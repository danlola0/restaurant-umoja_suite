import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatDateTime } from '../../utils/formatters';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Lock, 
  Calendar, 
  User, 
  FileText,
  AlertCircle
} from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const { auditLogs } = useRestaurant();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filteredLogs = auditLogs.filter(log => {
    if (roleFilter !== 'ALL' && log.userRole !== roleFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        log.userName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Journal d'Audit Système & Sécurité ({auditLogs.length} traces)
          </h2>
          <p className="text-xs text-stone-400">
            Historique certifié et immuable de toutes les actions opérationnelles et financières
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-stone-400 bg-stone-950 px-3 py-1 rounded-lg border border-stone-800 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Traces non modifiables
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par utilisateur, action, détail..."
            className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-10 pr-4 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">Tous les rôles</option>
            <option value="ADMINISTRATEUR">Administrateur</option>
            <option value="CAISSIER">Caissier</option>
            <option value="CUISINE">Cuisine</option>
            <option value="SERVEUR">Serveur</option>
            <option value="CLIENT">Client</option>
            <option value="EMPLOYE">Employé RH</option>
          </select>
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="divide-y divide-stone-800/70 max-h-[600px] overflow-y-auto">
          {filteredLogs.map(log => (
            <div key={log.id} className="p-4 hover:bg-stone-800/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-100">{log.userName}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-950 text-amber-400 border border-stone-800">
                    {log.userRole}
                  </span>
                  <span className="font-mono text-[10px] text-stone-500">
                    Action: <strong className="text-stone-300">{log.action}</strong>
                  </span>
                </div>
                <div className="text-stone-300 font-sans">{log.details}</div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-stone-400 font-mono text-[11px]">
                  {formatDateTime(log.timestamp)}
                </div>
                {log.entityId && (
                  <div className="text-[10px] text-stone-600 font-mono">
                    Ref: {log.entityId}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
