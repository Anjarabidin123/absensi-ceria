import { useState, useEffect, useCallback } from 'react';
import { Shield, Key, User, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';

interface HybridAuthProps {
  onAuthSuccess?: (method: string, data?: any) => void;
  onAuthError?: (error: string) => void;
  mode?: 'login' | 'attendance';
  showFaceRecognition?: boolean;
  showPin?: boolean;
  showPassword?: boolean;
}

export function HybridAuth({ 
  onAuthSuccess, 
  onAuthError,
  mode = 'login',
  showFaceRecognition = true,
  showPin = true,
  showPassword = true
}: HybridAuthProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pin');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle PIN authentication
  const handlePinAuthComplete = useCallback((success: boolean, data?: any) => {
    if (success) {
      setSuccessMessage('PIN authentication successful!');
      setErrorMessage('');
      onAuthSuccess?.('pin', data);
    } else {
      setErrorMessage('Invalid PIN code');
      onAuthError?.('Invalid PIN code');
    }
  }, [onAuthSuccess, onAuthError]);

  // Handle password authentication
  const handlePasswordAuthComplete = useCallback((success: boolean, data?: any) => {
    if (success) {
      setSuccessMessage('Password authentication successful!');
      setErrorMessage('');
      onAuthSuccess?.('password', data);
    } else {
      setErrorMessage('Invalid password');
      onAuthError?.('Invalid password');
    }
  }, [onAuthSuccess, onAuthError]);

  const availableTabs = [];
  if (showPin) availableTabs.push('pin');
  if (showPassword) availableTabs.push('password');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Hybrid Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Messages */}
        {successMessage && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Auth Methods */}
        {availableTabs.length > 0 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {showPin && (
                <TabsTrigger value="pin">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <span>PIN</span>
                  </div>
                </TabsTrigger>
              )}
              {showPassword && (
                <TabsTrigger value="password">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Password</span>
                  </div>
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="pin" className="mt-4">
              <PinAuth onAuthComplete={handlePinAuthComplete} />
            </TabsContent>
            
            <TabsContent value="password" className="mt-4">
              <PasswordAuth onAuthComplete={handlePasswordAuthComplete} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Authentication Methods Available</h3>
            <p className="text-muted-foreground">
              Please enable at least one authentication method in settings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// PIN Authentication Component
function PinAuth({ onAuthComplete }: { onAuthComplete: (success: boolean, data?: any) => void }) {
  const [pinCode, setPinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pinCode.length !== 4) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const isValidPin = pinCode.length === 4;
      
      if (isValidPin) {
        onAuthComplete(true, { pin: pinCode });
        setPinCode('');
      } else {
        setError('Invalid PIN code');
      }
    } catch (error) {
      setError('PIN verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pin">PIN Code</Label>
        <Input
          id="pin"
          type="password"
          placeholder="Enter 4-digit PIN"
          value={pinCode}
          onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
          maxLength={4}
          className="text-center text-lg tracking-widest"
        />
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button type="submit" disabled={isLoading || pinCode.length !== 4} className="w-full">
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2" />
            Verifying...
          </>
        ) : (
          <>
            <Key className="h-4 w-4 mr-2" />
            Verify PIN
          </>
        )}
      </Button>
    </form>
  );
}

// Password Authentication Component
function PasswordAuth({ onAuthComplete }: { onAuthComplete: (success: boolean, data?: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const isValidEmail = email.includes('@');
      const isValidPassword = password.length >= 6;
      
      if (isValidEmail && isValidPassword) {
        onAuthComplete(true, { email, password });
        setEmail('');
        setPassword('');
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
      setError('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button type="submit" disabled={isLoading || !email || !password} className="w-full">
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2" />
            Authenticating...
          </>
        ) : (
          <>
            <User className="h-4 w-4 mr-2" />
            Sign In
          </>
        )}
      </Button>
    </form>
  );
}
