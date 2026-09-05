import React, { useState } from 'react';
import { ArrowRight, KeyRound, LockKeyhole, ShieldCheck, Utensils, X } from 'lucide-react';
import { UserRole } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

const destinationForRole = (role: UserRole): string => {
  if (role === 'ADMINISTRATEUR' || role === 'RESPONSABLE') return '/admin/dashboard';
  if (role === 'CAISSIER') return '/cashier/dashboard';
  if (role === 'CUISINE') return '/kitchen/dashboard';
  if (role === 'SERVEUR' || role === 'EMPLOYE' || role === 'POINTAGE') return '/staff/dashboard';
  return '/menu';
};

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { signIn } = useRestaurant();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const result = await signIn(email.trim(), password);
    if (!result.success || !result.role) {
      setErrorMessage('Adresse email ou mot de passe incorrect. Veuillez réessayer.');
      setIsSubmitting(false);
      return;
    }

    onNavigate(destinationForRole(result.role));
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Restaurant Umoja</h1>
              <p className="text-xs text-stone-400">Espace personnel sécurisé</p>
            </div>
          </div>
          <button onClick={() => onNavigate('/menu')} aria-label="Retour au menu" className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs text-stone-300">Votre rôle et vos autorisations sont déterminés automatiquement par votre compte.</p>
          </div>

          <div>
            <label htmlFor="login-email" className="block text-xs font-bold text-stone-300 mb-1.5">Adresse email</label>
            <input id="login-email" type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="nom@restaurant-umoja.cd" />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-bold text-stone-300 mb-1.5">Mot de passe</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input id="login-password" type="password" required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Votre mot de passe" />
            </div>
          </div>

          {errorMessage && <p role="alert" className="text-xs text-rose-300 bg-rose-950/50 border border-rose-700/50 rounded-xl p-3">{errorMessage}</p>}

          <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold rounded-xl py-3 text-sm transition">
            <LockKeyhole className="w-4 h-4" />
            {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </main>
  );
};
