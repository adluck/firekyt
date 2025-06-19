# FireKyt Authentication & Token Validation

## Current Authentication System

### Primary Authentication (JWT)
- **Main Platform**: Uses proper JWT validation via `authenticateToken` middleware
- **Token Format**: Standard JWT with user information and expiration
- **Security**: Production-ready with proper validation and secret verification

### External Blog Publishing Authentication
The publishing system supports multiple authentication methods:

1. **Production JWT Tokens**
   - Standard Bearer tokens for real blog platforms
   - WordPress: Uses application passwords or OAuth tokens
   - Ghost: Uses Admin API keys
   - Custom APIs: Accept Bearer JWT tokens

2. **Test Environment Token**
   - `firekyt_test_token_2024` - Used only for testing/demonstration
   - Allows safe testing without exposing real credentials
   - Limited to localhost environments

## Token Validation Logic

### For FireKyt Platform Access
```javascript
// Validates JWT tokens with secret verification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.sendStatus(401);
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
```

### For External Blog Publishing
- **Real Platforms**: Validates tokens against respective platform APIs
- **Test Environment**: Accepts predefined test token for safe demonstration
- **Production**: Requires valid platform-specific authentication

## Security Implementation

1. **JWT Secrets**: Environment-based secret management
2. **Token Expiration**: Configurable expiration times
3. **Platform Validation**: External APIs validate their own tokens
4. **Test Isolation**: Test tokens only work in development environment

## Production Deployment

For production use:
- Remove test token acceptance
- Enforce HTTPS for all token transmission
- Implement token refresh mechanism
- Add rate limiting for authentication endpoints