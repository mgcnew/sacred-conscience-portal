import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft, Share2, Heart, MessageCircle, Send,
  Trash2, Loader2, User, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PageContainer } from '@/components/shared';
import { CATEGORIAS_MATERIAIS, useMaterial } from '@/hooks/queries/useMateriais';
import {
  useCurtidasMaterial,
  useUsuarioCurtiu,
  useToggleCurtida,
  useComentariosMaterial,
  useCreateComentario,
  useDeleteComentario,
} from '@/hooks/queries/useMateriaisInteracoes';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ROUTES } from '@/constants';

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
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity">$1</a>'
  );
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  return formatted;
}

const EstudoDetalhe: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const { data: material, isLoading } = useMaterial(id ?? null);

  const { data: curtidas = [] } = useCurtidasMaterial(id);
  const { data: usuarioCurtiu = false } = useUsuarioCurtiu(id);
  const { data: comentarios = [] } = useComentariosMaterial(id);

  const toggleCurtida = useToggleCurtida();
  const createComentario = useCreateComentario();
  const deleteComentario = useDeleteComentario();

  const [novoComentario, setNovoComentario] = useState('');

  const formattedContent = useMemo(() => {
    if (!material) return '';
    return formatContent(material.conteudo);
  }, [material?.conteudo]);

  const categoria = CATEGORIAS_MATERIAIS.find((c) => c.value === material?.categoria);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: material?.titulo, text: material?.resumo, url });
      } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  const handleToggleCurtida = () => {
    if (!user) { toast.error('Faça login para curtir'); return; }
    toggleCurtida.mutate({ materialId: id!, curtido: usuarioCurtiu });
  };

  const handleEnviarComentario = () => {
    if (!user) { toast.error('Faça login para comentar'); return; }
    if (!novoComentario.trim()) return;
    createComentario.mutate(
      { materialId: id!, texto: novoComentario.trim() },
      {
        onSuccess: () => { setNovoComentario(''); toast.success('Comentário enviado!'); },
        onError: () => toast.error('Erro ao enviar comentário'),
      }
    );
  };

  const handleDeletarComentario = (comentarioId: string) => {
    deleteComentario.mutate(
      { comentarioId, materialId: id! },
      {
        onSuccess: () => toast.success('Comentário removido'),
        onError: () => toast.error('Erro ao remover comentário'),
      }
    );
  };

  return (
    <PageContainer maxWidth="md">
      {/* Botão voltar */}
      <button
        onClick={() => navigate(ROUTES.ESTUDOS)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Voltar para Estudos
      </button>

      {isLoading && (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-3 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" style={{ width: `${85 + Math.random() * 15}%` }} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && material && (
        <article className="space-y-0">
          {/* Imagem hero */}
          {material.imagem_url && (
            <div className="relative rounded-2xl overflow-hidden mb-8 -mx-4 sm:mx-0">
              <img
                src={material.imagem_url}
                alt={material.titulo}
                className="w-full h-56 sm:h-72 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            </div>
          )}

          {/* Cabeçalho do artigo */}
          <header className="mb-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <Badge variant="secondary" className="text-xs">
                {categoria?.icon} {categoria?.label || material.categoria}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleShare} className="text-muted-foreground">
                <Share2 className="w-4 h-4 mr-1.5" />
                Compartilhar
              </Button>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-5">
              {material.titulo}
            </h1>

            <p className="text-muted-foreground text-base leading-relaxed mb-5">
              {material.resumo}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-5 border-t border-border/50">
              {material.autor ? (
                <div className="flex items-center gap-2">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={material.autor.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {material.autor.full_name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{material.autor.full_name || 'Admin'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Admin</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(material.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              </div>
            </div>
          </header>

          {/* Conteúdo — tipografia otimizada para leitura */}
          <div
            className={cn(
              'text-foreground/90 font-body',
              '[&_p]:text-[17px] [&_p]:leading-[1.85] [&_p]:mb-6',
              '[&_strong]:font-semibold [&_strong]:text-foreground',
              '[&_em]:italic [&_em]:text-foreground/80',
              '[&_br]:block [&_br]:mb-2',
            )}
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />

          {/* Interações */}
          <div className="border-t border-border/50 pt-8 mt-10 space-y-6">
            {/* Curtir */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('gap-2 rounded-full px-4', usuarioCurtiu && 'text-red-500 hover:text-red-600')}
                  onClick={handleToggleCurtida}
                  disabled={toggleCurtida.isPending}
                >
                  <Heart className={cn('w-5 h-5', usuarioCurtiu && 'fill-current')} />
                  <span>{curtidas.length}</span>
                </Button>

                {curtidas.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground px-2 rounded-full">
                        ver quem curtiu
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" align="start">
                      <p className="font-medium mb-3 text-sm">Curtidas ({curtidas.length})</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {curtidas.map((c) => (
                          <div key={c.id} className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={c.profiles?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">{c.profiles?.full_name?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{c.profiles?.full_name || 'Usuário'}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="gap-2 rounded-full px-4"
                onClick={() => document.getElementById('comentarios')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <MessageCircle className="w-5 h-5" />
                <span>{comentarios.length}</span>
              </Button>
            </div>

            {/* Comentários */}
            <div id="comentarios" className="space-y-5">
              <h3 className="font-display font-semibold text-base">
                {comentarios.length > 0 ? `${comentarios.length} comentário${comentarios.length > 1 ? 's' : ''}` : 'Comentários'}
              </h3>

              {comentarios.length > 0 && (
                <div className="divide-y divide-border/40">
                  {comentarios.map((c) => (
                    <div key={c.id} className="flex gap-3 group py-4 first:pt-0">
                      <Avatar className="w-8 h-8 shrink-0 mt-0.5">
                        <AvatarImage src={c.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {c.profiles?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1.5">
                          <span className="font-semibold text-sm text-foreground">
                            {c.profiles?.full_name || 'Usuário'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(c.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </span>
                          {(c.user_id === user?.id || isAdmin) && (
                            <button
                              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                              onClick={() => handleDeletarComentario(c.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap break-words">
                          {c.texto}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {user ? (
                <div className="flex gap-3 pt-4 border-t border-border/40">
                  <Avatar className="w-8 h-8 shrink-0 mt-1">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Textarea
                      placeholder="Escreva um comentário..."
                      value={novoComentario}
                      onChange={(e) => setNovoComentario(e.target.value)}
                      className="min-h-[72px] resize-none text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleEnviarComentario();
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      className="shrink-0 self-end"
                      onClick={handleEnviarComentario}
                      disabled={!novoComentario.trim() || createComentario.isPending}
                    >
                      {createComentario.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Send className="w-4 h-4" />
                      }
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border/60 rounded-xl">
                  Faça login para deixar um comentário
                </p>
              )}
            </div>
          </div>
        </article>
      )}

      {!isLoading && !material && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium mb-2">Material não encontrado</p>
          <Button variant="outline" onClick={() => navigate(ROUTES.ESTUDOS)} className="mt-4">
            Voltar para Estudos
          </Button>
        </div>
      )}
    </PageContainer>
  );
};

export default EstudoDetalhe;
