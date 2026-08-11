import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User, X, Share2, Heart, MessageCircle, Send, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORIAS_MATERIAIS } from '@/hooks/queries/useMateriais';
import {
  useCurtidasMaterial,
  useUsuarioCurtiu,
  useToggleCurtida,
  useComentariosMaterial,
  useCreateComentario,
  useDeleteComentario,
} from '@/hooks/queries/useMateriaisInteracoes';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { MaterialComAutor } from '@/types';

interface MaterialModalProps {
  material: MaterialComAutor | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatContent(content: string): string {
  let formatted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  formatted = formatted
    .split(/\n\n+/)
    .map((p) => `<p>${p.trim()}</p>`)
    .join('');

  formatted = formatted.replace(/\n/g, '<br>');
  formatted = formatted.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  return formatted;
}

const MaterialModal = ({ material, isOpen, onClose }: MaterialModalProps) => {
  const isMobile = useIsMobile();
  const { user, isAdmin } = useAuth();
  const [novoComentario, setNovoComentario] = useState('');
  const [showComentarios, setShowComentarios] = useState(false);

  // Queries de interações
  const { data: curtidas = [] } = useCurtidasMaterial(material?.id);
  const { data: usuarioCurtiu = false } = useUsuarioCurtiu(material?.id);
  const { data: comentarios = [] } = useComentariosMaterial(material?.id);
  
  // Mutations
  const toggleCurtida = useToggleCurtida();
  const createComentario = useCreateComentario();
  const deleteComentario = useDeleteComentario();

  // Memoizar formatação do conteúdo
  const formattedContent = useMemo(() => {
    if (!material) return '';
    return formatContent(material.conteudo);
  }, [material?.conteudo]);

  // Não renderizar nada se não estiver aberto
  if (!isOpen || !material) return null;

  const categoria = CATEGORIAS_MATERIAIS.find((c) => c.value === material.categoria);

  const handleShare = async () => {
    const url = `${window.location.origin}/estudos?id=${material.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: material.titulo,
          text: material.resumo,
          url,
        });
      } catch {
        // Usuário cancelou
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  const handleToggleCurtida = () => {
    if (!user) {
      toast.error('Faça login para curtir');
      return;
    }
    toggleCurtida.mutate({ materialId: material.id, curtido: usuarioCurtiu });
  };

  const handleEnviarComentario = () => {
    if (!user) {
      toast.error('Faça login para comentar');
      return;
    }
    if (!novoComentario.trim()) return;

    createComentario.mutate(
      { materialId: material.id, texto: novoComentario.trim() },
      {
        onSuccess: () => {
          setNovoComentario('');
          toast.success('Comentário enviado!');
        },
        onError: () => {
          toast.error('Erro ao enviar comentário');
        },
      }
    );
  };

  const handleDeletarComentario = (comentarioId: string) => {
    deleteComentario.mutate(
      { comentarioId, materialId: material.id },
      {
        onSuccess: () => toast.success('Comentário removido'),
        onError: () => toast.error('Erro ao remover comentário'),
      }
    );
  };

  // Lista de quem curtiu para o tooltip/popover
  const curtidasList = (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {curtidas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma curtida ainda</p>
      ) : (
        curtidas.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={c.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {c.profiles?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{c.profiles?.full_name || 'Usuário'}</span>
          </div>
        ))
      )}
    </div>
  );

  // Seção de interações (curtir e comentar)
  const interacoesSection = (
    <div className="border-t pt-4 mt-4 space-y-4">
      {/* Botões de curtir e comentar */}
      <div className="flex items-center gap-4">
        {/* Botão Curtir */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-2',
              usuarioCurtiu && 'text-red-500 hover:text-red-600'
            )}
            onClick={handleToggleCurtida}
            disabled={toggleCurtida.isPending}
          >
            <Heart
              className={cn('w-5 h-5', usuarioCurtiu && 'fill-current')}
            />
            <span>{curtidas.length}</span>
          </Button>
          
          {/* Popover para ver quem curtiu */}
          {curtidas.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground px-1">
                  ver quem curtiu
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <p className="font-medium mb-2 text-sm">Curtidas ({curtidas.length})</p>
                {curtidasList}
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Botão Comentários */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => setShowComentarios(!showComentarios)}
        >
          <MessageCircle className="w-5 h-5" />
          <span>{comentarios.length}</span>
        </Button>
      </div>

      {/* Seção de comentários */}
      {showComentarios && (
        <div className="space-y-4 bg-muted/30 rounded-lg p-4">
          {/* Lista de comentários */}
          {comentarios.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comentarios.map((c) => (
                <div key={c.id} className="flex gap-3 group">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={c.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {c.profiles?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {c.profiles?.full_name || 'Usuário'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(c.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                      {/* Botão deletar (próprio comentário ou admin) */}
                      {(c.user_id === user?.id || isAdmin) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeletarComentario(c.id)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                      {c.texto}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          )}

          {/* Input para novo comentário */}
          {user ? (
            <div className="flex gap-2">
              <Textarea
                placeholder="Escreva um comentário..."
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEnviarComentario();
                  }
                }}
              />
              <Button
                size="icon"
                onClick={handleEnviarComentario}
                disabled={!novoComentario.trim() || createComentario.isPending}
              >
                {createComentario.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              Faça login para comentar
            </p>
          )}
        </div>
      )}
    </div>
  );

  const content = (
    <div className="space-y-4">
      {material.imagem_url && (
        <div className="relative -mx-4 -mt-4 sm:-mx-6 sm:-mt-6">
          <img
            src={material.imagem_url}
            alt={material.titulo}
            className="w-full h-48 sm:h-64 object-cover"
          />
          <div className="absolute inset-0 bg-background/70" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          {categoria?.icon} {categoria?.label || material.categoria}
        </Badge>
        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold">{material.titulo}</h2>

      <div className="flex items-center gap-4 text-sm text-muted-foreground pb-4 border-b">
        {material.autor ? (
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={material.autor.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {material.autor.full_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <span>{material.autor.full_name || 'Admin'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Admin</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>
            {format(new Date(material.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>

      <div
        className="prose prose-sm sm:prose max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />

      {/* Seção de interações */}
      {interacoesSection}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[95vh] flex flex-col">
          <DrawerHeader className="border-b pb-2 shrink-0">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-base font-medium truncate pr-4">
                {material.titulo}
              </DrawerTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{material.titulo}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[90vh] overflow-y-auto p-6">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialModal;
