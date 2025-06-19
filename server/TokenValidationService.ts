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
      const response = await fetch('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        return {
          isValid: true,
          platform: 'linkedin',
          details: {
            firstName: userData.firstName?.localized?.en_US,
            lastName: userData.lastName?.localized?.en_US,
            status: 'authenticated'
          },
          lastChecked: new Date()
        };
      } else {
        return {
          isValid: false,
          platform: 'linkedin',
          error: `Authentication failed: ${response.status} ${response.statusText}`,
          lastChecked: new Date()
        };
      }
    } catch (error: any) {
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