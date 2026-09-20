#!/bin/bash
# Clear all rate limit keys from Redis for QA testing

# This script clears Redis keys matching the rate limit pattern:
# - staging:ratelimit:ip:*
# - staging:ratelimit:key:*
# - production:ratelimit:ip:*
# - production:ratelimit:key:*

echo "Connecting to Redis and clearing rate limit keys..."
redis-cli KEYS "*/ratelimit:ip/*" | xargs redis-cli DEL
redis-cli KEYS "*/ratelimit:key/*" | xargs redis-cli DEL

echo "Rate limit cache cleared!"
echo "Note: Also make sure to redeploy the latest code with the commented-out rate limits."
