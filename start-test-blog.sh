#!/bin/bash

echo "Starting FireKyt Test Blog Server..."
echo "=================================="
echo ""
echo "Blog URL: http://localhost:3001"
echo "Access Token: firekyt_test_token_2024"
echo ""
echo "API Endpoints:"
echo "- GET  /api/posts - List all posts"
echo "- POST /api/posts - Create new post (requires auth)"
echo "- PUT  /api/posts/:id - Update post (requires auth)"
echo "- DELETE /api/posts/:id - Delete post (requires auth)"
echo ""
echo "Starting server..."
echo ""

node test-blog-server.js