import * as path from 'node:path';
import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { HttpApi, CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { InstanceClass, InstanceSize, InstanceType, Peer, Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { Architecture, DockerImageCode, DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion, StorageType } from 'aws-cdk-lib/aws-rds';
import { BlockPublicAccess, Bucket, BucketEncryption, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Queue, QueueEncryption } from 'aws-cdk-lib/aws-sqs';

interface PortfolioStackProps extends StackProps {
  // Secret JSON com JWT_*, GROQ_API_KEY, STRIPE_*, GITHUB_* — criado fora do CDK pra não vazar no template
  secretName: string;
  // URL do front (retorno do checkout, links dos e-mails, login com GitHub)
  frontendUrl: string;
  // Remetente dos e-mails. O domínio/e-mail precisa estar verificado no SES
  emailFrom: string;
}

export class PortfolioStack extends Stack {
  constructor(scope: Construct, id: string, props: PortfolioStackProps) {
    super(scope, id, props);

    // ---------- Secrets Manager
    const secret = Secret.fromSecretNameV2(this, 'AppSecret', props.secretName);

    // ---------- VPC: só subnets públicas, sem NAT Gateway (~US$ 32/mês a menos)
    const vpc = new Vpc(this, 'Vpc', {
      maxAzs: 2, // o RDS exige subnet group em 2 AZs, mesmo sendo single-AZ
      natGateways: 0,
      subnetConfiguration: [{ name: 'public', subnetType: SubnetType.PUBLIC }],
    });

    // ---------- RDS PostgreSQL (configuração mais barata)
    // A Lambda roda fora da VPC (pra acessar Stripe/Groq sem NAT), então o banco precisa ser
    // acessível pela internet. Proteção: SSL obrigatório + senha gerada no Secrets Manager.
    const dbSecurityGroup = new SecurityGroup(this, 'DatabaseSG', {
      vpc,
      description: 'PostgreSQL publico (SSL obrigatorio)',
    });
    dbSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(5432), 'Lambda fora da VPC nao tem IP fixo');

    const database = new DatabaseInstance(this, 'Database', {
      // Mesma major do docker-compose (pgvector/pgvector:pg17) — RDS já traz a extensão vector
      engine: DatabaseInstanceEngine.postgres({ version: PostgresEngineVersion.VER_17 }),
      instanceType: InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      publiclyAccessible: true,
      securityGroups: [dbSecurityGroup],
      databaseName: 'portfolio',
      // Usuário/senha gerados e guardados num secret próprio (host/porta/dbname incluídos)
      credentials: Credentials.fromGeneratedSecret('portfolio'),
      multiAz: false,
      allocatedStorage: 20, // mínimo do gp3
      storageType: StorageType.GP3,
      storageEncrypted: true,
      backupRetention: Duration.days(7), // backup até o tamanho do disco não é cobrado
      enablePerformanceInsights: false,
      monitoringInterval: Duration.seconds(0),
      autoMinorVersionUpgrade: true,
      // `cdk destroy` não apaga os dados: tira um snapshot final
      removalPolicy: RemovalPolicy.SNAPSHOT,
    });


    // ---------- S3
    const bucket = new Bucket(this, 'StorageBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      // Arquivos de usuário não somem num `cdk destroy`
      removalPolicy: RemovalPolicy.RETAIN,
      // O front envia direto pro S3 via URL pré-assinada
      cors: [{
        allowedMethods: [HttpMethods.PUT, HttpMethods.GET],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
      }],
    });

    // ---------- SQS (+ dead letter queue)
    const deadLetterQueue = new Queue(this, 'EventsDLQ', {
      retentionPeriod: Duration.days(14),
      encryption: QueueEncryption.SQS_MANAGED,
    });

    const eventsQueue = new Queue(this, 'EventsQueue', {
      visibilityTimeout: Duration.seconds(60),
      encryption: QueueEncryption.SQS_MANAGED,
      deadLetterQueue: { queue: deadLetterQueue, maxReceiveCount: 5 },
    });

    // ---------- Lambda (API NestJS em container)
    const apiFunction = new DockerImageFunction(this, 'ApiFunction', {
      code: DockerImageCode.fromImageAsset(path.join(__dirname, '../..'), {
        file: 'Dockerfile.lambda',
        platform: Platform.LINUX_ARM64,
      }),
      architecture: Architecture.ARM_64,
      memorySize: 1024,
      // API Gateway corta em 30s
      timeout: Duration.seconds(29),
      logGroup: new LogGroup(this, 'ApiLogs', {
        retention: RetentionDays.ONE_MONTH,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
      environment: {
        NODE_ENV: 'production',
        AWS_SECRET_ID: secret.secretName,
        DB_SECRET_ID: database.secret!.secretArn,
        // Bundle de CAs da imagem base da Lambda, inclui os certificados da RDS (sslmode=verify-full)
        NODE_EXTRA_CA_CERTS: '/var/runtime/ca-cert.pem',
        STORAGE_PROVIDER: 'S3',
        S3_BUCKET: bucket.bucketName,
        MESSAGING_PROVIDER: 'SQS',
        SQS_QUEUE_URL: eventsQueue.queueUrl,
        EMAIL_PROVIDER: 'SES',
        EMAIL_FROM: props.emailFrom,
        FRONTEND_URL: props.frontendUrl,
      },
    });

    // ---------- IAM: só o mínimo que a API usa
    secret.grantRead(apiFunction);
    database.secret!.grantRead(apiFunction);
    bucket.grantReadWrite(apiFunction);
    eventsQueue.grantSendMessages(apiFunction);
    apiFunction.addToRolePolicy(new PolicyStatement({
      actions: ['ses:SendEmail'],
      resources: [`arn:aws:ses:${this.region}:${this.account}:identity/*`],
    }));

    // ---------- API Gateway (HTTP API) → Lambda
    const api = new HttpApi(this, 'HttpApi', {
      defaultIntegration: new HttpLambdaIntegration('ApiIntegration', apiFunction),
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [CorsHttpMethod.ANY],
        allowHeaders: ['authorization', 'content-type'],
      },
    });

    new CfnOutput(this, 'ApiUrl', { value: api.apiEndpoint });
    new CfnOutput(this, 'DatabaseEndpoint', { value: database.dbInstanceEndpointAddress });
    new CfnOutput(this, 'DatabaseSecretArn', { value: database.secret!.secretArn });
    new CfnOutput(this, 'BucketName', { value: bucket.bucketName });
    new CfnOutput(this, 'EventsQueueUrl', { value: eventsQueue.queueUrl });
    new CfnOutput(this, 'EventsDLQUrl', { value: deadLetterQueue.queueUrl });
  }
}
