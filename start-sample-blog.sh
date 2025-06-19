#!/bin/bash

# Kill any existing blog server
pkill -f sample-blog-server || true

# Wait a moment
sleep 1

# Start the sample blog server
echo "Starting FireKyt Sample Blog Server..."
node sample-blog-server.cjs &

# Get the process ID
BLOG_PID=$!
echo "Sample blog server started with PID: $BLOG_PID"

# Wait for server to start
sleep 2

# Check if server is running
if curl -s http://localhost:3002/api/health > /dev/null; then
    echo "✅ Sample blog server is running at http://localhost:3002"
    echo "🔍 Health check: http://localhost:3002/api/health"
    echo "📝 View posts: http://localhost:3002/api/posts/list"
    echo "🔑 Test token: firekyt_test_token_2024"
else
    echo "❌ Failed to start sample blog server"
    exit 1
fi