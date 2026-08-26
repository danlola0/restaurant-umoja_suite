import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { DEFAULT_FOOD_IMAGE, formatFC, handleImageError } from '../../utils/formatters';
import { Sparkles, Flame, Clock, ChevronLeft, ChevronRight, ShoppingBag, Eye } from 'lucide-react';

interface FeaturedDishesSliderProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const FeaturedDishesSlider: React.FC<FeaturedDishesSliderProps> = ({
  products,
  onSelectProduct,
  onAddToCart
}) => {
  // Select top highlight products (those with photos, recommended or top dishes)
  const featured = React.useMemo(() => {
    const recs = products.filter(p => p.available && p.photo);
    if (recs.length === 0) return products.slice(0, 5);
    // Sort to prioritize recommended ones, then by order
    return [...recs].sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0)).slice(0, 8);
  }, [products]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-cycle through images every 4 seconds
  useEffect(() => {
    if (featured.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featured.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [featured.length, isPaused]);

  if (featured.length === 0) return null;

  const currentDish = featured[currentIndex] || featured[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? featured.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % featured.length);
  };

  return (
    <div 
      className="relative w-full rounded-2xl overflow-hidden bg-stone-900 border border-amber-500/20 shadow-2xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Dynamic Background Image with Blur & Gradient Overlay */}
      <div className="relative h-64 sm:h-72 md:h-80 w-full overflow-hidden">
        {featured.map((dish, idx) => (
          <div
            key={dish.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105 pointer-events-none'
            }`}
          >
            <img
              src={dish.photo || DEFAULT_FOOD_IMAGE}
              alt={dish.name}
              referrerPolicy="no-referrer"
              onError={handleImageError}
              fetchPriority={idx === currentIndex ? 'high' : 'low'}
              decoding="async"
              className="w-full h-full object-cover transform transition-transform duration-1000"
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/70 to-transparent w-full md:w-3/4" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/40" />
          </div>
        ))}

        {/* Content Box Over the Sliding Image */}
        <div className="relative z-20 h-full max-w-7xl mx-auto px-5 sm:px-8 flex flex-col justify-between py-6">
          {/* Top Tag & Slide Indicators */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Sélection du Chef
              </span>
              {currentDish.isRecommended && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/20 text-red-300 border border-red-500/40">
                  <Flame className="w-3 h-3 text-red-400" />
                  Coup de Cœur
                </span>
              )}
            </div>

            {/* Slide Index Pill */}
            <div className="px-2.5 py-1 rounded-full bg-stone-900/80 backdrop-blur-md border border-stone-700/60 text-[11px] font-mono text-stone-300">
              {currentIndex + 1} / {featured.length}
            </div>
          </div>

          {/* Center/Bottom Dish Details */}
          <div className="max-w-xl space-y-2 mt-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md line-clamp-1">
              {currentDish.name}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 line-clamp-2 drop-shadow leading-relaxed">
              {currentDish.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="text-lg sm:text-2xl font-extrabold text-amber-400 font-mono drop-shadow">
                {formatFC(currentDish.price)}
              </div>

              {currentDish.preparationTimeMinutes && (
                <div className="flex items-center gap-1 text-xs text-stone-300 bg-stone-950/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-stone-800">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentDish.preparationTimeMinutes} min</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-auto sm:ml-0">
                <button
                  onClick={() => onSelectProduct(currentDish)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-100 text-xs font-semibold backdrop-blur-md border border-stone-700 transition active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5 text-stone-400" />
                  <span>Détails</span>
                </button>
                <button
                  onClick={() => onAddToCart(currentDish, 1)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold shadow-lg shadow-amber-900/40 transition active:scale-95 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Commander</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          aria-label="Image précédente"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-stone-950/60 hover:bg-stone-900 text-stone-200 hover:text-white border border-stone-800/80 backdrop-blur-sm transition active:scale-90"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Image suivante"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-stone-950/60 hover:bg-stone-900 text-stone-200 hover:text-white border border-stone-800/80 backdrop-blur-sm transition active:scale-90"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Bottom Pagination Dots */}
        <div className="absolute bottom-2.5 right-6 z-30 flex items-center gap-1.5">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Aller au plat ${i + 1}`}
              className={`transition-all duration-300 rounded-full ${
                i === currentIndex
                  ? 'w-6 h-1.5 bg-amber-500'
                  : 'w-1.5 h-1.5 bg-stone-600/80 hover:bg-stone-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
