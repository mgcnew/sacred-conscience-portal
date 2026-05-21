import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CHECK_INTERVAL_MS = 60 * 1000; // verifica nova versão a cada 1 minuto

const PWAUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      setInterval(async () => {
        if (!registration.installing) {
          try {
            const res = await fetch(swUrl, { cache: 'no-store' });
            if (res.status === 200) await registration.update();
          } catch {
            // sem conexão — ignora
          }
        }
      }, CHECK_INTERVAL_MS);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[60] lg:bottom-4 lg:left-auto lg:right-4 lg:w-80 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 bg-primary text-primary-foreground px-4 py-3 rounded-2xl shadow-lg shadow-primary/20">
        <Leaf className="w-4 h-4 shrink-0 opacity-80" />
        <p className="text-sm font-medium flex-1 leading-tight">
          Nova versão disponível
        </p>
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0 h-8 text-xs font-semibold gap-1.5 rounded-xl"
          onClick={() => updateServiceWorker(true)}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar
        </Button>
      </div>
    </div>
  );
};

export default PWAUpdatePrompt;
