import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TestEmail() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSendTestEmail = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setResult({ success: false, message: errorMessage });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Test Email System</h1>
        <p className="text-muted-foreground">Send test emails to verify email service functionality</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Test Email
          </CardTitle>
          <CardDescription>
            Test the Resend email service by sending a sample welcome email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address to test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <Button 
            onClick={handleSendTestEmail}
            disabled={isLoading || !email.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Test Email...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Test Email
              </>
            )}
          </Button>

          {result && (
            <Alert className={result.success ? 'border-green-500' : 'border-red-500'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>
                <strong>{result.success ? 'Success' : 'Error'}:</strong> {result.message}
                {result.success && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>Service: {result.service}</p>
                    <p>From: {result.from}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">Email Service Information</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Service: Resend</li>
          <li>• From Address: support@firekyt.com</li>
          <li>• Template: Welcome Email</li>
          <li>• Check your email inbox (including spam folder)</li>
        </ul>
      </div>
    </div>
  );
}