import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Clock } from 'lucide-react';

interface SessionManagerProps {
  onSessionExpired?: () => void;
}

export function SessionManager({ onSessionExpired }: SessionManagerProps) {
  const { logout } = useAuth();
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(60);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Session timeout settings
  const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
  const WARNING_TIME = 14 * 60 * 1000; // 14 minutes in milliseconds
  const COUNTDOWN_TIME = 60 * 1000; // 1 minute in milliseconds

  // Track user activity
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    if (isWarningOpen) {
      setIsWarningOpen(false);
      setCountdownSeconds(60);
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
        setCountdownSeconds(60);
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
    logout();
  };

  const handleExtendSession = () => {
    updateActivity();
    setIsWarningOpen(false);
    setCountdownSeconds(60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressValue = ((60 - countdownSeconds) / 60) * 100;

  return (
    <Dialog open={isWarningOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription className="text-base">
            Your session will expire due to inactivity. You'll be logged out automatically in:
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
                Session will expire automatically
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
              Logout Now
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Any activity will automatically extend your session
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}