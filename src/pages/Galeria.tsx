import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Image, Upload, X, Loader2, Calendar, Trash2, Edit2, Check, Play,
  ChevronLeft, ChevronRight, Tag,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PageHeader, PageContainer } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useCerimoniasSelect } from '@/hooks/queries';
import {
  useGaleria, useUploadGaleria, useUpdateGaleria, useDeleteGaleria,
} from '@/hooks/queries/useGaleria';
import { formatDateBR } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import type { GaleriaItemComCerimonia } from '@/types';


// ── Upload Dialog ────────────────────────────────────────────────────────────

function UploadDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cerimoniaId, setCerimoniaId] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: cerimonias } = useCerimoniasSelect();
  const uploadMutation = useUploadGaleria();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    // revoke previous previews
    previews.forEach(u => URL.revokeObjectURL(u));
    setFiles(selected);
    setPreviews(selected.map(f => URL.createObjectURL(f)));
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) { toast.error('Selecione pelo menos um arquivo'); return; }

    let success = 0;
    for (let i = 0; i < files.length; i++) {
      try {
        await uploadMutation.mutateAsync({
          file: files[i],
          cerimoniaId: cerimoniaId && cerimoniaId !== 'nenhuma' ? cerimoniaId : null,
          titulo: files.length === 1 ? (titulo || undefined) : undefined,
          descricao: files.length === 1 ? (descricao || undefined) : undefined,
        });
        success++;
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      } catch {
        toast.error(`Erro ao enviar ${files[i].name}`);
      }
    }

    if (success > 0) {
      toast.success(success === 1 ? 'Mídia enviada!' : `${success} mídias enviadas!`);
      handleClose();
    }
  };

  const handleClose = () => {
    previews.forEach(u => URL.revokeObjectURL(u));
    setFiles([]);
    setPreviews([]);
    setTitulo('');
    setDescricao('');
    setCerimoniaId('');
    setUploadProgress(0);
    onClose();
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File picker */}
      <div className="space-y-2">
        <Label>Arquivo(s)</Label>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="hidden" />

        {files.length === 0 ? (
          <Button type="button" variant="outline" className="w-full h-32 border-dashed" onClick={() => fileInputRef.current?.click()}>
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Clique para selecionar — aceita múltiplos</span>
            </div>
          </Button>
        ) : files.length === 1 ? (
          <div className="relative">
            {files[0].type.startsWith('video/') ? (
              <video src={previews[0]} className="w-full h-48 object-cover rounded-lg" controls />
            ) : (
              <img src={previews[0]} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
            )}
            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeFile(0)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="font-medium">{files.length} arquivos selecionados</span>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => fileInputRef.current?.click()}>
                Alterar
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {previews.slice(0, 7).map((url, i) => (
                <div key={i} className="relative aspect-square">
                  {files[i].type.startsWith('video/') ? (
                    <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                      <Play className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ) : (
                    <img src={url} alt="" className="w-full h-full object-cover rounded" />
                  )}
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center"
                    onClick={() => removeFile(i)}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              {previews.length > 7 && (
                <div className="aspect-square bg-muted rounded flex items-center justify-center text-xs font-medium text-muted-foreground">
                  +{previews.length - 7}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cerimônia */}
      <div className="space-y-2">
        <Label>Cerimônia (opcional)</Label>
        <Select value={cerimoniaId} onValueChange={setCerimoniaId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma cerimônia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nenhuma">Nenhuma</SelectItem>
            {cerimonias?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome || c.medicina_principal} — {formatDateBR(c.data)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Título e descrição apenas para upload único */}
      {files.length <= 1 && (
        <>
          <div className="space-y-2">
            <Label>Título (opcional)</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título da mídia" />
          </div>
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da mídia" className="resize-none" rows={2} />
          </div>
        </>
      )}

      {/* Progress bar (upload múltiplo) */}
      {uploadMutation.isPending && files.length > 1 && (
        <div className="space-y-1">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground text-center">{uploadProgress}% enviado</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={files.length === 0 || uploadMutation.isPending}>
        {uploadMutation.isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" />Enviando...</>
        ) : (
          <><Upload className="w-4 h-4 mr-2" />{files.length > 1 ? `Enviar ${files.length} arquivos` : 'Enviar'}</>
        )}
      </Button>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90vh]">
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mb-2" />
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Adicionar Mídia
            </DrawerTitle>
            <DrawerDescription>Envie fotos ou vídeos para a galeria.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">{formContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Adicionar Mídia
          </DialogTitle>
          <DialogDescription>Envie fotos ou vídeos para a galeria.</DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}


// ── Lightbox com navegação ───────────────────────────────────────────────────

function Lightbox({
  items,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  canEdit,
}: {
  items: GaleriaItemComCerimonia[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  canEdit: boolean;
}) {
  const item = items[currentIndex] ?? null;
  const [isEditing, setIsEditing] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');

  const updateMutation = useUpdateGaleria();
  const deleteMutation = useDeleteGaleria();

  useEffect(() => {
    if (item) {
      setTitulo(item.titulo || '');
      setDescricao(item.descricao || '');
      setIsEditing(false);
    }
  }, [item?.id]);

  // Navegação por teclado
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
    if (e.key === 'ArrowRight' && currentIndex < items.length - 1) onNavigate(currentIndex + 1);
  }, [currentIndex, items.length, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, handleKey]);

  const handleSave = async () => {
    if (!item) return;
    try {
      await updateMutation.mutateAsync({ id: item.id, titulo, descricao });
      toast.success('Atualizado com sucesso!');
      setIsEditing(false);
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    try {
      await deleteMutation.mutateAsync({ id: item.id, url: item.url });
      toast.success('Mídia removida!');
      onClose();
    } catch {
      toast.error('Erro ao remover');
    }
  };

  if (!item) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="sr-only">
          <DialogTitle>{item.titulo || 'Visualizar mídia'}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          {/* Mídia */}
          <div className="bg-black flex items-center justify-center min-h-[300px] max-h-[65vh] relative">
            {item.tipo === 'video' ? (
              <video src={item.url} className="max-w-full max-h-[65vh] object-contain" controls autoPlay />
            ) : (
              <img src={item.url} alt={item.titulo || 'Imagem da galeria'} className="max-w-full max-h-[65vh] object-contain" />
            )}

            {/* Botões de navegação */}
            {hasPrev && (
              <button
                onClick={() => onNavigate(currentIndex - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {hasNext && (
              <button
                onClick={() => onNavigate(currentIndex + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                aria-label="Próxima"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Contador */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
              {currentIndex + 1} / {items.length}
            </div>
          </div>

          {/* Info */}
          <div className="p-4 space-y-3">
            {isEditing ? (
              <div className="space-y-3">
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" />
                <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição" className="resize-none" rows={2} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {item.titulo && <h3 className="text-base font-medium">{item.titulo}</h3>}
                {item.descricao && <p className="text-sm text-muted-foreground">{item.descricao}</p>}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  {item.cerimonias && (
                    <Badge variant="outline" className="ml-1">
                      {item.cerimonias.nome || item.cerimonias.medicina_principal}
                    </Badge>
                  )}
                </div>
              </>
            )}

            {canEdit && !isEditing && (
              <div className="flex gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. A mídia será removida permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                        {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


// ── Componente principal ─────────────────────────────────────────────────────

const Galeria: React.FC = () => {
  const { isAdmin, isGuardiao } = useAuth();
  const canEdit = isAdmin || isGuardiao;

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [filtroCerimonia, setFiltroCerimonia] = useState<string>('todas');
  const [agrupamento, setAgrupamento] = useState<'data' | 'cerimonia'>('data');

  const { data: galeria, isLoading } = useGaleria();

  // Items filtrados pela cerimônia selecionada
  const itemsFiltrados = useMemo(() => {
    if (!galeria) return [];
    if (filtroCerimonia === 'todas') return galeria;
    if (filtroCerimonia === '__sem__') return galeria.filter(i => !i.cerimonias);
    return galeria.filter(i => i.cerimonias && (i.cerimonias as any).id === filtroCerimonia);
  }, [galeria, filtroCerimonia]);

  // Cerimônias únicas com fotos (para chips de filtro)
  const ceremoniasNaGaleria = useMemo(() => {
    if (!galeria) return [];
    const seen = new Map<string, string>();
    galeria.forEach(i => {
      if (i.cerimonias) {
        const id = (i.cerimonias as any).id as string;
        if (!seen.has(id)) seen.set(id, i.cerimonias.nome || i.cerimonias.medicina_principal || 'Cerimônia');
      }
    });
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
  }, [galeria]);

  // Agrupamento dos itens filtrados
  const grupos = useMemo(() => {
    if (agrupamento === 'data') {
      const map: Record<string, { label: string; items: GaleriaItemComCerimonia[] }> = {};
      itemsFiltrados.forEach(item => {
        const key = format(new Date(item.created_at), 'yyyy-MM-dd');
        if (!map[key]) map[key] = { label: format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), items: [] };
        map[key].items.push(item);
      });
      return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).map(([, v]) => v);
    } else {
      const map: Record<string, { label: string; items: GaleriaItemComCerimonia[] }> = {};
      itemsFiltrados.forEach(item => {
        const key = item.cerimonias ? (item.cerimonias as any).id : '__sem__';
        if (!map[key]) map[key] = { label: item.cerimonias ? (item.cerimonias.nome || item.cerimonias.medicina_principal || 'Cerimônia') : 'Sem cerimônia', items: [] };
        map[key].items.push(item);
      });
      return Object.values(map);
    }
  }, [itemsFiltrados, agrupamento]);

  const handleOpenLightbox = (item: GaleriaItemComCerimonia) => {
    const index = itemsFiltrados.findIndex(i => i.id === item.id);
    setLightboxIndex(index);
  };

  // Skeleton com alturas variadas para simular masonry
  const skeletonHeights = ['aspect-[3/4]', 'aspect-square', 'aspect-[4/3]', 'aspect-[3/4]', 'aspect-[4/3]', 'aspect-square', 'aspect-square', 'aspect-[3/4]'];

  return (
    <PageContainer maxWidth="xl">
      <PageHeader icon={Image} title="Galeria" description="Momentos especiais das nossas cerimônias.">
        {canEdit && (
          <Button onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Adicionar
          </Button>
        )}
      </PageHeader>

      {/* Barra de filtro + agrupamento */}
      {!isLoading && galeria && galeria.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Chips de cerimônia */}
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            <button
              onClick={() => setFiltroCerimonia('todas')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                filtroCerimonia === 'todas'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              Todas
            </button>
            {ceremoniasNaGaleria.map(c => (
              <button
                key={c.id}
                onClick={() => setFiltroCerimonia(filtroCerimonia === c.id ? 'todas' : c.id)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                  filtroCerimonia === c.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Toggle de agrupamento */}
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-1 shrink-0">
            <button
              onClick={() => setAgrupamento('data')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors',
                agrupamento === 'data' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Calendar className="w-3.5 h-3.5" /> Data
            </button>
            <button
              onClick={() => setAgrupamento('cerimonia')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors',
                agrupamento === 'cerimonia' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Tag className="w-3.5 h-3.5" /> Cerimônia
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      {isLoading ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
          {skeletonHeights.map((h, i) => (
            <div key={i} className="break-inside-avoid mb-3">
              <Skeleton className={cn('rounded-lg w-full', h)} />
            </div>
          ))}
        </div>
      ) : itemsFiltrados.length > 0 ? (
        <div className="space-y-8">
          {grupos.map((grupo, gi) => (
            <div key={gi}>
              {/* Cabeçalho do grupo */}
              <div className="flex items-center gap-2 mb-3">
                {agrupamento === 'data'
                  ? <Calendar className="w-4 h-4 text-primary shrink-0" />
                  : <Tag className="w-4 h-4 text-primary shrink-0" />
                }
                <h2 className="text-base font-semibold truncate">{grupo.label}</h2>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {grupo.items.length} {grupo.items.length === 1 ? 'item' : 'itens'}
                </Badge>
              </div>

              {/* Grid masonry */}
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
                {grupo.items.map((item) => (
                  <div
                    key={item.id}
                    className="break-inside-avoid mb-3 group cursor-pointer relative rounded-lg overflow-hidden ring-0 hover:ring-2 hover:ring-primary/50 transition-all duration-200"
                    onClick={() => handleOpenLightbox(item)}
                  >
                    {item.tipo === 'video' ? (
                      <div className="relative aspect-video bg-black">
                        <video src={item.url} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <Play className="w-8 h-8 text-white fill-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={item.titulo || 'Imagem'}
                        className="w-full h-auto block group-hover:scale-[1.02] transition-transform duration-300"
                        loading="lazy"
                      />
                    )}

                    {/* Overlay no hover com título/cerimônia */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2.5">
                      <div className="w-full">
                        {item.titulo && (
                          <p className="text-white text-xs font-medium line-clamp-2 leading-snug">{item.titulo}</p>
                        )}
                        {item.cerimonias && (
                          <Badge className="mt-1 bg-white/20 text-white border-0 text-[10px] backdrop-blur-sm">
                            {item.cerimonias.nome || item.cerimonias.medicina_principal}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 border-dashed border-2">
          <CardContent>
            <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-xl text-muted-foreground font-display">
              {filtroCerimonia !== 'todas' ? 'Nenhuma mídia para esta cerimônia.' : 'Nenhuma mídia na galeria ainda.'}
            </p>
            {canEdit && filtroCerimonia === 'todas' && (
              <Button className="mt-4" onClick={() => setIsUploadOpen(true)}>
                <Upload className="w-4 h-4 mr-2" /> Adicionar primeira mídia
              </Button>
            )}
            {filtroCerimonia !== 'todas' && (
              <Button variant="outline" className="mt-4" onClick={() => setFiltroCerimonia('todas')}>
                Ver todas as mídias
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <UploadDialog isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />

      <Lightbox
        items={itemsFiltrados}
        currentIndex={lightboxIndex}
        isOpen={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
        onNavigate={setLightboxIndex}
        canEdit={canEdit}
      />
    </PageContainer>
  );
};

export default Galeria;
