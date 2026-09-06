import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestaurantTable } from '../../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  Users, 
  Utensils, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export const TableManager: React.FC = () => {
  const { tables, addTable, updateTable, deleteTable, employees } = useRestaurant();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  
  const [code, setCode] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [zone, setZone] = useState('Salle Principale');
  const [waiterName, setWaiterName] = useState('');

  const openCreate = () => {
    setEditingTable(null);
    setCode(`Table ${String(tables.length + 1).padStart(2, '0')}`);
    setCapacity(4);
    setZone('Salle Principale');
    setWaiterName(employees.find(e => e.poste.toLowerCase().includes('serveur'))?.prenom || 'Équipe Umoja');
    setIsModalOpen(true);
  };

  const openEdit = (t: RestaurantTable) => {
    setEditingTable(t);
    setCode(t.code);
    setCapacity(t.capacity);
    setZone(t.zone);
    setWaiterName(t.waiterName || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || capacity <= 0) return;

    if (editingTable) {
      updateTable(editingTable.id, {
        code,
        capacity,
        zone,
        waiterName,
      });
    } else {
      addTable({
        code,
        capacity,
        zone,
        waiterName,
      });
    }
    setIsModalOpen(false);
  };

  const zones = Array.from(new Set(tables.map(t => t.zone)));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            Configuration du Plan de Salle & Tables ({tables.length} tables)
          </h2>
          <p className="text-xs text-stone-400">Création, capacités d'accueil, affectation des zones et serveurs</p>
        </div>

        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold transition shadow shadow-amber-900/30 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une Table</span>
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map(table => (
          <div
            key={table.id}
            className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-base text-amber-400">{table.code}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-950 text-stone-300 border border-stone-800">
                  {table.zone}
                </span>
              </div>
              <div className="text-xs text-stone-400 mt-1 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-stone-500" />
                <span>Capacité : <strong>{table.capacity} couverts</strong></span>
              </div>
              <div className="text-xs text-stone-400 mt-1">
                Serveur attitré : <strong className="text-stone-200">{table.waiterName || 'Non assigné'}</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                table.status === 'LIBRE'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                  : 'bg-amber-950 text-amber-300 border border-amber-600/50'
              }`}>
                {table.status}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(table)}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                  title="Modifier"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Supprimer définitivement la ${table.code} ?`)) {
                      deleteTable(table.id);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 text-stone-400 hover:text-rose-400 transition"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative text-stone-100 flex flex-col">
            
            <div className="px-5 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-100">
                {editingTable ? `Modifier ${editingTable.code}` : 'Ajouter une Nouvelle Table'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">Code / Identifiant Table *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: Table 09, Salon VIP 2"
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Capacité (Couverts)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={capacity || ''}
                    onChange={(e) => setCapacity(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Zone du restaurant</label>
                  <input
                    type="text"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    placeholder="Terrasse, Salle, VIP..."
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">Serveur(se) assigné(e)</label>
                <select
                  value={waiterName}
                  onChange={(e) => setWaiterName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Équipe Umoja">Équipe Umoja (Général)</option>
                  {employees.map(e => (
                    <option key={e.id} value={`${e.prenom} ${e.nom}`}>
                      {e.prenom} {e.nom} ({e.poste})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 transition shadow"
                >
                  {editingTable ? 'Enregistrer' : 'Créer la Table'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
