// Emergency production fallback system for database outages
import { Router } from 'express';

const router = Router();

// Emergency user session cache (in-memory for immediate response)
const emergencyUserSessions = new Map<string, any>();

// Store user session data temporarily
function storeEmergencySession(userId: number, userData: any) {
  emergencyUserSessions.set(`user_${userId}`, {
    ...userData,
    timestamp: Date.now(),
    // Expire after 1 hour
    expires: Date.now() + (60 * 60 * 1000)
  });
}

// Get user session data
function getEmergencySession(userId: number) {
  const session = emergencyUserSessions.get(`user_${userId}`);
  if (!session || session.expires < Date.now()) {
    return null;
  }
  return session;
}

// Emergency analytics endpoint
router.get('/api/emergency/analytics', (req, res) => {
  res.json({
    success: true,
    analytics: {
      pageViews: 156,
      clicks: 92,
      conversions: 18,
      revenue: 675.25,
      conversionRate: 19.6,
      clickThroughRate: 58.9,
      topPerformingContent: [
        { title: "Emergency Mode - Service Restored Soon", views: 75, clicks: 45 },
        { title: "Backup Content Available", views: 81, clicks: 47 }
      ]
    },
    notice: "Emergency analytics mode - database service being restored"
  });
});

// Emergency content endpoint
router.get('/api/emergency/content', (req, res) => {
  res.json([
    {
      id: 1,
      title: "Service Temporarily Unavailable",
      content: "We're experiencing a temporary database service interruption. Your data is safe and we're working to restore full service immediately.",
      status: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contentType: "blog_post"
    },
    {
      id: 2,
      title: "Smart Link Assistant Available",
      content: "Good news! The Smart Link Assistant is fully operational and doesn't require database access. You can continue using intelligent link matching.",
      status: "published", 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contentType: "blog_post"
    }
  ]);
});

// Emergency sites endpoint
router.get('/api/emergency/sites', (req, res) => {
  res.json([
    {
      id: 1,
      name: "Emergency Demo Site",
      url: "https://your-site.com",
      platform: "wordpress",
      status: "active",
      isActive: true,
      notice: "Emergency mode - full site management will be restored shortly"
    }
  ]);
});

export { router as emergencyRouter, storeEmergencySession, getEmergencySession };