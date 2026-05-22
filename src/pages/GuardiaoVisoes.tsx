import React, { useState, useRef, useEffect } from 'react';
import { Eye, Send, Sparkles, RotateCcw, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

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
  const { user } = useAuth();
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

  // Trava o scroll externo da página enquanto o chat está aberto
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

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
      setError(err.message || 'Erro desconhecido. Veja o console para detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput('');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-11rem)] lg:h-[calc(100dvh-3.5rem)] max-w-2xl mx-auto px-4">

      {/* Header */}
      <div className="flex items-center justify-between py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600/30 to-primary/20 flex items-center justify-center shadow-inner">
            <Eye className="w-5 h-5 text-violet-400" />
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
        <button
          onClick={reset}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted/50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Nova conversa
        </button>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-violet-500/8 border border-violet-500/15 mb-3 shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
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
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600/30 to-primary/20 flex items-center justify-center shrink-0 mr-2 mt-1">
                <Eye className="w-3.5 h-3.5 text-violet-400" />
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
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600/30 to-primary/20 flex items-center justify-center shrink-0 mr-2 mt-1">
              <Eye className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="bg-muted/60 border border-border/30 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-violet-400/60 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center text-xs text-destructive/80 py-2 px-4 bg-destructive/5 rounded-xl border border-destructive/15">
            {error}
          </div>
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
        <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>

    </div>
  );
};

export default GuardiaoVisoes;
