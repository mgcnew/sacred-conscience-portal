import React, { useState, useRef, useEffect } from 'react';
import { Eye, Send, Sparkles, RotateCcw, ChevronDown, Share2, Link2, MessageSquareText, Lock, BookHeart, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { APP_CONFIG } from '@/config/app';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTemConsagracao } from '@/hooks/queries/useMyInscriptions';
import { useCreateDiarioEntrada } from '@/hooks/queries/useInsights';
import { ROUTES } from '@/constants';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const WELCOME_MESSAGE: Message = {
  role: 'model',
  content:
    'Bem-vindo ao espaço do Guardião das Visões.\n\nEste é um lugar de escuta e reflexão — aqui você pode compartilhar livremente as visões que vivenciou durante uma cerimônia, sonhos que te marcaram ou imagens que surgiram em estados de contemplação.\n\nJuntos, exploraremos os símbolos e o que eles podem estar sussurrando para você.\n\nO que deseja compartilhar?',
};

const SUGGESTIONS = [
  'Vi uma serpente que me envolvia em espirais de luz...',
  'Sonhei com uma floresta que falava comigo...',
  'Apareceu um jaguar olhando nos meus olhos...',
  'Vi águas escuras que se tornaram um espelho...',
];

const GuardiaoVisoes: React.FC = () => {
  const { user, isAdmin, isGuardiao } = useAuth();
  const navigate = useNavigate();
  const { data: temConsagracao, isLoading: isCheckingAcesso } = useTemConsagracao(user?.id);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Busca o primeiro nome do perfil
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.full_name) {
          setUserName(data.full_name.split(' ')[0]);
        }
      });
  }, [user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const history = messages.filter((m) => m !== WELCOME_MESSAGE);

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'guardiao-visoes',
        { body: { message: trimmed, history, userName, isFirstMessage: history.length === 0 } }
      );

      if (fnError) {
        // Tenta extrair o corpo da resposta de erro
        let detail = fnError.message;
        try {
          const body = await (fnError as any).context?.json?.();
          if (body?.error) detail = body.error;
        } catch {}
        console.error('FnError detail:', detail);
        throw new Error(detail);
      }
      if (!data?.reply) {
        console.error('Data sem reply:', data);
        throw new Error(data?.error || 'Resposta vazia');
      }

      setMessages((prev) => [
        ...prev,
        { role: 'model', content: data.reply },
      ]);
    } catch (err: any) {
      console.error('Erro Guardião:', err);
      const msg = err.message || '';
      if (msg.includes('RATE_LIMIT') || msg.includes('429')) {
        setError('RATE_LIMIT');
      } else {
        setError(msg || 'Erro desconhecido.');
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput('');
    setError(null);
  };

  const [shareOpen, setShareOpen] = useState(false);
  const [savedToInsights, setSavedToInsights] = useState(false);
  const createEntrada = useCreateDiarioEntrada();

  const handleSalvarDiario = async () => {
    if (!user?.id || messages.length <= 1) return;
    const conversa = messages
      .filter(m => m !== WELCOME_MESSAGE)
      .map(m => `${m.role === 'user' ? '🧑 Você' : '🌿 Guardião'}:\n${m.content}`)
      .join('\n\n─────\n\n');
    await createEntrada.mutateAsync({
      userId: user.id,
      conteudo: conversa,
      humor: null,
      data: new Date().toISOString().split('T')[0],
      tipo: 'guardiao',
    });
    setSavedToInsights(true);
    toast.success('Conversa salva no diário!', {
      description: 'Acesse em Minha Jornada para revisitar.',
      action: { label: 'Ver agora', onClick: () => navigate(ROUTES.INSIGHTS) },
    });
  };

  const handleSharePagina = async () => {
    setShareOpen(false);
    const url = `${window.location.origin}/guardiao-visoes`;
    const text = `🌿 *Guardião das Visões*\n\nSe você viveu visões em cerimônia ou tem sonhos que querem ser compreendidos, temos um espaço sagrado para isso no app Consciência Divinal.\n\nO Guardião das Visões interpreta símbolos, arquétipos e imagens com sabedoria xamânica — de forma acolhedora e gratuita.\n\nAcesse aqui 👇`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Guardião das Visões — Consciência Divinal', text, url }); } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success('Link copiado!');
    }
  };

  const handleShareConversa = async () => {
    setShareOpen(false);
    const conversa = messages
      .filter(m => m !== WELCOME_MESSAGE)
      .map(m => `${m.role === 'user' ? '🧑 Eu' : '🌿 Guardião'}:\n${m.content}`)
      .join('\n\n');

    if (!conversa.trim()) {
      toast.error('Nenhuma conversa para compartilhar ainda.');
      return;
    }

    const texto = `🌿 *Conversa com o Guardião das Visões*\n\n${conversa}\n\n— Consciência Divinal`;

    if (navigator.share) {
      try { await navigator.share({ title: 'Conversa com o Guardião das Visões', text: texto }); } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(texto);
      toast.success('Conversa copiada!');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const temAcesso = isAdmin || isGuardiao || temConsagracao === true;

  if (isCheckingAcesso) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!temAcesso) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center text-center gap-6">
        <div className="relative w-20 h-20 rounded-3xl bg-primary/12 flex items-center justify-center">
          <Eye className="w-9 h-9 text-sacred-gold/60" />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2 max-w-sm">
          <h1 className="font-display text-xl font-bold text-foreground">
            Guardião das Visões
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Este espaço é reservado para quem já vivenciou ao menos uma cerimônia conosco.
          </p>
        </div>

        <div className="bg-sacred-gold/8 border border-sacred-gold/20 rounded-2xl px-6 py-5 max-w-sm space-y-3 text-left">
          <p className="text-sm text-foreground/80 leading-relaxed">
            🌿 O Guardião das Visões é um lugar sagrado de integração — ele acolhe visões, sonhos e símbolos que emergem da experiência com as medicinas.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ao participar de uma cerimônia e ter sua presença confirmada, este espaço se abrirá para você.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button onClick={() => navigate(ROUTES.CERIMONIAS)} className="w-full gap-2">
            <Sparkles className="w-4 h-4" />
            Ver cerimônias disponíveis
          </Button>
          <Button variant="ghost" onClick={() => navigate(ROUTES.HOME)} className="w-full text-muted-foreground">
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-9rem)] lg:h-[calc(100dvh-3.5rem)] max-w-2xl mx-auto px-4">

      {/* Header */}
      <div className="flex items-center justify-between py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner">
            <Eye className="w-5 h-5 text-sacred-gold" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
          </div>
          <div>
            <h1 className="font-display font-bold text-base text-foreground leading-none">
              Guardião das Visões
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Interpretação simbólica e espiritual
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Popover open={shareOpen} onOpenChange={setShareOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted/50">
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compartilhar</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-1.5">
              <button
                onClick={handleSharePagina}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-left"
              >
                <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium leading-tight">Compartilhar página</p>
                  <p className="text-[11px] text-muted-foreground">Convite para o grupo</p>
                </div>
              </button>
              <button
                onClick={handleShareConversa}
                disabled={messages.length <= 1}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MessageSquareText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium leading-tight">Compartilhar conversa</p>
                  <p className="text-[11px] text-muted-foreground">Exportar este diálogo</p>
                </div>
              </button>
            </PopoverContent>
          </Popover>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted/50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nova conversa</span>
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-sacred-gold/8 border border-sacred-gold/15 mb-3 shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-sacred-gold shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          As interpretações são reflexões simbólicas — não verdades absolutas. A sabedoria verdadeira vive dentro de você.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 py-2 scrollbar-mystical">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.role === 'model' && (
              <div className="w-7 h-7 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 mr-2 mt-1">
                <Eye className="w-3.5 h-3.5 text-sacred-gold" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-muted/60 text-foreground rounded-tl-sm border border-border/30'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 mr-2 mt-1">
              <Eye className="w-3.5 h-3.5 text-sacred-gold" />
            </div>
            <div className="bg-muted/60 border border-border/30 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-sacred-gold/60 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          error === 'RATE_LIMIT' ? (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 mr-2 mt-1">
                <Eye className="w-3.5 h-3.5 text-sacred-gold" />
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3 bg-muted/60 border border-border/30 text-sm leading-relaxed text-foreground/80">
                Neste momento muitas almas estão buscando orientação ao mesmo tempo. O Guardião precisa de um instante de silêncio — tente novamente em alguns momentos. 🌿
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-destructive/80 py-2 px-4 bg-destructive/5 rounded-xl border border-destructive/15">
              {error}
            </div>
          )
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions — só na primeira interação */}
      {messages.length === 1 && !loading && (
        <div className="shrink-0 py-3">
          <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
            <ChevronDown className="w-3 h-3" /> Exemplos para começar
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s)}
                className="shrink-0 text-xs px-3 py-2 rounded-xl bg-muted/50 border border-border/40 hover:bg-muted hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground text-left max-w-[200px] leading-relaxed"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Salvar no diário */}
      {messages.length > 1 && (
        <div className="shrink-0 pt-1">
          <button
            onClick={handleSalvarDiario}
            disabled={savedToInsights || createEntrada.isPending}
            className={cn(
              'w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all text-xs',
              savedToInsights
                ? 'bg-primary/8 border-primary/20 text-primary cursor-default'
                : 'bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted hover:border-primary/30 hover:text-foreground'
            )}
          >
            {savedToInsights
              ? <Check className="w-4 h-4 shrink-0 text-primary" />
              : <BookHeart className="w-4 h-4 shrink-0" />
            }
            <span>
              {savedToInsights
                ? 'Conversa salva no diário'
                : createEntrada.isPending ? 'Salvando...' : 'Salvar esta conversa no diário'
              }
            </span>
          </button>
        </div>
      )}

      {/* Contato com o Mestre */}
      {messages.length > 1 && (
        <div className="shrink-0 pb-2">
          <a
            href={`https://wa.me/${APP_CONFIG.contacts.whatsappLider}?text=${encodeURIComponent(`Olá Mestre Kenay, ${userName ? `sou ${userName}, ` : ''}fui direcionado pelo Guardião das Visões do aplicativo Consciência Divinal. Tenho dúvidas sobre minhas visões e gostaria de conversar.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 hover:border-green-500/35 transition-all group"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-green-500 shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
              Ainda com dúvidas sobre suas visões?{' '}
              <span className="font-medium text-green-600 dark:text-green-400">Converse com o Mestre Kenay</span>
            </p>
          </a>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 pt-2 pb-3">
        <div className="flex items-end gap-2 p-2 rounded-2xl border border-border/50 bg-muted/30 focus-within:border-primary/40 focus-within:bg-muted/50 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(); }}
            onKeyDown={handleKeyDown}
            placeholder="Descreva sua visão ou sonho..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none px-2 py-1.5 leading-relaxed scrollbar-none"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all',
              input.trim() && !loading
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="hidden lg:block text-[10px] text-muted-foreground/50 text-center mt-1.5">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>

    </div>
  );
};

export default GuardiaoVisoes;
