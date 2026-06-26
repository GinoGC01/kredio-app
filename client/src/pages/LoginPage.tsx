import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../context/AlertContext';
import { FiSun, FiMoon, FiGlobe } from 'react-icons/fi';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: { theme?: string; size?: string; type?: string; shape?: string; text?: string; logo_alignment?: string; width?: string },
          ) => void;
          cancel?: () => void;
        };
      };
    };
  }
}

const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register, googleLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, toggleLanguage } = useLanguage();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleInitialized = useRef(false);

  useEffect(() => {
    if (!window.google || !googleButtonRef.current || googleInitialized.current) return;
    googleInitialized.current = true;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          await googleLogin(response.credential);
          navigate('/');
        } catch {
          setError(t('login.googleError'));
        }
      },
    });

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      shape: 'rectangular',
      text: 'continue_with',
      logo_alignment: 'left',
      width: '400',
    });

    return () => {
      window.google?.accounts.id.cancel?.();
    };
  }, [googleLogin, navigate, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(email, name, password);
        addToast('success', t('login.registerSuccess'));
      } else {
        await login(email, password);
        addToast('success', t('login.loginSuccess'));
      }
      navigate('/');
    } catch {
      setError(t('login.invalidCredentials'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base relative">
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={toggleLanguage}
          className="p-2 text-text-muted hover:text-text-secondary rounded-lg hover:bg-bg-card-hover min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <FiGlobe className="w-5 h-5" />
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 text-text-muted hover:text-text-secondary rounded-lg hover:bg-bg-card-hover min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
        </button>
      </div>
      <div className="bg-bg-card p-8 rounded-xl border border-border w-full max-w-md">
        <div className="flex items-center justify-center gap-1 mb-2">
          <img src="/images/logo-kredio.webp" alt="Kredio" className="w-10 h-10" />
          <h1 className="text-3xl font-extrabold text-accent-purple" style={{ fontFamily: 'Manrope, sans-serif' }}>Kredio</h1>
        </div>
        <p className="text-text-muted text-center mb-6">{t('login.subtitle')}</p>

        {error && (
          <div className="bg-stat-red-bg text-danger p-3 rounded-lg text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('login.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('login.emailPlaceholder')}
            required
          />
          {isRegister && (
            <Input
              label={t('login.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('login.namePlaceholder')}
              required
            />
          )}
          <Input
            label={t('login.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            required
          />
          <Button type="submit" className="w-full">
            {isRegister ? t('login.register') : t('login.login')}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-bg-card px-4 text-text-muted">{t('login.or')}</span>
          </div>
        </div>

        <div ref={googleButtonRef} className="flex justify-center" />

        <p className="text-center text-sm text-text-muted mt-4">
          {isRegister ? t('login.alreadyAccount') : t('login.noAccount')}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-accent-purple hover:underline"
          >
            {isRegister ? t('login.switchToLogin') : t('login.switchToRegister')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
