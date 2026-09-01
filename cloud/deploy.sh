#!/usr/bin/env bash
# =====================================================================
#  deploy.sh - kompletan deploy event-driven arhitekture
#  Preduslovi: AWS CLI + AWS SAM CLI konfigurisan (aws configure).
#  Pokretanje iz root-a projekta:  bash cloud/deploy.sh
# =====================================================================
set -euo pipefail

STACK_NAME="estudent-prijave"
REGION="${AWS_REGION:-eu-central-1}"   # Frankfurt; promeni po potrebi

echo "==> [1/5] SAM build (pakuje Lambdu i zavisnosti)"
sam build --template cloud/template.yaml

echo "==> [2/5] SAM deploy (kreira/azurira stack)"
sam deploy \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset

echo "==> [3/5] Citam outpute stack-a"
API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text)
FRONTEND_BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendURL'].OutputValue" --output text)
BUCKET_NAME="${STACK_NAME}-frontend"

echo "    API endpoint: $API_URL"

echo "==> [4/5] Build frontenda sa API URL-om"
echo "VITE_PRIJAVE_API_URL=$API_URL" > .env.production
npm install
npm run build

echo "==> [5/5] Sync dist/ na S3 frontend bucket"
aws s3 sync dist/ "s3://${BUCKET_NAME}/" --delete --region "$REGION"

echo ""
echo "===================================================================="
echo " GOTOVO. Frontend je dostupan na:"
echo "   $FRONTEND_BUCKET"
echo "===================================================================="
