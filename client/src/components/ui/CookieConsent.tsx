import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { X, Settings, Shield } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const defaultPreferences: CookiePreferences = {
  necessary: true, // Always required
  analytics: false,
  marketing: false
};

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    } else {
      const savedPreferences = JSON.parse(consent);
      setPreferences(savedPreferences);
    }
  }, []);

  const savePreferences = async (prefs: CookiePreferences, consentType: string = 'custom') => {
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setPreferences(prefs);
    setIsVisible(false);
    setShowSettings(false);
    
    // Track cookie consent activity
    try {
      await fetch('/api/track-cookie-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: prefs,
          consentType
        })
      });
    } catch (error) {
      console.log('Failed to track cookie consent:', error);
    }
    
    // Apply preferences (for future analytics/marketing features)
    if (prefs.analytics) {
      // Enable analytics tracking
      console.log('Analytics tracking enabled');
    }
    if (prefs.marketing) {
      // Enable marketing cookies
      console.log('Marketing cookies enabled');
    }
  };

  const acceptAll = () => {
    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true
    }, 'accept_all');
  };

  const acceptNecessary = () => {
    savePreferences(defaultPreferences, 'essential_only');
  };

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'necessary') return; // Always required
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Cookie Consent Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      We use cookies to enhance your experience
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      FireKyt uses essential cookies for secure authentication and session management. 
                      We also offer optional analytics to improve our platform. Your privacy is important to us.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Cookie Settings
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={acceptNecessary}
                    className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Essential Only
                  </Button>
                  <Button
                    size="sm"
                    onClick={acceptAll}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Accept All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cookie Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cookie Preferences
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Choose which cookies you'd like to allow. You can change these settings at any time.
            </div>
            
            {/* Necessary Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
                    Essential Cookies
                  </Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Required for secure authentication, session management, and core platform functionality. 
                    These cannot be disabled.
                  </p>
                </div>
                <Switch
                  checked={true}
                  disabled={true}
                  className="ml-4"
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-500 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                <strong>Used for:</strong> Login sessions, security tokens, form submissions, user preferences
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
                    Analytics Cookies
                  </Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Help us understand how you use FireKyt so we can improve the platform and user experience.
                  </p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => handlePreferenceChange('analytics', checked)}
                  className="ml-4"
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-500 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                <strong>Used for:</strong> Page views, feature usage, performance monitoring, error tracking
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
                    Marketing Cookies
                  </Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Used to show relevant content and measure campaign effectiveness. Currently not implemented.
                  </p>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
                  className="ml-4"
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-500 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                <strong>Future use:</strong> Personalized content, campaign tracking, social media integration
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => savePreferences(preferences)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}