import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, User, Calendar, Mail } from 'lucide-react';

const PRE_REGISTER_KEY = 'pre_register_data';

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-xs text-destructive mt-1">{message}</p> : null;

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, resetPassword, signInWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'login' | 'register' | 'reset'>('login');
  const [preNome, setPreNome] = useState('');
  const [preDataNascimento, setPreDataNascimento] = useState('');
  const [preErrors, setPreErrors] = useState<Record<string, string>>({});
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

  useEffect(() => {
    const saved = localStorage.getItem(PRE_REGISTER_KEY);
    if (saved) {
      try {
        const { nome, dataNascimento } = JSON.parse(saved);
        if (nome) setPreNome(nome);
        if (dataNascimento) setPreDataNascimento(dataNascimento);
      } catch { /* ignore */ }
    }
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error('Erro no login com Google', { description: error.message });
      setIsLoading(false);
    }
  };

  const handlePreRegister = () => {
    const errors: Record<string, string> = {};
    if (!preNome || preNome.trim().length < 3) errors.nome = 'Nome deve ter pelo menos 3 caracteres';
    if (!preDataNascimento) errors.dataNascimento = 'Data de nascimento é obrigatória';
    if (Object.keys(errors).length > 0) { setPreErrors(errors); return; }
    localStorage.setItem(PRE_REGISTER_KEY, JSON.stringify({ nome: preNome.trim(), dataNascimento: preDataNascimento }));
    handleGoogleLogin();
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
      <div aria-hidden className="pointer-events-none select-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 dark:bg-primary/8 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-amber-400/8 dark:bg-amber-500/6 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-primary/8 dark:bg-primary/6 blur-3xl" />
        {/* Grade de pontos sutil */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative w-full max-w-sm space-y-5 animate-fade-in">

        {/* Logo + Título */}
        <div className="text-center space-y-2">
          {/* Glow atrás da logo */}
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-110" />
            <div className="relative w-28 h-28 mx-auto">
              <img src="/logo-full.png" alt="Consciência Divinal" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
          </div>
          <div className="pt-1">
            <h1 className="font-display text-2xl font-semibold tracking-wide text-foreground">
              Consciência Divinal
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Portal de Medicinas e Cerimônias Sagradas
            </p>
          </div>
        </div>

        {/* ── VIEW: LOGIN ── */}
        {view === 'login' && (
          <>
            {/* Frase inspiracional */}
            <div className="text-center px-2 py-1">
              <p className="text-[hsl(38,70%,45%)] dark:text-amber-300/80 italic text-[13px] leading-relaxed font-light">
                "Quem sabe o Criador não trouxe você aqui<br />pra tomar uma xícara de chá conosco"
              </p>
            </div>

            {/* Card principal */}
            <div className="rounded-2xl border border-border/60 bg-card/90 dark:bg-card/80 backdrop-blur-sm shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden">
              {/* Linha decorativa no topo */}
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

              <div className="p-6 space-y-4">
                <div className="space-y-1 text-center">
                  <h2 className="font-display text-lg font-medium text-foreground">Bem-vindo de volta</h2>
                  <p className="text-muted-foreground text-sm">Entre com sua conta para acessar o portal</p>
                </div>

                {/* Google button — destaque total */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-xl bg-white dark:bg-white/95 text-gray-700 font-medium text-sm border border-gray-200 hover:bg-gray-50 hover:shadow-md active:scale-[0.99] transition-all duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-gray-500" /> : <><GoogleIcon /><span>Entrar com Google</span></>}
                </button>

                {/* Divisor */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-[11px] text-muted-foreground uppercase tracking-widest">Novo por aqui?</span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>

                {/* Criar conta */}
                <button
                  type="button"
                  onClick={() => setView('register')}
                  className="w-full h-10 rounded-xl border border-primary/40 text-primary hover:bg-primary/5 text-sm font-medium transition-colors"
                >
                  Criar minha conta
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {[
                { emoji: '📋', label: 'Anamnese' },
                { emoji: '🌿', label: 'Medicinas' },
                { emoji: '🌙', label: 'Cerimônias' },
                { emoji: '💬', label: 'Partilhas' },
              ].map(({ emoji, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/70 dark:bg-card/50 border border-border/40 text-xs text-muted-foreground backdrop-blur-sm">
                  <span>{emoji}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-[11px] text-muted-foreground/70">
              Ao continuar, você concorda com nossos termos de uso e política de privacidade.
            </p>
          </>
        )}

        {/* ── VIEW: CADASTRO ── */}
        {view === 'register' && (
          <div className="rounded-2xl border border-border/60 bg-card/90 dark:bg-card/80 backdrop-blur-sm shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden">
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
            <div className="p-6 space-y-5">

              {/* Header com voltar */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setView('login'); setPreErrors({}); }}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="font-display text-lg font-medium leading-tight">Criar conta</h2>
                  <p className="text-muted-foreground text-xs mt-0.5">Algumas informações para começar</p>
                </div>
              </div>

              {/* Campos */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pre-nome" className="text-sm flex items-center gap-1.5 text-foreground/80">
                    <User className="w-3.5 h-3.5" />Nome Completo
                  </Label>
                  <Input
                    id="pre-nome"
                    type="text"
                    placeholder="Seu nome completo"
                    value={preNome}
                    autoFocus
                    onChange={(e) => { setPreNome(e.target.value); setPreErrors(p => ({ ...p, nome: '' })); }}
                    className={preErrors.nome ? 'border-destructive' : ''}
                  />
                  <FieldError message={preErrors.nome} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pre-data" className="text-sm flex items-center gap-1.5 text-foreground/80">
                    <Calendar className="w-3.5 h-3.5" />Data de Nascimento
                  </Label>
                  <Input
                    id="pre-data"
                    type="date"
                    value={preDataNascimento}
                    onChange={(e) => { setPreDataNascimento(e.target.value); setPreErrors(p => ({ ...p, dataNascimento: '' })); }}
                    className={preErrors.dataNascimento ? 'border-destructive' : ''}
                  />
                  <FieldError message={preErrors.dataNascimento} />
                </div>
              </div>

              {/* Botão */}
              <button
                type="button"
                onClick={handlePreRegister}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-xl bg-white dark:bg-white/95 text-gray-700 font-medium text-sm border border-gray-200 hover:bg-gray-50 hover:shadow-md active:scale-[0.99] transition-all duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-gray-500" /> : <><GoogleIcon /><span>Continuar com Google</span></>}
              </button>

              <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
                Essas informações são necessárias para seu cadastro e atendimento personalizado.
              </p>
            </div>
          </div>
        )}

        {/* ── VIEW: RESET SENHA ── */}
        {view === 'reset' && (
          <div className="rounded-2xl border border-border/60 bg-card/90 dark:bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
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
