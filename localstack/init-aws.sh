#!/bin/bash
# Cria os recursos que a API espera ao subir o LocalStack
set -e

awslocal s3 mb s3://portfolio-local
awslocal sqs create-queue --queue-name portfolio-events-dlq
awslocal sqs create-queue --queue-name portfolio-events \
  --attributes '{"RedrivePolicy":"{\"deadLetterTargetArn\":\"arn:aws:sqs:us-east-1:000000000000:portfolio-events-dlq\",\"maxReceiveCount\":\"5\"}"}'
