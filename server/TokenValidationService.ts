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
      
      // Try the userinfo endpoint first, which requires fewer permissions
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 LinkedIn API response status:', response.status, response.statusText);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ LinkedIn profile data received:', userData);
        
        return {
          isValid: true,
          platform: 'linkedin',
          details: {
            name: userData.name,
            email: userData.email,
            status: 'authenticated',
            profileId: userData.sub
          },
          lastChecked: new Date()
        };
      } else {
        const errorText = await response.text();
        console.log('❌ LinkedIn userinfo API failed, trying profile endpoint...');
        
        // Fallback to the original profile endpoint
        const profileResponse = await fetch('https://api.linkedin.com/v2/people/~', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📡 LinkedIn profile API response status:', profileResponse.status);

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('✅ LinkedIn profile data received:', profileData);
          
          return {
            isValid: true,
            platform: 'linkedin',
            details: {
              firstName: profileData.firstName?.localized?.en_US,
              lastName: profileData.lastName?.localized?.en_US,
              status: 'authenticated',
              profileId: profileData.id
            },
            lastChecked: new Date()
          };
        } else {
          const profileErrorText = await profileResponse.text();
          console.log('❌ LinkedIn profile API also failed:', {
            status: profileResponse.status,
            error: profileErrorText
          });

          let errorMessage = `Authentication failed: ${response.status} ${response.statusText}`;
          
          if (response.status === 403) {
            errorMessage += '\n\nYour LinkedIn access token needs these scopes:\n• openid\n• profile\n• email\n• w_member_social\n\nPlease regenerate your token with these permissions.';
          }
          
          return {
            isValid: false,
            platform: 'linkedin',
            error: errorMessage,
            lastChecked: new Date()
          };
        }
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