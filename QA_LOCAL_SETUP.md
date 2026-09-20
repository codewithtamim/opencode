# Local QA Testing Setup (No Rate Limits)

This guide helps QA test the OpenCode API locally without hitting any rate limits.

## Quick Start

### 1. Start Local Redis (for rate limit cache - but disabled in code)
```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or using Homebrew (if installed)
brew services start redis
```

### 2. Set Up Local Environment Variables
```bash
# Create/update .env file
cd /path/to/console

cat > .env.local << 'EOF'
# Disable rate limiting for local QA testing
OPENCODE_DISABLE_AUTOUPDATE=1

# Point to local Redis (optional, but good for testing)
UPSTASH_REDIS_REST_URL=http://localhost:6379
UPSTASH_REDIS_REST_TOKEN=local

# Your test API key
OPENCODE_API_KEY=your_test_api_key_here
EOF
```

### 3. Run Console Locally
```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Or start the API server directly
bun run --cwd packages/console dev
```

### 4. Test API Locally
```bash
# Create test requests without rate limiting
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_test_key" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'
```

## For Your QA Lead: Batch Testing Without Rate Limits

### Option 1: Multiple Concurrent Requests
```bash
#!/bin/bash
# Run 100 requests in parallel locally (no rate limits!)
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/v1/messages \
    -H "X-API-Key: qa-test-key" \
    -d "{\"model\":\"gpt-4\",\"messages\":[{\"role\":\"user\",\"content\":\"Test $i\"}]}" &
done
wait
echo "All requests completed!"
```

### Option 2: Load Testing with Apache Bench
```bash
# Install: brew install httpd
ab -n 100 -c 10 \
  -H "X-API-Key: qa-test-key" \
  -p request.json \
  http://localhost:3000/api/v1/messages
```

### Option 3: Load Testing with wrk
```bash
# Install: brew install wrk
wrk -t4 -c100 -d30s \
  -H "X-API-Key: qa-test-key" \
  http://localhost:3000/api/v1/messages
```

## Key Rate Limiter Files (All Disabled for Local Testing)

These are all returning early - rate limiting is disabled:
- ✅ `packages/console/app/src/routes/zen/util/ipRateLimiter.ts`
- ✅ `packages/console/app/src/routes/zen/util/keyRateLimiter.ts`
- ✅ `packages/console/app/src/routes/zen/util/trialLimiter.ts`
- ✅ Handler: lines 141-147, 183-190 (all commented out)

## Verify Local Setup is Working

```bash
# Check that rate limiters return early
grep -n "return" packages/console/app/src/routes/zen/util/keyRateLimiter.ts | head -1

# Should show: 10:  return  (early return, disabling the limiter)

# Test with verbose logging
DEBUG=opencode:* bun run dev
```

## Clearing Local Redis Cache (If Needed)
```bash
# Connect to local Redis
redis-cli

# Clear all rate limit keys
> KEYS "*:ratelimit:*"
> FLUSHALL

# Exit
> exit
```

## Environment Variables for Full Control

```bash
export OPENCODE_DISABLE_AUTOUPDATE=1           # Disable auto-update
export DEBUG=opencode:*                         # Enable debug logging
export NODE_ENV=development                     # Development mode
export LOG_LEVEL=debug                          # Debug logging
```

## Testing Checklist for QA Lead

- [ ] Start Redis locally
- [ ] Set `OPENCODE_DISABLE_AUTOUPDATE=1`
- [ ] Run console dev server locally
- [ ] Make 100+ concurrent requests
- [ ] Verify no "rate limit exceeded" errors
- [ ] Check response times are normal
- [ ] Test with different API keys
- [ ] Test with streaming and non-streaming responses

## If Still Hitting Rate Limits

1. Verify the disable flags in the code:
   ```bash
   grep -A 2 "Disabled for QA" packages/console/app/src/routes/zen/util/*.ts
   ```

2. Make sure you're using the newly built binary:
   ```bash
   opencode --version  # Should be 1.18.31 or higher
   ```

3. Clear Redis completely:
   ```bash
   redis-cli FLUSHALL
   ```

4. Restart the dev server:
   ```bash
   pkill -f "console dev" || true
   bun run --cwd packages/console dev
   ```
