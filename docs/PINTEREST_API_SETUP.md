# Pinterest API Setup Guide

## Overview
This guide helps you set up Pinterest API access for the FireKyt platform to enable pin creation and content publishing.

## Prerequisites
- Pinterest Business Account (required for API access)
- Verified website domain
- Pinterest Developer App

## Step-by-Step Setup

### 1. Create Pinterest Business Account
1. Go to [Pinterest Business](https://business.pinterest.com/)
2. Convert your personal account to business or create new business account
3. Verify your website domain in Pinterest settings

### 2. Create Pinterest Developer App
1. Visit [Pinterest Developer Portal](https://developers.pinterest.com/)
2. Click "Create app" or "Manage apps"
3. Fill out app details:
   - **App name**: Your application name (e.g., "FireKyt Content Publisher")
   - **App description**: Brief description of your use case
   - **Website URL**: Your website URL
   - **Redirect URI**: `https://your-domain.com/auth/pinterest/callback`

### 3. App Review Process
Pinterest requires app review for production access:

#### Development Phase (Limited Access)
- You get a test token that works with your own Pinterest account
- Limited to 100 API calls per day
- Sufficient for testing integration

#### Production Phase (Full Access)
- Requires Pinterest review and approval
- Submit detailed use case and user flow
- Can take 2-4 weeks for approval

### 4. Required Scopes
Your Pinterest app needs these permissions:

#### Essential Scopes:
- `user_accounts:read` - Read user account information
- `pins:read` - Read pin information
- `pins:write` - Create and update pins
- `boards:read` - Read board information

#### Optional Scopes:
- `boards:write` - Create and update boards
- `ads:read` - Read advertising data (if using Pinterest Ads)

### 5. Generate Access Token

#### Method 1: OAuth Flow (Recommended for Production)
1. Implement OAuth flow in your application
2. Direct users to Pinterest authorization URL
3. Handle callback and exchange code for access token

#### Method 2: Manual Token (Development/Testing)
1. Go to your app in Pinterest Developer Console
2. Click "Generate token" under "OAuth & API Keys"
3. Select required scopes
4. Copy the generated access token

**Note**: Manual tokens are short-lived (typically 30 days) and only work for your own account.

### 6. Test Your Integration
Use the FireKyt Pinterest test interface at `/publishing/pinterest` to:
1. Test token validity
2. Create test connections
3. Post sample pins

## Common Issues and Solutions

### 401 Unauthorized Error
**Possible causes:**
- Token has expired
- Token doesn't have required scopes
- App is not approved for production use
- Token was generated for wrong Pinterest account

**Solutions:**
1. Generate a new access token
2. Verify all required scopes are selected
3. Ensure you're using the token with the correct Pinterest account
4. For production use, complete Pinterest app review process

### 403 Forbidden Error
**Possible causes:**
- App doesn't have permission for specific action
- Rate limit exceeded
- Account doesn't have business features enabled

**Solutions:**
1. Check your app's approved scopes
2. Wait for rate limit reset (typically 1 hour)
3. Ensure Pinterest Business Account is properly set up

### 400 Bad Request Error
**Possible causes:**
- Invalid request format
- Missing required parameters
- Invalid pin data (image URL, description, etc.)

**Solutions:**
1. Check Pinterest API documentation for correct request format
2. Validate all pin data before submitting
3. Ensure image URLs are publicly accessible

## API Rate Limits

### Development/Testing
- 100 requests per day per user
- 5 requests per second

### Production (After Approval)
- 1,000 requests per day per user (default)
- Higher limits available upon request
- 10 requests per second

## Security Best Practices

1. **Store tokens securely**: Never expose access tokens in client-side code
2. **Use HTTPS**: All API calls must use HTTPS
3. **Token rotation**: Implement automatic token refresh for OAuth flows
4. **Minimal scopes**: Only request scopes your app actually needs
5. **Error handling**: Implement proper error handling for API failures

## Testing Checklist

Before going live, test these scenarios:

- [ ] Token validation with valid token
- [ ] Token validation with expired token
- [ ] Token validation with insufficient scopes
- [ ] Pin creation with valid image URL
- [ ] Pin creation with invalid image URL
- [ ] Pin creation with long descriptions
- [ ] Pin creation with special characters
- [ ] Rate limit handling
- [ ] Error response handling

## Production Deployment

### Pre-launch Requirements
1. Complete Pinterest app review process
2. Implement proper OAuth flow
3. Set up production redirect URIs
4. Configure error monitoring
5. Implement token refresh mechanism

### Post-launch Monitoring
1. Monitor API usage and rate limits
2. Track error rates and types
3. Monitor token expiration and refresh
4. Set up alerts for API failures

## Support Resources

- [Pinterest Developer Documentation](https://developers.pinterest.com/docs/)
- [Pinterest API Reference](https://developers.pinterest.com/docs/api/v5/)
- [Pinterest Business Help Center](https://help.pinterest.com/en/business)
- [Pinterest Developer Community](https://community.pinterest.com/)

## FireKyt Integration Notes

The FireKyt platform supports:
- Automatic token validation
- Pin creation with images and links
- Board selection and management
- Bulk pin publishing
- Analytics and performance tracking

For technical support with FireKyt Pinterest integration, contact our support team.