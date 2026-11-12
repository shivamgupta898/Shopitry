#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:30739}"

echo "Testing Storefront UI..."
curl -fsS -o /dev/null -w "Storefront HTTP %{http_code}\n" "$BASE_URL/"

echo "Testing Admin Dashboard..."
curl -fsS -o /dev/null -w "Admin Dashboard HTTP %{http_code}\n" "$BASE_URL/admin"

echo "Testing API Gateway -> Catalog Service..."
curl -fsS -o /dev/null -w "Catalog API HTTP %{http_code}\n" "$BASE_URL/api/catalog/products"

echo "All Shopitry endpoints responded successfully."