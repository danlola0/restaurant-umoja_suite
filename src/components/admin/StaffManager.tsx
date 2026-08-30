import React, { useEffect, useRef, useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Employee, UserRole } from '../../types';
import { formatFC, formatDateOnly } from '../../utils/formatters';
import { handleImageError } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  KeyRound, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Phone, 
  Mail, 
  X, 
  CheckCircle2, 
  UserCheck 
} from 'lucide-react';

export const StaffManager: React.FC = () => {
  const { employees, addEmployee, createStaffAccount, updateEmployee, deleteEmployee } = useRestaurant();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [role, setRole] = useState<UserRole>('SERVEUR');
  const [poste, setPoste] = useState('Serveur de Salle');
  const [telephone, setTelephone] = useState('+243 81 000 0000');
  const [email, setEmail] = useState('');
  const [salaireBase, setSalaireBase] = useState<number>(350000);
  const [dateEmbauche, setDateEmbauche] = useState(new Date().toISOString().split('T')[0]);
  const [typeContrat, setTypeContrat] = useState<'CDI' | 'CDD' | 'STAGE' | 'EXTRA'>('CDI');
  const [statut, setStatut] = useState<'ACTIF' | 'CONGE' | 'SUSPENDU' | 'INACTIF'>('ACTIF');
  const [photo, setPhoto] = useState('');
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [pin, setPin] = useState('1234');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountError, setAccountError] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    if (!isCameraOpen) return;

    let cancelled = false;
    const openCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('La caméra n’est pas disponible dans ce navigateur.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        cameraStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setCameraError('Accès à la caméra refusé. Autorisez la caméra dans votre navigateur puis réessayez.');
      }
    };

    void openCamera();
    return () => {
      cancelled = true;
      cameraStreamRef.current?.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    };
  }, [isCameraOpen]);

  const closeCamera = () => {
    cameraStreamRef.current?.getTracks().forEach(track => track.stop());
    cameraStreamRef.current = null;
    setIsCameraOpen(false);
    setCameraError('');
  };

  const captureEmployeePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `employe-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedPhotoFile(file);
      setPhoto(URL.createObjectURL(file));
      closeCamera();
    }, 'image/jpeg', 0.9);
  };
  const [scheduledShiftStart, setScheduledShiftStart] = useState('08:00');
  const [scheduledShiftEnd, setScheduledShiftEnd] = useState('17:00');

  const openCreate = () => {
    setEditingEmp(null);
    setNom('');
    setPrenom('');
    setRole('SERVEUR');
    setPoste('Serveur de Salle');
    setTelephone('+243 81 555 1234');
    setEmail('');
    setSalaireBase(350000);
    setDateEmbauche(new Date().toISOString().split('T')[0]);
    setTypeContrat('CDI');
    setStatut('ACTIF');
    setPhoto('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80');
    setSelectedPhotoFile(null);
    setPin('1234');
    setAccountPassword('');
    setAccountError('');
    setScheduledShiftStart('08:00');
    setScheduledShiftEnd('17:00');
    setIsModalOpen(true);
  };

  const openEdit = (e: Employee) => {
    setEditingEmp(e);
    setNom(e.nom);
    setPrenom(e.prenom);
    setRole(e.role || 'SERVEUR');
    setPoste(e.poste);
    setTelephone(e.telephone);
    setEmail(e.email || '');
    setSalaireBase(e.salaireBase || e.salaire || 350000);
    setDateEmbauche(e.dateEmbauche);
    setTypeContrat(e.typeContrat as any);
    setStatut(e.statut);
    setPhoto(e.photo);
    setSelectedPhotoFile(null);
    setPin(e.pin);
    setScheduledShiftStart(e.scheduledShiftStart || '08:00');
    setScheduledShiftEnd(e.scheduledShiftEnd || '17:00');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim()) return;

    let photoUrl = photo;
    if (selectedPhotoFile) {
      setIsCreatingAccount(true);
      const extension = selectedPhotoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `employees/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('employee-images')
        .upload(filePath, selectedPhotoFile, { upsert: false, contentType: selectedPhotoFile.type });
      if (uploadError) {
        setIsCreatingAccount(false);
        const normalizedUploadError = uploadError.message.toLowerCase();
        setAccountError(normalizedUploadError.includes('bucket not found')
          ? 'Le stockage employee-images n’existe pas encore. Exécutez le fichier supabase/employee-images.sql dans Supabase SQL Editor, puis réessayez.'
          : normalizedUploadError.includes('row-level security')
            ? 'Import refusé : reconnectez-vous avec un compte ADMINISTRATEUR ou RESPONSABLE, puis vérifiez que les politiques employee-images sont installées dans Supabase.'
            : `Photo non envoyée : ${uploadError.message}`);
        return;
      }
      photoUrl = supabase.storage.from('employee-images').getPublicUrl(filePath).data.publicUrl;
      setIsCreatingAccount(false);
    }

    if (editingEmp) {
      updateEmployee(editingEmp.id, {
        nom,
        prenom,
        role,
        poste,
        telephone,
        email,
        salaire: salaireBase,
        salaireBase: salaireBase,
        dateEmbauche,
        typeContrat,
        statut,
        photo: photoUrl || editingEmp.photo,
        pin,
        scheduledShiftStart,
        scheduledShiftEnd,
      });
    } else {
      if (!email.trim() || accountPassword.length < 8) {
        setAccountError('Un email et un mot de passe d’au moins 8 caractères sont obligatoires.');
        return;
      }
      setIsCreatingAccount(true);
      const result = await createStaffAccount({
        email: email.trim(),
        password: accountPassword,
        role,
        employee: {
        nom,
        prenom,
        role,
        poste,
        telephone,
        email,
        salaire: salaireBase,
        salaireBase: salaireBase,
        dateEmbauche,
        typeContrat,
        statut,
          photo: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        pin,
        scheduledShiftStart,
        scheduledShiftEnd,
        },
      });
      setIsCreatingAccount(false);
      if (!result.success) {
        setAccountError(result.message);
        return;
      }
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            Gestion des Ressources Humaines ({employees.length} collaborateurs)
          </h2>
          <p className="text-xs text-stone-400">Fiches du personnel, rôles, horaires programmés, codes PIN et rémunérations</p>
        </div>

        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold transition shadow shadow-amber-900/30 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel Employé</span>
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {employees.map(emp => (
          <div
            key={emp.id}
            className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start gap-3.5">
              <img
                src={emp.photo}
                alt={emp.prenom}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/40 shadow shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="font-bold text-sm text-stone-100 truncate">
                    {emp.prenom} {emp.nom}
                  </h3>
                  <span className="font-mono text-[10px] font-bold text-amber-400 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800">
                    {emp.matricule}
                  </span>
                </div>

                <div className="text-xs font-medium text-amber-300 mt-0.5">{emp.poste}</div>
                <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-stone-500" />
                  <span>{emp.telephone}</span>
                </div>
              </div>
            </div>

            {/* Shift & Compensation details */}
            <div className="bg-stone-950/70 border border-stone-800/80 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-stone-500 block">Horaires de service</span>
                <strong className="font-mono text-stone-200">{emp.scheduledShiftStart} - {emp.scheduledShiftEnd}</strong>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block">Salaire mensuel de base</span>
                <strong className="font-mono text-emerald-400 font-bold">{formatFC(emp.salaireBase)}</strong>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block">Code PIN Pointage</span>
                <strong className="font-mono text-stone-400">•••• ({emp.pin})</strong>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block">Type de Contrat</span>
                <span className="text-stone-300 font-semibold">{emp.typeContrat}</span>
              </div>
            </div>

            {/* Actions & Status */}
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                emp.statut === 'ACTIF'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                  : 'bg-stone-800 text-stone-400'
              }`}>
                {emp.statut}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEdit(emp)}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                  title="Modifier"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Supprimer l'employé ${emp.prenom} ${emp.nom} ?`)) {
                      deleteEmployee(emp.id);
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

      {/* Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl relative text-stone-100 flex flex-col max-h-[90vh]">
            
            <div className="px-5 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-100">
                {editingEmp ? `Modifier ${editingEmp.prenom} ${editingEmp.nom}` : 'Créer un Nouvel Employé'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Poste / Fonction</label>
                  <input
                    type="text"
                    value={poste}
                    onChange={(e) => setPoste(e.target.value)}
                    placeholder="Ex: Chef Cuisinier, Serveur"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Rôle Système</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="SERVEUR">Serveur</option>
                    <option value="CUISINE">Cuisine</option>
                    <option value="CAISSIER">Caissier</option>
                    <option value="RESPONSABLE">Responsable</option>
                    <option value="ADMINISTRATEUR">Administrateur</option>
                    <option value="EMPLOYE">Employé Standard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Salaire Mensuel (CNY)</label>
                  <input
                    type="number"
                    step={10000}
                    value={salaireBase}
                    onChange={(e) => setSalaireBase(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {!editingEmp && (
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                  <div>
                    <label className="text-xs font-bold text-stone-300 block mb-1">Email de connexion *</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="employe@umoja.cd" className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-300 block mb-1">Mot de passe initial *</label>
                    <input type="password" required minLength={8} value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} placeholder="8 caractères minimum" className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500" />
                  </div>
                  <p className="col-span-2 text-[11px] text-amber-200/80">Le rôle sélectionné sera appliqué automatiquement au compte Supabase.</p>
                </div>
              )}

              {accountError && <p role="alert" className="rounded-lg border border-rose-700/50 bg-rose-950/50 p-2.5 text-xs text-rose-300">{accountError}</p>}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Code PIN (4 chiffres)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs font-mono font-bold text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Prise de service</label>
                  <input
                    type="time"
                    value={scheduledShiftStart}
                    onChange={(e) => setScheduledShiftStart(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Fin de service</label>
                  <input
                    type="time"
                    value={scheduledShiftEnd}
                    onChange={(e) => setScheduledShiftEnd(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">Photo Officielle (URL)</label>
                <input
                  type="text"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-xs font-semibold text-stone-200 hover:bg-stone-700">
                    <span>Choisir une photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file && file.size > 5 * 1024 * 1024) {
                          setAccountError('La photo doit faire moins de 5 Mo.');
                          return;
                        }
                        setSelectedPhotoFile(file);
                        if (file) setPhoto(URL.createObjectURL(file));
                      }}
                    />
                  </label>
                  <label className="cursor-pointer rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20">
                    <span>Prendre avec l’appareil</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file && file.size > 5 * 1024 * 1024) {
                          setAccountError('La photo doit faire moins de 5 Mo.');
                          return;
                        }
                        setSelectedPhotoFile(file);
                        if (file) setPhoto(URL.createObjectURL(file));
                      }}
                    />
                  </label>
                  <button type="button" onClick={() => { setCameraError(''); setIsCameraOpen(true); }} className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20">
                    Ouvrir la caméra
                  </button>
                  {selectedPhotoFile && <span className="max-w-full truncate text-[11px] text-emerald-400">{selectedPhotoFile.name}</span>}
                </div>
                {photo && <img src={photo} alt="Aperçu de la photo officielle" onError={handleImageError} className="mt-3 h-24 w-24 rounded-xl object-cover border border-stone-700" />}
              </div>

              {isCameraOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4">
                  <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-stone-700 bg-stone-900 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-stone-800 bg-stone-950 px-5 py-4">
                      <h3 className="text-sm font-bold text-stone-100">Photo de l’employé</h3>
                      <button type="button" onClick={closeCamera} className="p-1.5 text-stone-400 hover:text-white" aria-label="Fermer la caméra"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="space-y-4 p-5">
                      {cameraError ? <p role="alert" className="rounded-lg border border-rose-700/50 bg-rose-950/50 p-3 text-xs text-rose-300">{cameraError}</p> : <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full rounded-xl bg-black object-cover" />}
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={closeCamera} className="rounded-xl bg-stone-800 px-4 py-2 text-xs font-semibold text-stone-300">Annuler</button>
                        {!cameraError && <button type="button" onClick={captureEmployeePhoto} className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-stone-950">Capturer la photo</button>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                  disabled={isCreatingAccount}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 transition shadow"
                >
                  {isCreatingAccount ? 'Création du compte...' : editingEmp ? 'Enregistrer les Modifications' : 'Créer le compte et la fiche'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
