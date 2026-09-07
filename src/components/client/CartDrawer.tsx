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
  const currentTableCode = currentTable?.code || 'Table non sélectionnée';

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);

    try {
      const order = await placeClientOrder(
        selectedTableId,
        cartItems,
        clientName.trim() || undefined,
        specialInstructions.trim() || undefined
      );

      onClearCart();
      onClose();
      onOrderSuccess(order.id);
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : 'La commande n’a pas pu être enregistrée.');
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
          <div className="px-6 py-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-stone-100">Votre plateau</h2>
                <p className="text-xs font-medium text-stone-400">
                  {totalItemsCount} saveur{totalItemsCount > 1 ? 's' : ''} prête{totalItemsCount > 1 ? 's' : ''} à partir
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="min-h-10 min-w-10 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Table Selector Box */}
          <div className="px-6 py-4 bg-amber-950/20 border-b border-amber-900/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <Utensils className="w-4 h-4 text-amber-400" />
              <span className="text-stone-300 font-medium">Votre table</span>
            </div>
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="bg-stone-950 text-amber-300 border border-amber-600/40 rounded-xl min-h-10 px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {tables.map(t => (
                <option key={t.id} value={t.id}>
                  {t.code} ({t.zone})
                </option>
              ))}
            </select>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
                <ShoppingBag className="w-16 h-16 text-stone-700 mb-4 stroke-[1.5]" />
                <p className="text-lg font-semibold text-stone-300">Votre plateau est encore vide</p>
                <p className="text-sm text-stone-500 mt-2 max-w-xs leading-relaxed">
                  Choisissez un plat qui vous fait de l’œil : un tap, et il rejoint votre commande.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {cartItems.map((item, index) => (
                  <div 
                    key={`${item.product.id}-${index}`}
                    className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 flex gap-3.5 items-start relative group shadow-[0_12px_28px_-22px_rgba(0,0,0,0.9)]"
                  >
                    <img
                      src={item.product.photo || DEFAULT_FOOD_IMAGE}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                      loading="lazy"
                      decoding="async"
                      className="w-[4.5rem] h-[4.5rem] rounded-xl object-cover bg-stone-900 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-stone-100 line-clamp-1 tracking-tight">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(index)}
                          className="min-h-8 min-w-8 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-900 transition flex items-center justify-center"
                          title="Retirer l'article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-sm font-bold text-amber-400 font-mono mt-1">
                        {formatFC(item.product.price * item.quantity)}
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-stone-400 italic mt-1.5 bg-stone-900/90 rounded-lg px-2.5 py-1 border border-stone-800">
                          « {item.notes} »
                        </p>
                      )}

                      {/* Quantity control */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-800/80">
                        <span className="text-[11px] text-stone-500 font-medium">
                          {formatFC(item.product.price)} l’unité
                        </span>

                        <div className="flex items-center gap-1 bg-stone-900 border border-stone-700/80 rounded-xl px-1 py-0.5">
                          <button
                            onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                            className="min-h-9 min-w-9 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-bold font-mono text-stone-200 min-w-[1.25rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                            className="min-h-9 min-w-9 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center"
                          >
                            <Plus className="w-3.5 h-3.5" />
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
              <div className="pt-3 space-y-3.5 border-t border-stone-800">
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    Pour qui est cette table ? <span className="font-medium text-stone-500">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex. : M. Kabeya"
                    className="w-full min-h-11 bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    Un mot pour le service
                  </label>
                  <textarea
                    rows={2}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Ex. : boissons d’abord, extra piment à part…"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer & Checkout Action */}
          {cartItems.length > 0 && (
            <div className="p-6 bg-stone-950 border-t border-stone-800 space-y-4 shrink-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-stone-400">
                  <span className="font-medium">Sous-total ({totalItemsCount} plats)</span>
                  <span className="font-mono text-stone-300 font-semibold">{formatFC(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span className="font-medium">Service</span>
                  <span className="font-mono text-stone-300">Inclus</span>
                </div>
                <div className="flex justify-between text-lg font-extrabold text-stone-100 pt-3 border-t border-stone-800">
                  <span>Total de votre table</span>
                  <span className="text-amber-400 font-mono">{formatFC(totalAmount)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full min-h-[3.25rem] py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 transition shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Envoi vers les fourneaux…
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Envoyer en cuisine · {currentTableCode}
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-stone-500 leading-relaxed">
                Un tap, et la cuisine Umoja s’en occupe. Vous suivez la préparation en direct.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
