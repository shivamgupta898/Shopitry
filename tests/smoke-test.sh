#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:30739}"

echo "Testing Storefront UI..."
curl -fsS -o /dev/null -w "Storefront HTTP %{http_code}\n" "$BASE_URL/"

echo "Testing Admin Dashboard..."
curl -fsS -o /dev/null -w "Admin Dashboard HTTP %{http_code}\n" "$BASE_URL/admin"

echo "Testing API Gateway Health..."
curl -fsS "$BASE_URL/api/health" && echo ""

echo "All Shopitry endpoints responded successfully."
