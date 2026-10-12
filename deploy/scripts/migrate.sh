#!/bin/bash
# Roda as migrations do Prisma no RDS usando as credenciais do secret gerado pelo stack.
# Uso: ./deploy/scripts/migrate.sh   (precisa de AWS CLI autenticado e do stack já deployado)
set -euo pipefail

STACK_NAME="${STACK_NAME:-PortfolioStack}"
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

SECRET_ARN=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='DatabaseSecretArn'].OutputValue" --output text)

SECRET=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query SecretString --output text)

DATABASE_URL=$(node -e '
  const s = JSON.parse(process.argv[1]);
  const e = encodeURIComponent;
  console.log(`postgresql://${e(s.username)}:${e(s.password)}@${s.host}:${s.port}/${s.dbname}?sslmode=require`);
' "$SECRET")

cd "$ROOT_DIR"
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy
