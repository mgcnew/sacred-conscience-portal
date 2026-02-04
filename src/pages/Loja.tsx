import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader, PageContainer } from '@/components/shared';
import { ShoppingBag, Plus, Search, Package, Pencil, Trash2, Star, Info, Filter, ArrowRight, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import ProductFormDialog from '@/components/loja/ProductFormDialog';
import CheckoutModal from '@/components/loja/CheckoutModal';
import LojaInfoModal from '@/components/loja/LojaInfoModal';
import RapeInstructionsModal from '@/components/loja/RapeInstructionsModal';
import { AdminFab } from '@/components/ui/admin-fab';
import { EmptyState, NoResultsState } from '@/components/ui/empty-state';
import type { Produto, CategoriaProduto } from '@/types';

const Loja: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
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
    
    if (paymentStatus) {
      searchParams.delete('payment');
      setSearchParams(searchParams, { replace: true });

      if (paymentStatus === 'success') {
        // Mostrar modal com instruções do rapé
        setShowRapeInstructions(true);
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
    }
  }, [searchParams, setSearchParams]);

  const handleComprar = useCallback((produto: Produto) => {
    if (!user) {
      toast.error('Faça login para comprar', {
        description: 'Você precisa estar logado para realizar compras.',
      });
      return;
    }
    setProductToCheckout(produto);
    setIsCheckoutModalOpen(true);
  }, [user]);

  const handleViewInfo = useCallback((produto: Produto) => {
    setProductToView(produto);
    setIsInfoModalOpen(true);
  }, []);

  const handleCloseInfo = useCallback(() => {
    setIsInfoModalOpen(false);
    setProductToView(null);
  }, []);

  const handleCloseCheckout = useCallback(() => {
    setIsCheckoutModalOpen(false);
    setProductToCheckout(null);
  }, []);

  // Buscar produtos
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

  // Buscar categorias
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

  // Mutation para deletar produto
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Produto removido com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
    onError: () => {
      toast.error('Erro ao remover produto');
    },
  });

  // Filtrar produtos
  const filteredProducts = produtos?.filter((produto) => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'todas' || produto.categoria === selectedCategory;
    // Admins veem todos, usuários só veem ativos
    const isVisible = isAdmin || produto.ativo;
    return matchesSearch && matchesCategory && isVisible;
  });

  // Formatar preço
  const formatPrice = (centavos: number): string => {
    return (centavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleEdit = (produto: Produto) => {
    setProductToEdit(produto);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={ShoppingBag}
        title="Loja"
        description="Produtos artesanais e itens sagrados para sua jornada."
      />

      {/* FAB para admin criar produto */}
      {isAdmin && (
        <AdminFab
          actions={[
            {
              icon: Plus,
              label: 'Novo Produto',
              onClick: () => setIsCreateModalOpen(true),
            },
          ]}
        />
      )}

      {/* Filtros e Categorias */}
      <div className="space-y-6 mb-10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="O que você está procurando?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 rounded-2xl border-muted bg-card/50 focus-visible:ring-primary/20"
            />
          </div>
          <div className="hidden md:block">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px] h-12 rounded-2xl border-muted bg-card/50">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categorias?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.nome}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chips de Categoria (Mobile & Quick Access) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Button
            variant={selectedCategory === 'todas' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('todas')}
            className="rounded-full h-8 px-4 text-[11px] uppercase tracking-wider font-bold"
          >
            Todas
          </Button>
          {categorias?.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.nome ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.nome)}
              className="rounded-full h-8 px-4 text-[11px] uppercase tracking-wider font-bold whitespace-nowrap"
            >
              {cat.nome}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid de produtos */}
      {!filteredProducts || filteredProducts.length === 0 ? (
        <div className="py-20 text-center bg-card/30 rounded-[2rem] border-2 border-dashed">
          {searchTerm || selectedCategory !== 'todas' ? (
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
                "group relative flex flex-col h-full bg-card rounded-[1.5rem] border border-border/40 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1",
                !produto.ativo && "opacity-60"
              )}
            >
              {/* Container da Imagem */}
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
                
                {/* Overlay de Ações Rápidas (Desktop) */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center gap-2">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="rounded-full w-10 h-10 shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                    onClick={() => handleViewInfo(produto)}
                  >
                    <Info className="w-5 h-5" />
                  </Button>
                </div>

                {/* Badges Flutuantes */}
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

                {/* Categoria Badge */}
                {produto.categoria && (
                  <div className="absolute bottom-2 right-2">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-background/80 backdrop-blur-sm text-foreground px-2 py-1 rounded-lg border shadow-sm">
                      {produto.categoria}
                    </span>
                  </div>
                )}

                {/* Info Button (Mobile Only) */}
                <button
                  type="button"
                  className="md:hidden absolute top-2 right-2 h-8 w-8 rounded-full bg-background/90 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewInfo(produto);
                  }}
                >
                  <Info className="w-4 h-4 text-primary" />
                </button>
              </div>

              {/* Conteúdo do Produto */}
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
                        "w-full rounded-xl h-10 md:h-11 font-bold transition-all group/btn",
                        produto.estoque === 0 ? "bg-muted text-muted-foreground" : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/10"
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

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleEdit(produto)}
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
        onClose={() => {
          setIsEditModalOpen(false);
          setProductToEdit(null);
        }}
        mode="edit"
        product={productToEdit}
        categorias={categorias || []}
      />

      {/* Modal de Checkout */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={handleCloseCheckout}
        produto={productToCheckout}
        userEmail={user?.email || ''}
        userName={user?.email || ''}
      />

      {/* Modal de Informações do Produto */}
      <LojaInfoModal
        isOpen={isInfoModalOpen}
        onClose={handleCloseInfo}
        produto={productToView}
        onComprar={() => productToView && handleComprar(productToView)}
      />

      {/* Modal de Instruções do Rapé - Após Compra */}
      <RapeInstructionsModal
        isOpen={showRapeInstructions}
        onClose={() => setShowRapeInstructions(false)}
      />
    </PageContainer>
  );
};

export default Loja;
