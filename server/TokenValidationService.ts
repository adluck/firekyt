/**
 * Token Validation Service
 * Tests and validates access tokens for connected publishing platforms
 */

interface TokenValidationResult {
  isValid: boolean;
  platform: string;
  error?: string;
  details?: any;
  lastChecked: Date;
}

export class TokenValidationService {
  
  /**
   * Validate WordPress token by testing API access
   */
  async validateWordPressToken(accessToken: string, blogUrl: string): Promise<TokenValidationResult> {
    try {
      const apiUrl = `${blogUrl}/wp-json/wp/v2/users/me`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        return {
          isValid: true,
          platform: 'wordpress',
          details: {
            username: userData.name,
            capabilities: userData.capabilities,
            status: 'authenticated'
          },
          lastChecked: new Date()
        };
      } else {
        return {
          isValid: false,
          platform: 'wordpress',
          error: `Authentication failed: ${response.status} ${response.statusText}`,
          lastChecked: new Date()
        };
      }
    } catch (error: any) {
      return {
        isValid: false,
        platform: 'wordpress',
        error: `Connection error: ${error.message}`,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Validate Ghost token by testing admin API access
   */
  async validateGhostToken(adminKey: string, blogUrl: string): Promise<TokenValidationResult> {
    try {
      const apiUrl = `${blogUrl}/ghost/api/v4/admin/site/`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Ghost ${adminKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const siteData = await response.json();
        return {
          isValid: true,
          platform: 'ghost',
          details: {
            title: siteData.site?.title,
            version: siteData.site?.version,
            status: 'authenticated'
          },
          lastChecked: new Date()
        };
      } else {
        return {
          isValid: false,
          platform: 'ghost',
          error: `Authentication failed: ${response.status} ${response.statusText}`,
          lastChecked: new Date()
        };
      }
    } catch (error: any) {
      return {
        isValid: false,
        platform: 'ghost',
        error: `Connection error: ${error.message}`,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Validate Medium token by testing user info endpoint
   */
  async validateMediumToken(accessToken: string): Promise<TokenValidationResult> {
    try {
      const response = await fetch('https://api.medium.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        return {
          isValid: true,
          platform: 'medium',
          details: {
            username: userData.data?.username,
            name: userData.data?.name,
            status: 'authenticated'
          },
          lastChecked: new Date()
        };
      } else {
        return {
          isValid: false,
          platform: 'medium',
          error: `Authentication failed: ${response.status} ${response.statusText}`,
          lastChecked: new Date()
        };
      }
    } catch (error: any) {
      return {
        isValid: false,
        platform: 'medium',
        error: `Connection error: ${error.message}`,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Validate LinkedIn token by testing profile endpoint
   */
  async validateLinkedInToken(accessToken: string): Promise<TokenValidationResult> {
    try {
      console.log('🔗 Testing LinkedIn token validation...');
      console.log('🔑 Token length:', accessToken?.length);
      console.log('🔑 Token starts with:', accessToken?.substring(0, 10) + '...');
      
      // LinkedIn has restricted API access significantly. We'll do basic token validation
      // and let the actual posting attempt handle detailed validation
      
      // Basic token format validation
      if (!accessToken || accessToken.length < 50) {
        return {
          isValid: false,
          platform: 'linkedin',
          error: 'LinkedIn access token appears invalid - should be 50+ characters',
          lastChecked: new Date()
        };
      }

      // Test with a simple API call that works with minimal scopes
      const response = await fetch('https://api.linkedin.com/v2/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      console.log('📡 LinkedIn API response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ LinkedIn token validated successfully');
        
        return {
          isValid: true,
          platform: 'linkedin',
          details: {
            status: 'authenticated',
            profileId: data.id || 'unknown',
            message: 'Token validation successful'
          },
          lastChecked: new Date()
        };
      } else if (response.status === 401) {
        return {
          isValid: false,
          platform: 'linkedin',
          error: 'LinkedIn access token is invalid or expired. Please generate a new token.',
          lastChecked: new Date()
        };
      } else if (response.status === 403) {
        // Token is valid but may lack some scopes - this is acceptable for basic validation
        console.log('✅ LinkedIn token is valid but has limited scopes');
        return {
          isValid: true,
          platform: 'linkedin',
          details: {
            status: 'authenticated',
            message: 'Token valid with limited scopes - posting functionality will validate required permissions'
          },
          lastChecked: new Date()
        };
      } else {
        const errorText = await response.text();
        console.log('❌ LinkedIn API validation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        return {
          isValid: false,
          platform: 'linkedin',
          error: `LinkedIn API error: ${response.status} ${response.statusText}. Please check your token and try again.`,
          lastChecked: new Date()
        };
      }
    } catch (error: any) {
      console.log('🔥 LinkedIn validation error:', error.message);
      return {
        isValid: false,
        platform: 'linkedin',
        error: `Connection error: ${error.message}`,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Validate Pinterest token by testing user info endpoint
   */
  async validatePinterestToken(accessToken: string): Promise<TokenValidationResult> {
    try {
      console.log('🔗 Testing Pinterest token validation...');
      console.log('🔑 Token length:', accessToken?.length);
      console.log('🔑 Token starts with:', accessToken?.substring(0, 10) + '...');
      
      // Pinterest API v5 user info endpoint
      const response = await fetch('https://api.pinterest.com/v5/user_account', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Pinterest API response status:', response.status, response.statusText);

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Pinterest token validated successfully');
        
        return {
          isValid: true,
          platform: 'pinterest',
          details: {
            username: userData.username,
            account_type: userData.account_type,
            profile_image: userData.profile_image,
            status: 'authenticated'
          },
          lastChecked: new Date()
        };
      } else if (response.status === 401) {
        const errorText = await response.text();
        console.log('❌ Pinterest 401 error details:', errorText);
        
        let errorMessage = 'Pinterest authentication failed.';
        let errorDetails = '';
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.code === 2) {
            errorDetails = 'Token is invalid, expired, or has insufficient permissions.';
          } else if (errorData.code === 3) {
            errorDetails = 'Application consumer type not supported. Your Pinterest app needs approval for API access.';
          } else if (errorData.message) {
            errorDetails = errorData.message;
          }
        } catch (e) {
          errorDetails = 'Authentication error occurred.';
        }
        
        errorMessage = `${errorMessage} ${errorDetails}

To fix this issue:
1. Go to Pinterest Developer Console (https://developers.pinterest.com/apps/)
2. Apply for API access approval if you see "consumer type not supported"
3. Generate a NEW access token with these scopes:
   • user_accounts:read
   • pins:read  
   • pins:write
   • boards:read
4. Ensure you have a Pinterest Business account
5. Verify your domain is linked to your Pinterest Business account

Note: Pinterest requires app review for production API access. Test tokens expire after 30 days.`;
        
        return {
          isValid: false,
          platform: 'pinterest',
          error: errorMessage,
          lastChecked: new Date()
        };
      } else {
        const errorText = await response.text();
        console.log('❌ Pinterest API validation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        return {
          isValid: false,
          platform: 'pinterest',
          error: `Pinterest API error: ${response.status} ${response.statusText}. Please check your token and scopes.`,
          lastChecked: new Date()
        };
      }
    } catch (error: any) {
      console.log('🔥 Pinterest validation error:', error.message);
      return {
        isValid: false,
        platform: 'pinterest',
        error: `Connection error: ${error.message}`,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Test local blog server token (for development/testing)
   */
  async validateLocalBlogToken(accessToken: string, serverUrl: string = 'http://localhost:3002'): Promise<TokenValidationResult> {
    try {
      const response = await fetch(`${serverUrl}/api/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        return {
          isValid: true,
          platform: 'local_blog',
          details: {
            server: serverUrl,
            tokenType: result.tokenType || 'test',
            status: 'authenticated'
          },
          lastChecked: new Date()
        };
      } else {
        return {
          isValid: false,
          platform: 'local_blog',
          error: `Authentication failed: ${response.status} ${response.statusText}`,
          lastChecked: new Date()
        };
      }
    } catch (error: any) {
      return {
        isValid: false,
        platform: 'local_blog',
        error: `Connection error: ${error.message}`,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Validate token based on platform type
   */
  async validateToken(platform: string, accessToken: string, connectionData: any): Promise<TokenValidationResult> {
    switch (platform.toLowerCase()) {
      case 'wordpress':
        return this.validateWordPressToken(accessToken, connectionData.blogUrl);
      
      case 'ghost':
        return this.validateGhostToken(connectionData.adminKey || accessToken, connectionData.blogUrl);
      
      case 'medium':
        return this.validateMediumToken(accessToken);
      
      case 'linkedin':
        return this.validateLinkedInToken(accessToken);
      
      case 'pinterest':
        return this.validatePinterestToken(accessToken);
      
      case 'local_blog':
      case 'test':
        return this.validateLocalBlogToken(accessToken);
      
      default:
        return {
          isValid: false,
          platform,
          error: `Unsupported platform: ${platform}`,
          lastChecked: new Date()
        };
    }
  }

  /**
   * Validate all platform connections for a user
   */
  async validateAllConnections(connections: any[]): Promise<TokenValidationResult[]> {
    const validationPromises = connections.map(connection => 
      this.validateToken(
        connection.platform,
        connection.accessToken,
        connection.connectionData || {}
      )
    );

    return Promise.all(validationPromises);
  }
}

export const tokenValidationService = new TokenValidationService();