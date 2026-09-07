import React from 'react';
import { Utensils } from 'lucide-react';

export const SplashScreen: React.FC = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-stone-950 px-6 text-stone-100">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(245,158,11,0.16),transparent_32rem)]" />
    <div className="relative flex max-w-sm flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-400/50 bg-amber-500 text-stone-950 shadow-2xl shadow-amber-900/30 sm:h-24 sm:w-24">
        <Utensils className="h-9 w-9 sm:h-11 sm:w-11" />
      </div>
      <p className="text-3xl font-black tracking-[0.22em] text-amber-400 sm:text-4xl">UMOJA</p>
      <p className="mt-3 text-sm text-stone-300 sm:text-base">Gestion intelligente de votre restaurant</p>
      <div className="mt-9 h-1.5 w-40 overflow-hidden rounded-full bg-stone-800">
        <div className="h-full w-1/2 animate-[splash-loading_1.2s_ease-in-out_infinite] rounded-full bg-amber-500" />
      </div>
    </div>
  </div>
);
