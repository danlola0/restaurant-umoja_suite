import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AttendanceType } from '../../types';
import { ATTENDANCE_TYPE_LABELS } from '../../utils/attendanceStatus';
import { AlertCircle, CheckCircle2, Clock, Coffee, KeyRound, LogIn, LogOut, ShieldCheck } from 'lucide-react';

export const PublicAttendanceKiosk: React.FC = () => {
  const [matricule, setMatricule] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const submitAttendance = async (type: AttendanceType) => {
    if (!matricule.trim() || pin.length !== 4) {
      setFeedback({ type: 'error', message: 'Saisissez votre matricule et votre code PIN à 4 chiffres.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    const { data, error } = await supabase.functions.invoke('clock-attendance', {
      body: { matricule: matricule.trim(), pin, type },
    });
    setIsSubmitting(false);
    setPin('');

    if (error || !data?.success) {
      setFeedback({ type: 'error', message: data?.error || error?.message || 'Pointage refusé.' });
      return;
    }
    setFeedback({ type: 'success', message: data.message || `${ATTENDANCE_TYPE_LABELS[type]} enregistrée.` });
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-stone-950 p-4 text-stone-100 sm:p-6">
      <section className="mx-auto max-w-md space-y-5">
        <div className="flex items-center gap-3 border-b border-stone-800 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/20 text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold">Pointage Personnel</h1>
            <p className="text-xs text-stone-400">Borne employés · enregistrement direct dans Supabase.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5 shadow-xl">
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-stone-300">
            <ShieldCheck className="h-5 w-5 shrink-0 text-amber-400" />
            <span>Prise de poste, pause et fin de service sont enregistrés dans la table des présences, sans afficher la liste du personnel.</span>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="attendance-matricule" className="mb-1.5 block text-xs font-bold text-stone-300">Matricule</label>
              <input id="attendance-matricule" type="text" value={matricule} onChange={event => setMatricule(event.target.value.toUpperCase())} autoComplete="username" placeholder="Ex: EMP-001" className="w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2.5 font-mono text-sm uppercase text-stone-100 outline-none focus:ring-2 focus:ring-amber-500" />
            </div>

            <div>
              <label htmlFor="attendance-pin" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-stone-300"><KeyRound className="h-3.5 w-3.5 text-amber-400" /> Code PIN personnel</label>
              <input id="attendance-pin" type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} autoComplete="current-password" placeholder="••••" className="w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2.5 text-center font-mono text-lg tracking-[0.4em] text-stone-100 outline-none focus:ring-2 focus:ring-amber-500" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button type="button" disabled={isSubmitting} onClick={() => void submitAttendance('ENTREE')} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"><LogIn className="h-4 w-4" /> Prise de poste</button>
              <button type="button" disabled={isSubmitting} onClick={() => void submitAttendance('DEBUT_PAUSE')} className="flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-3 py-3 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-50"><Coffee className="h-4 w-4" /> Pause</button>
              <button type="button" disabled={isSubmitting} onClick={() => void submitAttendance('FIN_PAUSE')} className="flex items-center justify-center gap-2 rounded-xl bg-sky-800 px-3 py-3 text-xs font-bold text-white transition hover:bg-sky-700 disabled:opacity-50"><Clock className="h-4 w-4" /> Reprise</button>
              <button type="button" disabled={isSubmitting} onClick={() => void submitAttendance('SORTIE')} className="flex items-center justify-center gap-2 rounded-xl bg-stone-700 px-3 py-3 text-xs font-bold text-white transition hover:bg-stone-600 disabled:opacity-50"><LogOut className="h-4 w-4" /> Fin de service</button>
            </div>

            {feedback && <div role="status" className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${feedback.type === 'success' ? 'border-emerald-600/50 bg-emerald-950/40 text-emerald-200' : 'border-rose-600/50 bg-rose-950/40 text-rose-200'}`}>
              {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>}
          </div>
        </div>
      </section>
    </main>
  );
};
