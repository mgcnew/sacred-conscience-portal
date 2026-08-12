import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchInput } from '@/components/ui/search-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, PageContainer } from '@/components/shared';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  BookOpen, Library, ShoppingBag, Star, BookMarked, Upload, FileText,
  Trash2, Loader2, ImagePlus, Link, X, Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Produto, BibliotecaUsuario, EbookPessoal } from '@/types';
import { ROUTES } from '@/constants';
import PdfReaderModal from '@/components/biblioteca/PdfReaderModal';

// --- Skeleton ---
const BookSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="aspect-[2/3] rounded-lg w-full" />
    <Skeleton className="h-3 w-4/5" />
    <Skeleton className="h-3 w-2/3" />
  </div>
);

const BookSkeletonGrid = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
    {Array.from({ length: count }).map((_, i) => <BookSkeleton key={i} />)}
  </div>
);

/** Formatos que o usuário pode subir. Só o EPUB abre no leitor completo. */
const FORMATOS_ACEITOS = ['epub', 'pdf', 'docx', 'doc'] as const;
type FormatoAceito = (typeof FORMATOS_ACEITOS)[number];

const extensaoDe = (nome: string) => nome.split('.').pop()?.toLowerCase() ?? '';
const ehPdf = (url: string) => /\.pdf(\?|#|$)/i.test(url);

/** Caminho dentro do bucket privado `ebooks`, a partir da URL gravada no banco. */
const caminhoNoBucket = (valor: string): string | null => {
  if (!valor) return null;
  if (!valor.startsWith('http')) return valor.replace(/^\/+/, '');
  const i = valor.indexOf('/ebooks/');
  if (i === -1) return null;
  return decodeURIComponent(valor.slice(i + '/ebooks/'.length).split('?')[0]);
};

const Biblioteca: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState('meus-livros');
  const [searchMeus, setSearchMeus] = useState('');
  const [searchUploads, setSearchUploads] = useState('');
  const [searchLoja, setSearchLoja] = useState('');

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAutor, setUploadAutor] = useState('');
  const [uploadCapaFile, setUploadCapaFile] = useState<File | null>(null);
  const [uploadCapaUrl, setUploadCapaUrl] = useState('');
  const [uploadCapaPreview, setUploadCapaPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const capaInputRef = useRef<HTMLInputElement>(null);

  // Só o PDF continua abrindo em modal; EPUB vai para a tela de leitura.
  const [pdfAberto, setPdfAberto] = useState<{ url: string; titulo: string; autor: string | null } | null>(null);

  // --- Queries ---
  const { data: meusEbooks, isLoading: loadingMeus } = useQuery({
    queryKey: ['minha-biblioteca', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('biblioteca_usuario')
        .select(`*, produto:produtos(*)`)
        .eq('user_id', user?.id)
        .order('ultima_leitura', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as (BibliotecaUsuario & { produto: Produto })[];
    },
    enabled: !!user?.id,
  });

  const { data: ebooksPessoais, isLoading: loadingPessoais } = useQuery({
    queryKey: ['ebooks-pessoais', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ebooks_pessoais')
        .select('*')
        .eq('user_id', user?.id)
        .order('ultima_leitura', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as EbookPessoal[];
    },
    enabled: !!user?.id,
  });

  const { data: ebooksLoja, isLoading: loadingLoja } = useQuery({
    queryKey: ['ebooks-loja'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .eq('is_ebook', true)
        .order('destaque', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Produto[];
    },
  });

  // --- Filtered data ---
  const meusEbooksFiltrados = useMemo(() => {
    if (!meusEbooks) return [];
    if (!searchMeus.trim()) return meusEbooks;
    const t = searchMeus.toLowerCase();
    return meusEbooks.filter(e => e.produto?.nome?.toLowerCase().includes(t));
  }, [meusEbooks, searchMeus]);

  const uploadsFiltrados = useMemo(() => {
    if (!ebooksPessoais) return [];
    if (!searchUploads.trim()) return ebooksPessoais;
    const t = searchUploads.toLowerCase();
    return ebooksPessoais.filter(e =>
      e.titulo.toLowerCase().includes(t) || e.autor?.toLowerCase().includes(t)
    );
  }, [ebooksPessoais, searchUploads]);

  const lojaFiltrada = useMemo(() => {
    if (!ebooksLoja) return [];
    if (!searchLoja.trim()) return ebooksLoja;
    const t = searchLoja.toLowerCase();
    return ebooksLoja.filter(p => p.nome.toLowerCase().includes(t));
  }, [ebooksLoja, searchLoja]);

  // --- Mutations ---
  const deleteMutation = useMutation({
    mutationFn: async (ebook: EbookPessoal) => {
      if (ebook.arquivo_url) {
        const caminho = caminhoNoBucket(ebook.arquivo_url);
        if (caminho) await supabase.storage.from('ebooks').remove([caminho]);
      }
      const { error } = await supabase.from('ebooks_pessoais').delete().eq('id', ebook.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Ebook removido com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['ebooks-pessoais'] });
    },
    onError: () => toast.error('Erro ao remover ebook'),
  });

  // --- Helpers ---
  const formatPrice = (centavos: number) =>
    (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatLastRead = (date: string | null) => {
    if (!date) return null;
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const handleLer = async (item: BibliotecaUsuario & { produto: Produto }) => {
    const url = item.produto?.arquivo_url;
    if (!url) {
      toast.info('Arquivo indisponível', {
        description: 'Este título ainda não tem o arquivo anexado. Fale com o templo.',
      });
      return;
    }
    if (ehPdf(url)) {
      // O bucket é privado: a URL só sai da função, que confere a compra.
      const { data, error } = await supabase.functions.invoke('ler-ebook', {
        body: { produto_id: item.produto_id },
      });
      if (error || !data?.url) {
        toast.error('Não foi possível abrir o livro', { description: data?.error });
        return;
      }
      setPdfAberto({ url: data.url, titulo: item.produto.nome, autor: null });
      return;
    }
    navigate(`${ROUTES.LEITURA}/${item.produto_id}`);
  };

  /** Upload é arquivo do próprio dono: ele mesmo assina a URL. */
  const assinarProprio = async (arquivoUrl: string) => {
    const caminho = caminhoNoBucket(arquivoUrl);
    if (!caminho) return null;
    const { data } = await supabase.storage.from('ebooks').createSignedUrl(caminho, 60 * 10);
    return data?.signedUrl ?? null;
  };

  const handleLerPessoal = async (ebook: EbookPessoal) => {
    if (ebook.tipo_arquivo === 'epub') {
      navigate(`${ROUTES.LEITURA_UPLOAD}/${ebook.id}`);
      return;
    }

    const url = await assinarProprio(ebook.arquivo_url);
    if (!url) {
      toast.error('Não foi possível abrir o arquivo');
      return;
    }
    if (ebook.tipo_arquivo === 'pdf') {
      setPdfAberto({ url, titulo: ebook.titulo, autor: ebook.autor });
    } else {
      window.open(url, '_blank');
    }
    // O EPUB grava a última leitura sozinho, ao acompanhar a posição.
    supabase
      .from('ebooks_pessoais')
      .update({ ultima_leitura: new Date().toISOString() })
      .eq('id', ebook.id)
      .then(() => queryClient.invalidateQueries({ queryKey: ['ebooks-pessoais'] }));
  };

  const handleComprar = async (produto: Produto) => {
    if (!user) { toast.error('Faça login para comprar'); return; }
    const jaPossui = meusEbooks?.some(e => e.produto_id === produto.id);
    if (jaPossui) { toast.info('Você já possui este ebook!'); setActiveTab('meus-livros'); return; }
    try {
      const response = await supabase.functions.invoke('create-checkout', {
        body: {
          tipo: 'produto', produto_id: produto.id, produto_nome: produto.nome,
          quantidade: 1, valor_centavos: produto.preco_promocional || produto.preco,
          user_email: user.email, user_name: user.email,
        },
      });
      if (response.error) throw new Error(response.error.message);
      const url = response.data?.checkout_url || response.data?.sandbox_url;
      if (url) window.location.href = url;
    } catch {
      toast.error('Erro ao processar compra');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Valida pela extensão: muitos sistemas entregam .epub como
    // application/octet-stream, e aí a checagem por MIME rejeitaria o arquivo.
    const ext = extensaoDe(file.name);
    if (!FORMATOS_ACEITOS.includes(ext as FormatoAceito)) {
      toast.error('Formato inválido', { description: 'Aceitamos EPUB, PDF e Word.' });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Arquivo muito grande', { description: 'O tamanho máximo é 50MB.' });
      return;
    }
    setUploadingFile(file);
    setUploadTitle(file.name.replace(/\.(epub|pdf|docx|doc)$/i, ''));
    setIsUploadModalOpen(true);
  };

  const handleCapaFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande (máx. 5MB)'); return; }
    setUploadCapaFile(file);
    setUploadCapaUrl('');
    setUploadCapaPreview(URL.createObjectURL(file));
  };

  const handleCapaUrlChange = (url: string) => {
    setUploadCapaUrl(url);
    setUploadCapaFile(null);
    if (uploadCapaPreview) URL.revokeObjectURL(uploadCapaPreview);
    setUploadCapaPreview(url || null);
  };

  const clearCapaSelection = () => {
    setUploadCapaFile(null);
    setUploadCapaUrl('');
    if (uploadCapaPreview && !uploadCapaPreview.startsWith('http')) URL.revokeObjectURL(uploadCapaPreview);
    setUploadCapaPreview(null);
  };

  const handleUpload = async () => {
    if (!uploadingFile || !user || !uploadTitle.trim()) return;
    setIsUploading(true);
    try {
      const fileExt = extensaoDe(uploadingFile.name);
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('ebooks').upload(filePath, uploadingFile);
      if (uploadError) throw uploadError;

      let capaUrl: string | null = null;
      if (uploadCapaFile) {
        const capaFileName = `${user.id}/${Date.now()}-capa.${uploadCapaFile.name.split('.').pop()}`;
        const { error: capaError } = await supabase.storage.from('ebook-capas').upload(capaFileName, uploadCapaFile);
        if (!capaError) {
          const { data: capaUrlData } = supabase.storage.from('ebook-capas').getPublicUrl(capaFileName);
          capaUrl = capaUrlData.publicUrl;
        }
      } else if (uploadCapaUrl.trim()) {
        capaUrl = uploadCapaUrl.trim();
      }

      const { error: dbError } = await supabase.from('ebooks_pessoais').insert({
        user_id: user.id, titulo: uploadTitle.trim(), autor: uploadAutor.trim() || null,
        // Caminho, não URL: o bucket é privado, o link é assinado na leitura.
        arquivo_url: filePath, capa_url: capaUrl,
        tipo_arquivo: fileExt as FormatoAceito, tamanho_bytes: uploadingFile.size,
      });
      if (dbError) throw dbError;

      toast.success('Ebook adicionado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['ebooks-pessoais'] });
      setIsUploadModalOpen(false);
      setUploadingFile(null);
      setUploadTitle('');
      setUploadAutor('');
      clearCapaSelection();
    } catch {
      toast.error('Erro ao fazer upload do ebook');
    } finally {
      setIsUploading(false);
    }
  };

  // --- Shared tab trigger classes ---
  const triggerCls = cn(
    'rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all gap-1.5',
    'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
    'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground',
  );

  return (
    <PageContainer maxWidth="xl">
      <PageHeader icon={Library} title="Biblioteca" description="Sua estante digital de conhecimento sagrado." />

      <input ref={fileInputRef} type="file" accept=".epub,.pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Pill-style tabs */}
        <div className="mb-6 overflow-x-auto scrollbar-none">
          <TabsList className="inline-flex gap-1 bg-muted/70 p-1 rounded-full h-auto min-w-max">
            <TabsTrigger value="meus-livros" className={triggerCls}>
              <BookMarked className="w-3.5 h-3.5" />
              <span>Meus Livros</span>
              {meusEbooks && meusEbooks.length > 0 && (
                <span className={cn(
                  'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                  activeTab === 'meus-livros' ? 'bg-primary/15 text-primary' : 'bg-muted-foreground/15 text-muted-foreground'
                )}>
                  {meusEbooks.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="uploads" className={triggerCls}>
              <Upload className="w-3.5 h-3.5" />
              <span>Meus Uploads</span>
              {ebooksPessoais && ebooksPessoais.length > 0 && (
                <span className={cn(
                  'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                  activeTab === 'uploads' ? 'bg-primary/15 text-primary' : 'bg-muted-foreground/15 text-muted-foreground'
                )}>
                  {ebooksPessoais.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="loja" className={triggerCls}>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Loja</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Meus Livros ── */}
        <TabsContent value="meus-livros" className="space-y-4">
          {loadingMeus ? (
            <BookSkeletonGrid />
          ) : !meusEbooks || meusEbooks.length === 0 ? (
            <Card className="text-center py-16 border-dashed border-2 bg-card/50">
              <CardContent>
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-display text-foreground mb-2">Nenhum ebook comprado</h3>
                <p className="text-muted-foreground mb-4">Explore nossa loja e adquira seu primeiro ebook!</p>
                <Button onClick={() => setActiveTab('loja')}>
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Ver Ebooks Disponíveis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <SearchInput
                placeholder="Buscar livro..."
                value={searchMeus}
                onChange={setSearchMeus}
                containerClassName="max-w-sm"
              />

              {meusEbooksFiltrados.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum livro encontrado</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {meusEbooksFiltrados.map(item => (
                    <div key={item.id} className="group cursor-pointer" onClick={() => handleLer(item)}>
                      {/* Cover */}
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 bg-sacred-gold/15 dark:bg-sacred-gold/20">
                        {item.produto?.imagem_url ? (
                          <img src={item.produto.imagem_url} alt={item.produto.nome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                            <BookOpen className="w-8 h-8 text-amber-700 dark:text-amber-300 mb-2" />
                            <span className="text-xs font-medium text-amber-800 dark:text-amber-200 line-clamp-3">{item.produto?.nome}</span>
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <Play className="w-5 h-5 text-white fill-white" />
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                          <Progress value={item.progresso} className="h-1 mb-1" />
                          <p className="text-[10px] text-white/80 text-center">{item.progresso.toFixed(0)}% lido</p>
                        </div>
                      </div>

                      {/* Info below cover */}
                      <div className="mt-2 px-0.5 space-y-0.5">
                        <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                          {item.produto?.nome}
                        </h4>
                        {item.ultima_leitura && (
                          <p className="text-[11px] text-muted-foreground">
                            Lido em {formatLastRead(item.ultima_leitura)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Meus Uploads ── */}
        <TabsContent value="uploads" className="space-y-4">
          {loadingPessoais ? (
            <BookSkeletonGrid />
          ) : !ebooksPessoais || ebooksPessoais.length === 0 ? (
            <Card className="text-center py-16 border-dashed border-2 bg-card/50">
              <CardContent>
                <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-display text-foreground mb-2">Nenhum ebook enviado</h3>
                <p className="text-muted-foreground mb-4">
                  Envie seus livros em EPUB para ler aqui dentro, com marcadores e anotações. PDF e Word também são aceitos.
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Primeiro Ebook
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Search + Upload button */}
              <div className="flex items-center gap-2">
                <SearchInput
                  placeholder="Buscar upload..."
                  value={searchUploads}
                  onChange={setSearchUploads}
                  containerClassName="flex-1"
                />
                <Button size="sm" onClick={() => fileInputRef.current?.click()} className="shrink-0">
                  <Upload className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Enviar Ebook</span>
                </Button>
              </div>

              {uploadsFiltrados.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum upload encontrado</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {uploadsFiltrados.map(ebook => (
                    <div key={ebook.id} className="group">
                      {/* Cover */}
                      <div
                        className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 bg-primary/12 dark:bg-primary/20 cursor-pointer"
                        onClick={() => handleLerPessoal(ebook)}
                      >
                        {ebook.capa_url ? (
                          <img src={ebook.capa_url} alt={ebook.titulo} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                            <FileText className="w-8 h-8 text-primary mb-2" />
                            <span className="text-xs font-medium text-primary line-clamp-3">{ebook.titulo}</span>
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <Play className="w-5 h-5 text-white fill-white" />
                          </div>
                        </div>

                        {/* Formato do arquivo: o EPUB se destaca porque é o
                            único que abre no leitor completo do app. */}
                        <div className="absolute top-2 left-2">
                          <Badge
                            className={cn(
                              'text-[10px] px-1.5 uppercase',
                              ebook.tipo_arquivo === 'epub'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {ebook.tipo_arquivo}
                          </Badge>
                        </div>
                      </div>

                      {/* Info below */}
                      <div className="mt-2 px-0.5 space-y-0.5">
                        <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                          {ebook.titulo}
                        </h4>
                        {ebook.autor && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">{ebook.autor}</p>
                        )}
                        <div className="flex items-center justify-between pt-0.5">
                          {ebook.ultima_leitura ? (
                            <span className="text-[11px] text-muted-foreground">
                              {formatLastRead(ebook.ultima_leitura)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">{formatFileSize(ebook.tamanho_bytes)}</span>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={e => e.stopPropagation()}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover ebook?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O arquivo será removido permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(ebook)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Loja ── */}
        <TabsContent value="loja" className="space-y-4">
          {loadingLoja ? (
            <BookSkeletonGrid />
          ) : !ebooksLoja || ebooksLoja.length === 0 ? (
            <Card className="text-center py-16 border-dashed border-2 bg-card/50">
              <CardContent>
                <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-display text-foreground mb-2">Nenhum ebook disponível</h3>
                <p className="text-muted-foreground">Em breve teremos novos títulos!</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <SearchInput
                placeholder="Buscar na loja..."
                value={searchLoja}
                onChange={setSearchLoja}
                containerClassName="max-w-sm"
              />

              {lojaFiltrada.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum ebook encontrado</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {lojaFiltrada.map(produto => {
                    const jaPossui = meusEbooks?.some(e => e.produto_id === produto.id);
                    return (
                      <div key={produto.id} className="group">
                        {/* Cover */}
                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 bg-muted dark:bg-muted">
                          {produto.imagem_url ? (
                            <img src={produto.imagem_url} alt={produto.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                              <BookOpen className="w-8 h-8 text-slate-500 mb-2" />
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 line-clamp-3">{produto.nome}</span>
                            </div>
                          )}

                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {produto.destaque && (
                              <Badge className="bg-amber-500 text-white text-[10px] px-1.5">
                                <Star className="w-2.5 h-2.5 mr-0.5" />
                                Destaque
                              </Badge>
                            )}
                            {produto.preco_promocional && (
                              <Badge className="bg-red-500 text-white text-[10px] px-1.5">Promoção</Badge>
                            )}
                            {jaPossui && (
                              <Badge className="bg-green-500 text-white text-[10px] px-1.5">Adquirido</Badge>
                            )}
                          </div>

                          {/* Price / read overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/55 pt-6 pb-2 px-2">
                            {jaPossui ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="w-full h-7 text-xs"
                                onClick={() => {
                                  const meuEbook = meusEbooks?.find(e => e.produto_id === produto.id);
                                  if (meuEbook) handleLer(meuEbook as BibliotecaUsuario & { produto: Produto });
                                }}
                              >
                                <BookOpen className="w-3 h-3 mr-1" />
                                Ler
                              </Button>
                            ) : (
                              <div className="text-center">
                                {produto.preco_promocional ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span className="text-white font-bold text-sm">{formatPrice(produto.preco_promocional)}</span>
                                    <span className="text-white/50 text-xs line-through">{formatPrice(produto.preco)}</span>
                                  </div>
                                ) : (
                                  <span className="text-white font-bold text-sm">{formatPrice(produto.preco)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Info below */}
                        <div className="mt-2 px-0.5 space-y-1.5">
                          <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                            {produto.nome}
                          </h4>
                          {!jaPossui && (
                            <Button
                              size="sm"
                              className="w-full h-8 text-xs"
                              onClick={() => handleComprar(produto)}
                            >
                              Comprar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={open => { setIsUploadModalOpen(open); if (!open) clearCapaSelection(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Adicionar Ebook
            </DialogTitle>
            <DialogDescription>Preencha as informações do seu ebook</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {uploadingFile && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileText className="w-8 h-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadingFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(uploadingFile.size)}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-[120px_1fr] gap-4">
              {/* Cover picker */}
              <div className="space-y-2">
                <Label>Capa</Label>
                <input ref={capaInputRef} type="file" accept="image/*" onChange={handleCapaFileSelect} className="hidden" />
                <div
                  className="aspect-[2/3] rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden relative"
                  onClick={() => capaInputRef.current?.click()}
                >
                  {uploadCapaPreview ? (
                    <>
                      <img src={uploadCapaPreview} alt="Capa" className="w-full h-full object-cover" />
                      <Button
                        variant="destructive" size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={e => { e.stopPropagation(); clearCapaSelection(); }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <ImagePlus className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                      <span className="text-[10px] text-muted-foreground">Adicionar capa</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input id="titulo" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Nome do livro" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="autor">Autor</Label>
                  <Input id="autor" value={uploadAutor} onChange={e => setUploadAutor(e.target.value)} placeholder="Nome do autor" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="capaUrl" className="flex items-center gap-1">
                    <Link className="w-3 h-3" />
                    URL da capa
                  </Label>
                  <Input
                    id="capaUrl"
                    value={uploadCapaUrl}
                    onChange={e => handleCapaUrlChange(e.target.value)}
                    placeholder="https://..."
                    disabled={!!uploadCapaFile}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsUploadModalOpen(false); setUploadingFile(null); setUploadTitle(''); setUploadAutor(''); clearCapaSelection(); }}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !uploadTitle.trim()}>
              {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : <><Upload className="w-4 h-4 mr-2" />Adicionar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leitor de PDF (o EPUB abre na tela de leitura, não em modal) */}
      {pdfAberto && (
        <PdfReaderModal
          open
          onOpenChange={open => { if (!open) setPdfAberto(null); }}
          pdfUrl={pdfAberto.url}
          title={pdfAberto.titulo}
          autor={pdfAberto.autor}
        />
      )}
    </PageContainer>
  );
};

export default Biblioteca;
