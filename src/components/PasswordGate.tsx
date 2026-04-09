'use client';

import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface PasswordGateProps {
  children: React.ReactNode;
}

export function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    // Check both cookie and localStorage for reliability
    const isAuth = localStorage.getItem('site_auth') === '175416' || document.cookie.includes('site_auth=175416');
    setIsAuthenticated(isAuth);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '175416') {
      localStorage.setItem('site_auth', '175416');
      document.cookie = 'site_auth=175416; path=/; max-age=31536000'; // 1 year cookie
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  // Prevent hydration mismatch by rendering nothing until mounted
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 absolute inset-0 z-50">
      <div className="max-w-md w-full bg-card border border-border rounded-xl shadow-2xl p-8 space-y-6 animate-in fade-in zoom-in-95">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold">需要访问密码</h2>
          <p className="text-sm text-muted-foreground text-center">
            这是一个私有部署的服务，请输入专属密码以继续访问。
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="请输入密码"
              className={`w-full px-4 py-3 bg-background border ${error ? 'border-error focus:ring-error/50' : 'border-input focus:ring-primary/50'} rounded-lg focus:outline-none focus:ring-2 transition-all`}
              autoFocus
            />
            {error && <p className="text-sm text-error mt-2">密码错误，请重新输入</p>}
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-md"
          >
            解锁
          </button>
        </form>
      </div>
    </div>
  );
}
