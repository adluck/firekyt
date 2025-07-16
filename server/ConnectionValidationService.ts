/**
 * Connection Validation Service
 * Automatically validates and updates WordPress connection status
 * Provides detailed error information for failed connections
 */

import { storage } from './storage';

export interface ValidationResult {
  isValid: boolean;
  platform: string;
  error?: string;
  errorCode?: string;
  userMessage?: string;
  actionRequired?: string;
  lastChecked: Date;
}

export class ConnectionValidationService {
  
  /**
   * Validate all active WordPress connections
   */
  async validateAllWordPressConnections(): Promise<void> {
    try {
      console.log('🔍 Starting WordPress connection validation...');
      
      // Get all active WordPress connections
      const connections = await storage.getAllPlatformConnections();
      const wordpressConnections = connections.filter(
        conn => conn.platform === 'wordpress' && conn.isActive
      );
      
      console.log(`📋 Found ${wordpressConnections.length} active WordPress connections to validate`);
      
      for (const connection of wordpressConnections) {
        await this.validateWordPressConnection(connection);
        // Small delay between validation calls to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('✅ WordPress connection validation completed');
    } catch (error: any) {
      console.error('❌ Error during WordPress connection validation:', error.message);
    }
  }
  
  /**
   * Validate a single WordPress connection
   */
  async validateWordPressConnection(connection: any): Promise<ValidationResult> {
    try {
      // Parse connectionData if it's a JSON string
      let parsedConnectionData = connection.connectionData;
      if (typeof connection.connectionData === 'string') {
        try {
          parsedConnectionData = JSON.parse(connection.connectionData);
        } catch (e) {
          console.log('🚨 Failed to parse connectionData JSON:', connection.connectionData);
          parsedConnectionData = {};
        }
      }
      
      // Check multiple possible locations for connection data
      const blogUrl = parsedConnectionData?.blogUrl || connection.blogUrl;
      const username = parsedConnectionData?.username || connection.platformUsername || connection.username;
      const accessToken = parsedConnectionData?.accessToken || connection.accessToken;
      
      console.log(`🔍 Connection data structure:`, {
        id: connection.id,
        platform: connection.platform,
        blogUrl: blogUrl,
        username: username,
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length || 0,
        connectionDataRaw: connection.connectionData,
        connectionDataParsed: parsedConnectionData,
        connectionDataKeys: parsedConnectionData ? Object.keys(parsedConnectionData) : 'no connectionData',
        directKeys: Object.keys(connection)
      });
      
      if (!blogUrl) {
        return {
          isValid: false,
          platform: 'wordpress',
          error: 'Missing blog URL in connection data',
          errorCode: 'MISSING_BLOG_URL',
          userMessage: 'WordPress blog URL is missing. Please recreate your connection.',
          actionRequired: 'Recreate WordPress connection with valid blog URL',
          lastChecked: new Date()
        };
      }
      
      if (!username) {
        return {
          isValid: false,
          platform: 'wordpress',
          error: 'Missing username in connection data',
          errorCode: 'MISSING_USERNAME',
          userMessage: 'WordPress username is missing. Please recreate your connection.',
          actionRequired: 'Recreate WordPress connection with valid username',
          lastChecked: new Date()
        };
      }
      
      if (!accessToken) {
        return {
          isValid: false,
          platform: 'wordpress',
          error: 'Missing access token in connection data',
          errorCode: 'MISSING_ACCESS_TOKEN',
          userMessage: 'WordPress application password is missing. Please recreate your connection.',
          actionRequired: 'Recreate WordPress connection with valid application password',
          lastChecked: new Date()
        };
      }
      
      // Ensure proper URL formatting (remove trailing slash before adding path)
      const cleanBlogUrl = blogUrl.replace(/\/+$/, '');
      const apiUrl = `${cleanBlogUrl}/wp-json/wp/v2/users/me`;
      console.log(`🔍 Validating WordPress connection ${connection.id} (${username}) - ${blogUrl}`);
      console.log(`🔑 Using access token (length: ${accessToken?.length || 0})`);
      console.log(`🌐 Testing URL: ${apiUrl}`);
      
      // WordPress uses Basic auth with username:app_password format
      // Note: Remove spaces from application password (WordPress shows them with spaces but they should be removed)
      const cleanPassword = accessToken.replace(/\s+/g, '');
      const authString = `${username}:${cleanPassword}`;
      const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
      
      console.log(`🔐 Auth format: username="${username}", original_password_length=${accessToken?.length}, clean_password_length=${cleanPassword.length}, auth_string="${authString}"`);
      
      // Also try with lowercase username as WordPress might be case-sensitive
      const lowercaseUsername = username.toLowerCase();
      const altAuthString = `${lowercaseUsername}:${cleanPassword}`;
      console.log(`🔐 Alternative auth string: "${altAuthString}"`);
      
      // Try with original case first
      let response = await fetch(apiUrl, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });
      
      // If authentication fails, try with lowercase username
      if (response.status === 401 && username !== lowercaseUsername) {
        console.log(`🔄 Retrying with lowercase username: ${lowercaseUsername}`);
        const altAuthHeader = `Basic ${Buffer.from(altAuthString).toString('base64')}`;
        
        response = await fetch(apiUrl, {
          headers: {
            'Authorization': altAuthHeader,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(15000)
        });
      }
      
      console.log(`📡 WordPress API response status: ${response.status} ${response.statusText}`);
      
      const responseData = await response.json();
      console.log(`📋 WordPress API response data:`, responseData);
      
      if (response.ok) {
        console.log(`✅ WordPress connection ${connection.id} is valid`);
        
        // Update connection as valid
        await this.updateConnectionStatus(connection.id, true, null);
        
        return {
          isValid: true,
          platform: 'wordpress',
          lastChecked: new Date()
        };
      } else {
        // Handle specific WordPress error codes
        let userMessage = '';
        let actionRequired = '';
        
        if (responseData.code === 'rest_not_logged_in') {
          userMessage = 'WordPress authentication failed. Your application password may have expired or been revoked.';
          actionRequired = 'Please recreate your WordPress connection with a new application password.';
        } else if (responseData.code === 'rest_forbidden') {
          userMessage = 'WordPress access denied. Your user account needs Editor or Administrator permissions.';
          actionRequired = 'Contact your WordPress site administrator to upgrade your user role.';
        } else {
          userMessage = `WordPress error: ${responseData.message || 'Unknown authentication error'}`;
          actionRequired = 'Please check your WordPress connection settings and recreate if necessary.';
        }
        
        console.log(`❌ WordPress connection ${connection.id} failed: ${responseData.code} - ${responseData.message}`);
        
        // Update connection as invalid with error details
        await this.updateConnectionStatus(connection.id, false, {
          code: responseData.code,
          message: responseData.message,
          userMessage,
          actionRequired,
          lastError: new Date()
        });
        
        return {
          isValid: false,
          platform: 'wordpress',
          error: responseData.message,
          errorCode: responseData.code,
          userMessage,
          actionRequired,
          lastChecked: new Date()
        };
      }
    } catch (error: any) {
      console.log(`❌ WordPress connection ${connection.id} error: ${error.message}`);
      
      // Update connection with network error
      await this.updateConnectionStatus(connection.id, false, {
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage: 'Unable to connect to your WordPress site. Please check the blog URL.',
        actionRequired: 'Verify your WordPress site URL is correct and accessible.',
        lastError: new Date()
      });
      
      return {
        isValid: false,
        platform: 'wordpress',
        error: `Connection error: ${error.message}`,
        errorCode: 'NETWORK_ERROR',
        userMessage: 'Unable to connect to your WordPress site. Please check the blog URL.',
        actionRequired: 'Verify your WordPress site URL is correct and accessible.',
        lastChecked: new Date()
      };
    }
  }
  
  /**
   * Update connection status and error information
   */
  private async updateConnectionStatus(connectionId: number, isValid: boolean, errorData: any): Promise<void> {
    try {
      const updateData: any = {
        isActive: isValid,
        lastSyncAt: new Date()
      };
      
      if (errorData) {
        updateData.connectionData = {
          ...updateData.connectionData,
          validationError: errorData
        };
      }
      
      await storage.updatePlatformConnection(connectionId, updateData);
    } catch (error: any) {
      console.error(`Failed to update connection ${connectionId} status:`, error.message);
    }
  }
  
  /**
   * Get validation summary for all WordPress connections
   */
  async getWordPressValidationSummary(): Promise<{ valid: number; invalid: number; total: number; errors: any[] }> {
    try {
      const connections = await storage.getAllPlatformConnections();
      const wordpressConnections = connections.filter(conn => conn.platform === 'wordpress');
      
      const valid = wordpressConnections.filter(conn => conn.isActive).length;
      const invalid = wordpressConnections.filter(conn => !conn.isActive).length;
      const errors = wordpressConnections
        .filter(conn => !conn.isActive && conn.connectionData?.validationError)
        .map(conn => ({
          id: conn.id,
          username: conn.platformUsername,
          error: conn.connectionData.validationError
        }));
      
      return {
        valid,
        invalid,
        total: wordpressConnections.length,
        errors
      };
    } catch (error: any) {
      console.error('Error getting WordPress validation summary:', error.message);
      return { valid: 0, invalid: 0, total: 0, errors: [] };
    }
  }
}

export const connectionValidationService = new ConnectionValidationService();