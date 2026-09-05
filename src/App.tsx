import React, { useEffect, useState } from 'react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { Header } from './components/common/Header';
import { SplashScreen } from './components/common/SplashScreen';
import { ClientMenuView } from './components/client/ClientMenuView';
import { KitchenKdsView } from './components/kitchen/KitchenKdsView';
import { CashierPosView } from './components/cashier/CashierPosView';
import { AttendanceKioskView } from './components/attendance/AttendanceKioskView';
import { PublicAttendanceKiosk } from './components/attendance/PublicAttendanceKiosk';
import { AdminView } from './components/admin/AdminView';
import { LoginModal } from './components/auth/LoginModal';
import { LoginPage } from './components/auth/LoginPage';
import { UserRole } from './types';

const AppContent: React.FC = () => {
  const { currentRole, authLoading, authEmail } = useRestaurant();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginTargetRole, setLoginTargetRole] = useState<UserRole | undefined>();
  const [path, setPath] = useState(window.location.pathname || '/menu');

  useEffect(() => {
    const handleNavigation = () => setPath(window.location.pathname || '/menu');
    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const isInternalPath = path.startsWith('/admin') || path.startsWith('/cashier') || path.startsWith('/kitchen') || path.startsWith('/staff') || ['/caisse', '/cuisine', '/personnel', '/depenses', '/rapports'].some(prefix => path.startsWith(prefix));
    if (!isInternalPath) return;

    const rolePaths: Record<string, string> = {
      ADMINISTRATEUR: '/admin/dashboard',
      RESPONSABLE: '/admin/dashboard',
      CAISSIER: '/cashier/dashboard',
      CUISINE: '/kitchen/dashboard',
      SERVEUR: '/staff/dashboard',
      EMPLOYE: '/staff/dashboard',
      POINTAGE: '/staff/dashboard',
    };
    const allowed = path.startsWith('/admin')
      ? ['ADMINISTRATEUR', 'RESPONSABLE'].includes(currentRole)
      : path.startsWith('/cashier') || path.startsWith('/caisse')
        ? currentRole === 'CAISSIER'
        : path.startsWith('/kitchen') || path.startsWith('/cuisine')
          ? currentRole === 'CUISINE'
          : path.startsWith('/staff') || path.startsWith('/personnel')
            ? ['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER', 'CUISINE', 'SERVEUR', 'EMPLOYE', 'POINTAGE'].includes(currentRole)
            : ['ADMINISTRATEUR', 'RESPONSABLE'].includes(currentRole);

    if (!authEmail || !allowed) {
      window.history.replaceState({}, '', authEmail ? (rolePaths[currentRole] || '/menu') : '/menu');
      setPath(authEmail ? (rolePaths[currentRole] || '/menu') : '/menu');
    } else if (path.startsWith('/depenses') || path.startsWith('/rapports')) {
      window.history.replaceState({}, '', '/admin/dashboard');
      setPath('/admin/dashboard');
    }
  }, [authEmail, authLoading, currentRole, path]);

  const goTo = (nextPath: string) => {
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
  };

  const isInternalPath = path.startsWith('/admin') || path.startsWith('/cashier') || path.startsWith('/kitchen') || path.startsWith('/staff') || ['/caisse', '/cuisine', '/personnel', '/depenses', '/rapports'].some(prefix => path.startsWith(prefix));
  const isLoginPath = path === '/login';
  const isPublicAttendancePath = path === '/pointage';
  const showClient = !isInternalPath && !isLoginPath && !isPublicAttendancePath;

  if (authLoading) {
    return <SplashScreen />;
  }

  if (isLoginPath) {
    return <LoginPage onNavigate={goTo} />;
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      
      {/* Universal Responsive Header with Cross-role Navigation & Live System Clocks */}
      <Header
        onOpenLoginModal={(targetRole) => {
          setLoginTargetRole(targetRole);
          setIsLoginModalOpen(true);
        }}
        onNavigate={goTo}
        isPublicExperience={showClient}
      />

      {/* Main View Router based on active role */}
      <main className="flex-1">
        {showClient && (
          <ClientMenuView />
        )}

        {isPublicAttendancePath && <PublicAttendanceKiosk />}

        {(path.startsWith('/kitchen') || path.startsWith('/cuisine')) && currentRole === 'CUISINE' && (
          <KitchenKdsView />
        )}

        {(path.startsWith('/cashier') || path.startsWith('/caisse')) && currentRole === 'CAISSIER' && (
          <CashierPosView />
        )}

        {(path.startsWith('/staff') || path.startsWith('/personnel')) && ['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER', 'CUISINE', 'POINTAGE', 'EMPLOYE', 'SERVEUR'].includes(currentRole) && (
          <AttendanceKioskView onNavigate={goTo} />
        )}

        {path.startsWith('/admin') && ['ADMINISTRATEUR', 'RESPONSABLE'].includes(currentRole) && (
          <AdminView />
        )}
      </main>

      {/* Login & Role Switcher Modal */}
      <LoginModal
        key={loginTargetRole || 'login'}
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        targetRole={loginTargetRole}
        onAuthenticated={(role) => {
          const destination = role === 'ADMINISTRATEUR' || role === 'RESPONSABLE'
            ? '/admin/dashboard'
            : role === 'CAISSIER'
              ? '/cashier/dashboard'
              : role === 'CUISINE'
                ? '/kitchen/dashboard'
                : role === 'SERVEUR' || role === 'EMPLOYE' || role === 'POINTAGE'
                  ? '/staff/dashboard'
                  : '/menu';
          goTo(destination);
        }}
      />

    </div>
  );
};

export default function App() {
  return (
    <RestaurantProvider>
      <AppContent />
    </RestaurantProvider>
  );
}
