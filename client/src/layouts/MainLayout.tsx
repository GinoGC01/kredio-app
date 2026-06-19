import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useInactivityTracker } from '../hooks/useInactivityTracker';
import { FiBarChart2, FiUsers, FiDollarSign, FiCreditCard, FiList, FiLogOut, FiMenu, FiSun, FiMoon, FiGlobe, FiHelpCircle } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const navColor = '#4361ee';

const navItems = [
  { path: '/', label: 'nav.dashboard', icon: FiBarChart2, group: 'General' },
  { path: '/clients', label: 'nav.clients', icon: FiUsers, group: 'Management' },
  { path: '/credits', label: 'nav.credits', icon: FiDollarSign, group: 'Management' },
  { path: '/payments', label: 'nav.payments', icon: FiCreditCard, group: 'Management' },
  { path: '/activity', label: 'nav.activity', icon: FiList, group: 'Reports' },
  { path: '/help', label: 'nav.help', icon: FiHelpCircle, group: 'Reports' },
];

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, toggleLanguage, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const check = () => setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  useInactivityTracker(() => {
    logout();
    navigate('/login');
  });

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navGroups = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-bg-base flex relative overflow-hidden">
      {/* Blobs - behind everything */}
      <div className="blob-scene" aria-hidden="true">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/55 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-10
          sidebar
          flex flex-col h-screen overflow-y-auto
          transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isTablet ? 'w-16' : 'w-60'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center gap-1 px-4 pt-5 pb-6 ${isTablet ? 'justify-center px-0' : ''}`}>
          <img src="/images/logo-kredio.webp" alt="Kredio" className="w-8 h-8 shrink-0" />
          {!isTablet && (
            <h1 className="text-3xl font-extrabold text-[#046ffe]" style={{ fontFamily: 'Manrope, sans-serif' }}>Kredio</h1>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-6">
          {Object.entries(navGroups).map(([group, items]) => (
            <div key={group}>
              {!isTablet && (
                <p className="px-3 mb-2 text-xs font-semibold text-text-muted uppercase tracking-widest">
                  {t(`navGroup.${group.toLowerCase()}`)}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map(({ path, label, icon: Icon }) => {
                  const active = isActive(path);
                  return (
                    <Link
                      key={path}
                      to={path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                        active
                          ? 'text-white shadow-sm'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-hover'
                      } ${isTablet ? 'justify-center px-0' : ''}`}
                      style={active ? { backgroundColor: navColor } : undefined}
                      title={isTablet ? t(label) : undefined}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${active ? '' : 'text-text-muted'}`} />
                      {!isTablet && <span>{t(label)}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className={`p-3 border-t border-border space-y-0.5 ${isTablet ? 'flex flex-col items-center' : ''}`}>
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-all duration-150 w-full ${isTablet ? 'justify-center px-0' : ''}`}
            title={isTablet ? (theme === 'light' ? t('nav.darkMode') : t('nav.lightMode')) : undefined}
          >
            {theme === 'light' ? <FiMoon className="w-5 h-5 shrink-0" /> : <FiSun className="w-5 h-5 shrink-0" />}
            {!isTablet && (theme === 'light' ? t('nav.darkMode') : t('nav.lightMode'))}
          </button>
          <button
            onClick={toggleLanguage}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-all duration-150 w-full ${isTablet ? 'justify-center px-0' : ''}`}
            title={isTablet ? (language === 'es' ? 'English' : 'Español') : undefined}
          >
            <FiGlobe className="w-5 h-5 shrink-0" />
            {!isTablet && (language === 'es' ? 'English' : 'Español')}
          </button>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-all duration-150 w-full ${isTablet ? 'justify-center px-0' : ''}`}
            title={isTablet ? t('nav.logout') : undefined}
          >
            <FiLogOut className="w-5 h-5 shrink-0" />
            {!isTablet && t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-y-scroll relative z-10">
        {/* Topbar */}
        <header className="h-16 topbar flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-card-hover min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {t('topbar.welcome').replace('{name}', user?.name || '')}
              </p>
              <p className="text-xs text-text-muted hidden sm:block">{t('topbar.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-card-hover min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {theme === 'light' ? <FiMoon className="w-4 h-4" /> : <FiSun className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleLanguage}
              className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-card-hover min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <FiGlobe className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-card-hover min-w-[44px] min-h-[44px] flex items-center justify-center lg:hidden"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title={t('confirm.logout.title')}
        message={t('confirm.logout.message')}
        confirmText={t('confirm.logout.confirm')}
        variant="danger"
      />
    </div>
  );
};
