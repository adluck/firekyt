-- Database Optimization for High Scalability
-- This file contains SQL optimizations for supporting millions of users and large data volumes

-- Connection and Performance Tuning
ALTER SYSTEM SET max_connections = 1000;
ALTER SYSTEM SET shared_buffers = '8GB';
ALTER SYSTEM SET effective_cache_size = '24GB';
ALTER SYSTEM SET work_mem = '64MB';
ALTER SYSTEM SET maintenance_work_mem = '2GB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '64MB';
ALTER SYSTEM SET default_statistics_target = 1000;

-- Enable parallel processing
ALTER SYSTEM SET max_parallel_workers = 8;
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
ALTER SYSTEM SET max_worker_processes = 16;

-- Query optimization
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET seq_page_cost = 1.0;
ALTER SYSTEM SET cpu_tuple_cost = 0.01;
ALTER SYSTEM SET cpu_index_tuple_cost = 0.005;

-- WAL and checkpoint optimization
ALTER SYSTEM SET wal_level = 'logical';
ALTER SYSTEM SET max_wal_size = '4GB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET checkpoint_timeout = '15min';

-- Optimized indexes for high-performance queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_hash ON users USING HASH (email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tier ON users (tier) WHERE tier IS NOT NULL;

-- Content indexes for fast retrieval
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_user_status ON content (user_id, status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_type_status ON content (content_type, status) WHERE status = 'published';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_keywords ON content USING GIN (target_keywords);

-- Link management indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_links_user_created ON links (user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_links_status_type ON links (status, link_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_links_tracking_id ON links (tracking_id) WHERE tracking_id IS NOT NULL;

-- Link suggestions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_link_suggestions_content ON link_suggestions (content_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_link_suggestions_confidence ON link_suggestions (confidence DESC) WHERE status = 'pending';

-- Vacuum and analyze automation
ALTER SYSTEM SET autovacuum = on;
ALTER SYSTEM SET autovacuum_max_workers = 6;
ALTER SYSTEM SET autovacuum_naptime = '30s';
ALTER SYSTEM SET autovacuum_vacuum_threshold = 500;
ALTER SYSTEM SET autovacuum_analyze_threshold = 250;
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.1;
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.05;

-- Apply all configuration changes
SELECT pg_reload_conf();