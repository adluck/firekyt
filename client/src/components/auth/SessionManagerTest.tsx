import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Clock } from 'lucide-react';

interface SessionManagerTestProps {
  onSessionExpired?: () => void;
}

export function SessionManagerTest({ onSessionExpired }: SessionManagerTestProps) {
  const { logout } = useAuth();
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(10);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Test session timeout settings (much shorter for testing)
  const SESSION_TIMEOUT = 20 * 1000; // 20 seconds instead of 15 minutes
  const WARNING_TIME = 15 * 1000; // 15 seconds instead of 14 minutes  
  const COUNTDOWN_TIME = 10 * 1000; // 10 seconds instead of 1 minute

  // Track user activity
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    if (isWarningOpen) {
      setIsWarningOpen(false);
      setCountdownSeconds(10);
    }
  }, [isWarningOpen]);

  // Activity event listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => updateActivity();
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [updateActivity]);

  // Session monitoring
  useEffect(() => {
    const checkSession = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;

      if (timeSinceActivity >= SESSION_TIMEOUT) {
        // Session expired - force logout
        handleSessionExpire();
      } else if (timeSinceActivity >= WARNING_TIME && !isWarningOpen) {
        // Show warning dialog
        setIsWarningOpen(true);
        setCountdownSeconds(10);
      }
    };

    const interval = setInterval(checkSession, 1000); // Check every second
    return () => clearInterval(interval);
  }, [lastActivity, isWarningOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isWarningOpen) return;

    const countdown = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          handleSessionExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [isWarningOpen]);

  const handleSessionExpire = () => {
    setIsWarningOpen(false);
    onSessionExpired?.();
    console.log('TEST: Session expired - would log out user in production');
    // Uncomment for real logout: logout();
  };

  const handleExtendSession = () => {
    updateActivity();
    setIsWarningOpen(false);
    setCountdownSeconds(10);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressValue = ((10 - countdownSeconds) / 10) * 100;

  return (
    <Dialog open={isWarningOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            TEST: Session Expiring Soon
          </DialogTitle>
          <DialogDescription className="text-base">
            Your test session will expire due to inactivity. You'll be logged out automatically in:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Countdown Display */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-3xl font-mono font-bold text-orange-600 dark:text-orange-400">
                {formatTime(countdownSeconds)}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress 
                value={progressValue} 
                className="h-2"
                style={{
                  background: 'hsl(var(--muted))'
                }}
              />
              <p className="text-sm text-muted-foreground">
                Test session will expire automatically
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleExtendSession}
              className="w-full"
              size="lg"
            >
              Stay Logged In
            </Button>
            <Button 
              onClick={handleSessionExpire}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Test Logout Now
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              TEST MODE: 15s warning, 10s countdown
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}