#!/bin/bash

echo "🧪 TESTING MOUNTAINSHARES CORS CONFIGURATION"
echo "============================================="

BACKEND_URL="https://mountainshares-production.up.railway.app"
NETLIFY_URL="https://68571eab2182a306ff7359d9--relaxed-medovik-06c531.netlify.app"

echo ""
echo "1. Testing preflight request..."
curl -X OPTIONS \
  -H "Origin: $NETLIFY_URL" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -s -D - -o /dev/null \
  "$BACKEND_URL/api/create-checkout-session" | grep -i "access-control"

echo ""
echo "2. Testing actual POST request..."
curl -X POST \
  -H "Origin: $NETLIFY_URL" \
  -H "Content-Type: application/json" \
  -d '{"msTokens":1}' \
  -s -D - -o /dev/null \
  "$BACKEND_URL/api/create-checkout-session" | grep -i "access-control"

echo ""
echo "3. Testing health endpoint..."
curl -X GET \
  -H "Origin: $NETLIFY_URL" \
  -s -D - -o /dev/null \
  "$BACKEND_URL/api/health" | grep -i "access-control"

echo ""
echo "4. Testing unauthorized origin..."
curl -X OPTIONS \
  -H "Origin: https://unauthorized-domain.com" \
  -H "Access-Control-Request-Method: POST" \
  -s -D - -o /dev/null \
  "$BACKEND_URL/api/create-checkout-session" | grep -i "access-control"

echo ""
echo "✅ CORS testing completed!"
