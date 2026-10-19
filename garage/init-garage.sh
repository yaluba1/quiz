#!/bin/sh
set -e

TOKEN=$(cat /run/secrets/garage_admin_token)

echo "Waiting for Garage Admin API on http://garage:3903..."
until curl -s -f -H "Authorization: Bearer $TOKEN" "http://garage:3903/v2/GetBucketInfo?globalAlias=media" > /tmp/bucket.json 2>/dev/null; do
  echo "Garage not ready yet, retrying in 2 seconds..."
  sleep 2
done

BUCKET_ID=$(jq -r '.id' /tmp/bucket.json)
echo "Found Garage bucket ID: $BUCKET_ID"

echo "Enabling public website access on bucket $BUCKET_ID..."
curl -s -f -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"websiteAccess": {"enabled": true, "indexDocument": "index.html"}}' \
  "http://garage:3903/v2/UpdateBucket?id=$BUCKET_ID"

echo ""
echo "Garage media bucket website access enabled successfully."
exit 0

