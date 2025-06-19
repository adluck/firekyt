import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// In-memory storage for blog posts
let blogPosts = [];
let nextId = 1;

// Valid access tokens
const VALID_TOKENS = {
  'firekyt_test_token_2024': {
    name: 'FireKyt Test Blog',
    permissions: ['read', 'write', 'delete']
  }
};

app.use(cors());
app.use(express.json());

// Middleware to authenticate requests
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (!VALID_TOKENS[token]) {
    return res.status(403).json({ error: 'Invalid access token' });
  }

  req.user = VALID_TOKENS[token];
  next();
};

// Public endpoint - List all posts
app.get('/api/posts', (req, res) => {
  res.json({
    success: true,
    posts: blogPosts,
    total: blogPosts.length
  });
});

// Protected endpoint - Create new post
app.post('/api/posts', authenticateToken, (req, res) => {
  const { title, content, keywords, author } = req.body;

  if (!title || !content) {
    return res.status(400).json({ 
      error: 'Title and content are required' 
    });
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

  res.status(201).json({
    success: true,
    message: 'Post published successfully',
    post: newPost
  });
});

// Protected endpoint - Update post
app.put('/api/posts/:id', authenticateToken, (req, res) => {
  const postId = parseInt(req.params.id);
  const { title, content, keywords } = req.body;

  const postIndex = blogPosts.findIndex(post => post.id === postId);
  
  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  blogPosts[postIndex] = {
    ...blogPosts[postIndex],
    title: title || blogPosts[postIndex].title,
    content: content || blogPosts[postIndex].content,
    keywords: keywords || blogPosts[postIndex].keywords,
    updatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'Post updated successfully',
    post: blogPosts[postIndex]
  });
});

// Protected endpoint - Delete post
app.delete('/api/posts/:id', authenticateToken, (req, res) => {
  const postId = parseInt(req.params.id);
  const postIndex = blogPosts.findIndex(post => post.id === postId);
  
  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const deletedPost = blogPosts.splice(postIndex, 1)[0];

  res.json({
    success: true,
    message: 'Post deleted successfully',
    post: deletedPost
  });
});

// Test connection endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'FireKyt Test Blog Server is running',
    version: '1.0.0',
    endpoints: {
      'GET /api/posts': 'List all posts (public)',
      'POST /api/posts': 'Create new post (requires auth)',
      'PUT /api/posts/:id': 'Update post (requires auth)',
      'DELETE /api/posts/:id': 'Delete post (requires auth)',
      'GET /api/test': 'Test connection (public)'
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer YOUR_TOKEN',
      validToken: 'firekyt_test_token_2024'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    posts: blogPosts.length
  });
});

// Root endpoint with instructions
app.get('/', (req, res) => {
  res.json({
    name: 'FireKyt Test Blog Server',
    description: 'External blog server for testing FireKyt publishing features',
    version: '1.0.0',
    documentation: {
      baseUrl: `http://localhost:${PORT}`,
      endpoints: {
        'GET /': 'This information page',
        'GET /health': 'Health check',
        'GET /api/test': 'Connection test with full API info',
        'GET /api/posts': 'List all published posts',
        'POST /api/posts': 'Publish new post (requires authentication)',
        'PUT /api/posts/:id': 'Update existing post (requires authentication)',
        'DELETE /api/posts/:id': 'Delete post (requires authentication)'
      },
      authentication: {
        method: 'Bearer Token',
        header: 'Authorization: Bearer firekyt_test_token_2024',
        testToken: 'firekyt_test_token_2024'
      },
      exampleRequest: {
        url: '/api/posts',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer firekyt_test_token_2024'
        },
        body: {
          title: 'My First Post',
          content: 'This is the content of my first post.',
          keywords: ['example', 'test'],
          author: 'FireKyt User'
        }
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
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
});

// Start server
app.listen(PORT, () => {
  console.log('==================================');
  console.log('🚀 FireKyt Test Blog Server Started');
  console.log('==================================');
  console.log(`📍 Server running at: http://localhost:${PORT}`);
  console.log(`🔑 Access Token: firekyt_test_token_2024`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/test`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('Ready to receive published content from FireKyt!');
  console.log('==================================');
});

export default app;