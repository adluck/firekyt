import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookiePreferencesLink() {
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(() => {
    const saved = localStorage.getItem('cookieConsent');
    return saved ? JSON.parse(saved) : {
      necessary: true,
      analytics: false,
      marketing: false
    };
  });

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setPreferences(prefs);
    setShowSettings(false);
    
    // Apply preferences
    if (prefs.analytics) {
      console.log('Analytics tracking enabled');
    }
    if (prefs.marketing) {
      console.log('Marketing cookies enabled');
    }
  };

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'necessary') return; // Always required
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowSettings(true)}
        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
      >
        Cookie Preferences
      </Button>

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
              Manage your cookie preferences. Changes take effect immediately.
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
                  </p>
                </div>
                <Switch
                  checked={true}
                  disabled={true}
                  className="ml-4"
                />
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
                    Help us understand platform usage to improve user experience.
                  </p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => handlePreferenceChange('analytics', checked)}
                  className="ml-4"
                />
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
                    Used for personalized content and campaign effectiveness (currently not implemented).
                  </p>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
                  className="ml-4"
                />
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