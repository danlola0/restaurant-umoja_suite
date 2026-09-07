import React, { useState, useMemo, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Product } from '../../types';
import { DEFAULT_FOOD_IMAGE, formatFC, handleImageError } from '../../utils/formatters';
import { ProductDetailModal } from './ProductDetailModal';
import { CartDrawer, CartItem } from './CartDrawer';
import { ClientOrderTracker } from './ClientOrderTracker';
import { FeaturedDishesSlider } from './FeaturedDishesSlider';
import { useI18n } from '../../context/LanguageContext';
import { 
  Search, 
  Sparkles, 
  Flame, 
  Clock, 
  Plus, 
  ShoppingBag, 
  UtensilsCrossed,
  ChefHat,
  CheckCircle2
} from 'lucide-react';

export const ClientMenuView: React.FC = () => {
  const { categories, products, selectedTableId, tables, orders, tableSessions } = useRestaurant();
  const { t, translateCategory, translateDish, translateDishDescription } = useI18n();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyRecommended, setOnlyRecommended] = useState<boolean>(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [showOrderSuccessToast, setShowOrderSuccessToast] = useState<string | null>(null);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.available) return false;
      if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) return false;
      if (onlyRecommended && !p.isRecommended) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q) || translateDish(p.name).toLowerCase().includes(q);
        const matchesDesc =
          p.description.toLowerCase().includes(q) ||
          translateDishDescription(p.name, p.description).toLowerCase().includes(q);
        const matchesTags = p.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesTags) return false;
      }
      return true;
    }).sort((a, b) => a.order - b.order);
  }, [products, selectedCategory, onlyRecommended, searchQuery, translateDish, translateDishDescription]);

  const visibleProducts = useMemo(() => products.filter(p => p.available), [products]);

  useEffect(() => {
    const visibleIds = new Set(visibleProducts.map(p => p.id));
    setCartItems(prev => prev.filter(item => visibleIds.has(item.product.id)));
  }, [visibleProducts]);

  // Cart handlers
  const handleAddToCart = (product: Product, quantity: number, notes?: string) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id && item.notes === notes);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity, notes }];
    });
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
    } else {
      setCartItems(prev => {
        const updated = [...prev];
        updated[index].quantity = newQty;
        return updated;
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartAmount = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const currentTable = tables.find(t => t.id === selectedTableId) || tables[0];
  const currentTableCode = currentTable?.code || t('tableNotSelected');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-950 text-stone-100 pb-32">

      {/* Hero Welcome Banner */}
      <div className="relative border-b border-stone-800/80 bg-gradient-to-b from-stone-900 via-stone-900/90 to-stone-950 px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {t('liveMenu')}
                </span>
                <span className="text-xs font-medium text-stone-400">
                  {t('yourTable')} : <strong className="text-amber-400 font-semibold">{currentTableCode}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-stone-100 tracking-tight">
                {t('menuTitle')}
              </h1>
              <p className="text-sm sm:text-[15px] text-stone-400 max-w-2xl leading-relaxed">
                {t('menuSubtitle')}
              </p>
            </div>

            {/* Quick summary button to open cart */}
            {totalCartCount > 0 && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="self-start sm:self-auto flex items-center gap-2.5 min-h-12 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-xl shadow-amber-900/30 transition-transform duration-200 active:scale-[0.97]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t('viewPlate')} ({totalCartCount}) · {formatFC(totalCartAmount)}</span>
              </button>
            )}
          </div>

          {/* Top Animated Dish Showcase Slider for Client Presentations */}
          <div className="pt-1">
            <FeaturedDishesSlider
              products={visibleProducts}
              onSelectProduct={(dish) => setActiveProduct(dish)}
              onAddToCart={(dish, qty) => handleAddToCart(dish, qty)}
            />
          </div>

          {/* Active Table Orders Tracker */}
          <div className="pt-2">
            <ClientOrderTracker />
          </div>

          {/* Search & Filters Bar */}
          <div className="pt-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full min-h-12 bg-stone-900/90 border border-stone-700/80 rounded-2xl pl-11 pr-11 py-3 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 min-h-8 min-w-8 rounded-lg text-stone-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Recommended Toggle */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setOnlyRecommended(!onlyRecommended)}
                className={`flex items-center gap-2 min-h-12 px-4 py-2.5 rounded-2xl text-xs font-semibold border transition shrink-0 ${
                  onlyRecommended
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-600'
                }`}
              >
                <ChefHat className="w-4 h-4 text-amber-400" />
                <span>{t('chefSelection')}</span>
              </button>
            </div>

          </div>

          {/* Category Tabs Pill Bar */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-3 border-t border-stone-800/60">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`min-h-10 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-900/30'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              {t('allMenu')} ({visibleProducts.length})
            </button>
            {categories.filter(c => c.active).map(cat => {
              const count = visibleProducts.filter(p => p.categoryId === cat.id).length;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`min-h-10 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-900/30 font-bold'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  <span>{translateCategory(cat.name)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-stone-950/20 text-stone-950 font-extrabold' : 'bg-stone-800 text-stone-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* Main Dishes Grid */}
      <main className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-10 sm:py-12">
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-stone-500">
            <UtensilsCrossed className="w-14 h-14 mx-auto text-stone-700 mb-4" />
            <p className="text-lg font-semibold text-stone-300">{t('noDish')}</p>
            <p className="text-sm text-stone-500 mt-2">{t('tryAnother')}</p>
            <button
              onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); setOnlyRecommended(false); }}
              className="mt-5 min-h-11 px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-semibold"
            >
              {t('showMenuAgain')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-7">
            {filteredProducts.map(product => {
              const isAvail = product.available;
              return (
                <div
                  key={product.id}
                  onClick={() => setActiveProduct(product)}
                  className={`group bg-stone-900 border border-stone-800/90 rounded-3xl overflow-hidden shadow-[0_18px_40px_-24px_rgba(0,0,0,0.85)] hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-[0_24px_48px_-20px_rgba(120,53,15,0.45)] transition-all duration-300 flex flex-col cursor-pointer relative ${
                    !isAvail ? 'opacity-60 grayscale-[40%]' : ''
                  }`}
                >
                  {/* Photo with gradient overlay & badges */}
                  <div className="relative h-52 w-full bg-stone-950 overflow-hidden shrink-0">
                    <img
                      src={product.photo || DEFAULT_FOOD_IMAGE}
                      alt={translateDish(product.name)}
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-black/20" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {product.isRecommended && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-500 text-stone-950 shadow-lg shadow-amber-900/40">
                          {t('chefsChoice')}
                        </span>
                      )}
                      {product.tags?.some(tag => /nouveau|new/i.test(tag)) && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-stone-950/80 text-amber-300 border border-amber-500/40">
                          {t('nouveau')}
                        </span>
                      )}
                      {product.tags?.some(tag => /populaire|best/i.test(tag)) && !product.isRecommended && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-stone-950/80 text-amber-200 border border-amber-500/30">
                          {t('populaire')}
                        </span>
                      )}
                      {!isAvail && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                          {t('soldOut')}
                        </span>
                      )}
                    </div>

                    {/* Preparation Time & Spice */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-stone-950/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-medium text-stone-300 border border-stone-800">
                      {product.spicyLevel && product.spicyLevel > 0 ? (
                        <span className="flex items-center text-rose-400 font-bold">
                          <Flame className="w-3 h-3" />
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1 text-stone-300">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {product.preparationTimeMinutes} min
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-base sm:text-[17px] text-stone-100 group-hover:text-amber-400 transition-colors duration-300 line-clamp-1 tracking-tight">
                        {translateDish(product.name)}
                      </h3>
                      <p className="text-[13px] text-stone-400 line-clamp-2 leading-relaxed">
                        {translateDishDescription(product.name, product.description)}
                      </p>
                    </div>

                    {/* Price and Add Button */}
                    <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-3">
                      <div className="font-mono text-lg font-bold text-amber-400 tracking-tight">
                        {formatFC(product.price)}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isAvail) handleAddToCart(product, 1);
                        }}
                        disabled={!isAvail}
                        className={`flex items-center gap-1.5 min-h-11 px-4 py-2 rounded-xl text-xs font-bold transition-transform duration-200 shadow-md ${
                          !isAvail
                            ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                            : 'bg-amber-500 hover:bg-amber-400 text-stone-950 active:scale-95 shadow-amber-900/30'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>{t('add')}</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-stone-800 bg-stone-900/80 px-5 sm:px-8 lg:px-10 py-8">
        <div className="max-w-7xl mx-auto text-center space-y-2">
          <div className="flex flex-col items-center justify-center gap-1.5 text-xs text-stone-400 sm:flex-row sm:gap-6">
            <span>Canton, Guangdong</span>
            <span>183 0203 8449</span>
          </div>
          <p className="pt-1 text-[11px] text-stone-500">Copyright Lola Tech 2026</p>
        </div>
      </footer>

      {/* Floating Bottom Bar (when Cart has items) */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-5 left-4 right-4 max-w-xl mx-auto z-40">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-3.5 sm:p-4 text-stone-950 shadow-2xl shadow-amber-950/60 flex items-center justify-between gap-4 border border-amber-400/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-stone-950 text-amber-400 flex items-center justify-center font-black text-sm shrink-0">
                {totalCartCount}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-950">
                  {t('readyToSend')} · {currentTableCode}
                </div>
                <div className="text-lg sm:text-xl font-black font-mono leading-tight">
                  {formatFC(totalCartAmount)}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-stone-950 hover:bg-stone-900 text-amber-300 font-bold min-h-11 px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-md active:scale-95 shrink-0"
            >
              <span>{t('validateOrder')}</span>
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showOrderSuccessToast && (
        <div className="fixed top-20 left-4 right-4 max-w-md mx-auto z-50 rounded-2xl border border-amber-500/40 bg-stone-900 px-4 py-3 shadow-2xl shadow-black/50 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-stone-100">{t('orderSent')}</p>
            <p className="text-xs text-stone-400">{t('orderSentHint')}</p>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <ProductDetailModal
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCartItems([])}
        onOrderSuccess={(orderId) => {
          setShowOrderSuccessToast(orderId);
          setTimeout(() => setShowOrderSuccessToast(null), 5000);
        }}
      />

    </div>
  );
};
