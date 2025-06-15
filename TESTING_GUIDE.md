# Performance Optimization Testing Guide

## Overview
This guide provides comprehensive instructions for testing all performance optimization features implemented in the affiliate marketing platform.

## Prerequisites

### Required Dependencies
```bash
npm install --save-dev vitest supertest @types/supertest artillery autocannon
```

### Environment Setup
1. Ensure PostgreSQL database is running
2. Set up test environment variables:
   ```bash
   export NODE_ENV=test
   export DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/test_db
   export JWT_SECRET=test_secret_key
   ```

## Test Structure

### Unit Tests (`tests/unit/`)
- **CacheManager.test.ts**: Tests for multi-layer caching system
- **RateLimiter.test.ts**: Tests for rate limiting functionality
- **QueryOptimizer.test.ts**: Tests for database query optimization
- **PerformanceMonitor.test.ts**: Tests for real-time performance monitoring

### Integration Tests (`tests/integration/`)
- **PerformanceSystem.test.ts**: End-to-end testing of all performance systems

### Performance Benchmarks (`tests/performance/`)
- **LoadTesting.bench.ts**: Performance benchmarks and load testing

## Running Tests

### 1. Unit Tests
```bash
# Run all unit tests
npm run test:unit

# Run specific test file
npx vitest tests/unit/CacheManager.test.ts

# Run with coverage
npx vitest --coverage tests/unit/
```

### 2. Integration Tests
```bash
# Run integration tests
npm run test:integration

# Run with detailed output
npx vitest tests/integration/ --reporter=verbose
```

### 3. Performance Benchmarks
```bash
# Run performance benchmarks
npm run test:performance

# Run specific benchmark
npx vitest tests/performance/LoadTesting.bench.ts
```

## Feature Testing Instructions

### 1. Cache Manager Testing

#### Test Cache Hit/Miss Ratio
```bash
# Start the application
npm run dev

# Run cache-specific tests
npx vitest tests/unit/CacheManager.test.ts --run

# Expected Results:
# - Cache hit ratio > 85%
# - Response time improvement > 50%
# - Memory usage stable under load
```

#### Manual Cache Testing
```bash
# Test cache performance manually
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/analytics/dashboard

# First call: slower (cache miss)
# Subsequent calls: faster (cache hit)
```

#### Cache Invalidation Testing
```bash
# Create content to test cache invalidation
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","content":"Test content"}' \
     http://localhost:3000/api/content

# Verify cache is invalidated and fresh data is returned
```

### 2. Rate Limiting Testing

#### Basic Rate Limit Testing
```bash
# Test API rate limits
for i in {1..150}; do
  curl -H "Authorization: Bearer YOUR_TOKEN" \
       http://localhost:3000/api/analytics/dashboard
done

# Expected: Some requests return 429 (Too Many Requests)
```

#### Rate Limit Headers Testing
```bash
# Check rate limit headers
curl -I -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/analytics/dashboard

# Expected Headers:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: [timestamp]
# X-RateLimit-Window: 60000
```

#### Authentication Rate Limiting
```bash
# Test auth endpoint rate limiting
for i in {1..10}; do
  curl -X POST -H "Content-Type: application/json" \
       -d '{"email":"test@example.com","password":"wrong"}' \
       http://localhost:3000/api/auth/login
done

# Expected: Requests blocked after 5 attempts
```

### 3. Database Performance Testing

#### Query Performance Testing
```bash
# Test pagination performance
time curl -H "Authorization: Bearer YOUR_TOKEN" \
          "http://localhost:3000/api/content?page=1&limit=50"

# Expected: Response time < 500ms
```

#### Search Performance Testing
```bash
# Test search functionality
time curl -H "Authorization: Bearer YOUR_TOKEN" \
          "http://localhost:3000/api/content/search?q=test&limit=20"

# Expected: Response time < 300ms
```

#### Index Optimization Verification
```bash
# Connect to PostgreSQL and check indexes
psql $DATABASE_URL -c "\d+ content"

# Expected: Indexes on user_id, status, site_id, etc.
```

### 4. Performance Monitoring Testing

#### Real-time Metrics Testing
```bash
# Generate load and check metrics
curl -H "Authorization: Bearer ADMIN_TOKEN" \
     http://localhost:3000/api/admin/performance

# Expected Response Structure:
# {
#   "currentMetrics": {
#     "responseTime": number,
#     "memoryUsage": number,
#     "cacheHitRatio": number,
#     "requestsPerSecond": number,
#     "errorRate": number
#   },
#   "systemHealth": {...},
#   "cache": {...},
#   "database": {...}
# }
```

#### Alert System Testing
```bash
# Generate high load to trigger alerts
./scripts/load-test.sh

# Check for performance alerts in logs
tail -f logs/application.log | grep "Performance alert"
```

## Load Testing with Artillery

### 1. Install Artillery
```bash
npm install -g artillery
```

### 2. Create Load Test Configuration
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Authorization: 'Bearer YOUR_TOKEN'

scenarios:
  - name: "API Load Test"
    flow:
      - get:
          url: "/api/analytics/dashboard"
      - get:
          url: "/api/sites"
      - get:
          url: "/api/content"
```

### 3. Run Load Tests
```bash
# Basic load test
artillery run artillery-config.yml

# High-intensity test
artillery quick --duration 60 --rate 50 http://localhost:3000/api/analytics/dashboard
```

## Performance Benchmarking

### 1. Response Time Benchmarks
```bash
# Benchmark response times
npx autocannon -c 100 -d 30 -H "Authorization=Bearer YOUR_TOKEN" \
               http://localhost:3000/api/analytics/dashboard

# Expected Results:
# - Average latency < 500ms
# - 99th percentile < 1000ms
# - Requests/sec > 100
```

### 2. Concurrent User Testing
```bash
# Test with multiple concurrent users
npx autocannon -c 50 -d 60 -H "Authorization=Bearer YOUR_TOKEN" \
               http://localhost:3000/api/analytics/dashboard

# Expected: System handles 50+ concurrent users
```

### 3. Memory Leak Detection
```bash
# Monitor memory usage during load
node --inspect server/index.js &
# Use Chrome DevTools to monitor memory usage

# Run sustained load test
artillery run --duration 300 artillery-config.yml

# Expected: Stable memory usage, no significant leaks
```

## Database Optimization Testing

### 1. Index Usage Analysis
```sql
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Expected: High idx_scan values for created indexes
```

### 2. Query Performance Analysis
```sql
-- Enable query statistics
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%content%' 
ORDER BY total_time DESC 
LIMIT 10;

-- Expected: Fast query execution times
```

### 3. Connection Pool Testing
```bash
# Test connection pool limits
for i in {1..100}; do
  curl -H "Authorization: Bearer YOUR_TOKEN" \
       http://localhost:3000/api/analytics/dashboard &
done
wait

# Expected: No connection errors, proper pool management
```

## Continuous Performance Testing

### 1. Automated Performance Monitoring
```bash
# Set up continuous monitoring
npm run monitor:start

# This will:
# - Collect metrics every 30 seconds
# - Alert on performance degradation
# - Generate daily performance reports
```

### 2. Performance Regression Testing
```bash
# Run before deployments
npm run test:performance:regression

# Expected: All performance benchmarks pass
```

## Troubleshooting Common Issues

### Cache Not Working
1. Check cache configuration in CacheManager
2. Verify TTL settings
3. Check memory limits
4. Review cache invalidation logic

### Rate Limiting Too Aggressive
1. Adjust rate limit rules in RateLimiter
2. Check sliding window configuration
3. Verify key generation logic
4. Review cleanup intervals

### Slow Database Queries
1. Check if indexes are being used
2. Analyze query execution plans
3. Verify connection pool settings
4. Check for table locks

### High Memory Usage
1. Monitor cache memory usage
2. Check for memory leaks in application code
3. Verify garbage collection settings
4. Review data structure usage

## Performance Metrics Targets

### Response Time Targets
- API endpoints: < 500ms average
- Database queries: < 200ms average
- Search operations: < 300ms average
- Cache hits: < 10ms average

### Throughput Targets
- Concurrent users: 1000+
- Requests per second: 500+
- Database connections: 50 max
- Cache hit ratio: > 85%

### Resource Usage Targets
- Memory usage: < 80% of available
- CPU usage: < 70% average
- Database connections: < 80% of pool
- Cache memory: < 90% of allocated

## Automated Testing Scripts

### Daily Performance Check
```bash
#!/bin/bash
# scripts/daily-performance-check.sh

echo "Running daily performance checks..."

# Run unit tests
npm run test:unit

# Run performance benchmarks
npm run test:performance

# Check system metrics
curl -H "Authorization: Bearer ADMIN_TOKEN" \
     http://localhost:3000/api/admin/performance

echo "Performance check completed"
```

### Load Test Script
```bash
#!/bin/bash
# scripts/load-test.sh

echo "Starting load test..."

# Warm up cache
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/analytics/dashboard

# Run load test
artillery run artillery-config.yml

# Check performance metrics after test
curl -H "Authorization: Bearer ADMIN_TOKEN" \
     http://localhost:3000/api/admin/performance

echo "Load test completed"
```

## Conclusion

This comprehensive testing guide ensures that all performance optimization features are thoroughly tested and validated. Regular execution of these tests will help maintain optimal performance and identify potential issues before they impact users.

For additional support or questions about performance testing, refer to the performance optimization documentation or contact the development team.