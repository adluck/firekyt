const http = require('http');
const url = require('url');

const PORT = 3001;
let blogPosts = [];
let nextId = 1;

const VALID_TOKEN = 'firekyt_test_token_2024';

// Helper function to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Helper function to send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Authentication middleware
function authenticate(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  return token === VALID_TOKEN;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    sendJSON(res, 200, { message: 'OK' });
    return;
  }

  try {
    // Route: GET /health
    if (pathname === '/health' && method === 'GET') {
      sendJSON(res, 200, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        posts: blogPosts.length
      });
      return;
    }

    // Route: GET /api/test
    if (pathname === '/api/test' && method === 'GET') {
      sendJSON(res, 200, {
        success: true,
        message: 'FireKyt Test Blog Server is running',
        version: '1.0.0',
        authentication: {
          type: 'Bearer Token',
          header: 'Authorization: Bearer firekyt_test_token_2024',
          validToken: 'firekyt_test_token_2024'
        }
      });
      return;
    }

    // Route: GET /api/posts
    if (pathname === '/api/posts' && method === 'GET') {
      sendJSON(res, 200, {
        success: true,
        posts: blogPosts,
        total: blogPosts.length
      });
      return;
    }

    // Route: POST /api/posts (requires auth)
    if (pathname === '/api/posts' && method === 'POST') {
      if (!authenticate(req)) {
        sendJSON(res, 401, { error: 'Unauthorized: Invalid or missing token' });
        return;
      }

      const body = await parseBody(req);
      const { title, content, keywords, author } = body;

      if (!title || !content) {
        sendJSON(res, 400, { error: 'Title and content are required' });
        return;
      }

      const newPost = {
        id: nextId++,
        title,
        content,
        keywords: keywords || [],
        author: author || 'FireKyt User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        published: true
      };

      blogPosts.push(newPost);
      console.log(`📝 New post published: "${title}" by ${newPost.author}`);

      sendJSON(res, 201, {
        success: true,
        message: 'Post published successfully',
        post: newPost
      });
      return;
    }

    // Route: PUT /api/posts/:id (requires auth)
    if (pathname.startsWith('/api/posts/') && method === 'PUT') {
      if (!authenticate(req)) {
        sendJSON(res, 401, { error: 'Unauthorized: Invalid or missing token' });
        return;
      }

      const postId = parseInt(pathname.split('/')[3]);
      const body = await parseBody(req);
      const { title, content, keywords } = body;

      const postIndex = blogPosts.findIndex(post => post.id === postId);
      
      if (postIndex === -1) {
        sendJSON(res, 404, { error: 'Post not found' });
        return;
      }

      blogPosts[postIndex] = {
        ...blogPosts[postIndex],
        title: title || blogPosts[postIndex].title,
        content: content || blogPosts[postIndex].content,
        keywords: keywords || blogPosts[postIndex].keywords,
        updatedAt: new Date().toISOString()
      };

      sendJSON(res, 200, {
        success: true,
        message: 'Post updated successfully',
        post: blogPosts[postIndex]
      });
      return;
    }

    // Route: DELETE /api/posts/:id (requires auth)
    if (pathname.startsWith('/api/posts/') && method === 'DELETE') {
      if (!authenticate(req)) {
        sendJSON(res, 401, { error: 'Unauthorized: Invalid or missing token' });
        return;
      }

      const postId = parseInt(pathname.split('/')[3]);
      const postIndex = blogPosts.findIndex(post => post.id === postId);
      
      if (postIndex === -1) {
        sendJSON(res, 404, { error: 'Post not found' });
        return;
      }

      const deletedPost = blogPosts.splice(postIndex, 1)[0];

      sendJSON(res, 200, {
        success: true,
        message: 'Post deleted successfully',
        post: deletedPost
      });
      return;
    }

    // Route: GET / (root)
    if (pathname === '/' && method === 'GET') {
      sendJSON(res, 200, {
        name: 'FireKyt Test Blog Server',
        description: 'External blog server for testing FireKyt publishing features',
        version: '1.0.0',
        endpoints: {
          'GET /': 'This information page',
          'GET /health': 'Health check',
          'GET /api/test': 'Connection test',
          'GET /api/posts': 'List all published posts',
          'POST /api/posts': 'Publish new post (requires authentication)',
          'PUT /api/posts/:id': 'Update existing post (requires authentication)',
          'DELETE /api/posts/:id': 'Delete post (requires authentication)'
        },
        authentication: {
          method: 'Bearer Token',
          header: 'Authorization: Bearer firekyt_test_token_2024',
          testToken: 'firekyt_test_token_2024'
        }
      });
      return;
    }

    // 404 for unknown routes
    sendJSON(res, 404, {
      error: 'Endpoint not found',
      availableEndpoints: [
        'GET /',
        'GET /health',
        'GET /api/test',
        'GET /api/posts',
        'POST /api/posts',
        'PUT /api/posts/:id',
        'DELETE /api/posts/:id'
      ]
    });

  } catch (error) {
    console.error('Server error:', error);
    sendJSON(res, 500, {
      error: 'Internal server error',
      message: error.message
    });
  }
});

server.listen(PORT, () => {
  console.log('==================================');
  console.log('🚀 FireKyt Test Blog Server Started');
  console.log('==================================');
  console.log(`📍 Server running at: http://localhost:${PORT}`);
  console.log(`🔑 Access Token: ${VALID_TOKEN}`);
  console.log(`📚 API Test: http://localhost:${PORT}/api/test`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('Ready to receive published content from FireKyt!');
  console.log('==================================');
});

module.exports = server;