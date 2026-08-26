import React, { useState } from 'react';
import { Product } from '../../types';
import { DEFAULT_FOOD_IMAGE, formatFC, handleImageError } from '../../utils/formatters';
import { X, Plus, Minus, Flame, Clock, Check, ShoppingBag, Sparkles, AlertCircle } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, notes?: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [cookingNotes, setCookingNotes] = useState('');
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart(product, quantity, cookingNotes.trim() || undefined);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 600);
  };

  const quickInstructions = [
    'Sans piment',
    'Piment à part',
    'Bien cuit / Très croustillant',
    'Sauce à part',
    'Sans oignons',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative text-stone-100 max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Banner */}
        <div className="relative h-60 w-full overflow-hidden bg-stone-950 shrink-0">
          <img
            src={product.photo || DEFAULT_FOOD_IMAGE}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={handleImageError}
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-black/30" />
          
          {/* Tags & Recommended Badge */}
          <div className="absolute bottom-3 left-4 flex flex-wrap items-center gap-2">
            {product.isRecommended && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500 text-stone-950 shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                Spécialité Recommandée
              </span>
            )}
            {product.spicyLevel && product.spicyLevel > 0 ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-700/50">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                {product.spicyLevel === 1 ? 'Légèrement Épicé' : product.spicyLevel === 2 ? 'Épicé' : 'Très Relevé'}
              </span>
            ) : null}
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-stone-800/80 text-stone-300 border border-stone-700">
              <Clock className="w-3 h-3" />
              ~{product.preparationTimeMinutes} min
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-xl font-bold text-stone-100">{product.name}</h3>
              <div className="text-xl font-extrabold text-amber-400 shrink-0 font-mono">
                {formatFC(product.price)}
              </div>
            </div>
            <p className="text-stone-300 text-sm mt-2 leading-relaxed">{product.description}</p>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {product.tags.map((t, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-stone-800 text-stone-400 rounded text-xs">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Cooking Instructions / Special Requests */}
          <div className="space-y-2 pt-2 border-t border-stone-800">
            <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
              <span>Instructions spéciales pour la cuisine (optionnel)</span>
              <span className="text-[11px] text-stone-400 font-normal">Ex: sans sel, piment séparé</span>
            </label>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5">
              {quickInstructions.map(inst => (
                <button
                  key={inst}
                  type="button"
                  onClick={() => {
                    if (cookingNotes.includes(inst)) {
                      setCookingNotes(cookingNotes.replace(inst, '').replace(/,\s*,/g, ',').trim());
                    } else {
                      setCookingNotes(cookingNotes ? `${cookingNotes}, ${inst}` : inst);
                    }
                  }}
                  className={`text-xs px-2.5 py-1 rounded-full border transition ${
                    cookingNotes.includes(inst)
                      ? 'bg-amber-600/30 border-amber-500 text-amber-300 font-semibold'
                      : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:border-stone-500'
                  }`}
                >
                  {inst}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={cookingNotes}
              onChange={(e) => setCookingNotes(e.target.value)}
              placeholder="Précisez ici vos préférences de cuisson ou allergies..."
              className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-4 shrink-0">
          
          {/* Quantity stepper */}
          <div className="flex items-center gap-3 bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="p-1 rounded-lg text-stone-400 hover:text-white disabled:opacity-40"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-base font-mono text-stone-100 min-w-[20px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-1 rounded-lg text-stone-400 hover:text-white"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            disabled={!product.available}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition shadow-lg ${
              !product.available 
                ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                : addedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-amber-900/30'
            }`}
          >
            {addedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                Ajouté au panier !
              </>
            ) : !product.available ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Plat momentanément indisponible
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                Ajouter • {formatFC(product.price * quantity)}
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
};
