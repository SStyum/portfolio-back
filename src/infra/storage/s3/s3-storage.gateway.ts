import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  SignedUploadUrlInput,
  StorageGateway,
  UploadFileInput,
} from '../../../core/gateways/storage.gateway';
import { EnvService } from '../../env/env.service';
import { awsClientConfig } from '../../aws/aws-client-config';

const DEFAULT_EXPIRES_IN = 60 * 5; // 5 minutos

@Injectable()
export class S3StorageGateway implements StorageGateway {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(env: EnvService) {
    this.s3 = new S3Client({
      ...awsClientConfig(env),
      // LocalStack não resolve bucket por subdomínio
      forcePathStyle: !!env.get('AWS_ENDPOINT_URL'),
    });
    this.bucket = env.get('S3_BUCKET')!;
  }

  async upload({ key, body, contentType }: UploadFileInput): Promise<void> {
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }));
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }

  async getUploadUrl({ key, contentType, expiresInSeconds }: SignedUploadUrlInput): Promise<string> {
    return getSignedUrl(
      this.s3,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn: expiresInSeconds ?? DEFAULT_EXPIRES_IN },
    );
  }

  async getDownloadUrl(key: string, expiresInSeconds?: number): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds ?? DEFAULT_EXPIRES_IN },
    );
  }
}
