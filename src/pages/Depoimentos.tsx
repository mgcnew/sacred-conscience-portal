import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    MessageSquareQuote, 
    PenLine, 
    Clock, 
    CheckCircle2, 
    Sparkles, 
    Loader2, 
    Quote, 
    Calendar, 
    Instagram, 
    Share2, 
    MessageCircle, 
    User,
    Heart,
    Star
} from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/shared';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/constants/messages';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateBR } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { 
    useDepoimentosInfinito, 
    useCerimoniasSelect, 
    useMeusDepoimentosPendentes,
    useRoles,
    useUserRoles,
    getUserRoleFromData
} from '@/hooks/queries';

// Componente para o Card de Depoimento individual
const TestimonialCard = ({ 
    depoimento, 
    user, 
    canShareAll, 
    index,
    isNew = false
}: { 
    depoimento: any; 
    user: any; 
    canShareAll: boolean;
    index: number;
    isNew?: boolean;
}) => {
    return (
        <div className={cn(
            "mb-6 break-inside-avoid",
            isNew && "animate-in fade-in slide-in-from-bottom-4 duration-500"
        )} style={{ animationDelay: isNew ? `${(index % 10) * 50}ms` : undefined }}>
            <Card className="group relative overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-card/50 backdrop-blur-sm border-white/10">
                {/* Efeito de luz sutil no hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardContent className="p-6 relative">
                    <div className="flex flex-col gap-4">
                        {/* Ícone de Aspas Superior */}
                        <div className="flex justify-between items-start">
                            <Quote className="w-10 h-10 text-primary/10 -ml-2" />
                            {depoimento.autoriza_instagram && (
                                <Badge variant="secondary" className="bg-pink-500/10 text-pink-500 border-none text-[10px] h-5 px-2">
                                    <Instagram className="w-3 h-3 mr-1" /> Instagram
                                </Badge>
                            )}
                        </div>

                        {/* Texto da Partilha */}
                        <p className="text-foreground/90 leading-relaxed font-body text-base italic whitespace-pre-wrap">
                            {depoimento.texto}
                        </p>

                        {/* Rodapé do Card */}
                        <div className="flex flex-col gap-4 pt-4 border-t border-primary/10">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10 border-2 border-primary/20">
                                        <AvatarImage src={depoimento.profiles?.avatar_url || undefined} alt={depoimento.profiles?.full_name || 'Avatar'} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                            {depoimento.profiles?.full_name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-foreground">
                                            {depoimento.profiles?.full_name || 'Anônimo'}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                            {format(new Date(depoimento.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                        </span>
                                    </div>
                                </div>

                                {/* Ações */}
                                {(canShareAll || depoimento.user_id === user?.id) && (
                                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full"
                                            title="Compartilhar no WhatsApp"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const shareText = `"${depoimento.texto}"\n\n- ${depoimento.profiles?.full_name || 'Anônimo'}\n\n🌿 Templo Xamânico Consciência Divinal`;
                                                window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                                            }}
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-full"
                                            title="Copiar para Instagram"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const shareText = `"${depoimento.texto}"\n\n- ${depoimento.profiles?.full_name || 'Anônimo'}\n\n🌿 @temploxamaniconscienciadivinal`;
                                                navigator.clipboard.writeText(shareText);
                                                toast.success('Texto copiado!', {
                                                    description: 'Cole no Instagram para compartilhar.',
                                                });
                                            }}
                                        >
                                            <Instagram className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Cerimônia Relacionada */}
                            {depoimento.cerimonias && (
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                                    <Sparkles className="w-3 h-3 text-primary" />
                                    <span>{depoimento.cerimonias.nome || depoimento.cerimonias.medicina_principal}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Componente do Modal de Compartilhar
function ShareExperienceModal({
    isOpen,
    onClose,
    isMobile,
    cerimonias,
    cerimoniaId,
    setCerimoniaId,
    texto,
    setTexto,
    autorizaInstagram,
    setAutorizaInstagram,
    handleSubmit,
    isPending,
}: {
    isOpen: boolean;
    onClose: () => void;
    isMobile: boolean;
    cerimonias: { id: string; nome: string | null; medicina_principal: string; data: string }[] | undefined;
    cerimoniaId: string;
    setCerimoniaId: (value: string) => void;
    texto: string;
    setTexto: (value: string) => void;
    autorizaInstagram: boolean;
    setAutorizaInstagram: (value: boolean) => void;
    handleSubmit: (e: React.FormEvent) => void;
    isPending: boolean;
}) {
    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="cerimonia">Relacionado a qual consagração? (opcional)</Label>
                <Select value={cerimoniaId} onValueChange={setCerimoniaId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione uma consagração" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="livre">Partilha Livre</SelectItem>
                        {cerimonias?.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                                {c.nome || c.medicina_principal} - {formatDateBR(c.data)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="texto">Sua Partilha</Label>
                <Textarea
                    id="texto"
                    placeholder="Compartilhe sua experiência, insights e transformações..."
                    className="min-h-[150px] resize-none"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                    Seu nome será exibido junto à partilha.
                </p>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-800">
                <Checkbox
                    id="autoriza-instagram"
                    checked={autorizaInstagram}
                    onCheckedChange={(checked) => setAutorizaInstagram(checked === true)}
                />
                <div className="space-y-1">
                    <Label htmlFor="autoriza-instagram" className="flex items-center gap-2 cursor-pointer">
                        <Instagram className="w-4 h-4 text-pink-500" />
                        Autorizo compartilhar no Instagram
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        Sua partilha poderá ser publicada no Instagram do Templo Xamânico Consciência Divinal.
                    </p>
                </div>
            </div>

            <Button
                type="submit"
                className="w-full"
                disabled={isPending}
            >
                {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Enviar Partilha
            </Button>
        </form>
    );

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={onClose}>
                <DrawerContent className="max-h-[90vh]">
                    <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mb-2" />
                    <DrawerHeader>
                        <DrawerTitle className="font-display flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Compartilhe sua Experiência
                        </DrawerTitle>
                        <DrawerDescription>
                            Sua partilha será revisada antes de ser publicada.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-6 overflow-y-auto">
                        {formContent}
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-display flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Compartilhe sua Experiência
                    </DialogTitle>
                    <DialogDescription>
                        Sua partilha será revisada antes de ser publicada.
                    </DialogDescription>
                </DialogHeader>
                <div className="pt-4">
                    {formContent}
                </div>
            </DialogContent>
        </Dialog>
    );
}

const Depoimentos: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isMobile = useIsMobile();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [texto, setTexto] = useState('');
    const [cerimoniaId, setCerimoniaId] = useState<string>('livre');
    const [autorizaInstagram, setAutorizaInstagram] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Infinite Query para depoimentos aprovados (Requirements: 6.2)
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useDepoimentosInfinito();

    const allDepoimentos = data?.pages.flatMap((page) => page.data) || [];

    // Intersection Observer para Infinite Scroll infinito (Substituindo Virtuoso para maior estabilidade)
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Query para cerimônias (para o select) (Requirements: 6.2)
    const { data: cerimonias } = useCerimoniasSelect();

    // Query para depoimentos do usuário (pendentes) (Requirements: 6.2)
    const { data: meusDepoimentos } = useMeusDepoimentosPendentes(user?.id);

    // Query para verificar role do usuário
    const { data: roles } = useRoles();
    const { data: userRoles } = useUserRoles();
    const userRole = user ? getUserRoleFromData(user.id, userRoles, roles) : 'consagrador';
    const canShareAll = userRole === 'admin' || userRole === 'guardiao';

    // Mutation para criar depoimento
    const createMutation = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('Usuário não autenticado');

            const { error } = await supabase
                .from('depoimentos')
                .insert({
                    user_id: user.id,
                    cerimonia_id: cerimoniaId === 'livre' ? null : cerimoniaId,
                    texto,
                    autoriza_instagram: autorizaInstagram,
                });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Partilha enviada!', {
                description: 'Aguarde a aprovação do administrador para que seja publicada. Gratidão por compartilhar sua experiência!',
            });
            setTexto('');
            setCerimoniaId('livre');
            setAutorizaInstagram(false);
            setIsDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['meus-depoimentos'] });
        },
        onError: () => {
            toast.error('Erro ao enviar partilha', {
                description: 'Não foi possível enviar sua partilha. Tente novamente.',
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!texto.trim()) {
            toast.error('Campo obrigatório', {
                description: 'Por favor, escreva sua partilha antes de enviar.',
            });
            return;
        }
        createMutation.mutate();
    };

    return (
        <PageContainer maxWidth="xl" className="relative overflow-visible">
            {/* Elementos Decorativos de Fundo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-primary/5 to-transparent blur-3xl -z-10 pointer-events-none" />
            
            <div className="pt-8 md:pt-12">
                {/* Header Centralizado e Elegante */}
                <PageHeader
                    centered
                    icon={MessageSquareQuote}
                    title="Partilhas"
                    description="Um espaço sagrado para compartilhar as curas, insights e transformações vivenciadas em nossa jornada."
                    className="mb-12"
                >
                    {user && (
                        <div className="mt-8 flex justify-center">
                            <Button 
                                size="lg"
                                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2 px-8 rounded-full transition-all hover:scale-105 active:scale-95" 
                                onClick={() => setIsDialogOpen(true)}
                            >
                                <PenLine className="w-5 h-5" /> 
                                Escrever Minha Partilha
                            </Button>
                            
                            <ShareExperienceModal
                                isOpen={isDialogOpen}
                                onClose={() => setIsDialogOpen(false)}
                                isMobile={isMobile}
                                cerimonias={cerimonias}
                                cerimoniaId={cerimoniaId}
                                setCerimoniaId={setCerimoniaId}
                                texto={texto}
                                setTexto={setTexto}
                                autorizaInstagram={autorizaInstagram}
                                setAutorizaInstagram={setAutorizaInstagram}
                                handleSubmit={handleSubmit}
                                isPending={createMutation.isPending}
                            />
                        </div>
                    )}
                </PageHeader>

                {/* Aviso de depoimento pendente */}
                {meusDepoimentos && meusDepoimentos.length > 0 && (
                    <div className="max-w-2xl mx-auto mb-12">
                        <Card className="border-amber-200/50 bg-amber-50/30 dark:bg-amber-950/10 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
                            <CardContent className="py-3 px-4 flex items-center justify-center gap-3">
                                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                                <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                                    Você tem <strong>{meusDepoimentos.length}</strong> partilha(s) em processo de revisão.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Grid de Depoimentos (Manual Columns para evitar pulos no Masonry) */}
                <div className="relative">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="mb-6">
                                    <Card className="overflow-hidden border-none bg-card/50">
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <Skeleton className="h-4 w-10" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-full" />
                                                    <Skeleton className="h-4 w-[90%]" />
                                                    <Skeleton className="h-4 w-[80%]" />
                                                </div>
                                                <div className="flex items-center gap-3 pt-4 border-t border-primary/5">
                                                    <Skeleton className="w-10 h-10 rounded-full" />
                                                    <div className="space-y-1">
                                                        <Skeleton className="h-3 w-24" />
                                                        <Skeleton className="h-2 w-16" />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    ) : allDepoimentos.length === 0 ? (
                        <div className="max-w-md mx-auto text-center py-20">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                                <Quote className="w-10 h-10 text-muted-foreground opacity-20" />
                            </div>
                            <h3 className="text-xl font-display font-medium mb-2">O silêncio das águas...</h3>
                            <p className="text-muted-foreground mb-8">
                                Ainda não há partilhas publicadas. Que tal ser o primeiro a manifestar sua voz?
                            </p>
                            {user && (
                                <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="rounded-full px-8">
                                    Começar agora
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Coluna 1 */}
                                <div className="flex-1 flex flex-col">
                                    {allDepoimentos.filter((_, i) => i % (isMobile ? 1 : 3) === 0).map((depoimento, index) => (
                                        <TestimonialCard 
                                            key={depoimento.id} 
                                            depoimento={depoimento} 
                                            user={user} 
                                            canShareAll={canShareAll}
                                            index={index * 3}
                                            isNew={index > 3} // Apenas anima os que não são os primeiros
                                        />
                                    ))}
                                </div>
                                {/* Coluna 2 */}
                                {!isMobile && (
                                    <div className="flex-1 flex flex-col">
                                        {allDepoimentos.filter((_, i) => i % 3 === 1).map((depoimento, index) => (
                                            <TestimonialCard 
                                                key={depoimento.id} 
                                                depoimento={depoimento} 
                                                user={user} 
                                                canShareAll={canShareAll}
                                                index={index * 3 + 1}
                                                isNew={index > 3}
                                            />
                                        ))}
                                    </div>
                                )}
                                {/* Coluna 3 */}
                                {!isMobile && (
                                    <div className="flex-1 flex flex-col">
                                        {allDepoimentos.filter((_, i) => i % 3 === 2).map((depoimento, index) => (
                                            <TestimonialCard 
                                                key={depoimento.id} 
                                                depoimento={depoimento} 
                                                user={user} 
                                                canShareAll={canShareAll}
                                                index={index * 3 + 2}
                                                isNew={index > 3}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Alvo do Observer para Infinite Scroll */}
                            <div ref={observerTarget} className="w-full h-20 flex items-center justify-center mt-8">
                                {isFetchingNextPage && (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                        <span className="text-xs text-muted-foreground animate-pulse">Buscando mais luz...</span>
                                    </div>
                                )}
                                {!hasNextPage && allDepoimentos.length > 0 && (
                                    <div className="flex flex-col items-center gap-2 opacity-50">
                                        <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-primary">Fim das Partilhas</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </PageContainer>
    );
};

export default Depoimentos;
