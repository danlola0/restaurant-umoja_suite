import React, { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallAppButton: React.FC = () => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    if (standalone) {
      setInstalled(true);
      return;
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const handleClick = async () => {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
        setInstallEvent(null);
      }
      return;
    }
    if (isIos) {
      setIosHint(true);
      return;
    }
    window.alert('Ouvrez le menu du navigateur puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void handleClick()}
        className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2 py-1.5 text-[11px] font-bold text-amber-300 transition hover:bg-amber-500/25"
        title="Installer l’application sur cet appareil"
      >
        <Smartphone className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Installer l’application</span>
        <Download className="h-3.5 w-3.5 sm:hidden" />
      </button>
      {iosHint && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-stone-700 bg-stone-900 p-3 text-[11px] text-stone-300 shadow-xl">
          Sur iPhone / iPad : touchez Partager, puis « Sur l’écran d’accueil ».
          <button type="button" className="mt-2 block text-amber-400" onClick={() => setIosHint(false)}>OK</button>
        </div>
      )}
    </div>
  );
};
