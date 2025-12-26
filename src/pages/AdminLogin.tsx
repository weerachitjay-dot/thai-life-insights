import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, ShieldAlert } from 'lucide-react';

const ADMIN_PIN = '9999'; // Hardcoded PIN for now

export default function AdminLogin() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUnlock = () => {
    setError('');
    setLoading(true);

    // Simulate slight delay for UX
    setTimeout(() => {
      if (pin === ADMIN_PIN) {
        localStorage.setItem('isAdminAuthenticated', 'true');
        navigate('/data-management');
      } else {
        setError('Invalid PIN');
      }
      setLoading(false);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Access Required</h1>
          <p className="text-muted-foreground">
            Please enter the security PIN to manage data connections.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-center text-lg tracking-widest"
              maxLength={10}
            />
            {error && (
              <div className="flex items-center justify-center gap-2 text-destructive text-sm">
                <ShieldAlert className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          <Button 
            onClick={handleUnlock} 
            className="w-full"
            disabled={loading || !pin}
          >
            {loading ? 'Verifying...' : 'Unlock Dashboard'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Contact your administrator if you need access credentials.
        </p>
      </Card>
    </div>
  );
}
