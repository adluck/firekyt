import { storage } from "./storage";
import { IntegrationService } from "./IntegrationService";

export class SchedulerService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private integrationService: IntegrationService;

  constructor() {
    this.integrationService = new IntegrationService();
  }

  /**
   * Start the scheduler to check for pending publications every minute
   */
  start(): void {
    if (this.isRunning) {
      console.log("✅ Scheduler is already running");
      return;
    }

    this.isRunning = true;
    
    console.log("🚀 Starting publication scheduler...");
    
    // DISABLED during database outage to prevent rate limits
    // Check immediately on start
    // this.processScheduledPublications();
    
    // DISABLED: Scheduler causing database rate limits during production outage
    console.log("📅 Scheduler DISABLED during database maintenance - avoiding rate limits");
    
    // Then check every 30 seconds for better responsiveness
    // this.intervalId = setInterval(() => {
    //   console.log("⏰ Scheduler checking for pending publications...");
    //   this.processScheduledPublications();
    // }, 30 * 1000); // Check every 30 seconds

    // console.log("✅ Publication scheduler started - checking every 30 seconds");
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("Publication scheduler stopped");
  }

  /**
   * Process all pending scheduled publications that are due
   */
  private async processScheduledPublications(): Promise<void> {
    try {
      const pendingPublications = await this.getPendingPublications();
      
      if (pendingPublications.length === 0) {
        console.log("📋 No pending publications found");
        return;
      }

      console.log(`🚀 Processing ${pendingPublications.length} scheduled publications`);

      for (const publication of pendingPublications) {
        await this.processPublication(publication);
      }
    } catch (error: any) {
      console.error("❌ Error processing scheduled publications:", error);
    }
  }

  /**
   * Get all pending publications that are due for publishing
   */
  private async getPendingPublications(): Promise<any[]> {
    const now = new Date();
    
    // Get all pending scheduled publications from database
    const allScheduled = await storage.getAllScheduledPublications();
    
    console.log(`📋 Total scheduled publications in database: ${allScheduled.length}`);
    console.log(`📋 Current time: ${now.toISOString()}`);
    
    const filteredPublications = allScheduled.filter((pub: any) => {
      const scheduledTime = new Date(pub.scheduledAt);
      const isPending = pub.status === 'pending';
      const isTimeReached = scheduledTime <= now;
      
      console.log(`📋 Publication ${pub.id}: status=${pub.status}, scheduled=${scheduledTime.toISOString()}, timeReached=${isTimeReached}`);
      
      return isPending && isTimeReached;
    });
    
    console.log(`📋 Found ${filteredPublications.length} publications ready to publish`);
    
    return filteredPublications;
  }

  /**
   * Process a single scheduled publication
   */
  private async processPublication(publication: any): Promise<void> {
    try {
      console.log(`🚀 Publishing scheduled content: ${publication.id}`);

      // Mark as processing
      await storage.updateScheduledPublication(publication.id, {
        status: 'processing'
      });

      console.log(`📊 Publication details:`, {
        id: publication.id,
        userId: publication.userId,
        contentId: publication.contentId,
        platformConnectionId: publication.platformConnectionId,
        scheduledAt: publication.scheduledAt
      });

      // Get the content and platform connection
      const content = await storage.getContentById(publication.contentId);
      const connection = await storage.getPlatformConnection(publication.platformConnectionId);

      console.log(`📝 Retrieved content:`, content ? { id: content.id, title: content.title } : 'NOT FOUND');
      console.log(`🔗 Retrieved connection:`, connection ? { id: connection.id, platform: connection.platform } : 'NOT FOUND');

      if (!content || !connection) {
        throw new Error('Content or platform connection not found');
      }

      // Publish the content using IntegrationService
      const publishResult = await this.integrationService.publishContent(
        publication.userId,
        content,
        [{
          platform: connection.platform,
          accountId: connection.id.toString(),
          settings: publication.publishSettings || {}
        }]
      );

      if (publishResult.successes.length > 0) {
        // Publication successful
        const success = publishResult.successes[0];
        const publishedAt = new Date();
        
        await storage.updateScheduledPublication(publication.id, {
          status: 'published',
          publishedAt: publishedAt,
          platformPostId: success.postId,
          platformUrl: success.url
        });

        // Update the content status to 'published' and set publishedAt timestamp
        await storage.updateContent(publication.contentId, publication.userId, {
          status: 'published',
          publishedAt: publishedAt
        });

        // Add to publication history
        await storage.createPublicationHistory({
          userId: publication.userId,
          contentId: publication.contentId,
          platformConnectionId: publication.platformConnectionId,
          platform: connection.platform,
          platformPostId: success.postId,
          platformUrl: success.url,
          publishedAt: publishedAt,
          status: 'published'
        });

        console.log(`Successfully published scheduled content ${publication.id} to ${connection.platform} and updated content status to 'published'`);
      } else {
        // Publication failed
        const failure = publishResult.failures[0];
        await storage.updateScheduledPublication(publication.id, {
          status: 'failed',
          errorMessage: failure?.error || 'Publication failed'
        });

        console.error(`Failed to publish scheduled content ${publication.id}:`, failure?.error);
      }

    } catch (error: any) {
      // Mark as failed
      await storage.updateScheduledPublication(publication.id, {
        status: 'failed',
        errorMessage: error.message
      });

      console.error(`Error publishing scheduled content ${publication.id}:`, error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; nextCheck?: Date } {
    return {
      isRunning: this.isRunning,
      nextCheck: this.isRunning ? new Date(Date.now() + 60000) : undefined
    };
  }
}

// Create singleton instance
export const schedulerService = new SchedulerService();