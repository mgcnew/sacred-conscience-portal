import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchInput } from '@/components/ui/search-input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageHeader, PageContainer } from '@/components/shared';
import {
  ShoppingBag, Plus, Package, Pencil, Trash2, Star, Info,
  ShoppingCart, ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import ProductFormDialog from '@/components/loja/ProductFormDialog';
import CheckoutModal from '@/components/loja/CheckoutModal';
import LojaInfoModal from '@/components/loja/LojaInfoModal';
import RapeInstructionsModal from '@/components/loja/RapeInstructionsModal';
import { AdminFab } from '@/components/ui/admin-fab';
import { EmptyState, NoResultsState } from '@/components/ui/empty-state';
import type { Produto, CategoriaProduto } from '@/types';

type SortOption = 'destaque' | 'menor_preco' | 'maior_preco' | 'mais_recente';

// ── Skeleton de card ─────────────────────────────────────────────────────────
const ProductCardSkeleton = () => (
  <div className="bg-card rounded-[1.5rem] border border-border/40 overflow-hidden">
    <Skeleton className="aspect-square w-full" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="pt-1 space-y-2">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────────
const Loja: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [sortBy, setSortBy] = useState<SortOption>('destaque');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Produto | null>(null);
  const [productToView, setProductToView] = useState<Produto | null>(null);
  const [productToCheckout, setProductToCheckout] = useState<Produto | null>(null);
  const [showRapeInstructions, setShowRapeInstructions] = useState(false);

  // Tratar retorno do Mercado Pago
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (!paymentStatus) return;

    searchParams.delete('payment');
    setSearchParams(searchParams, { replace: true });

    if (paymentStatus === 'success') {
      const productNome = localStorage.getItem('lastPurchasedProductNome') || '';
      localStorage.removeItem('lastPurchasedProductId');
      localStorage.removeItem('lastPurchasedProductNome');

      const isRape = productNome.toLowerCase().includes('rap');
      if (isRape) {
        setShowRapeInstructions(true);
      } else {
        toast.success('Compra realizada com sucesso!', {
          description: productNome ? `Obrigado pela compra de ${productNome}!` : undefined,
          duration: 6000,
        });
      }
    } else if (paymentStatus === 'pending') {
      toast.info('Pagamento em processamento', {
        description: 'Seu pagamento está sendo processado.',
        duration: 6000,
      });
    } else if (paymentStatus === 'failure') {
      toast.error('Pagamento não aprovado', {
        description: 'Houve um problema com seu pagamento. Tente novamente.',
        duration: 6000,
      });
    }
  }, [searchParams, setSearchParams]);

  const handleComprar = (produto: Produto) => {
    if (!user) {
      toast.error('Faça login para comprar', {
        description: 'Você precisa estar logado para realizar compras.',
      });
      return;
    }
    setProductToCheckout(produto);
    setIsCheckoutModalOpen(true);
  };

  const handleViewInfo = (produto: Produto) => {
    setProductToView(produto);
    setIsInfoModalOpen(true);
  };

  // Queries
  const { data: produtos, isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('destaque', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Produto[];
    },
  });

  const { data: categorias } = useQuery({
    queryKey: ['categorias-produto'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_produto')
        .select('*')
        .eq('ativo', true)
        .order('ordem');
      if (error) throw error;
      return data as CategoriaProduto[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Produto removido com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
    onError: () => toast.error('Erro ao remover produto'),
  });

  // Filtrar + ordenar produtos
  const filteredProducts = useMemo(() => {
    if (!produtos) return [];

    const result = produtos.filter((p) => {
      const matchesSearch =
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'todas' || p.categoria === selectedCategory;
      const isVisible = isAdmin || p.ativo;
      return matchesSearch && matchesCategory && isVisible;
    });

    return result.sort((a, b) => {
      // Esgotados sempre no fim
      if (a.estoque === 0 && b.estoque > 0) return 1;
      if (b.estoque === 0 && a.estoque > 0) return -1;

      switch (sortBy) {
        case 'menor_preco':
          return (a.preco_promocional || a.preco) - (b.preco_promocional || b.preco);
        case 'maior_preco':
          return (b.preco_promocional || b.preco) - (a.preco_promocional || a.preco);
        case 'mais_recente':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default: // destaque
          if (a.destaque && !b.destaque) return -1;
          if (!a.destaque && b.destaque) return 1;
          return 0;
      }
    });
  }, [produtos, searchTerm, selectedCategory, isAdmin, sortBy]);

  const formatPrice = (centavos: number) =>
    (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const chipCls = (active: boolean) =>
    cn(
      'px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
      active
        ? 'bg-primary text-primary-foreground'
        : 'bg-muted text-muted-foreground hover:text-foreground'
    );

  const isFiltering = searchTerm || selectedCategory !== 'todas';

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={ShoppingBag}
        title="Loja"
        description="Produtos artesanais e itens sagrados para sua jornada."
      />

      {isAdmin && (
        <AdminFab
          actions={[{ icon: Plus, label: 'Novo Produto', onClick: () => setIsCreateModalOpen(true) }]}
        />
      )}

      {/* Barra de busca + ordenação */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-3">
          <SearchInput
            placeholder="O que você está procurando?"
            value={searchTerm}
            onChange={setSearchTerm}
            containerClassName="flex-1"
          />
          <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
            <SelectTrigger className="w-auto gap-2 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="destaque">Destaque</SelectItem>
              <SelectItem value="menor_preco">Menor preço</SelectItem>
              <SelectItem value="maior_preco">Maior preço</SelectItem>
              <SelectItem value="mais_recente">Mais recente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chips de categoria */}
        {categorias && categorias.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button className={chipCls(selectedCategory === 'todas')} onClick={() => setSelectedCategory('todas')}>
              Todas
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                className={chipCls(selectedCategory === cat.nome)}
                onClick={() => setSelectedCategory(selectedCategory === cat.nome ? 'todas' : cat.nome)}
              >
                {cat.nome}
              </button>
            ))}
          </div>
        )}

        {/* Contagem de resultados */}
        {!isLoading && produtos && (
          <p className="text-xs text-muted-foreground">
            {filteredProducts.length === 0
              ? 'Nenhum produto encontrado'
              : `${filteredProducts.length} produto${filteredProducts.length !== 1 ? 's' : ''}${isFiltering ? ' encontrado' + (filteredProducts.length !== 1 ? 's' : '') : ''}`}
          </p>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 text-center bg-card/30 rounded-[2rem] border-2 border-dashed">
          {isFiltering ? (
            <NoResultsState query={searchTerm} />
          ) : (
            <EmptyState
              icon={Package}
              title="A loja está descansando..."
              description="Em breve teremos novos itens sagrados disponíveis para você."
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map((produto) => (
            <div
              key={produto.id}
              className={cn(
                'group relative flex flex-col h-full bg-card rounded-[1.5rem] border border-border/40 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1',
                !produto.ativo && 'opacity-60'
              )}
            >
              {/* Imagem */}
              <div className="relative aspect-square overflow-hidden bg-muted">
                {produto.imagem_url ? (
                  <img
                    src={produto.imagem_url}
                    alt={produto.nome}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-muted-foreground/20" />
                  </div>
                )}

                {/* Overlay desktop */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full w-10 h-10 shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                    onClick={() => handleViewInfo(produto)}
                  >
                    <Info className="w-5 h-5" />
                  </Button>
                </div>

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
                  {produto.destaque && (
                    <Badge className="bg-amber-500 hover:bg-amber-500 text-[9px] uppercase font-black tracking-tighter border-none px-2 h-5">
                      <Star className="w-2.5 h-2.5 mr-1 fill-white" /> Destaque
                    </Badge>
                  )}
                  {produto.preco_promocional && (
                    <Badge className="bg-red-500 hover:bg-red-500 text-[9px] uppercase font-black tracking-tighter border-none px-2 h-5">
                      Promoção
                    </Badge>
                  )}
                  {!produto.ativo && isAdmin && (
                    <Badge variant="secondary" className="text-[9px] uppercase font-black tracking-tighter h-5">Inativo</Badge>
                  )}
                </div>

                {/* Categoria */}
                {produto.categoria && (
                  <div className="absolute bottom-2 right-2">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-background/80 backdrop-blur-sm text-foreground px-2 py-1 rounded-lg border shadow-sm">
                      {produto.categoria}
                    </span>
                  </div>
                )}

                {/* Info mobile */}
                <button
                  type="button"
                  className="md:hidden absolute top-2 right-2 h-8 w-8 rounded-full bg-background/90 flex items-center justify-center shadow-lg active:scale-90 transition-transform z-10"
                  onClick={(e) => { e.stopPropagation(); handleViewInfo(produto); }}
                >
                  <Info className="w-4 h-4 text-primary" />
                </button>
              </div>

              {/* Conteúdo */}
              <div className="flex flex-col flex-grow p-3 md:p-5">
                <div className="flex-grow">
                  <h3 className="font-display text-sm md:text-base font-bold text-foreground leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">
                    {produto.nome}
                  </h3>
                  {produto.descricao && (
                    <p className="text-[11px] md:text-xs text-muted-foreground line-clamp-1 mb-3">
                      {produto.descricao}
                    </p>
                  )}
                </div>

                <div className="mt-auto space-y-3">
                  {/* Preço */}
                  <div className="flex flex-col">
                    {produto.preco_promocional ? (
                      <div className="flex flex-col -space-y-1">
                        <span className="text-[10px] text-muted-foreground line-through opacity-60">
                          {formatPrice(produto.preco)}
                        </span>
                        <span className="text-lg md:text-xl font-black text-primary">
                          {formatPrice(produto.preco_promocional)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg md:text-xl font-black text-foreground">
                        {formatPrice(produto.preco)}
                      </span>
                    )}
                  </div>

                  {/* Estoque baixo */}
                  {produto.estoque <= 5 && produto.estoque > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 rounded-lg w-fit">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <p className="text-[9px] md:text-[10px] font-bold text-amber-600 uppercase">
                        Resta {produto.estoque} unidade{produto.estoque > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <Button
                      className={cn(
                        'w-full rounded-xl h-10 md:h-11 font-bold transition-all group/btn',
                        produto.estoque === 0
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/10'
                      )}
                      disabled={produto.estoque === 0}
                      onClick={() => handleComprar(produto)}
                    >
                      {produto.estoque === 0 ? (
                        'Esgotado'
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2 group-hover/btn:translate-x-1 transition-transform" />
                          Comprar
                        </>
                      )}
                    </Button>

                    {isAdmin && (
                      <div className="flex gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary"
                          onClick={() => { setProductToEdit(produto); setIsEditModalOpen(true); }}
                        >
                          <Pencil className="w-3 h-3 mr-1" /> Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3 h-3 mr-1" /> Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2rem] border-none">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir {produto.nome}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação removerá o produto permanentemente da loja.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Voltar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(produto.id)}
                                className="bg-destructive text-white rounded-xl"
                              >
                                Confirmar Exclusão
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modais */}
      <ProductFormDialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
        categorias={categorias || []}
      />
      <ProductFormDialog
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setProductToEdit(null); }}
        mode="edit"
        product={productToEdit}
        categorias={categorias || []}
      />
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => { setIsCheckoutModalOpen(false); setProductToCheckout(null); }}
        produto={productToCheckout}
        userEmail={user?.email || ''}
        userName={user?.user_metadata?.full_name || ''}
      />
      <LojaInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => { setIsInfoModalOpen(false); setProductToView(null); }}
        produto={productToView}
        onComprar={() => productToView && handleComprar(productToView)}
      />
      <RapeInstructionsModal
        isOpen={showRapeInstructions}
        onClose={() => setShowRapeInstructions(false)}
      />
    </PageContainer>
  );
};

export default Loja;
