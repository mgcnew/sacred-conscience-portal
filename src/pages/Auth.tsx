import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft, User, Calendar, Sparkles } from 'lucide-react';

const PRE_REGISTER_KEY = 'pre_register_data';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, resetPassword, signInWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'login' | 'register' | 'reset'>('login');

  // Pré-cadastro
  const [preNome, setPreNome] = useState('');
  const [preDataNascimento, setPreDataNascimento] = useState('');
  const [preErrors, setPreErrors] = useState<Record<string, string>>({});

  // Reset senha
  const [resetEmail, setResetEmail] = useState('');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  // Carrega dados salvos se existirem (usuário que estava no meio do cadastro)
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

    localStorage.setItem(PRE_REGISTER_KEY, JSON.stringify({
      nome: preNome.trim(),
      dataNascimento: preDataNascimento,
    }));
    handleGoogleLogin();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) { toast.error('Digite seu email'); return; }
    setIsLoading(true);
    const { error } = await resetPassword(resetEmail);
    setIsLoading(false);
    if (error) {
      toast.error('Erro', { description: error.message });
    } else {
      toast.success('Email enviado', { description: 'Verifique sua caixa de entrada.' });
      setView('login');
      setResetEmail('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">

        {/* Logo + Título */}
        <div className="text-center space-y-3">
          <div className="w-24 h-24 mx-auto">
            <img src="/logo-full.png" alt="Consciência Divinal" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-medium text-foreground">Consciência Divinal</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Portal de Medicinas e Cerimônias Sagradas</p>
          </div>
        </div>

        {/* ── VIEW: LOGIN ── */}
        {view === 'login' && (
          <div className="space-y-4">
            {/* Frase */}
            <div className="text-center px-2">
              <p className="text-amber-300/70 italic text-sm leading-relaxed">
                "Quem sabe o Criador não trouxe você aqui pra tomar uma xícara de chá conosco"
              </p>
            </div>

            {/* Card login */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg space-y-5">
              <div className="text-center">
                <h2 className="font-display text-lg font-medium">Bem-vindo de volta</h2>
                <p className="text-muted-foreground text-sm mt-1">Entre com sua conta Google para acessar o portal</p>
              </div>

              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-12 bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 shadow-sm text-base font-medium"
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5 shrink-0" viewBox="0 0 488 512" xmlns="http://www.w3.org/2000/svg">
                      <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                    </svg>
                    Entrar com Google
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/40" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground">primeira vez aqui?</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setView('register')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 text-sm font-medium transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Criar minha conta
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { emoji: '📋', label: 'Ficha de Anamnese' },
                { emoji: '🌿', label: 'Medicinas Sagradas' },
                { emoji: '💬', label: 'Partilhas' },
              ].map(({ emoji, label }) => (
                <div key={label} className="p-3 rounded-xl bg-card/50 border border-border/30">
                  <span className="text-xl block mb-1">{emoji}</span>
                  <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              Ao continuar, você concorda com nossos{' '}
              <span className="underline underline-offset-2 cursor-pointer">termos de uso</span>
            </p>
          </div>
        )}

        {/* ── VIEW: REGISTRO ── */}
        {view === 'register' && (
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg space-y-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setView('login'); setPreErrors({}); }}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="font-display text-lg font-medium leading-tight">Criar conta</h2>
                <p className="text-muted-foreground text-xs mt-0.5">Precisamos de algumas informações básicas</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pre-nome" className="text-sm flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  Nome Completo
                </Label>
                <Input
                  id="pre-nome"
                  type="text"
                  placeholder="Seu nome completo"
                  value={preNome}
                  onChange={(e) => { setPreNome(e.target.value); setPreErrors(prev => ({ ...prev, nome: '' })); }}
                  className={preErrors.nome ? 'border-destructive' : ''}
                  autoFocus
                />
                {preErrors.nome && <p className="text-xs text-destructive">{preErrors.nome}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pre-data" className="text-sm flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  Data de Nascimento
                </Label>
                <Input
                  id="pre-data"
                  type="date"
                  value={preDataNascimento}
                  onChange={(e) => { setPreDataNascimento(e.target.value); setPreErrors(prev => ({ ...prev, dataNascimento: '' })); }}
                  className={preErrors.dataNascimento ? 'border-destructive' : ''}
                />
                {preErrors.dataNascimento && <p className="text-xs text-destructive">{preErrors.dataNascimento}</p>}
              </div>
            </div>

            <Button
              type="button"
              onClick={handlePreRegister}
              disabled={isLoading}
              className="w-full h-11 gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 488 512" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                  </svg>
                  Continuar com Google
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Essas informações são necessárias para seu cadastro e atendimento personalizado.
            </p>
          </div>
        )}

        {/* ── VIEW: RESET SENHA ── */}
        {view === 'reset' && (
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg space-y-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setView('login')}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="font-display text-lg font-medium leading-tight">Recuperar acesso</h2>
                <p className="text-muted-foreground text-xs mt-0.5">Enviaremos um link para seu email</p>
              </div>
            </div>

            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6 text-primary" />
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reset-email" className="text-sm">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar link de recuperação'}
              </Button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Auth;
