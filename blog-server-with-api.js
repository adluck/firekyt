const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// JWT Secret (use the same one from your FireKyt token)
const JWT_SECRET = 'firekyt-blog-secret-2025';

// Mock database for posts
let posts = [];
let nextId = 1;

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      error: 'No token provided' 
    });
  }
  
  const token = authHeader.substring(7);
  try {
    // Try to decode without verification first to see the structure
    const decoded = jwt.decode(token);
    console.log('🔐 Token decoded:', { userId: decoded?.userId, username: decoded?.username });
    
    // For now, accept any properly formatted JWT token
    if (decoded && decoded.userId) {
      req.user = decoded;
      next();
    } else {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token format' 
      });
    }
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
    return res.status(401).json({ 
      success: false,
      error: 'Invalid token' 
    });
  }
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    totalPosts: posts.length,
    endpoints: [
      'GET /api/posts',
      'POST /api/posts',
      'GET /api/posts/:id',
      'PUT /api/posts/:id',
      'DELETE /api/posts/:id'
    ]
  });
});

app.get('/api/posts', verifyToken, (req, res) => {
  console.log('📋 Getting all posts, total:', posts.length);
  res.json({
    success: true,
    posts: posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      status: post.status,
      author: post.author,
      category: post.category,
      readTime: post.readTime,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      url: `https://your-blog.com/posts/${post.slug}`
    }))
  });
});

app.post('/api/posts', verifyToken, (req, res) => {
  console.log('📝 Creating new post...');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  const {
    title,
    slug,
    content,
    excerpt,
    author,
    category,
    readTime,
    published,
    metaTitle,
    metaDescription,
    featured
  } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      error: 'Title and content are required'
    });
  }

  const post = {
    id: nextId++,
    title,
    slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    content,
    excerpt: excerpt || content.substring(0, 200) + '...',
    author: author || 'Admin',
    category: category || 'General',
    readTime: readTime || Math.ceil(content.split(' ').length / 200),
    status: published ? 'published' : 'draft',
    metaTitle: metaTitle || title,
    metaDescription: metaDescription || excerpt,
    featured: featured || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  posts.push(post);

  console.log('✅ Post created successfully:', {
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    author: post.author
  });

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    post: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      url: `https://your-blog.com/posts/${post.slug}`,
      status: post.status,
      createdAt: post.createdAt
    }
  });
});

app.get('/api/posts/:id', verifyToken, (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) {
    return res.status(404).json({
      success: false,
      error: 'Post not found'
    });
  }
  
  res.json({
    success: true,
    post: {
      ...post,
      url: `https://your-blog.com/posts/${post.slug}`
    }
  });
});

app.put('/api/posts/:id', verifyToken, (req, res) => {
  const postIndex = posts.findIndex(p => p.id === parseInt(req.params.id));
  if (postIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Post not found'
    });
  }

  const updatedPost = {
    ...posts[postIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  posts[postIndex] = updatedPost;

  res.json({
    success: true,
    message: 'Post updated successfully',
    post: {
      ...updatedPost,
      url: `https://your-blog.com/posts/${updatedPost.slug}`
    }
  });
});

app.delete('/api/posts/:id', verifyToken, (req, res) => {
  const postIndex = posts.findIndex(p => p.id === parseInt(req.params.id));
  if (postIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Post not found'
    });
  }

  posts.splice(postIndex, 1);

  res.json({
    success: true,
    message: 'Post deleted successfully'
  });
});

// Serve your existing blog frontend for all other routes
app.get('*', (req, res) => {
  // If it's an API route that doesn't exist, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      availableEndpoints: [
        'GET /api/health',
        'GET /api/posts',
        'POST /api/posts',
        'GET /api/posts/:id',
        'PUT /api/posts/:id',
        'DELETE /api/posts/:id'
      ]
    });
  }
  
  // For all other routes, serve your blog frontend
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Blog server with API running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api/*`);
  console.log(`🌐 Blog frontend available at http://localhost:${PORT}`);
  console.log(`📝 Test API health: curl http://localhost:${PORT}/api/health`);
});