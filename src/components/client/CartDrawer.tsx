import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Product } from '../../types';
import { DEFAULT_FOOD_IMAGE, formatFC, handleImageError } from '../../utils/formatters';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  Utensils,
  MessageSquare
} from 'lucide-react';

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
}) => {
  const { tables, selectedTableId, setSelectedTableId, placeClientOrder } = useRestaurant();

  const [clientName, setClientName] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const currentTable = tables.find(t => t.id === selectedTableId) || tables[0];

  const handleSubmitOrder = () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);

    try {
      const order = placeClientOrder(
        selectedTableId,
        cartItems,
        clientName.trim() || undefined,
        specialInstructions.trim() || undefined
      );

      onClearCart();
      onClose();
      onOrderSuccess(order.id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-stone-900 border-l border-stone-800 text-stone-100 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="px-5 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-100">Votre Commande</h2>
                <p className="text-xs text-stone-400">
                  {totalItemsCount} article{totalItemsCount > 1 ? 's' : ''} au panier
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Table Selector Box */}
          <div className="px-5 py-3 bg-amber-950/20 border-b border-amber-900/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <Utensils className="w-4 h-4 text-amber-400" />
              <span className="text-stone-300 font-medium">Assigner à la table :</span>
            </div>
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="bg-stone-950 text-amber-300 border border-amber-600/40 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {tables.map(t => (
                <option key={t.id} value={t.id}>
                  {t.code} ({t.zone})
                </option>
              ))}
            </select>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
                <ShoppingBag className="w-14 h-14 text-stone-700 mb-3 stroke-[1.5]" />
                <p className="text-base font-semibold text-stone-400">Votre panier est vide</p>
                <p className="text-xs text-stone-500 mt-1 max-w-xs">
                  Sélectionnez les délicieux plats du Restaurant Umoja depuis le menu pour commencer votre commande.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div 
                    key={`${item.product.id}-${index}`}
                    className="bg-stone-950/80 border border-stone-800 rounded-xl p-3.5 flex gap-3 items-start relative group"
                  >
                    <img
                      src={item.product.photo || DEFAULT_FOOD_IMAGE}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                      loading="lazy"
                      decoding="async"
                      className="w-16 h-16 rounded-lg object-cover bg-stone-900 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-stone-200 line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(index)}
                          className="text-stone-500 hover:text-rose-400 transition p-0.5"
                          title="Retirer l'article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                        {formatFC(item.product.price * item.quantity)}
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-stone-400 italic mt-1 bg-stone-900/90 rounded px-2 py-0.5 border border-stone-800">
                          « {item.notes} »
                        </p>
                      )}

                      {/* Quantity control */}
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-800/80">
                        <span className="text-[10px] text-stone-500 font-mono">
                          {formatFC(item.product.price)} / unité
                        </span>

                        <div className="flex items-center gap-2 bg-stone-900 border border-stone-700/80 rounded-lg px-2 py-0.5">
                          <button
                            onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                            className="text-stone-400 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold font-mono text-stone-200 min-w-[14px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                            className="text-stone-400 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Extra Options (Name & Global Instructions) */}
            {cartItems.length > 0 && (
              <div className="pt-2 space-y-3 border-t border-stone-800">
                <div>
                  <label className="text-xs font-medium text-stone-300 block mb-1">
                    Nom du client / Référence (optionnel)
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: M. Kabeya"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-300 block mb-1">
                    Remarques générales pour le service
                  </label>
                  <textarea
                    rows={2}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Ex: Servir toutes les boissons d'abord..."
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer & Checkout Action */}
          {cartItems.length > 0 && (
            <div className="p-5 bg-stone-950 border-t border-stone-800 space-y-3 shrink-0">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Sous-total ({totalItemsCount} articles)</span>
                  <span className="font-mono text-stone-300">{formatFC(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>TVA & Service (Inclus)</span>
                  <span className="font-mono text-stone-300">0 FC</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-stone-100 pt-2 border-t border-stone-800">
                  <span>Total à payer</span>
                  <span className="text-amber-400 font-mono">{formatFC(totalAmount)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 transition shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Envoi en cours à la cuisine...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirmer la commande • {currentTable.code}
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-stone-500">
                La commande sera transmise instantanément aux écrans de la cuisine Umoja.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
