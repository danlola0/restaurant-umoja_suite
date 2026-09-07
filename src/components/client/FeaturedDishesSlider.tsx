import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { DEFAULT_FOOD_IMAGE, formatFC, handleImageError } from '../../utils/formatters';
import { Sparkles, Flame, Clock, ChevronLeft, ChevronRight, ShoppingBag, Eye } from 'lucide-react';
import { useI18n } from '../../context/LanguageContext';

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
  const { t, translateDish, translateDishDescription } = useI18n();
  const featured = React.useMemo(() => {
    const recs = products.filter(p => p.available && p.photo);
    if (recs.length === 0) return products.filter(p => p.available).slice(0, 5);
    return [...recs].sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0)).slice(0, 8);
  }, [products]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (featured.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featured.length);
    }, 4500);
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
      className="relative w-full overflow-hidden rounded-3xl border border-amber-500/20 bg-stone-900 shadow-2xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-44 w-full overflow-hidden bg-stone-950 sm:h-52 md:h-60 lg:h-64">
        {featured.map((dish, idx) => (
          <div
            key={dish.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentIndex ? 'z-10 scale-100 opacity-100' : 'pointer-events-none z-0 scale-105 opacity-0'
            }`}
          >
            <img
              src={dish.photo || DEFAULT_FOOD_IMAGE}
              alt={translateDish(dish.name)}
              referrerPolicy="no-referrer"
              onError={handleImageError}
              fetchPriority={idx === currentIndex ? 'high' : 'low'}
              decoding="async"
              className="h-full w-full object-cover object-center transition-transform duration-[1200ms] group-hover:scale-105"
            />
            <div className="absolute inset-0 w-full bg-gradient-to-r from-stone-950 via-stone-950/70 to-transparent md:w-3/4" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/40" />
          </div>
        ))}

        <div className="relative z-20 flex h-full flex-col justify-between px-3 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-950 shadow-lg shadow-amber-500/30">
                <Sparkles className="w-3 h-3" />
                {t('featuredTonight')}
              </span>
              {currentDish.isRecommended && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                  <Flame className="w-3 h-3 text-red-400" />
                  {t('favorite')}
                </span>
              )}
            </div>
            <div className="rounded-full border border-stone-700/60 bg-stone-900/80 px-2 py-0.5 font-mono text-[10px] text-stone-300 backdrop-blur-md">
              {currentIndex + 1} / {featured.length}
            </div>
          </div>

          <div className="mt-auto max-w-lg space-y-1.5">
            <h2 className="line-clamp-1 text-lg font-black tracking-tight text-white drop-shadow-md sm:text-xl md:text-2xl">
              {translateDish(currentDish.name)}
            </h2>
            <p className="hidden line-clamp-1 text-xs leading-relaxed text-stone-300 drop-shadow sm:block">
              {translateDishDescription(currentDish.name, currentDish.description)}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <div className="font-mono text-base font-extrabold text-amber-400 drop-shadow sm:text-xl">
                {formatFC(currentDish.price)}
              </div>
              {currentDish.preparationTimeMinutes && (
                <div className="flex items-center gap-1 rounded-full border border-stone-800 bg-stone-950/60 px-2 py-1 text-[10px] text-stone-300 backdrop-blur-sm">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{currentDish.preparationTimeMinutes} min</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSelectProduct(currentDish)}
                  className="hidden min-h-9 items-center gap-1 rounded-lg border border-stone-700 bg-stone-800/90 px-3 py-1.5 text-[11px] font-semibold text-stone-100 backdrop-blur-md transition hover:bg-stone-700 active:scale-95 sm:flex"
                >
                  <Eye className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t('viewDish')}</span>
                </button>
                <button
                  onClick={() => onAddToCart(currentDish, 1)}
                  className="flex min-h-9 cursor-pointer items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-extrabold text-stone-950 shadow-lg shadow-amber-900/40 transition hover:bg-amber-400 active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{t('orderNow')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handlePrev}
          aria-label={t('prevImage')}
          className="absolute left-2 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-stone-800/80 bg-stone-950/50 text-stone-200 backdrop-blur-sm transition hover:bg-stone-900 hover:text-white active:scale-90 sm:h-9 sm:w-9"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={handleNext}
          aria-label={t('nextImage')}
          className="absolute right-2 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-stone-800/80 bg-stone-950/50 text-stone-200 backdrop-blur-sm transition hover:bg-stone-900 hover:text-white active:scale-90 sm:h-9 sm:w-9"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="absolute bottom-2 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1">
          {featured.map((dish, i) => (
            <button
              key={dish.id}
              onClick={() => setCurrentIndex(i)}
              aria-label={`${t('goToDish')} ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex ? 'h-1.5 w-5 bg-amber-500' : 'h-1.5 w-1.5 bg-stone-500/80 hover:bg-stone-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
