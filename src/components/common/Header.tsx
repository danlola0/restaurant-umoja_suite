import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { UserRole } from '../../types';
import { 
  Utensils, 
  ChefHat, 
  CreditCard, 
  Clock, 
  ShieldAlert, 
  Users, 
  Bell, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Layers, 
  ChevronDown,
  ShoppingBag,
  Sparkles,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  onOpenCart?: () => void;
  cartCount?: number;
  onOpenLoginModal?: (targetRole?: UserRole) => void;
  onNavigate?: (path: string) => void;
  isPublicExperience?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCart, cartCount = 0, onOpenLoginModal, onNavigate, isPublicExperience = false }) => {
  const { 
    restaurantInfo, 
    currentRole, 
    setCurrentRole, 
    currentUser, 
    authEmail, 
    selectedTableId, 
    setSelectedTableId, 
    tables,
    orders,
    notifications,
    removeNotification,
    signOut
  } = useRestaurant();

  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeKitchenOrdersCount = orders.filter(o => ['NOUVELLE', 'ACCEPTEE', 'EN_PREPARATION'].includes(o.status)).length;
  const readyOrdersCount = orders.filter(o => o.status === 'PRETE').length;
  const currentTable = tables.find(t => t.id === selectedTableId) || tables[0];
  const currentTableCode = currentTable?.code || 'Table non sélectionnée';

  const roleLabels: Partial<Record<UserRole, string>> = {
    CLIENT: 'Espace Client', CUISINE: 'Écran Cuisine (KDS)', CAISSIER: 'Caisse & Tables (POS)',
    EMPLOYE: 'Pointage Personnel', SERVEUR: 'Espace Serveur', POINTAGE: 'Pointage Personnel',
    ADMINISTRATEUR: 'Administration & RH', RESPONSABLE: 'Administration',
  };
  const activeRoleLabel = isPublicExperience ? 'Espace Client' : roleLabels[currentRole] || 'Espace Umoja';
  const internalNavItems: { role: UserRole; label: string; icon: React.FC<{ className?: string }>; path: string; badge?: number }[] = [
    { role: 'CUISINE', label: 'Écran Cuisine (KDS)', icon: ChefHat, path: '/kitchen/dashboard', badge: activeKitchenOrdersCount },
    { role: 'CAISSIER', label: 'Caisse & Tables (POS)', icon: CreditCard, path: '/cashier/dashboard', badge: readyOrdersCount },
    { role: 'EMPLOYE', label: 'Pointage Personnel', icon: Clock, path: '/staff/dashboard' },
    { role: 'ADMINISTRATEUR', label: 'Administration & RH', icon: ShieldAlert, path: '/admin/dashboard' },
  ];
  const visibleInternalNavItems = internalNavItems.filter(item => {
    if (currentRole === 'ADMINISTRATEUR' || currentRole === 'RESPONSABLE') return item.role === 'ADMINISTRATEUR';
    if (currentRole === 'SERVEUR' || currentRole === 'EMPLOYE' || currentRole === 'POINTAGE') return item.role === 'EMPLOYE';
    return item.role === currentRole || item.role === 'EMPLOYE';
  });
  const canAccessPersonalAttendance = currentRole !== 'CLIENT' && Boolean(currentUser);

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-2 py-2 sm:flex-nowrap sm:gap-4 sm:py-0">
          
          {/* Logo & Identity */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => onNavigate?.('/menu')}>
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/40 text-stone-950 font-bold text-lg sm:w-10 sm:h-10 sm:text-xl ring-2 ring-amber-400/30">
              U
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-bold text-base tracking-tight text-amber-400 sm:text-lg">{restaurantInfo.name}</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Guangzhou
                </span>
              </div>
              <p className="text-xs text-stone-400 hidden md:block">
                {isPublicExperience ? `${activeRoleLabel} • ${currentTableCode}` : restaurantInfo.slogan}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-stone-950/70 p-1.5 rounded-xl border border-stone-800">
            {!isPublicExperience && currentRole !== 'CLIENT' && visibleInternalNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentRole === item.role;
              return (
                <button
                  key={item.role}
                  onClick={() => onNavigate?.(item.path)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-sm font-semibold'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-amber-700' : 'bg-amber-500 text-stone-950 animate-pulse'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Table Selector (if Client), Time, Notifications & Role Switcher */}
          <div className="flex shrink-0 items-center gap-1.5 max-[480px]:w-full max-[480px]:justify-end sm:gap-3">
            
            {/* Table selector for Client mode */}
            {(isPublicExperience || currentRole === 'CLIENT') && (
              <div className="flex max-w-[128px] items-center gap-1.5 bg-amber-950/40 border border-amber-800/40 px-1.5 py-1 rounded-lg text-xs sm:max-w-none sm:px-2.5">
                <span className="text-amber-400 font-medium hidden sm:inline">Votre table :</span>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="min-w-0 max-w-[105px] bg-stone-900 text-amber-200 border border-amber-600/40 rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 sm:max-w-none sm:px-2"
                >
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.code} ({t.zone})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Cart Trigger (Client Mode) */}
            {(isPublicExperience || currentRole === 'CLIENT') && onOpenCart && (
              <button
                onClick={onOpenCart}
                className="relative flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-md shadow-amber-900/30"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Panier</span>
                {cartCount > 0 && (
                  <span className="bg-stone-950 text-amber-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {!isPublicExperience && canAccessPersonalAttendance && (
              <button
                onClick={() => onNavigate?.('/staff/dashboard')}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/25"
                title="Ouvrir le pointage personnel"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Pointage</span>
              </button>
            )}

            {/* Live Clock & Date */}
            <div className="hidden sm:flex flex-col text-right pr-1">
              <span className="text-xs font-mono font-bold text-amber-300">{timeStr}</span>
              <span className="text-[10px] text-stone-400">{dateStr}</span>
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg bg-stone-800/80 text-stone-300 hover:text-white hover:bg-stone-700 transition"
                title="Notifications en temps réel"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-stone-950 text-[10px] font-bold flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-stone-950 border-b border-stone-800">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-stone-200">Activités & Alertes en direct</span>
                    </div>
                    <button onClick={() => setShowNotifications(false)} className="text-stone-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-stone-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-stone-500">
                        Aucune nouvelle notification pour le moment.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-3 hover:bg-stone-800/40 flex items-start gap-2.5 text-xs transition">
                          {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                          {n.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                          {n.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                          {n.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}
                          <div className="flex-1">
                            <p className="text-stone-200">{n.message}</p>
                            <span className="text-[10px] text-stone-400">
                              {new Date(n.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          <button onClick={() => removeNotification(n.id)} className="text-stone-400 hover:text-stone-200 p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile / Quick Role Switcher Button */}
            {isPublicExperience || currentRole === 'CLIENT' ? (
              <div className="flex items-center gap-1.5">
                <button onClick={() => onNavigate?.('/pointage')} className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/25">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Pointage Personnel</span>
                </button>
                <button onClick={() => onNavigate?.('/login')} className="flex items-center gap-1.5 rounded-lg bg-stone-800 px-2.5 py-1.5 text-xs text-stone-200 transition hover:bg-stone-700">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Espace personnel</span>
                </button>
                <button onClick={() => onNavigate?.('/menu')} className="flex items-center gap-1.5 rounded-lg bg-stone-800 px-2.5 py-1.5 text-xs text-stone-200 transition hover:bg-stone-700">
                  <Utensils className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Espace Client</span>
                </button>
              </div>
            ) : <div className="relative lg:hidden">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium px-2.5 py-1.5 rounded-lg text-xs transition"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="truncate max-w-[80px]">{currentRole}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                  <div className="px-3 py-1.5 border-b border-stone-800 text-[10px] text-stone-400 uppercase font-semibold">
                    Changer d'interface
                  </div>
                  {visibleInternalNavItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.role}
                        onClick={() => {
                          onNavigate?.(item.path);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left ${
                          currentRole === item.role ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-stone-300 hover:bg-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-stone-950">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>}

            {/* Current Active Staff Badge */}
            {currentUser && currentRole !== 'CLIENT' && !isPublicExperience && (
              <button 
                onClick={onOpenLoginModal}
                className="hidden xl:flex items-center gap-2 pl-2 border-l border-stone-800 hover:opacity-80 transition text-left cursor-pointer"
                title="Changer de profil ou d'utilisateur"
              >
                <img
                  src={currentUser.photo}
                  alt={currentUser.prenom}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400/50"
                />
                <div className="text-left text-xs leading-tight">
                  <div className="font-semibold text-stone-200">{currentUser.prenom} {currentUser.nom}</div>
                  <div className="text-[10px] text-amber-400 font-mono">{currentUser.poste}</div>
                </div>
              </button>
            )}

            {/* Full secure sign-out: confirmation + clears session and sensitive local data */}
            {authEmail && currentRole !== 'CLIENT' && !isPublicExperience && (
              <button
                onClick={() => {
                  if (window.confirm('Déconnecter votre session administrateur de cette machine ?')) {
                    void signOut();
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/50 text-rose-300 hover:bg-rose-900/60 transition text-xs font-bold"
                title="Se déconnecter et effacer la session de cette machine"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Déconnexion</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
