import React from 'react';
import { Utensils } from 'lucide-react';

export const SplashScreen: React.FC = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-stone-950 px-6 text-stone-100">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(245,158,11,0.14),transparent_36rem)]" />
    <div className="relative flex max-w-md flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500 text-stone-950 shadow-2xl shadow-amber-900/35 sm:h-24 sm:w-24">
        <Utensils className="h-9 w-9 sm:h-11 sm:w-11" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-amber-500/90">
        Guangzhou · Yuexiu
      </p>
      <p className="mt-3 text-2xl font-black uppercase tracking-[0.12em] text-amber-400 sm:text-3xl">
        Umoja Malewa
      </p>
      <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.28em] text-stone-400">
        Restaurant
      </p>
      <p className="mt-5 text-sm text-stone-400">Delivery / Livraison · Call us</p>
      <div className="mt-10 h-1.5 w-44 overflow-hidden rounded-full bg-stone-800">
        <div className="h-full w-1/2 animate-[splash-loading_1.2s_ease-in-out_infinite] rounded-full bg-amber-500" />
      </div>
    </div>
  </div>
);
