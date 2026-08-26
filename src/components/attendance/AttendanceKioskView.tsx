import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Employee, AttendanceType, AttendanceRecord } from '../../types';
import { formatTimeOnly, formatDateOnly, formatDateTime } from '../../utils/formatters';
import { 
  Clock, 
  UserCheck, 
  ShieldCheck, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Coffee, 
  LogOut, 
  LogIn, 
  User, 
  Calendar, 
  Sparkles,
  Info,
  Delete,
  Fingerprint
} from 'lucide-react';

export const AttendanceKioskView: React.FC = () => {
  const { employees, attendanceRecords, clockAttendance } = useRestaurant();

  const [selectedMatricule, setSelectedMatricule] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [activeType, setActiveType] = useState<AttendanceType>('ENTREE');
  const [identifiedEmployee, setIdentifiedEmployee] = useState<Employee | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string; record?: AttendanceRecord } | null>(null);
  
  const [currentLiveTime, setCurrentLiveTime] = useState<string>('');
  const [currentLiveDate, setCurrentLiveDate] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentLiveTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentLiveDate(now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // When matricule changes, update preview employee
  const handleMatriculeSelect = (mat: string) => {
    setSelectedMatricule(mat);
    const emp = employees.find(e => e.matricule.trim().toUpperCase() === mat.trim().toUpperCase());
    setIdentifiedEmployee(emp || null);
    setPinInput('');
    setFeedback(null);
  };

  const handleKeypadPress = (digit: string) => {
    if (pinInput.length < 6) {
      setPinInput(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPinInput('');
    setFeedback(null);
  };

  const handleSubmitClock = (type: AttendanceType) => {
    if (!selectedMatricule) {
      setFeedback({ type: 'error', message: 'Veuillez sélectionner votre matricule.' });
      return;
    }

    if (!pinInput) {
      setFeedback({ type: 'error', message: 'Veuillez saisir votre code PIN à 4 chiffres.' });
      return;
    }

    const res = clockAttendance(selectedMatricule, pinInput, type);
    if (res.success) {
      setFeedback({
        type: res.record?.status === 'RETARD' ? 'warning' : 'success',
        message: res.message,
        record: res.record,
      });
      setPinInput('');
    } else {
      setFeedback({
        type: 'error',
        message: res.message,
      });
    }
  };

  // Today's attendance records
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter(r => r.date === todayStr);

  const presentCount = new Set(todayRecords.filter(r => r.type === 'ENTREE').map(r => r.matricule)).size;
  const lateCount = todayRecords.filter(r => r.status === 'RETARD').length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-950 text-stone-100 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Top Banner / Live Clock */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-stone-100 tracking-tight">
              Borne de Pointage du Personnel Umoja
            </h1>
            <p className="text-xs text-stone-400">
              Enregistrement sécurisé par matricule, code PIN et horodatage certifié
            </p>
          </div>
        </div>

        {/* Live system certified clock */}
        <div className="bg-stone-950 border border-stone-800 rounded-xl px-4 py-2 text-right">
          <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
            Heure Officielle Serveur
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-stone-100">
            {currentLiveTime}
          </div>
          <div className="text-[10px] text-stone-400 capitalize">{currentLiveDate}</div>
        </div>
      </div>

      {/* Main Grid: Interactive Clocking Terminal (Left) & Today Attendance Status Board (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Terminal Left (7 cols) */}
        <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-5">
          
          <div className="border-b border-stone-800 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Saisie de Pointage Individuelle
            </h2>
            <span className="text-[10px] text-stone-400 bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
              Étape 1: Identification • Étape 2: PIN • Étape 3: Action
            </span>
          </div>

          {/* Step 1: Matricule Selector / Quick Employee Buttons */}
          <div>
            <label className="text-xs font-bold text-stone-300 block mb-2">
              1. Sélectionnez votre nom ou matricule
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {employees.filter(e => e.statut === 'ACTIF').map(emp => {
                const isSelected = selectedMatricule === emp.matricule;
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => handleMatriculeSelect(emp.matricule)}
                    className={`p-2.5 rounded-xl border text-xs text-left transition flex items-center gap-2.5 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold ring-1 ring-amber-500'
                        : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    <img
                      src={emp.photo}
                      alt={emp.prenom}
                      className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-stone-700"
                    />
                    <div className="truncate min-w-0">
                      <div className="font-semibold truncate">{emp.prenom} {emp.nom}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{emp.matricule}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Official Employee Photo Display for Visual Identity Confirmation */}
          {identifiedEmployee && (
            <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 flex items-center gap-4 animate-in fade-in">
              <div className="relative shrink-0">
                <img
                  src={identifiedEmployee.photo}
                  alt={identifiedEmployee.prenom}
                  className="w-16 h-16 rounded-xl object-cover ring-2 ring-amber-500 shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
              </div>

              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Photo officielle pour confirmation visuelle
                </div>
                <h3 className="text-base font-extrabold text-stone-100 truncate">
                  {identifiedEmployee.prenom} {identifiedEmployee.nom}
                </h3>
                <div className="text-xs text-stone-400 flex items-center gap-3">
                  <span>Poste : <strong>{identifiedEmployee.poste}</strong></span>
                  <span>Shift prévu : <strong className="font-mono text-amber-300">{identifiedEmployee.scheduledShiftStart || '08:00'}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Touch PIN Pad */}
          {identifiedEmployee && (
            <div className="space-y-3 pt-2 border-t border-stone-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  2. Saisissez votre code PIN (4 chiffres)
                </label>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full border transition-all ${
                        pinInput.length > i
                          ? 'bg-amber-500 border-amber-400 scale-110'
                          : 'bg-stone-900 border-stone-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Touch keypad */}
              <div className="max-w-xs mx-auto grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(btn => (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => {
                      if (btn === 'C') handleClear();
                      else if (btn === '⌫') handleBackspace();
                      else handleKeypadPress(btn);
                    }}
                    className={`py-3 rounded-xl font-bold font-mono text-base transition active:scale-95 shadow ${
                      btn === 'C'
                        ? 'bg-stone-800 hover:bg-stone-700 text-rose-400'
                        : btn === '⌫'
                        ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                        : 'bg-stone-950 hover:bg-stone-800 text-stone-100 border border-stone-800'
                    }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Clocking Action Buttons */}
          {identifiedEmployee && (
            <div className="space-y-2 pt-3 border-t border-stone-800">
              <label className="text-xs font-bold text-stone-300 block">
                3. Choisissez votre action de pointage
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleSubmitClock('ENTREE')}
                  className="py-3 px-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-md transition flex flex-col items-center gap-1 active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Arrivée / Prise</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitClock('DEBUT_PAUSE')}
                  className="py-3 px-2 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-md transition flex flex-col items-center gap-1 active:scale-95"
                >
                  <Coffee className="w-4 h-4" />
                  <span>Début Pause</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitClock('FIN_PAUSE')}
                  className="py-3 px-2 rounded-xl bg-gradient-to-br from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-bold text-xs shadow-md transition flex flex-col items-center gap-1 active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Fin Pause</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitClock('SORTIE')}
                  className="py-3 px-2 rounded-xl bg-gradient-to-br from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-700 text-white font-bold text-xs shadow-md transition flex flex-col items-center gap-1 active:scale-95"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Départ / Fin</span>
                </button>
              </div>
            </div>
          )}

          {/* Instant Feedback Banner */}
          {feedback && (
            <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                : feedback.type === 'warning'
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                : 'bg-rose-950/40 border-rose-500/60 text-rose-300'
            }`}>
              {feedback.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {feedback.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
              {feedback.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
              <div className="space-y-1">
                <p className="font-bold">{feedback.message}</p>
                {feedback.record && (
                  <p className="text-[11px] opacity-80 font-mono">
                    Matricule: {feedback.record.matricule} • Heure: {feedback.record.time} • Statut: {feedback.record.status}
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Attendance Board Right (5 cols) */}
        <div className="lg:col-span-5 bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Tableau des Présences du Jour
                </h3>
                <p className="text-xs text-stone-400">{currentLiveDate}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                  {presentCount} Présents
                </span>
                {lateCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700/50">
                    {lateCount} Retard{lateCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* List of today pointages */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {todayRecords.length === 0 ? (
                <div className="p-8 text-center text-stone-500 text-xs">
                  Aucun pointage enregistré pour cette journée pour le moment.
                </div>
              ) : (
                todayRecords.map(rec => (
                  <div
                    key={rec.id}
                    className="bg-stone-950/70 border border-stone-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rec.employeePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                        alt={rec.employeeName}
                        className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-stone-700"
                      />
                      <div>
                        <div className="font-bold text-stone-200">{rec.employeeName}</div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          {rec.matricule} • {rec.type === 'ENTREE' ? 'Arrivée' : rec.type === 'SORTIE' ? 'Départ' : rec.type}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-stone-100 text-sm">
                        {rec.time}
                      </div>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                        rec.status === 'RETARD'
                          ? 'bg-rose-950 text-rose-300 border border-rose-700/50'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                      }`}>
                        {rec.status === 'RETARD' ? `+${rec.delayMinutes}m retard` : 'À l\'heure'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-800 text-[11px] text-stone-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Toute anomalie ou oubli de pointage doit être régularisé auprès de l'Administration avec justificatif.</span>
          </div>

        </div>

      </div>

    </div>
  );
};
