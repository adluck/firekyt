import crypto from 'crypto';
import { db } from './db';
import { logger } from './Logger';
import { securityManager } from './SecurityManager';
import { alertingSystem } from './AlertingSystem';

export interface EncryptedField {
  value: string;
  isEncrypted: boolean;
}

export interface SecureStorageOptions {
  encryptSensitiveFields?: boolean;
  auditLog?: boolean;
  fieldLevelEncryption?: string[];
}

export class SecureDataStorage {
  private static instance: SecureDataStorage;
  private readonly encryptionKey: string;
  private readonly sensitiveFields = [
    'password',
    'apiKey',
    'accessToken',
    'refreshToken',
    'stripeCustomerId',
    'paymentMethodId',
    'socialSecurityNumber',
    'creditCardNumber',
    'bankAccountNumber'
  ];

  private constructor() {
    this.encryptionKey = process.env.FIELD_ENCRYPTION_KEY || this.generateEncryptionKey();
    if (!process.env.FIELD_ENCRYPTION_KEY) {
      logger.warn('No FIELD_ENCRYPTION_KEY found. Generated temporary key for session.');
    }
  }

  static getInstance(): SecureDataStorage {
    if (!SecureDataStorage.instance) {
      SecureDataStorage.instance = new SecureDataStorage();
    }
    return SecureDataStorage.instance;
  }

  // Field-level encryption for sensitive data
  encryptField(value: string, fieldName: string): EncryptedField {
    if (!this.isSensitiveField(fieldName)) {
      return { value, isEncrypted: false };
    }

    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
      
      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const encryptedValue = `${iv.toString('hex')}:${encrypted}`;
      
      logger.debug('Field encrypted successfully', { fieldName });
      return { value: encryptedValue, isEncrypted: true };
    } catch (error) {
      logger.error('Field encryption failed', error as Error, { fieldName });
      throw new Error('Encryption failed');
    }
  }

  decryptField(encryptedValue: string, fieldName: string): string {
    if (!encryptedValue.includes(':')) {
      // Not encrypted, return as-is
      return encryptedValue;
    }

    try {
      const [ivHex, encrypted] = encryptedValue.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Field decryption failed', error as Error, { fieldName });
      throw new Error('Decryption failed');
    }
  }

  // Secure user data operations
  async storeUserData(userData: any, options: SecureStorageOptions = {}): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Encrypt sensitive fields
      const secureData = this.processDataForStorage(userData, options);
      
      // Audit logging
      if (options.auditLog !== false) {
        await this.logDataAccess('STORE', 'user_data', userData.id, {
          fields: Object.keys(userData),
          encryptedFields: options.fieldLevelEncryption || []
        });
      }
      
      // Store with transaction for atomicity
      const result = await db.transaction(async (tx) => {
        return await tx.insert(/* table */).values(secureData).returning();
      });
      
      const duration = Date.now() - startTime;
      alertingSystem.recordMetric('secure_storage_operations', 1);
      alertingSystem.recordMetric('storage_operation_duration', duration);
      
      logger.info('Secure data storage completed', {
        operation: 'store',
        duration,
        encryptedFields: this.countEncryptedFields(secureData)
      });
      
      return result;
    } catch (error) {
      logger.error('Secure data storage failed', error as Error, {
        operation: 'store',
        userId: userData.id
      });
      
      alertingSystem.recordMetric('storage_operation_failures', 1);
      throw error;
    }
  }

  async retrieveUserData(userId: number, options: SecureStorageOptions = {}): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Audit logging
      if (options.auditLog !== false) {
        await this.logDataAccess('RETRIEVE', 'user_data', userId);
      }
      
      // Retrieve data
      const encryptedData = await db.query(/* SQL query to get user data */);
      
      // Decrypt sensitive fields
      const decryptedData = this.processDataFromStorage(encryptedData, options);
      
      const duration = Date.now() - startTime;
      alertingSystem.recordMetric('secure_retrieval_operations', 1);
      
      logger.info('Secure data retrieval completed', {
        operation: 'retrieve',
        userId,
        duration
      });
      
      return decryptedData;
    } catch (error) {
      logger.error('Secure data retrieval failed', error as Error, {
        operation: 'retrieve',
        userId
      });
      
      alertingSystem.recordMetric('retrieval_operation_failures', 1);
      throw error;
    }
  }

  // PII (Personally Identifiable Information) handling
  async storePII(data: any, userId: number): Promise<void> {
    const hashedUserId = this.hashIdentifier(userId.toString());
    
    const piiRecord = {
      userHash: hashedUserId,
      encryptedData: securityManager.encryptSensitiveData(JSON.stringify(data)),
      createdAt: new Date(),
      accessedAt: new Date()
    };
    
    await db.insert(/* PII table */).values(piiRecord);
    
    await this.logDataAccess('STORE_PII', 'pii_data', userId, {
      dataKeys: Object.keys(data)
    });
    
    logger.info('PII data stored securely', { userId: hashedUserId });
  }

  async retrievePII(userId: number): Promise<any> {
    const hashedUserId = this.hashIdentifier(userId.toString());
    
    const piiRecord = await db.query(/* Get PII by user hash */);
    
    if (!piiRecord) {
      return null;
    }
    
    // Update access timestamp
    await db.update(/* PII table */).set({ accessedAt: new Date() });
    
    await this.logDataAccess('RETRIEVE_PII', 'pii_data', userId);
    
    const decryptedData = JSON.parse(
      securityManager.decryptSensitiveData(piiRecord.encryptedData)
    );
    
    logger.info('PII data retrieved', { userId: hashedUserId });
    return decryptedData;
  }

  // Secure API key storage
  async storeAPIKey(userId: number, provider: string, apiKey: string): Promise<void> {
    const encryptedKey = securityManager.encryptSensitiveData(apiKey);
    const keyHash = this.hashIdentifier(apiKey);
    
    const apiKeyRecord = {
      userId,
      provider,
      encryptedKey,
      keyHash,
      createdAt: new Date(),
      lastUsed: null,
      isActive: true
    };
    
    await db.insert(/* API keys table */).values(apiKeyRecord);
    
    await this.logDataAccess('STORE_API_KEY', 'api_keys', userId, {
      provider,
      keyHash: keyHash.substring(0, 8)
    });
    
    logger.info('API key stored securely', { userId, provider });
  }

  async retrieveAPIKey(userId: number, provider: string): Promise<string | null> {
    const keyRecord = await db.query(/* Get API key by user and provider */);
    
    if (!keyRecord || !keyRecord.isActive) {
      return null;
    }
    
    // Update last used timestamp
    await db.update(/* API keys table */).set({ lastUsed: new Date() });
    
    await this.logDataAccess('RETRIEVE_API_KEY', 'api_keys', userId, {
      provider
    });
    
    const decryptedKey = securityManager.decryptSensitiveData(keyRecord.encryptedKey);
    
    logger.info('API key retrieved', { userId, provider });
    return decryptedKey;
  }

  // Data anonymization for analytics
  async anonymizeUserData(userData: any): Promise<any> {
    const anonymized = { ...userData };
    
    // Remove direct identifiers
    delete anonymized.email;
    delete anonymized.firstName;
    delete anonymized.lastName;
    delete anonymized.phone;
    
    // Hash remaining identifiers
    if (anonymized.id) {
      anonymized.userHash = this.hashIdentifier(anonymized.id.toString());
      delete anonymized.id;
    }
    
    // Generalize sensitive data
    if (anonymized.birthDate) {
      anonymized.ageGroup = this.getAgeGroup(anonymized.birthDate);
      delete anonymized.birthDate;
    }
    
    if (anonymized.ipAddress) {
      anonymized.ipPrefix = this.getIPPrefix(anonymized.ipAddress);
      delete anonymized.ipAddress;
    }
    
    return anonymized;
  }

  // Data retention and cleanup
  async cleanupExpiredData(): Promise<void> {
    const retentionPeriods = {
      audit_logs: 365, // 1 year
      pii_data: 1095, // 3 years
      session_data: 30, // 30 days
      temporary_tokens: 1 // 1 day
    };
    
    for (const [table, days] of Object.entries(retentionPeriods)) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      try {
        const deletedCount = await db.delete(/* table */)
          .where(/* createdAt < cutoffDate */);
        
        logger.info('Expired data cleaned up', {
          table,
          deletedRecords: deletedCount,
          cutoffDate
        });
        
        alertingSystem.recordMetric('data_cleanup_operations', 1);
      } catch (error) {
        logger.error('Data cleanup failed', error as Error, { table });
      }
    }
  }

  // Secure backup operations
  async createSecureBackup(userId: number): Promise<string> {
    const userData = await this.retrieveUserData(userId);
    const piiData = await this.retrievePII(userId);
    
    const backupData = {
      userData,
      piiData,
      timestamp: new Date(),
      version: '1.0'
    };
    
    const encryptedBackup = securityManager.encryptSensitiveData(
      JSON.stringify(backupData)
    );
    
    const backupId = crypto.randomBytes(16).toString('hex');
    
    await db.insert(/* backups table */).values({
      id: backupId,
      userId,
      encryptedData: encryptedBackup,
      createdAt: new Date()
    });
    
    await this.logDataAccess('CREATE_BACKUP', 'backups', userId, {
      backupId
    });
    
    logger.info('Secure backup created', { userId, backupId });
    return backupId;
  }

  // Private helper methods
  private processDataForStorage(data: any, options: SecureStorageOptions): any {
    const processed = { ...data };
    
    for (const [key, value] of Object.entries(processed)) {
      if (typeof value === 'string' && this.shouldEncryptField(key, options)) {
        const encrypted = this.encryptField(value, key);
        processed[key] = encrypted.value;
      }
    }
    
    return processed;
  }

  private processDataFromStorage(data: any, options: SecureStorageOptions): any {
    const processed = { ...data };
    
    for (const [key, value] of Object.entries(processed)) {
      if (typeof value === 'string' && this.shouldDecryptField(key, options)) {
        processed[key] = this.decryptField(value, key);
      }
    }
    
    return processed;
  }

  private shouldEncryptField(fieldName: string, options: SecureStorageOptions): boolean {
    if (options.fieldLevelEncryption) {
      return options.fieldLevelEncryption.includes(fieldName);
    }
    
    return options.encryptSensitiveFields !== false && this.isSensitiveField(fieldName);
  }

  private shouldDecryptField(fieldName: string, options: SecureStorageOptions): boolean {
    return this.shouldEncryptField(fieldName, options);
  }

  private isSensitiveField(fieldName: string): boolean {
    return this.sensitiveFields.some(sensitive => 
      fieldName.toLowerCase().includes(sensitive.toLowerCase())
    );
  }

  private countEncryptedFields(data: any): number {
    return Object.keys(data).filter(key => 
      this.isSensitiveField(key)
    ).length;
  }

  private hashIdentifier(identifier: string): string {
    return crypto.createHash('sha256').update(identifier).digest('hex');
  }

  private getAgeGroup(birthDate: Date): string {
    const age = new Date().getFullYear() - birthDate.getFullYear();
    if (age < 18) return 'under-18';
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    if (age < 65) return '55-64';
    return '65+';
  }

  private getIPPrefix(ipAddress: string): string {
    const parts = ipAddress.split('.');
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }

  private async logDataAccess(
    action: string,
    dataType: string,
    userId: number,
    metadata: any = {}
  ): Promise<void> {
    const auditLog = {
      action,
      dataType,
      userId,
      metadata,
      ipAddress: metadata.ipAddress || 'unknown',
      userAgent: metadata.userAgent || 'unknown',
      timestamp: new Date()
    };
    
    await db.insert(/* audit_logs table */).values(auditLog);
    
    logger.info('Data access logged', {
      action,
      dataType,
      userId
    });
  }

  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Export singleton instance
export const secureDataStorage = SecureDataStorage.getInstance();