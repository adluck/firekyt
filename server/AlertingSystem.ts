import { logger } from './Logger';
import { AppError, ErrorSeverity } from './ErrorHandler';

export enum AlertType {
  ERROR_RATE_HIGH = 'error_rate_high',
  RESPONSE_TIME_HIGH = 'response_time_high',
  DATABASE_CONNECTION_FAILED = 'database_connection_failed',
  MEMORY_USAGE_HIGH = 'memory_usage_high',
  CPU_USAGE_HIGH = 'cpu_usage_high',
  DISK_SPACE_LOW = 'disk_space_low',
  PAYMENT_FAILURE = 'payment_failure',
  AI_SERVICE_DOWN = 'ai_service_down',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SECURITY_BREACH = 'security_breach',
  SUBSCRIPTION_CHURN = 'subscription_churn',
  USER_SIGNUP_ANOMALY = 'user_signup_anomaly'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  metadata: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  escalationLevel: number;
  notificationsSent: string[];
}

export interface AlertRule {
  type: AlertType;
  enabled: boolean;
  conditions: AlertCondition[];
  severity: AlertSeverity;
  cooldownMinutes: number;
  escalationThresholds: number[];
  notificationChannels: NotificationChannel[];
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  windowMinutes: number;
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
}

export class AlertingSystem {
  private static instance: AlertingSystem;
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<AlertType, AlertRule> = new Map();
  private metrics: Map<string, Array<{ timestamp: Date; value: number }>> = new Map();
  private lastAlertTime: Map<AlertType, Date> = new Map();

  private constructor() {
    this.initializeDefaultRules();
    this.startMetricsCollection();
    this.startAlertEvaluation();
  }

  static getInstance(): AlertingSystem {
    if (!AlertingSystem.instance) {
      AlertingSystem.instance = new AlertingSystem();
    }
    return AlertingSystem.instance;
  }

  // Alert management
  createAlert(
    type: AlertType,
    title: string,
    message: string,
    metadata: Record<string, any> = {},
    severity: AlertSeverity = AlertSeverity.WARNING
  ): string {
    const alertId = this.generateAlertId();
    const alert: Alert = {
      id: alertId,
      type,
      severity,
      title,
      message,
      timestamp: new Date(),
      metadata,
      resolved: false,
      escalationLevel: 0,
      notificationsSent: []
    };

    this.alerts.set(alertId, alert);
    
    logger.warn(`Alert created: ${title}`, {
      alertId,
      alertType: type,
      severity,
      metadata
    });

    this.processAlert(alert);
    return alertId;
  }

  resolveAlert(alertId: string, resolvedBy?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolved) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    
    logger.info(`Alert resolved: ${alert.title}`, {
      alertId,
      alertType: alert.type,
      resolvedBy,
      duration: alert.resolvedAt.getTime() - alert.timestamp.getTime()
    });

    return true;
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  getAlertHistory(hours: number = 24): Alert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.alerts.values())
      .filter(alert => alert.timestamp >= cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Metrics collection
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricData = this.metrics.get(name)!;
    metricData.push({ timestamp: new Date(), value });

    // Keep only last 1000 data points
    if (metricData.length > 1000) {
      metricData.shift();
    }
  }

  // Error tracking
  trackError(error: AppError): void {
    this.recordMetric('error_count', 1);
    this.recordMetric(`error_${error.severity}`, 1);

    // Create alerts for critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.createAlert(
        AlertType.ERROR_RATE_HIGH,
        'Critical Error Detected',
        `Critical error occurred: ${error.message}`,
        {
          errorCode: error.code,
          userId: error.userId,
          requestId: error.requestId
        },
        AlertSeverity.CRITICAL
      );
    }

    // Check error rate
    this.evaluateErrorRate();
  }

  // Performance monitoring
  trackResponseTime(endpoint: string, responseTime: number): void {
    this.recordMetric('response_time', responseTime);
    this.recordMetric(`response_time_${endpoint}`, responseTime);
  }

  trackDatabaseQuery(duration: number): void {
    this.recordMetric('db_query_time', duration);
  }

  trackMemoryUsage(usage: number): void {
    this.recordMetric('memory_usage', usage);
  }

  trackCpuUsage(usage: number): void {
    this.recordMetric('cpu_usage', usage);
  }

  // Business metrics
  trackPaymentFailure(userId: number, amount: number, reason: string): void {
    this.recordMetric('payment_failures', 1);
    
    this.createAlert(
      AlertType.PAYMENT_FAILURE,
      'Payment Failure Detected',
      `Payment failed for user ${userId}: ${reason}`,
      { userId, amount, reason },
      AlertSeverity.WARNING
    );
  }

  trackSubscriptionChurn(userId: number, tier: string): void {
    this.recordMetric('subscription_churn', 1);
    
    this.createAlert(
      AlertType.SUBSCRIPTION_CHURN,
      'Subscription Cancelled',
      `User ${userId} cancelled ${tier} subscription`,
      { userId, tier },
      AlertSeverity.INFO
    );
  }

  trackSecurityEvent(event: string, severity: AlertSeverity, details: Record<string, any>): void {
    this.recordMetric('security_events', 1);
    
    this.createAlert(
      AlertType.SECURITY_BREACH,
      `Security Event: ${event}`,
      `Security event detected: ${event}`,
      details,
      severity
    );
  }

  // Private methods
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        type: AlertType.ERROR_RATE_HIGH,
        enabled: true,
        conditions: [
          { metric: 'error_count', operator: 'gt', threshold: 10, windowMinutes: 5 }
        ],
        severity: AlertSeverity.WARNING,
        cooldownMinutes: 15,
        escalationThresholds: [30, 60],
        notificationChannels: [
          { type: 'email', config: { recipients: ['admin@example.com'] }, enabled: true }
        ]
      },
      {
        type: AlertType.RESPONSE_TIME_HIGH,
        enabled: true,
        conditions: [
          { metric: 'response_time', operator: 'gt', threshold: 5000, windowMinutes: 10 }
        ],
        severity: AlertSeverity.WARNING,
        cooldownMinutes: 10,
        escalationThresholds: [20, 40],
        notificationChannels: [
          { type: 'email', config: { recipients: ['admin@example.com'] }, enabled: true }
        ]
      },
      {
        type: AlertType.MEMORY_USAGE_HIGH,
        enabled: process.env.NODE_ENV === 'production',
        conditions: [
          { metric: 'memory_usage', operator: 'gt', threshold: 95, windowMinutes: 10 }
        ],
        severity: AlertSeverity.CRITICAL,
        cooldownMinutes: 30,
        escalationThresholds: [60, 120],
        notificationChannels: [
          { type: 'email', config: { recipients: ['admin@example.com'] }, enabled: true }
        ]
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.type, rule);
    });
  }

  private processAlert(alert: Alert): void {
    const rule = this.alertRules.get(alert.type);
    if (!rule || !rule.enabled) {
      return;
    }

    // Check cooldown
    const lastAlert = this.lastAlertTime.get(alert.type);
    if (lastAlert) {
      const cooldownMs = rule.cooldownMinutes * 60 * 1000;
      if (Date.now() - lastAlert.getTime() < cooldownMs) {
        return;
      }
    }

    this.lastAlertTime.set(alert.type, new Date());
    this.sendNotifications(alert, rule);
  }

  private sendNotifications(alert: Alert, rule: AlertRule): void {
    rule.notificationChannels.forEach(channel => {
      if (!channel.enabled) return;

      try {
        switch (channel.type) {
          case 'email':
            this.sendEmailNotification(alert, channel.config);
            break;
          case 'slack':
            this.sendSlackNotification(alert, channel.config);
            break;
          case 'webhook':
            this.sendWebhookNotification(alert, channel.config);
            break;
          case 'sms':
            this.sendSmsNotification(alert, channel.config);
            break;
        }

        alert.notificationsSent.push(channel.type);
        
        logger.info(`Alert notification sent via ${channel.type}`, {
          alertId: alert.id,
          alertType: alert.type,
          channel: channel.type
        });
      } catch (error) {
        logger.error(`Failed to send alert notification via ${channel.type}`, error as Error, {
          alertId: alert.id,
          alertType: alert.type
        });
      }
    });
  }

  private sendEmailNotification(alert: Alert, config: any): void {
    // Email notification implementation
    const emailData = {
      to: config.recipients,
      subject: `Alert: ${alert.title}`,
      body: `
        Alert Details:
        - Type: ${alert.type}
        - Severity: ${alert.severity}
        - Message: ${alert.message}
        - Timestamp: ${alert.timestamp.toISOString()}
        - Metadata: ${JSON.stringify(alert.metadata, null, 2)}
      `
    };

    // In production, integrate with email service like SendGrid, SES, etc.
    console.log('Email notification:', emailData);
  }

  private sendSlackNotification(alert: Alert, config: any): void {
    // Slack notification implementation
    const slackMessage = {
      text: `🚨 Alert: ${alert.title}`,
      attachments: [
        {
          color: this.getSeverityColor(alert.severity),
          fields: [
            { title: 'Type', value: alert.type, short: true },
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Message', value: alert.message, short: false },
            { title: 'Timestamp', value: alert.timestamp.toISOString(), short: true }
          ]
        }
      ]
    };

    // In production, send to Slack webhook
    console.log('Slack notification:', slackMessage);
  }

  private sendWebhookNotification(alert: Alert, config: any): void {
    // Webhook notification implementation
    const webhookData = {
      alert: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp,
        metadata: alert.metadata
      }
    };

    // In production, send HTTP POST to webhook URL
    if (config.url) {
      fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': config.authHeader || ''
        },
        body: JSON.stringify(webhookData)
      }).catch(error => {
        logger.error('Webhook notification failed', error as Error);
      });
    }
  }

  private sendSmsNotification(alert: Alert, config: any): void {
    // SMS notification implementation (would integrate with Twilio, etc.)
    const smsMessage = `Alert: ${alert.title} - ${alert.message}`;
    console.log('SMS notification:', { to: config.phoneNumbers, message: smsMessage });
  }

  private evaluateErrorRate(): void {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const errorData = this.metrics.get('error_count') || [];
    const recentErrors = errorData.filter(data => data.timestamp >= fiveMinutesAgo);
    const errorCount = recentErrors.reduce((sum, data) => sum + data.value, 0);

    if (errorCount > 10) {
      this.createAlert(
        AlertType.ERROR_RATE_HIGH,
        'High Error Rate Detected',
        `${errorCount} errors in the last 5 minutes`,
        { errorCount, window: '5m' },
        AlertSeverity.WARNING
      );
    }
  }

  private startMetricsCollection(): void {
    // Collect system metrics every minute
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60000);
  }

  private startAlertEvaluation(): void {
    // Evaluate alert rules every 30 seconds
    setInterval(() => {
      this.evaluateAlertRules();
    }, 30000);
  }

  private collectSystemMetrics(): void {
    // Memory usage
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    this.recordMetric('memory_usage', memUsagePercent);

    // CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    this.recordMetric('cpu_usage', (cpuUsage.user + cpuUsage.system) / 1000000);
  }

  private evaluateAlertRules(): void {
    this.alertRules.forEach((rule, alertType) => {
      if (!rule.enabled) return;

      const shouldAlert = rule.conditions.every(condition => {
        return this.evaluateCondition(condition);
      });

      if (shouldAlert) {
        const activeAlert = Array.from(this.alerts.values())
          .find(alert => alert.type === alertType && !alert.resolved);

        if (!activeAlert) {
          this.createAlert(
            alertType,
            `Alert: ${alertType}`,
            `Alert condition met for ${alertType}`,
            {},
            rule.severity
          );
        }
      }
    });
  }

  private evaluateCondition(condition: AlertCondition): boolean {
    const metricData = this.metrics.get(condition.metric) || [];
    const windowMs = condition.windowMinutes * 60 * 1000;
    const cutoff = new Date(Date.now() - windowMs);
    
    const recentData = metricData.filter(data => data.timestamp >= cutoff);
    if (recentData.length === 0) return false;

    const avgValue = recentData.reduce((sum, data) => sum + data.value, 0) / recentData.length;

    switch (condition.operator) {
      case 'gt': return avgValue > condition.threshold;
      case 'gte': return avgValue >= condition.threshold;
      case 'lt': return avgValue < condition.threshold;
      case 'lte': return avgValue <= condition.threshold;
      case 'eq': return avgValue === condition.threshold;
      default: return false;
    }
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.INFO: return 'good';
      case AlertSeverity.WARNING: return 'warning';
      case AlertSeverity.CRITICAL: return 'danger';
      default: return 'warning';
    }
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const alertingSystem = AlertingSystem.getInstance();