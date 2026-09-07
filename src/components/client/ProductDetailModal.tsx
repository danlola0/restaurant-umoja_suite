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
      <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative text-stone-100 max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 min-h-10 min-w-10 rounded-full bg-black/60 text-white hover:bg-black/80 transition flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Banner */}
        <div className="relative h-64 w-full overflow-hidden bg-stone-950 shrink-0">
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
          <div className="absolute bottom-4 left-5 flex flex-wrap items-center gap-2">
            {product.isRecommended && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-amber-500 text-stone-950 shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                Chef’s Choice
              </span>
            )}
            {product.spicyLevel && product.spicyLevel > 0 ? (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-700/50">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                {product.spicyLevel === 1 ? 'Légèrement épicé' : product.spicyLevel === 2 ? 'Épicé' : 'Très relevé'}
              </span>
            ) : null}
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-800/80 text-stone-300 border border-stone-700">
              <Clock className="w-3 h-3" />
              ~{product.preparationTimeMinutes} min
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-5 flex-1">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-2xl font-bold tracking-tight text-stone-100">{product.name}</h3>
              <div className="text-xl font-extrabold text-amber-400 shrink-0 font-mono">
                {formatFC(product.price)}
              </div>
            </div>
            <p className="text-stone-300 text-[15px] mt-3 leading-relaxed">{product.description}</p>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {product.tags.map((t, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-stone-800 text-stone-400 rounded-full text-xs font-medium">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Cooking Instructions / Special Requests */}
          <div className="space-y-2.5 pt-3 border-t border-stone-800">
            <label className="text-xs font-bold text-stone-300 flex items-center justify-between gap-2">
              <span>Comment le voulez-vous ?</span>
              <span className="text-[11px] text-stone-400 font-medium">Optionnel</span>
            </label>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2">
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
                  className={`text-xs min-h-9 px-3 py-1.5 rounded-full border transition ${
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
              placeholder="Allergies, cuisson, sauce à part…"
              className="w-full bg-stone-950 border border-stone-700 rounded-2xl p-3 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-4 shrink-0">
          
          {/* Quantity stepper */}
          <div className="flex items-center gap-1 bg-stone-900 border border-stone-700 rounded-2xl px-1.5 py-1">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="min-h-11 min-w-11 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 disabled:opacity-40 flex items-center justify-center"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-lg font-mono text-stone-100 min-w-[1.5rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="min-h-11 min-w-11 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            disabled={!product.available}
            className={`flex-1 flex items-center justify-center gap-2 min-h-12 py-3 px-4 rounded-2xl font-bold text-sm transition shadow-lg active:scale-[0.98] ${
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
                Ajouté au plateau
              </>
            ) : !product.available ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Indisponible pour l’instant
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                Ajouter · {formatFC(product.price * quantity)}
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
};
