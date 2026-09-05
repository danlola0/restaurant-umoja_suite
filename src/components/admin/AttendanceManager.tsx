import React, { useEffect, useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { AttendanceRecord, AttendanceStatus } from '../../types';
import { formatDateOnly, formatTimeOnly } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';
import { 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Filter, 
  Calendar, 
  X, 
  FileText,
  ShieldCheck,
  Search
} from 'lucide-react';

export const AttendanceManager: React.FC = () => {
  const { attendanceRecords, correctAttendance, currentUser, employees } = useRestaurant();

  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchEmployee, setSearchEmployee] = useState<string>('');
  const [correctingRecord, setCorrectingRecord] = useState<AttendanceRecord | null>(null);

  const [newStatus, setNewStatus] = useState<AttendanceStatus>('PRESENT');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [workStart, setWorkStart] = useState('08:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [regularHours, setRegularHours] = useState(8);
  const [lateAfterMinutes, setLateAfterMinutes] = useState(5);
  const [savingRules, setSavingRules] = useState(false);

  useEffect(() => {
    void supabase.from('work_rules').select('*').eq('id', true).maybeSingle().then(({ data }) => {
      if (!data) return;
      setWorkStart(String(data.work_start).slice(0, 5));
      setWorkEnd(String(data.work_end).slice(0, 5));
      setRegularHours(Number(data.regular_hours_per_day));
      setLateAfterMinutes(data.late_after_minutes);
    });
  }, []);

  const handleOpenCorrection = (r: AttendanceRecord) => {
    setCorrectingRecord(r);
    setNewStatus(r.status);
    setCorrectionReason('');
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingRecord || !correctionReason.trim()) return;

    const adminName = currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Administrateur RH';
    correctAttendance(correctingRecord.id, newStatus, correctionReason.trim(), adminName);
    setCorrectingRecord(null);
  };

  const filteredRecords = attendanceRecords.filter(r => {
    if (filterDate && r.date !== filterDate) return false;
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (searchEmployee.trim()) {
      const q = searchEmployee.toLowerCase();
      if (!r.employeeName.toLowerCase().includes(q) && !r.matricule.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalDelays = attendanceRecords.filter(r => r.status === 'RETARD').reduce((sum, r) => sum + r.delayMinutes, 0);
  const totalLatesCount = attendanceRecords.filter(r => r.status === 'RETARD').length;
  type AttendanceSummary = { employeeId: string; employeeName: string; employeePhoto: string; matricule: string; date: string; arrival?: AttendanceRecord; departure?: AttendanceRecord };
  const attendanceGroups = new Map<string, AttendanceSummary>();
  filteredRecords.forEach(record => {
    const key = `${record.employeeId}-${record.date}`;
    const group: AttendanceSummary = attendanceGroups.get(key) || { employeeId: record.employeeId, employeeName: record.employeeName, employeePhoto: record.employeePhoto, matricule: record.matricule, date: record.date };
    if (record.type === 'ENTREE') group.arrival = record;
    if (record.type === 'SORTIE') group.departure = record;
    attendanceGroups.set(key, group);
  });
  const summaries: AttendanceSummary[] = [];
  attendanceGroups.forEach(summary => summaries.push(summary));

  const saveRules = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingRules(true);
    const { error } = await supabase.from('work_rules').upsert({ id: true, work_start: workStart, work_end: workEnd, regular_hours_per_day: regularHours, overtime_after_hours: regularHours, late_after_minutes: lateAfterMinutes, updated_by: currentUser?.auth_user_id || null, updated_at: new Date().toISOString() });
    setSavingRules(false);
    if (error) window.alert(`Règles non enregistrées : ${error.message}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Stats */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            Suivi des Présences & Pointages ({attendanceRecords.length} enregistrements)
          </h2>
          <p className="text-xs text-stone-400">Contrôle des retards, heures officielles et régularisations justifiées</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800 text-xs">
            <span className="text-stone-400 block text-[10px]">Cumul des Retards</span>
            <strong className="text-rose-400 font-mono font-bold">{totalDelays} min ({totalLatesCount} retards)</strong>
          </div>
        </div>
      </div>

      <form onSubmit={saveRules} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl">
        <div className="mb-4"><h3 className="text-sm font-bold text-stone-100">Règles de travail</h3><p className="text-xs text-stone-400">Appliquées automatiquement aux nouveaux pointages.</p></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"><label className="text-xs text-stone-400">Début<input type="time" value={workStart} onChange={e => setWorkStart(e.target.value)} className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-950 p-2 text-stone-200" /></label><label className="text-xs text-stone-400">Fin<input type="time" value={workEnd} onChange={e => setWorkEnd(e.target.value)} className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-950 p-2 text-stone-200" /></label><label className="text-xs text-stone-400">Heures normales<input type="number" min="1" step="0.5" value={regularHours} onChange={e => setRegularHours(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-950 p-2 text-stone-200" /></label><label className="text-xs text-stone-400">Retard après (min)<input type="number" min="0" value={lateAfterMinutes} onChange={e => setLateAfterMinutes(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-950 p-2 text-stone-200" /></label><button disabled={savingRules} className="self-end rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 disabled:opacity-50">{savingRules ? 'Enregistrement...' : 'Enregistrer les règles'}</button></div>
      </form>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchEmployee}
            onChange={(e) => setSearchEmployee(e.target.value)}
            placeholder="Filtrer par employé / matricule..."
            className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-10 pr-4 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="text-xs text-amber-400 hover:underline">
              Effacer
            </button>
          )}

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PRESENT">Présent</option>
            <option value="RETARD">Retard</option>
            <option value="ABSENT">Absent</option>
            <option value="EN_PAUSE">En pause</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-stone-300">
            <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] font-mono">
              <tr>
                <th className="py-3 px-4">Employé</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Arrivée</th>
                <th className="py-3 px-4">Sortie</th>
                <th className="py-3 px-4">Durée / Suppl.</th>
                <th className="py-3 px-4">Statut & Retard</th>
                <th className="py-3 px-4">Régularisation</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {summaries.map(summary => {
                const arrival = summary.arrival;
                const departure = summary.departure;
                const durationMinutes = arrival && departure ? Math.max(0, (new Date(`${summary.date}T${departure.time}`).getTime() - new Date(`${summary.date}T${arrival.time}`).getTime()) / 60000) : 0;
                const overtimeMinutes = Math.max(0, durationMinutes - regularHours * 60);
                const rec = arrival || departure!;
                return <tr key={`${summary.employeeId}-${summary.date}`} className="hover:bg-stone-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rec.employeePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                        alt={summary.employeeName}
                        className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-stone-700"
                      />
                      <div>
                        <div className="font-bold text-stone-100">{summary.employeeName}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{summary.matricule}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-stone-300">{formatDateOnly(summary.date)}</td>
                  
                  <td className="py-3 px-4 font-mono font-bold text-stone-100">{arrival?.time || '-'}</td>
                  <td className="py-3 px-4 font-mono font-bold text-stone-100">{departure?.time || '-'}</td>
                  <td className="py-3 px-4 font-mono text-stone-300">{durationMinutes ? `${Math.floor(durationMinutes / 60)}h${String(Math.round(durationMinutes % 60)).padStart(2, '0')}` : '-'}{overtimeMinutes > 0 && <span className="ml-1 text-amber-400">+{Math.floor(overtimeMinutes / 60)}h{String(Math.round(overtimeMinutes % 60)).padStart(2, '0')}</span>}</td>

                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      rec.status === 'PRESENT'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                        : rec.status === 'RETARD'
                        ? 'bg-rose-950 text-rose-300 border border-rose-600/50'
                        : 'bg-stone-800 text-stone-400'
                    }`}>
                      {rec.status === 'RETARD' ? `Retard (+${rec.delayMinutes}m)` : rec.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-[11px]">
                    {rec.isManualCorrection ? (
                      <span className="text-amber-400 italic" title={rec.correctionReason}>
                        Corrigé par {rec.correctedBy}
                      </span>
                    ) : (
                      <span className="text-stone-500 font-mono">Système auto</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenCorrection(rec)}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                      title="Régulariser manuellement"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Correction Modal (Strict requirement: Motif Obligatoire) */}
      {correctingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative text-stone-100 flex flex-col">
            
            <div className="px-5 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-stone-100">
                  Régularisation RH : {correctingRecord.employeeName}
                </h3>
              </div>
              <button
                onClick={() => setCorrectingRecord(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="p-5 space-y-4">
              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-xs space-y-1">
                <div>Matricule : <strong className="text-amber-400 font-mono">{correctingRecord.matricule}</strong></div>
                <div>Date & Heure : <span className="text-stone-300">{correctingRecord.date} à {correctingRecord.time}</span></div>
                <div>Statut actuel : <span className="font-bold text-stone-200">{correctingRecord.status}</span></div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">Nouveau Statut attribué *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AttendanceStatus)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="PRESENT">Présent (À l'heure)</option>
                  <option value="RETARD">Retard justifié</option>
                  <option value="ABSENT">Absent</option>
                  <option value="CONGE">Congé / Permission</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">
                  Motif obligatoire de la correction (enregistré dans le journal d'audit) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Ex: Panne de transport collectif justifiée par certificat..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCorrectingRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!correctionReason.trim()}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 transition shadow disabled:opacity-50"
                >
                  Valider la correction et tracer
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
