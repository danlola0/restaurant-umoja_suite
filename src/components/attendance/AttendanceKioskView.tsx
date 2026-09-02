import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { AttendanceRecord, AttendanceType } from '../../types';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  KeyRound,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface AttendanceKioskViewProps {
  onNavigate?: (path: string) => void;
}

export const AttendanceKioskView: React.FC<AttendanceKioskViewProps> = ({ onNavigate }) => {
  const { currentRole, currentUser, authLoading, clockCurrentUserAttendance } = useRestaurant();
  const [pinInput, setPinInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; record?: AttendanceRecord } | null>(null);

  const handleKeypadPress = (key: string) => {
    if (key === 'C') setPinInput('');
    else if (key === 'backspace') setPinInput(previous => previous.slice(0, -1));
    else if (pinInput.length < 4) setPinInput(previous => previous + key);
    setFeedback(null);
  };

  const submitAttendance = async (type: AttendanceType) => {
    if (pinInput.length !== 4) {
      setFeedback({ type: 'error', message: 'Saisissez votre code PIN personnel à 4 chiffres.' });
      return;
    }

    setIsSubmitting(true);
    const result = await clockCurrentUserAttendance(pinInput, type);
    setIsSubmitting(false);
    setPinInput('');
    setFeedback({ type: result.success ? 'success' : 'error', message: result.message, record: result.record });
  };

  if (authLoading) {
    return <div className="min-h-[calc(100vh-4rem)] bg-stone-950 p-6 text-center text-sm text-stone-400">Vérification de votre session sécurisée...</div>;
  }

  if (!currentUser) {
    return <div className="min-h-[calc(100vh-4rem)] bg-stone-950 p-6 text-center text-sm text-stone-400">Votre profil employé est indisponible. Contactez l’administration.</div>;
  }

  const workspacePath = currentRole === 'CAISSIER' ? '/cashier/dashboard' : currentRole === 'CUISINE' ? '/kitchen/dashboard' : '/menu';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-950 p-4 text-stone-100 sm:p-6 lg:p-8">
      <section className="mx-auto max-w-xl space-y-5">
        <div className="flex items-center justify-between gap-3 border-b border-stone-800 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/20 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold text-stone-100">Pointage personnel</h1>
              <p className="text-xs text-stone-400">Votre présence est liée à votre compte sécurisé.</p>
            </div>
          </div>
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 shadow-xl">
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3 rounded-xl border border-stone-800 bg-stone-950/70 p-3">
              {currentUser.photo ? <img src={currentUser.photo} alt="Profil" className="h-11 w-11 rounded-lg object-cover" /> : <UserCheck className="h-6 w-6 text-amber-400" />}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-stone-100">{currentUser.prenom} {currentUser.nom}</p>
                <p className="text-[11px] text-stone-400">{currentUser.poste}</p>
              </div>
            </div>

            <div className="border-t border-stone-800 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-stone-300"><KeyRound className="h-3.5 w-3.5 text-amber-400" /> Code PIN personnel</span>
                <span className="font-mono text-sm tracking-[0.35em] text-amber-400">{'•'.repeat(pinInput.length)}</span>
              </div>
              <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'backspace'].map(key => (
                  <button key={key} type="button" onClick={() => handleKeypadPress(key)} className="h-11 rounded-lg border border-stone-800 bg-stone-950 font-mono text-sm font-bold text-stone-100 transition hover:bg-stone-800">
                    {key === 'backspace' ? 'Effacer' : key}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-stone-800 pt-4">
              <button disabled={isSubmitting} onClick={() => void submitAttendance('ENTREE')} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-xs font-bold text-white disabled:opacity-50"><LogIn className="h-4 w-4" /> Arrivée</button>
              <button disabled={isSubmitting} onClick={() => void submitAttendance('SORTIE')} className="flex items-center justify-center gap-2 rounded-xl bg-stone-700 px-3 py-3 text-xs font-bold text-white disabled:opacity-50"><LogOut className="h-4 w-4" /> Départ</button>
            </div>

            {(currentRole === 'CAISSIER' || currentRole === 'CUISINE') && (
              <button onClick={() => onNavigate?.(workspacePath)} className="w-full rounded-xl border border-stone-700 bg-stone-800 px-3 py-2.5 text-xs font-bold text-stone-200 transition hover:bg-stone-700">
                Accéder à mon espace {currentRole === 'CAISSIER' ? 'caisse' : 'cuisine'}
              </button>
            )}

            {feedback && <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${feedback.type === 'success' ? 'border-emerald-600/50 bg-emerald-950/40 text-emerald-200' : 'border-rose-600/50 bg-rose-950/40 text-rose-200'}`}>
              {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>}
          </div>
        </div>
      </section>
    </div>
  );
};
