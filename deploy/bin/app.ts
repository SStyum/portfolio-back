import { App } from 'aws-cdk-lib';
import { PortfolioStack } from '../lib/portfolio-stack';

const app = new App();

new PortfolioStack(app, 'PortfolioStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  secretName: app.node.tryGetContext('secretName'),
});
