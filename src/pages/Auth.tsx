import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, resetPassword, signInWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'login' | 'reset'>('login');
  const [resetEmail, setResetEmail] = useState('');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // Seguir tema do sistema na página de auth
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.remove('dark', 'light');
    root.classList.add(systemDark ? 'dark' : 'light');
    return () => {
      root.classList.remove('dark', 'light');
      root.classList.add(hadDark ? 'dark' : 'light');
    };
  }, []);

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  // Reseta loading quando o browser restaura a página do bfcache
  // (usuário cancelou no Google e voltou com o botão Voltar)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setIsLoading(false);
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error('Erro no login com Google', { description: error.message });
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) { toast.error('Digite seu email'); return; }
    setIsLoading(true);
    const { error } = await resetPassword(resetEmail);
    setIsLoading(false);
    if (error) toast.error('Erro', { description: error.message });
    else {
      toast.success('Email enviado', { description: 'Verifique sua caixa de entrada.' });
      setView('login');
      setResetEmail('');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background px-4 py-10">

      {/* Orbs decorativos de fundo */}

      <div className="relative w-full max-w-sm animate-fade-in">

        {/* Emblema + Título. É a única tela em que o emblema tem a atenção
            toda; sem sombra em volta, o desenho já tem contorno próprio. */}
        <div className="text-center mb-7">
          <img
            src="/emblema.png"
            alt="Consciência Divinal"
            width={112}
            height={112}
            className="w-28 h-28 mx-auto mb-4 object-contain"
          />
          <h1 className="font-display text-2xl font-semibold tracking-wide text-foreground">
            Consciência Divinal
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Portal de Medicinas e Cerimônias Sagradas
          </p>
        </div>

        {/* ── VIEW: LOGIN ── */}
        {view === 'login' && (
          <>
            <div className="rounded-2xl border border-border/60 bg-card/90 dark:bg-card/80 backdrop-blur-sm shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden">
              <div className="h-0.5 w-full bg-primary/40" />

              <div className="p-6 space-y-5">
                <div className="space-y-1 text-center">
                  <h2 className="font-display text-lg font-medium text-foreground">Bem-vindo(a)</h2>
                  <p className="text-muted-foreground text-sm">Entre com sua conta para acessar o portal</p>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-xl bg-white dark:bg-white/95 text-gray-700 font-medium text-sm border border-gray-200 dark:border-border hover:bg-gray-50 hover:shadow-md active:scale-[0.99] transition-all duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    : <><GoogleIcon /><span>Continuar com Google</span></>
                  }
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => setView('reset')}
                    className="hover:text-foreground transition-colors hover:underline underline-offset-2"
                  >
                    Esqueci meu acesso
                  </button>
                </p>
              </div>
            </div>

            {/* A frase é a única voz do templo nesta tela; estava a 2,6:1,
                clara demais para ser lida. Agora usa a tinta dourada. */}
            <p className="text-center text-sacred-gold-ink italic text-[13px] leading-relaxed mt-5 px-4">
              "Quem sabe o Criador não trouxe você aqui pra tomar uma xícara de chá conosco"
            </p>

            <p className="text-center text-xs text-muted-foreground mt-3">
              Ao continuar, você concorda com nossos termos de uso e política de privacidade.
            </p>
          </>
        )}

        {/* ── VIEW: RESET SENHA ── */}
        {view === 'reset' && (
          <div className="rounded-2xl border border-border/60 bg-card/90 dark:bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
            <div className="h-0.5 w-full bg-primary/40" />
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setView('login')} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="font-display text-lg font-medium">Recuperar acesso</h2>
                  <p className="text-muted-foreground text-xs mt-0.5">Enviaremos um link para seu email</p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email" className="text-sm">Email</Label>
                  <Input id="reset-email" type="email" placeholder="seu@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} disabled={isLoading} autoFocus />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar link de recuperação'}
                </Button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Auth;
