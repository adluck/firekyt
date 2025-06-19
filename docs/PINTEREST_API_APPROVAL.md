# Pinterest API Approval Guide

## Error: "Your application consumer type is not supported"

This error (code 3) indicates that your Pinterest app requires approval for API access beyond basic testing.

## Solution Steps

### 1. Pinterest Developer Account Setup
- Ensure you have a Pinterest Business account (not personal)
- Go to [Pinterest Developer Console](https://developers.pinterest.com/apps/)
- Create or select your app

### 2. Request API Access Approval
Pinterest requires manual approval for production API access:

1. **Contact Pinterest Developer Support**
   - Email: `api-support@pinterest.com`
   - Subject: "API Access Request for [Your App Name]"

2. **Include in your request:**
   ```
   App Name: [Your App Name]
   App ID: [Your Pinterest App ID]
   Business Use Case: Content publishing and affiliate marketing
   Expected API Usage: Publishing pins programmatically
   Company/Organization: [Your Company]
   Website: [Your Website URL]
   ```

3. **Required Information:**
   - Clear description of how you'll use the API
   - Your business model
   - Expected volume of API calls
   - Privacy policy URL
   - Terms of service URL

### 3. App Configuration Requirements

**Required Scopes:**
- `user_accounts:read` - Read user profile information
- `pins:read` - Read pins data
- `pins:write` - Create and update pins
- `boards:read` - Read boards data

**Domain Verification:**
1. In Pinterest Business settings, verify your domain
2. Add HTML meta tag or upload verification file
3. Ensure domain matches your app configuration

### 4. Alternative Testing Options

While waiting for approval, you can:

1. **Use Test Tokens:**
   - Generate test tokens in developer console
   - Limited to 100 requests per day
   - Expire after 30 days

2. **Sandbox Environment:**
   - Pinterest provides limited sandbox access
   - Test basic functionality without full approval

### 5. Production Approval Timeline

- **Initial Response:** 3-5 business days
- **Full Review:** 2-4 weeks
- **Follow-up:** May require additional documentation

## Common Approval Requirements

### Business Verification
- Valid business registration
- Professional website with privacy policy
- Clear terms of service
- Contact information

### Technical Requirements
- Proper OAuth implementation
- Rate limiting respect
- Error handling
- Data privacy compliance

### Use Case Documentation
- Detailed API usage plan
- User benefit explanation
- Content moderation policies
- Spam prevention measures

## Troubleshooting

### If Approval is Denied
1. Review Pinterest's developer policies
2. Address specific feedback provided
3. Resubmit with improvements
4. Consider alternative integration approaches

### Alternative Approaches
1. **Manual Scheduling:** Use Pinterest's native scheduling tools
2. **Third-party Services:** Consider Pinterest-approved marketing platforms
3. **Browser Automation:** For internal use only (not recommended for production)

## Best Practices

### API Usage
- Respect rate limits (200 requests per hour for production)
- Implement proper error handling
- Cache responses when appropriate
- Use webhooks for real-time updates

### Content Guidelines
- Follow Pinterest community guidelines
- Ensure high-quality images
- Use relevant descriptions and hashtags
- Avoid spam or misleading content

### Compliance
- GDPR compliance for EU users
- CCPA compliance for California users
- Pinterest's data use policies
- Regular security audits

## Resources

- [Pinterest Developer Documentation](https://developers.pinterest.com/docs/)
- [Pinterest API Policies](https://policy.pinterest.com/developer-guidelines)
- [Pinterest Business Help Center](https://help.pinterest.com/en/business)
- [Pinterest API Rate Limits](https://developers.pinterest.com/docs/api/v5/#tag/Rate-limits)

## Contact Information

**Pinterest Developer Support:**
- Email: api-support@pinterest.com
- Developer Forum: [Pinterest Developers Community](https://community.pinterest.com/)
- Help Center: [Pinterest for Developers](https://help.pinterest.com/en/developers)