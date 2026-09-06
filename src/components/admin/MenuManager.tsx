import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Product, Category } from '../../types';
import { formatFC, handleImageError } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Flame, 
  Clock, 
  Check, 
  X, 
  Utensils, 
  AlertCircle,
  Tag,
  Search,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const MenuManager: React.FC = () => {
  const { 
    products, 
    categories, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    toggleProductAvailability,
    addCategory,
    deleteCategory 
  } = useRestaurant();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState(categories[0]?.id || '');
  const [formPrice, setFormPrice] = useState<number>(15000);
  const [formDescription, setFormDescription] = useState('');
  const [formPhoto, setFormPhoto] = useState('');
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formPrepTime, setFormPrepTime] = useState<number>(20);
  const [formSpicyLevel, setFormSpicyLevel] = useState<number>(0);
  const [formIsRecommended, setFormIsRecommended] = useState<boolean>(false);
  const [formTags, setFormTags] = useState('');

  // Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory(categories[0]?.id || '');
    setFormPrice(15000);
    setFormDescription('');
    setFormPhoto('https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80');
    setSelectedPhotoFile(null);
    setFormPrepTime(20);
    setFormSpicyLevel(0);
    setFormIsRecommended(false);
    setFormTags('grillade, signature');
    setIsCreatingNew(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.categoryId);
    setFormPrice(p.price);
    setFormDescription(p.description);
    setFormPhoto(p.photo);
    setSelectedPhotoFile(null);
    setFormPrepTime(p.preparationTimeMinutes);
    setFormSpicyLevel(p.spicyLevel || 0);
    setFormIsRecommended(!!p.isRecommended);
    setFormTags(p.tags?.join(', ') || '');
    setIsCreatingNew(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formPrice <= 0) return;

    const tagsArray = formTags.split(',').map(t => t.trim()).filter(Boolean);
    let photoUrl = formPhoto;

    if (selectedPhotoFile) {
      setIsUploadingPhoto(true);
      const extension = selectedPhotoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, selectedPhotoFile, { upsert: false, contentType: selectedPhotoFile.type });
      setIsUploadingPhoto(false);
      if (uploadError) {
        window.alert(`Image non envoyée : ${uploadError.message}`);
        return;
      }
      photoUrl = supabase.storage.from('product-images').getPublicUrl(filePath).data.publicUrl;
    }

    if (editingProduct) {
      const updatedOk = await updateProduct(editingProduct.id, {
        name: formName,
        categoryId: formCategory,
        price: formPrice,
        description: formDescription,
        photo: photoUrl || editingProduct.photo,
        preparationTimeMinutes: formPrepTime,
        spicyLevel: formSpicyLevel,
        isRecommended: formIsRecommended,
        tags: tagsArray,
      });
      if (!updatedOk) return;
      window.alert(`Produit « ${formName} » modifié avec succès.`);
    } else {
      addProduct({
        name: formName,
        categoryId: formCategory,
        price: formPrice,
        description: formDescription,
        photo: photoUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
        preparationTimeMinutes: formPrepTime,
        spicyLevel: formSpicyLevel,
        available: true,
        order: products.length + 1,
        isRecommended: formIsRecommended,
        tags: tagsArray,
      });
    }

    setIsCreatingNew(false);
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      description: newCatDescription.trim(),
      order: categories.length + 1,
      active: true,
    });
    setNewCatName('');
    setNewCatDescription('');
    setShowCategoryModal(false);
  };

  const filteredProducts = products.filter(p => {
    if (selectedCategoryId !== 'ALL' && p.categoryId !== selectedCategoryId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Notice / Rule Reminder on Price Immutability */}
      <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200">
        <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="block text-amber-300 font-bold mb-0.5">
            Règle de gestion financière :
          </strong>
          Toute modification de prix d'un produit s'applique uniquement aux futures commandes. Les commandes antérieures et en cours conservent strictement leur prix unitaire d'origine (instantané archivé).
        </div>
      </div>

      {/* Header and Controls */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-amber-400" />
            Gestion de la Carte & des Produits ({products.length} plats)
          </h2>
          <p className="text-xs text-stone-400">Création, ajustement des tarifs, disponibilité cuisine et catégories</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700 transition flex items-center gap-1.5"
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Gérer Catégories</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold transition shadow shadow-amber-900/30 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Plat</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un plat par nom ou description..."
            className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-10 pr-4 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategoryId('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedCategoryId === 'ALL' ? 'bg-amber-600 text-white shadow' : 'bg-stone-900 text-stone-400 hover:text-stone-200'
            }`}
          >
            Toutes ({products.length})
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategoryId(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategoryId === c.id ? 'bg-amber-600 text-white shadow' : 'bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-stone-300">
            <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] font-mono">
              <tr>
                <th className="py-3 px-4">Plat</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Prix Unitaire</th>
                <th className="py-3 px-4">Temps</th>
                <th className="py-3 px-4">Statut Stock</th>
                <th className="py-3 px-4">Spécialité</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {filteredProducts.map(p => {
                const cat = categories.find(c => c.id === p.categoryId);
                return (
                  <tr key={p.id} className="hover:bg-stone-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.photo}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          onError={handleImageError}
                          className="w-10 h-10 rounded-lg object-cover bg-stone-950 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-stone-100 text-xs">{p.name}</div>
                          <div className="text-[11px] text-stone-400 line-clamp-1 max-w-xs">{p.description}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-medium text-[11px]">
                        {cat?.name || 'Général'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-amber-400 text-sm">
                      {formatFC(p.price)}
                    </td>

                    <td className="py-3 px-4 text-stone-400">
                      ~{p.preparationTimeMinutes} min
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleProductAvailability(p.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 ${
                          p.available
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50 hover:bg-emerald-900/50'
                            : 'bg-rose-950 text-rose-300 border border-rose-600/50 hover:bg-rose-900/50'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.available ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {p.available ? 'Disponible' : 'Épuisé'}
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      {p.isRecommended ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                          Recommandé
                        </span>
                      ) : (
                        <span className="text-stone-600 text-[10px]">Standard</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                        title="Modifier le plat"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Supprimer définitivement ${p.name} ?`)) {
                            deleteProduct(p.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 text-stone-400 hover:text-rose-400 transition"
                        title="Supprimer du menu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Creation / Edit Modal */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl relative text-stone-100 flex flex-col max-h-[90vh]">
            
            <div className="px-5 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-100">
                {editingProduct ? `Modifier : ${editingProduct.name}` : 'Nouveau Plat à la Carte'}
              </h3>
              <button
                onClick={() => setIsCreatingNew(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 overflow-y-auto space-y-4 flex-1">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Nom du plat *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Capitaine Braisé Umoja"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Catégorie *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Prix Unitaire (CNY) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    step={1}
                    value={formPrice || ''}
                    onChange={(e) => setFormPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Temps prép. (min)</label>
                  <input
                    type="number"
                    value={formPrepTime || ''}
                    onChange={(e) => setFormPrepTime(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Piquant (0-3)</label>
                  <select
                    value={formSpicyLevel}
                    onChange={(e) => setFormSpicyLevel(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value={0}>0 - Doux</option>
                    <option value={1}>1 - Légèrement épicé</option>
                    <option value={2}>2 - Épicé</option>
                    <option value={3}>3 - Très relevé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">Description & Ingrédients</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Détails de préparation, accompagnements suggérés..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">URL de la photo</label>
                <input
                  type="text"
                  value={formPhoto}
                  onChange={(e) => setFormPhoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <div className="mt-2 flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-xs font-semibold text-stone-200 hover:bg-stone-700">
                    <span>Importer depuis l'ordinateur</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file && file.size > 5 * 1024 * 1024) {
                          window.alert('L’image doit faire moins de 5 Mo.');
                          return;
                        }
                        setSelectedPhotoFile(file);
                        if (file) setFormPhoto(URL.createObjectURL(file));
                      }}
                    />
                  </label>
                  {selectedPhotoFile && <span className="text-[11px] text-emerald-400 truncate">{selectedPhotoFile.name}</span>}
                </div>
                {formPhoto && (
                  <img src={formPhoto} alt="Aperçu du plat" onError={handleImageError} className="mt-3 h-28 w-40 rounded-lg object-cover border border-stone-700" />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-2">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">Tags (séparés par virgules)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="poisson, signature, sans gluten"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="recChef"
                    checked={formIsRecommended}
                    onChange={(e) => setFormIsRecommended(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-stone-950 border-stone-700"
                  />
                  <label htmlFor="recChef" className="text-xs font-bold text-amber-300 cursor-pointer">
                    Mettre en avant (Recommandé par le Chef)
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isUploadingPhoto}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 transition shadow"
                >
                  {isUploadingPhoto ? 'Import de l’image...' : editingProduct ? 'Enregistrer les Modifications' : 'Ajouter le Plat au Menu'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative text-stone-100 flex flex-col">
            <div className="px-5 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-100">Gestion des Catégories du Menu</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <form onSubmit={handleAddCategorySubmit} className="space-y-3 bg-stone-950 p-3.5 rounded-xl border border-stone-800">
                <h4 className="text-xs font-bold text-amber-400">Ajouter une nouvelle catégorie</h4>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nom (ex: Vins & Spiritueux)"
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition"
                >
                  Ajouter la catégorie
                </button>
              </form>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-stone-950/70 p-2.5 rounded-lg border border-stone-800 text-xs">
                    <span className="font-bold text-stone-200">{c.name}</span>
                    <button
                      onClick={() => deleteCategory(c.id)}
                      className="text-stone-500 hover:text-rose-400 p-1"
                      title="Supprimer la catégorie"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
