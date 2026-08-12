import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Sparkles, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'notification-prompt-dismissed';
const MIN_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export const NotificationPermission: React.FC = () => {
  const { permission, isSupported, requestPermission } = usePushNotifications();
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!isSupported || permission === 'granted') return;
    // O componente vive fora do ProtectedRoute, então sem esta linha o pedido
    // de permissão aparecia na tela de login, para quem ainda nem tem conta —
    // e uma recusa ali fica gravada no navegador e vale para sempre.
    if (!user) return;

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    const recentlyDismissed = dismissed && Date.now() - parseInt(dismissed) < MIN_INTERVAL_MS;
    if (recentlyDismissed) return;

    const timer = setTimeout(() => setShowPrompt(true), 5000);
    return () => clearTimeout(timer);
  }, [isSupported, permission, user]);

  const dismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  };

  const handleEnable = async () => {
    setRequesting(true);
    const granted = await requestPermission();
    setRequesting(false);
    if (granted) {
      dismiss();
    } else {
      setDenied(true);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 md:left-auto md:right-4 md:w-[380px] animate-in slide-in-from-bottom-4 duration-500">
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-xl shadow-black/20">
        {/* Glow decorativo */}

        {/* Botão fechar */}
        <button
          onClick={dismiss}
          aria-label="Dispensar aviso de notificações"
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-1 z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5">
          {!denied ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-primary" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground leading-tight">
                    Fique por dentro das cerimônias
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Templo Consciência Divinal</p>
                </div>
              </div>

              {/* Texto */}
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Receba avisos sobre novas cerimônias sagradas, vagas disponíveis e mensagens especiais do templo — direto no seu dispositivo.
              </p>

              {/* Bullets */}
              <div className="space-y-1.5 mb-5">
                {[
                  'Novas datas de cerimônias',
                  'Avisos de vagas disponíveis',
                  'Mensagens do facilitador',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
                    <span className="text-xs text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>

              {/* Botões */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleEnable}
                  disabled={requesting}
                  className="w-full gap-2 font-semibold"
                >
                  <Bell className="w-4 h-4" />
                  {requesting ? 'Aguardando permissão…' : 'Sim, quero me conectar'}
                </Button>
                <button
                  onClick={dismiss}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  Talvez depois
                </button>
              </div>
            </>
          ) : (
            /* Estado: permissão negada no browser */
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <BellOff className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Notificações bloqueadas</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">É necessário activar nas definições</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Para activar, abre as <strong>Definições do browser</strong>, procura as permissões deste site e permite as notificações.
              </p>
              <Button variant="outline" onClick={dismiss} className="w-full">
                Entendido
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPermission;
