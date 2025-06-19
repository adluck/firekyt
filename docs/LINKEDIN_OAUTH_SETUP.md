# LinkedIn OAuth Setup Guide for FireKyt

## Required LinkedIn App Configuration

### 1. Create LinkedIn App
1. Go to [LinkedIn Developer Console](https://developer.linkedin.com/)
2. Click "Create App"
3. Fill in required information:
   - App name: "FireKyt Content Publisher"
   - LinkedIn Company Page: (your company page)
   - Privacy policy URL: (your privacy policy)
   - App logo: (upload your logo)

### 2. Configure OAuth Settings
1. In your LinkedIn app dashboard, go to "Auth" tab
2. Add these OAuth 2.0 redirect URLs:
   ```
   https://your-firekyt-domain.replit.dev/publishing/linkedin
   http://localhost:3000/publishing/linkedin
   ```

### 3. Request Required Scopes
Your LinkedIn app needs these specific permissions:

#### Essential Scopes:
- `openid` - Basic identity verification
- `profile` - Access to profile information
- `email` - Access to email address
- `w_member_social` - Post content to LinkedIn

#### Additional Scopes (if available):
- `r_liteprofile` - Read lite profile
- `r_emailaddress` - Read email address

### 4. Generate Access Token

#### Method 1: OAuth Flow (Recommended)
1. Use this authorization URL:
```
https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=openid%20profile%20email%20w_member_social
```

2. After user authorizes, exchange code for access token:
```bash
curl -X POST 'https://www.linkedin.com/oauth/v2/accessToken' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=authorization_code&code=YOUR_AUTH_CODE&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&redirect_uri=YOUR_REDIRECT_URI'
```

#### Method 2: LinkedIn Developer Tools
1. In your app's "Auth" tab, scroll to "OAuth 2.0 Tools"
2. Select the required scopes
3. Click "Request access token"

### 5. Test Your Token
Use the generated access token in FireKyt's LinkedIn test interface.

## Common Issues

### 403 Forbidden Error
- **Cause**: Token missing required scopes
- **Solution**: Regenerate token with all required scopes listed above

### Token Format
LinkedIn access tokens typically:
- Start with `AQ` followed by alphanumeric characters
- Are 200-400 characters long
- Don't contain special characters except `-` and `_`

### Scope Verification
Test your token scopes with:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.linkedin.com/v2/userinfo
```

## Publishing Capabilities

With proper token setup, FireKyt can:
- Validate LinkedIn connection
- Post text content with hashtags
- Share links with rich previews
- Schedule posts for later publication
- Track engagement metrics

## Security Notes
- Store tokens securely
- Tokens expire (typically 60 days)
- Never share tokens in public repositories
- Use environment variables for production