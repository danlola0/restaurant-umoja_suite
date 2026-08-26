import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { UserRole } from '../../types';
import { 
  ShieldCheck, 
  KeyRound, 
  User, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Lock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole?: UserRole;
  onAuthenticated?: (role: UserRole) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onAuthenticated }) => {
  const { signIn, currentRole } = useRestaurant();

  const [email, setEmail] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const result = await signIn(email.trim(), pinInput);
    if (!result.success) {
      setErrorMsg('Connexion refusée. Vérifiez votre email et votre mot de passe.');
      return;
    }

    onAuthenticated?.(result.role || currentRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative text-stone-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-stone-100">
                Connexion à l'espace personnel
              </h3>
              <p className="text-[11px] text-stone-400">Système Unifié Restaurant Umoja</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleLoginSubmit} className="p-6 space-y-5 overflow-y-auto">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-300 block">
              Connectez-vous avec votre compte professionnel
            </label>
          </div>

          <div className="space-y-3 pt-3 border-t border-stone-800 animate-in fade-in">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">
                  2. Adresse email professionnelle
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employe@restaurant-umoja.cd"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">
                  3. Mot de passe Supabase
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500 tracking-widest"
                  />
                </div>
              </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-600/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 transition shadow shadow-amber-900/30 flex items-center justify-center gap-2"
            >
              <span>Accéder à l'interface</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
