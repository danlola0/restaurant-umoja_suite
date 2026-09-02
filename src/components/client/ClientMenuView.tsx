import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Product } from '../../types';
import { DEFAULT_FOOD_IMAGE, formatFC, handleImageError } from '../../utils/formatters';
import { ProductDetailModal } from './ProductDetailModal';
import { CartDrawer, CartItem } from './CartDrawer';
import { ClientOrderTracker } from './ClientOrderTracker';
import { FeaturedDishesSlider } from './FeaturedDishesSlider';
import { 
  Search, 
  Sparkles, 
  Flame, 
  Clock, 
  Plus, 
  ShoppingBag, 
  SlidersHorizontal,
  UtensilsCrossed,
  Layers,
  ChefHat,
  Info,
  Check
} from 'lucide-react';

export const ClientMenuView: React.FC = () => {
  const { categories, products, selectedTableId, tables, orders, tableSessions } = useRestaurant();

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
      if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) return false;
      if (onlyRecommended && !p.isRecommended) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesTags = p.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesTags) return false;
      }
      return true;
    }).sort((a, b) => a.order - b.order);
  }, [products, selectedCategory, onlyRecommended, searchQuery]);

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
  const currentTableCode = currentTable?.code || 'Table non sélectionnée';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-950 text-stone-100 pb-28">

      {/* Client Welcome and Restaurant Information */}
      <section className="border-b border-stone-800 bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/30 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-400">L’art de recevoir, autrement</p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-100">Bienvenue chez <span className="text-amber-400">Umoja</span></h2>
          <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-stone-300">
            Au cœur de la Chine, Umoja célèbre la rencontre entre les saveurs d’Afrique et l’authenticité locale.
          </p>
        </div>
      </section>
      
      {/* Hero Welcome Banner */}
      <div className="relative bg-gradient-to-b from-stone-900 via-stone-900/90 to-stone-950 border-b border-stone-800/80 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Menu Digital Sans Contact
                </span>
                <span className="text-xs text-stone-400">
                  Table actuelle : <strong className="text-amber-400">{currentTableCode}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight mt-1">
                La Carte Gastronomique <span className="text-amber-500">Umoja</span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-400 max-w-2xl mt-1">
                Découvrez nos grillades braisées au feu de bois, spécialités congolaises du terroir et accompagnements frais préparés à la minute.
              </p>
            </div>

            {/* Quick summary button to open cart */}
            {totalCartCount > 0 && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm shadow-xl shadow-amber-900/30 transition transform active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Panier ({totalCartCount}) • {formatFC(totalCartAmount)}</span>
              </button>
            )}
          </div>

          {/* Top Animated Dish Showcase Slider for Client Presentations */}
          <div className="pt-2">
            <FeaturedDishesSlider
              products={products}
              onSelectProduct={(dish) => setActiveProduct(dish)}
              onAddToCart={(dish, qty) => handleAddToCart(dish, qty)}
            />
          </div>

          {/* Active Table Orders Tracker */}
          <div className="pt-2">
            <ClientOrderTracker />
          </div>

          {/* Search & Filters Bar */}
          <div className="pt-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un plat, ingrédient (ex: Fumbwa, Poulet, Frites)..."
                className="w-full bg-stone-900/90 border border-stone-700/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Recommended Toggle */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setOnlyRecommended(!onlyRecommended)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition shrink-0 ${
                  onlyRecommended
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Recommandés du Chef</span>
              </button>
            </div>

          </div>

          {/* Category Tabs Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-t border-stone-800/60">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              Tous les Plats ({products.length})
            </button>
            {categories.filter(c => c.active).map(cat => {
              const count = products.filter(p => p.categoryId === cat.id).length;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-stone-500">
            <UtensilsCrossed className="w-12 h-12 mx-auto text-stone-700 mb-3" />
            <p className="text-base font-semibold text-stone-400">Aucun plat ne correspond à vos critères</p>
            <button
              onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); setOnlyRecommended(false); }}
              className="mt-3 px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map(product => {
              const isAvail = product.available;
              return (
                <div
                  key={product.id}
                  onClick={() => setActiveProduct(product)}
                  className={`group bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg hover:border-amber-500/50 hover:shadow-amber-950/20 transition-all flex flex-col cursor-pointer relative ${
                    !isAvail ? 'opacity-60 grayscale-[40%]' : ''
                  }`}
                >
                  {/* Photo with gradient overlay & badges */}
                  <div className="relative h-48 w-full bg-stone-950 overflow-hidden shrink-0">
                    <img
                      src={product.photo || DEFAULT_FOOD_IMAGE}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-black/20" />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      {product.isRecommended && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-stone-950 shadow">
                          Chef Umoja
                        </span>
                      )}
                      {!isAvail && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white">
                          Épuisé
                        </span>
                      )}
                    </div>

                    {/* Preparation Time & Spice */}
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 bg-stone-950/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px] font-medium text-stone-300 border border-stone-800">
                      {product.spicyLevel && product.spicyLevel > 0 ? (
                        <span className="flex items-center text-rose-400 font-bold">
                          <Flame className="w-3 h-3" />
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1 text-stone-300">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {product.preparationTimeMinutes}m
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-stone-100 group-hover:text-amber-400 transition line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Price and Add Button */}
                    <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-2">
                      <div className="font-mono text-base font-extrabold text-amber-400">
                        {formatFC(product.price)}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isAvail) handleAddToCart(product, 1);
                        }}
                        disabled={!isAvail}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow ${
                          !isAvail
                            ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                            : 'bg-amber-500 hover:bg-amber-400 text-stone-950 active:scale-95'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-stone-800 bg-stone-900/80 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto text-center space-y-2">
          <div className="flex flex-col items-center justify-center gap-1 text-xs text-stone-400 sm:flex-row sm:gap-5">
            <span>Localisation : Canton, Guangdong, Chine</span>
            <span>Contact : 183 0203 8449</span>
          </div>
          <p className="pt-1 text-[11px] text-stone-500">Copyright Lola Tech 2026</p>
        </div>
      </footer>

      {/* Floating Bottom Bar (when Cart has items) */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40 animate-in slide-in-from-bottom-5">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-3 sm:p-4 text-stone-950 shadow-2xl shadow-amber-950/60 flex items-center justify-between gap-4 border border-amber-400/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-950 text-amber-400 flex items-center justify-center font-black text-sm">
                {totalCartCount}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-950">
                  Votre Panier ({currentTableCode})
                </div>
                <div className="text-base sm:text-lg font-black font-mono leading-tight">
                  {formatFC(totalCartAmount)}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-stone-950 hover:bg-stone-900 text-amber-300 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition shadow-md active:scale-95"
            >
              <span>Voir la commande</span>
              <ShoppingBag className="w-4 h-4" />
            </button>
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
