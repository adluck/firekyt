const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Mock database for posts
let posts = [];
let nextId = 1;

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// API Routes
app.get('/api/posts', verifyToken, (req, res) => {
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
    slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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

  console.log('📝 New post created:', {
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    totalPosts: posts.length
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Blog API server running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api/*`);
});