import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft, ChevronRight, ArrowLeft, Settings, Type, BookOpen, List,
  Bookmark, BookmarkPlus, StickyNote, Plus, Trash2, Edit2, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants';
import { toast } from 'sonner';
import type { Produto, BibliotecaUsuario, EbookPessoal } from '@/types';
import EpubReader, {
  type EpubReaderHandle, type EpubTocItem, type EpubPosicao,
} from '@/components/biblioteca/EpubReader';
import PdfReader from '@/components/biblioteca/PdfReader';
import {
  useMarcadores, useCreateMarcador, useDeleteMarcador,
  useAnotacoes, useCreateAnotacao, useUpdateAnotacao, useDeleteAnotacao,
  useConfigLeitura, useUpsertConfigLeitura, useAcessoLivro,
} from '@/hooks/queries/useBiblioteca';

const READING_THEMES = {
  light: { bg: '#FFFFFF', text: '#1a1a1a', name: 'Claro' },
  sepia: { bg: '#F4ECD8', text: '#5B4636', name: 'Sépia' },
  dark: { bg: '#1a1a1a', text: '#E0E0E0', name: 'Escuro' },
};

type ReadingTheme = keyof typeof READING_THEMES;

/** De onde veio o livro: uma compra na loja ou um arquivo que o usuário subiu. */
type Origem = 'compra' | 'upload';

/** Tempo parado até os controles sumirem sozinhos e sobrar só o texto. */
const OCULTAR_CONTROLES_MS = 4000;

type SentinelaWakeLock = { release: () => Promise<void> };
type NavigatorComWakeLock = Navigator & {
  wakeLock?: { request: (tipo: 'screen') => Promise<SentinelaWakeLock> };
};

/** Formatos que abrem aqui dentro. O resto não tem leitor. */
type Formato = 'epub' | 'pdf' | 'outro';

interface LivroAberto {
  /** id em biblioteca_usuario (compra) ou em ebooks_pessoais (upload). */
  registroId: string;
  titulo: string;
  arquivoUrl: string | null;
  formato: Formato;
  posicaoSalva: number;
  cfiSalvo: string | null;
}

const detectarFormato = (url: string | null, tipo?: string | null): Formato => {
  const t = tipo?.toLowerCase();
  if (t === 'epub' || t === 'pdf') return t;
  if (url && /\.epub(\?|#|$)/i.test(url)) return 'epub';
  if (url && /\.pdf(\?|#|$)/i.test(url)) return 'pdf';
  return 'outro';
};

interface Props {
  origem?: Origem;
}

const Leitura: React.FC<Props> = ({ origem = 'compra' }) => {
  const { ebookId } = useParams<{ ebookId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const leitorRef = useRef<EpubReaderHandle>(null);

  const [fontSize, setFontSize] = useState(18);
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('sepia');
  const [showControls, setShowControls] = useState(true);
  const [toc, setToc] = useState<EpubTocItem[]>([]);
  const [pos, setPos] = useState<EpubPosicao | null>(null);
  const [painelAberto, setPainelAberto] = useState(false);
  const [isAnotacaoDialogOpen, setIsAnotacaoDialogOpen] = useState(false);
  const [anotacaoTexto, setAnotacaoTexto] = useState('');
  const [editingAnotacaoId, setEditingAnotacaoId] = useState<string | null>(null);
  const [marcadorTitulo, setMarcadorTitulo] = useState('');

  // --- Livro ---
  const { data: compra, isLoading: carregandoCompra } = useQuery({
    queryKey: ['biblioteca-item', ebookId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('biblioteca_usuario')
        .select('*, produto:produtos(*)')
        .eq('produto_id', ebookId)
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data as BibliotecaUsuario & { produto: Produto };
    },
    enabled: origem === 'compra' && !!ebookId && !!user?.id,
  });

  const { data: upload, isLoading: carregandoUpload } = useQuery({
    queryKey: ['ebook-pessoal', ebookId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ebooks_pessoais')
        .select('*')
        .eq('id', ebookId)
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data as EbookPessoal;
    },
    enabled: origem === 'upload' && !!ebookId && !!user?.id,
  });

  const livro: LivroAberto | null = useMemo(() => {
    if (origem === 'compra' && compra) {
      return {
        registroId: compra.id,
        titulo: compra.produto?.nome ?? 'Livro',
        arquivoUrl: compra.produto?.arquivo_url ?? null,
        formato: detectarFormato(compra.produto?.arquivo_url ?? null),
        posicaoSalva: compra.pagina_atual ?? 0,
        cfiSalvo: compra.localizacao ?? null,
      };
    }
    if (origem === 'upload' && upload) {
      return {
        registroId: upload.id,
        titulo: upload.titulo,
        arquivoUrl: upload.arquivo_url,
        formato: detectarFormato(upload.arquivo_url, upload.tipo_arquivo),
        posicaoSalva: upload.pagina_atual ?? 0,
        cfiSalvo: upload.localizacao ?? null,
      };
    }
    return null;
  }, [origem, compra, upload]);

  const carregando = origem === 'compra' ? carregandoCompra : carregandoUpload;

  // O bucket é privado: a URL do arquivo é assinada na hora e vale poucos
  // minutos. No caso da compra, quem assina é a função ler-ebook, depois de
  // conferir que a pessoa comprou.
  const temLeitor = livro?.formato === 'epub' || livro?.formato === 'pdf';
  const idAcesso = temLeitor
    ? (origem === 'compra' ? ebookId : livro!.registroId)
    : undefined;
  const {
    data: acesso, isLoading: carregandoAcesso, error: erroAcesso,
  } = useAcessoLivro(origem, idAcesso, livro?.arquivoUrl);

  // Só livro comprado é protegido: upload é arquivo do próprio dono.
  const protegido = origem === 'compra';
  const marcaDagua = protegido && acesso?.leitor
    ? [acesso.leitor.nome, acesso.leitor.email].filter(Boolean).join(' · ')
    : null;

  // Os controles somem sozinhos e deixam só o texto na tela. Um toque no meio
  // da página traz de volta. Não some com um painel aberto por cima, senão o
  // popover perde a âncora e fica flutuando.
  useEffect(() => {
    if (!showControls || painelAberto || isAnotacaoDialogOpen) return;
    const t = setTimeout(() => setShowControls(false), OCULTAR_CONTROLES_MS);
    return () => clearTimeout(t);
  }, [showControls, painelAberto, isAnotacaoDialogOpen, pos?.cfi]);

  // Ler não gera toque na tela, e o celular acaba apagando no meio da página.
  useEffect(() => {
    const nav = navigator as NavigatorComWakeLock;
    if (!nav.wakeLock) return;
    let sentinela: SentinelaWakeLock | null = null;
    let encerrado = false;

    const segurar = async () => {
      try {
        sentinela = await nav.wakeLock!.request('screen');
      } catch {
        // negado, bateria baixa ou aba em segundo plano: segue sem
      }
    };
    segurar();

    // O navegador solta o bloqueio ao trocar de aba; recupera na volta.
    const aoVoltar = () => {
      if (document.visibilityState === 'visible' && !encerrado) segurar();
    };
    document.addEventListener('visibilitychange', aoVoltar);

    return () => {
      encerrado = true;
      document.removeEventListener('visibilitychange', aoVoltar);
      sentinela?.release().catch(() => undefined);
    };
  }, []);

  // Barra de status do celular na cor do tema de leitura, para a tela virar
  // uma coisa só. Volta ao normal ao sair.
  // Lê de READING_THEMES em vez de `theme`, que só é declarado mais abaixo:
  // usar a variável antes da declaração — inclusive no array de dependências,
  // avaliado durante o render — lança ReferenceError.
  useEffect(() => {
    const fundo = READING_THEMES[readingTheme].bg;
    const tags = Array.from(document.querySelectorAll('meta[name="theme-color"]'));
    const anteriores = tags.map((t) => [t, t.getAttribute('content')] as const);
    tags.forEach((t) => t.setAttribute('content', fundo));
    return () => {
      anteriores.forEach(([t, valor]) => valor !== null && t.setAttribute('content', valor));
    };
  }, [readingTheme]);

  // Bloqueia a impressão da página inteira enquanto o leitor está aberto.
  useEffect(() => {
    if (!protegido) return;
    const style = document.createElement('style');
    style.textContent = '@media print { body { display: none !important; } }';
    document.head.appendChild(style);
    const barrarAtalho = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['p', 's'].includes(e.key.toLowerCase())) e.preventDefault();
    };
    window.addEventListener('keydown', barrarAtalho);
    return () => {
      style.remove();
      window.removeEventListener('keydown', barrarAtalho);
    };
  }, [protegido]);

  // Marcadores e anotações apontam para colunas diferentes conforme a origem.
  const marcadorAlvo = useMemo(
    () => (origem === 'upload'
      ? { ebook_pessoal_id: livro?.registroId ?? null, biblioteca_id: null }
      : { ebook_pessoal_id: null, biblioteca_id: livro?.registroId ?? null }),
    [origem, livro?.registroId],
  );
  const idUpload = origem === 'upload' ? livro?.registroId : undefined;
  const idCompra = origem === 'compra' ? livro?.registroId : undefined;

  const { data: marcadores } = useMarcadores(idUpload, idCompra);
  const { data: anotacoes } = useAnotacoes(idUpload, idCompra);
  const { data: configLeitura } = useConfigLeitura(user?.id);

  const createMarcador = useCreateMarcador();
  const deleteMarcador = useDeleteMarcador();
  const createAnotacao = useCreateAnotacao();
  const updateAnotacao = useUpdateAnotacao();
  const deleteAnotacao = useDeleteAnotacao();
  const upsertConfig = useUpsertConfigLeitura();

  useEffect(() => {
    if (configLeitura) {
      setReadingTheme(configLeitura.tema as ReadingTheme);
      setFontSize(configLeitura.tamanho_fonte);
    }
  }, [configLeitura]);

  // --- Progresso ---
  const salvarProgresso = useMutation({
    mutationFn: async ({ posicao, percentual, cfi }: { posicao: number; percentual: number; cfi: string }) => {
      if (!livro) return;
      const tabela = origem === 'upload' ? 'ebooks_pessoais' : 'biblioteca_usuario';
      const { error } = await supabase
        .from(tabela)
        .update({
          pagina_atual: posicao,
          progresso: percentual,
          localizacao: cfi,
          ultima_leitura: new Date().toISOString(),
        })
        .eq('id', livro.registroId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minha-biblioteca'] });
      queryClient.invalidateQueries({ queryKey: ['ebooks-pessoais'] });
    },
  });

  const cfiAtual = pos?.cfi;
  useEffect(() => {
    if (!cfiAtual || !livro) return;
    // Vira-página é rápido; gravar a cada virada encheria a fila de requisições.
    const t = setTimeout(() => {
      salvarProgresso.mutate({
        posicao: pos?.posicao ?? 0,
        percentual: pos?.percentual ?? 0,
        cfi: cfiAtual,
      });
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfiAtual, livro?.registroId]);

  // --- Navegação ---
  const proxima = useCallback(() => leitorRef.current?.proxima(), []);
  const anterior = useCallback(() => leitorRef.current?.anterior(), []);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (isAnotacaoDialogOpen) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); proxima(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); anterior(); }
      else if (e.key === 'Escape') navigate(ROUTES.BIBLIOTECA);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [isAnotacaoDialogOpen, proxima, anterior, navigate]);

  // --- Ações ---
  const handleAddMarcador = () => {
    if (!user?.id || !livro) return;
    createMarcador.mutate({
      user_id: user.id,
      ...marcadorAlvo,
      pagina: pos?.posicao ?? 0,
      localizacao: pos?.cfi ?? null,
      titulo: marcadorTitulo.trim() || pos?.capitulo || `${Math.round(pos?.percentual ?? 0)}% do livro`,
      cor: '#fbbf24',
    }, {
      onSuccess: () => { toast.success('Marcador adicionado!'); setMarcadorTitulo(''); },
      onError: () => toast.error('Erro ao adicionar marcador'),
    });
  };

  const handleSaveAnotacao = () => {
    if (!user?.id || !livro || !anotacaoTexto.trim()) return;
    if (editingAnotacaoId) {
      updateAnotacao.mutate(
        { id: editingAnotacaoId, texto: anotacaoTexto, ebookPessoalId: idUpload, bibliotecaId: idCompra },
        {
          onSuccess: () => {
            toast.success('Anotação atualizada!');
            setIsAnotacaoDialogOpen(false); setAnotacaoTexto(''); setEditingAnotacaoId(null);
          },
        },
      );
    } else {
      createAnotacao.mutate({
        user_id: user.id,
        ...marcadorAlvo,
        pagina: pos?.posicao ?? 0,
        localizacao: pos?.cfi ?? null,
        texto: anotacaoTexto,
        trecho_selecionado: null,
      }, {
        onSuccess: () => {
          toast.success('Anotação salva!');
          setIsAnotacaoDialogOpen(false); setAnotacaoTexto('');
        },
      });
    }
  };

  const handleSaveConfig = (tema?: ReadingTheme, fonte?: number) => {
    if (!user?.id) return;
    upsertConfig.mutate({ user_id: user.id, tema: tema || readingTheme, tamanho_fonte: fonte || fontSize });
  };

  const irParaMarca = (localizacao: string | null, posicao: number) => {
    if (localizacao) leitorRef.current?.irPara(localizacao);
    else leitorRef.current?.irParaPosicao(posicao);
  };

  const theme = READING_THEMES[readingTheme];
  const totalPosicoes = pos?.total ?? 0;
  const percentual = pos?.percentual ?? 0;
  const marcadoAqui = !!pos?.cfi && marcadores?.some(m => m.localizacao === pos.cfi);

  // --- Estados de borda ---
  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: theme.text }} />
      </div>
    );
  }

  if (!livro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-medium mb-2">Livro não encontrado</h2>
        <Button onClick={() => navigate(ROUTES.BIBLIOTECA)}>Voltar à Biblioteca</Button>
      </div>
    );
  }

  if (!livro.arquivoUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-medium mb-2">{livro.titulo}</h2>
        <p className="text-muted-foreground mb-4 max-w-sm">
          Este título ainda não tem o arquivo do livro anexado. Fale com o templo para receber seu exemplar.
        </p>
        <Button onClick={() => navigate(ROUTES.BIBLIOTECA)}>Voltar à Biblioteca</Button>
      </div>
    );
  }

  if (livro.formato === 'outro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-medium mb-2">{livro.titulo}</h2>
        <p className="text-muted-foreground mb-4 max-w-sm">
          O leitor abre EPUB e PDF. Este arquivo está em outro formato.
        </p>
        {/* O botão "Abrir arquivo" que ficava aqui apontava para o caminho
            cru no bucket, que é privado — não abria nem para o dono. Quem
            precisa do arquivo em Word usa o botão da Biblioteca, que assina
            a URL antes. */}
        <Button variant="outline" onClick={() => navigate(ROUTES.BIBLIOTECA)}>
          Voltar à Biblioteca
        </Button>
      </div>
    );
  }

  if (carregandoAcesso || !acesso?.url) {
    const mensagem = erroAcesso instanceof Error ? erroAcesso.message : null;
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center"
        style={{ backgroundColor: theme.bg, color: theme.text }}
      >
        {mensagem ? (
          <>
            <BookOpen className="w-14 h-14 opacity-40" />
            <p className="font-medium">Não foi possível abrir o livro</p>
            <p className="text-sm opacity-70 max-w-sm">{mensagem}</p>
            <Button variant="outline" onClick={() => navigate(ROUTES.BIBLIOTECA)}>
              Voltar à Biblioteca
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="text-sm opacity-70">Liberando seu exemplar...</p>
          </>
        )}
      </div>
    );
  }

  // Vai para o body, fora da árvore do MainLayout. O wrapper .page-transition
  // anima com transform, e um ancestral com transform vira o bloco de
  // contenção de qualquer descendente position:fixed — como esse wrapper só
  // tem filhos fora do fluxo, ele tem altura 0, e a área de leitura herdava
  // essa altura: o epubjs media 0 de altura e a página ficava em branco.
  // O portal também põe o leitor acima do cabeçalho e da barra inferior do app.
  return createPortal(
    <div className="fixed inset-0 overflow-hidden select-none" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Cabeçalho */}
      <header
        className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0')}
        style={{ backgroundColor: theme.bg }}
      >
        <div className="flex items-center justify-between px-2 h-14 border-b border-current/10">
          <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.BIBLIOTECA)} style={{ color: theme.text }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1 min-w-0 text-center px-2">
            <h1 className="text-sm font-medium truncate">{livro.titulo}</h1>
            {pos?.capitulo && <p className="text-[11px] opacity-60 truncate">{pos.capitulo}</p>}
          </div>

          <div className="flex items-center gap-0.5">
            <Popover onOpenChange={setPainelAberto}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" style={{ color: marcadoAqui ? '#f59e0b' : theme.text }}>
                  {marcadoAqui ? <Bookmark className="w-5 h-5 fill-current" /> : <BookmarkPlus className="w-5 h-5" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <p className="text-sm font-medium mb-2">Marcar este trecho</p>
                <Input
                  placeholder={pos?.capitulo || 'Título (opcional)'}
                  value={marcadorTitulo}
                  onChange={e => setMarcadorTitulo(e.target.value)}
                  className="mb-2"
                />
                <Button size="sm" className="w-full" onClick={handleAddMarcador} disabled={!pos}>
                  <Plus className="w-4 h-4 mr-1" />Adicionar
                </Button>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost" size="icon" style={{ color: theme.text }}
              onClick={() => { setEditingAnotacaoId(null); setAnotacaoTexto(''); setIsAnotacaoDialogOpen(true); }}
            >
              <StickyNote className="w-5 h-5" />
            </Button>

            <Popover onOpenChange={setPainelAberto}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" style={{ color: theme.text }}><Settings className="w-5 h-5" /></Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-2"><Type className="w-4 h-4" />Fonte</label>
                    <div className="flex items-center gap-3">
                      <span className="text-xs">A</span>
                      <Slider
                        value={[fontSize]}
                        onValueChange={([v]) => { setFontSize(v); handleSaveConfig(undefined, v); }}
                        min={14} max={28} step={2} className="flex-1"
                      />
                      <span className="text-lg">A</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tema</label>
                    <div className="flex gap-2">
                      {(Object.keys(READING_THEMES) as ReadingTheme[]).map(key => (
                        <button
                          key={key}
                          onClick={() => { setReadingTheme(key); handleSaveConfig(key); }}
                          className={cn('flex-1 py-2 px-3 rounded-lg border-2 text-sm',
                            readingTheme === key ? 'border-primary' : 'border-transparent')}
                          style={{ backgroundColor: READING_THEMES[key].bg, color: READING_THEMES[key].text }}
                        >
                          {READING_THEMES[key].name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Sheet onOpenChange={setPainelAberto}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" style={{ color: theme.text }}><List className="w-5 h-5" /></Button>
              </SheetTrigger>
              <SheetContent className="w-80">
                <SheetHeader><SheetTitle>Navegação</SheetTitle></SheetHeader>
                <Tabs defaultValue="indice" className="mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="indice">Índice</TabsTrigger>
                    <TabsTrigger value="marcadores">
                      Marcadores
                      {marcadores?.length ? <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">{marcadores.length}</Badge> : null}
                    </TabsTrigger>
                    <TabsTrigger value="notas">
                      Notas
                      {anotacoes?.length ? <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">{anotacoes.length}</Badge> : null}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="indice" className="mt-4 max-h-[70vh] overflow-y-auto space-y-0.5">
                    {toc.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Este livro não traz índice</p>
                    ) : toc.map((item, i) => (
                      <button
                        key={`${item.href}-${i}`}
                        onClick={() => leitorRef.current?.irPara(item.href)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm"
                        style={{ paddingLeft: `${12 + item.nivel * 14}px` }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </TabsContent>

                  <TabsContent value="marcadores" className="mt-4 max-h-[70vh] overflow-y-auto">
                    {!marcadores?.length ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum marcador</p>
                    ) : (
                      <div className="space-y-2">
                        {marcadores.map(m => (
                          <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted group">
                            <Bookmark className="w-4 h-4 text-warning shrink-0" />
                            <button className="flex-1 text-left text-sm" onClick={() => irParaMarca(m.localizacao, m.pagina)}>
                              {m.titulo || 'Trecho marcado'}
                            </button>
                            <Button
                              variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={() => deleteMarcador.mutate({ id: m.id, ebookPessoalId: idUpload, bibliotecaId: idCompra })}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="notas" className="mt-4 max-h-[70vh] overflow-y-auto">
                    {!anotacoes?.length ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma anotação</p>
                    ) : (
                      <div className="space-y-3">
                        {anotacoes.map(a => (
                          <div key={a.id} className="p-3 rounded-lg border bg-card group">
                            <button
                              className="text-xs text-primary mb-1 hover:underline"
                              onClick={() => irParaMarca(a.localizacao, a.pagina ?? 0)}
                            >
                              Ir para o trecho
                            </button>
                            <p className="text-sm line-clamp-3">{a.texto}</p>
                            <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100">
                              <Button
                                variant="ghost" size="sm" className="h-7"
                                onClick={() => { setEditingAnotacaoId(a.id); setAnotacaoTexto(a.texto); setIsAnotacaoDialogOpen(true); }}
                              >
                                <Edit2 className="w-3 h-3 mr-1" />Editar
                              </Button>
                              <Button
                                variant="ghost" size="sm" className="h-7 text-destructive"
                                onClick={() => deleteAnotacao.mutate({ id: a.id, ebookPessoalId: idUpload, bibliotecaId: idCompra })}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="h-1 bg-current/10">
          <div className="h-full bg-primary transition-all" style={{ width: `${percentual}%` }} />
        </div>
      </header>

      {/* Área de leitura: insets fixos para que mostrar/esconder os controles
          não mude o tamanho da página e force o EPUB a repaginar. */}
      <div className="absolute top-[60px] bottom-20 left-0 right-0 mx-auto max-w-2xl px-5">
        {/* Os dois leitores falam o mesmo contrato — mesma ref, mesma forma de
            posição —, então marcadores, anotações, temas e barra de progresso
            valem para EPUB e PDF sem nenhum caminho separado aqui. */}
        {livro.formato === 'epub' ? (
          <EpubReader
            ref={leitorRef}
            url={acesso.url}
            fontSize={fontSize}
            tema={readingTheme}
            temas={READING_THEMES}
            cfiInicial={livro.cfiSalvo}
            marcaDagua={marcaDagua}
            bloquearCopia={protegido}
            permitirBaixar={!protegido}
            onPronto={({ toc: sumario }) => setToc(sumario)}
            onPosicao={setPos}
            onToqueSimples={() => setShowControls(v => !v)}
            onErro={msg => toast.error('Erro ao abrir o livro', { description: msg })}
          />
        ) : (
          <PdfReader
            ref={leitorRef}
            url={acesso.url}
            fontSize={fontSize}
            tema={readingTheme}
            temas={READING_THEMES}
            cfiInicial={livro.cfiSalvo}
            marcaDagua={marcaDagua}
            bloquearCopia={protegido}
            onPronto={({ toc: sumario }) => setToc(sumario)}
            onPosicao={setPos}
            onToqueSimples={() => setShowControls(v => !v)}
            onErro={msg => toast.error('Erro ao abrir o livro', { description: msg })}
          />
        )}
      </div>

      {/* Zonas de toque nas laterais, acima do iframe do EPUB. */}
      <div className="absolute left-0 top-[60px] bottom-20 w-14 z-30" onClick={anterior} />
      <div className="absolute right-0 top-[60px] bottom-20 w-14 z-30" onClick={proxima} />

      {/* Rodapé */}
      <footer
        className={cn('fixed bottom-0 left-0 right-0 z-50 h-20 transition-all duration-300',
          showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0')}
        // Sem a barra do app embaixo, o rodapé encosta na faixa do gesto de
        // início dos celulares sem botão.
        style={{ backgroundColor: theme.bg, paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="border-t border-current/10 h-full flex items-center px-3">
          <div className="flex items-center justify-between max-w-2xl mx-auto gap-4 w-full">
            <Button variant="ghost" size="icon" onClick={anterior} style={{ color: theme.text }}>
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1">
              <Slider
                value={[pos?.posicao ?? 0]}
                onValueChange={([v]) => leitorRef.current?.irParaPosicao(v)}
                // No EPUB as posições começam em zero; no PDF, na página 1.
                min={livro.formato === 'pdf' ? 1 : 0}
                max={Math.max(1, totalPosicoes)}
                step={1}
                disabled={totalPosicoes === 0}
              />
              <p className="text-center text-xs mt-1 opacity-60 truncate">
                {totalPosicoes > 0
                  ? `${Math.round(percentual)}% lido`
                  : 'Calculando as páginas...'}
                {/* Dizer que o exemplar é identificado é o que faz a marca
                    d'água funcionar como desestímulo. */}
                {marcaDagua && acesso.leitor?.nome && (
                  <span className="opacity-80"> · exemplar de {acesso.leitor.nome}</span>
                )}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={proxima} style={{ color: theme.text }}>
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </footer>

      <Dialog open={isAnotacaoDialogOpen} onOpenChange={setIsAnotacaoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAnotacaoId ? 'Editar anotação' : 'Nova anotação'}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Escreva sua anotação..."
            value={anotacaoTexto}
            onChange={e => setAnotacaoTexto(e.target.value)}
            rows={5}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnotacaoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveAnotacao} disabled={!anotacaoTexto.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>,
    document.body,
  );
};

export default Leitura;
