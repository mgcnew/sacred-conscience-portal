import { useState, useMemo, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Plus, Users } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { TOAST_MESSAGES, ROUTES } from '@/constants';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PaymentModal from '@/components/cerimonias/PaymentModal';
import SuccessModal from '@/components/cerimonias/SuccessModal';
import CeremonyFormDialog from '@/components/cerimonias/CeremonyFormDialog';
import CerimoniasLista from '@/components/cerimonias/CerimoniasLista';
import CerimoniasHistorico from '@/components/cerimonias/CerimoniasHistorico';
import CerimoniasFilters from '@/components/cerimonias/CerimoniasFilters';
import CerimoniaSkeleton from '@/components/cerimonias/CerimoniaSkeleton';
import CerimoniaInfoModal from '@/components/cerimonias/CerimoniaInfoModal';
import ListaPresentes from '@/components/cerimonias/ListaPresentes';
import { useCerimoniasFuturas, useVagasPorCerimonia, useMinhasInscricoes, useMinhaListaEspera, useEntrarListaEspera, useSairListaEspera, useMeuPerfil } from '@/hooks/queries';
import { useTemAlgumaPermissao } from '@/hooks/queries/usePermissoes';
import { AdminFab } from '@/components/ui/admin-fab';
import { parseDateString } from '@/lib/date-utils';
import type { Cerimonia } from '@/types';

const Cerimonias: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Verificar se pode ver lista de presentes (guardião, admin ou super_admin)
  const podeVerListaPresentes = useTemAlgumaPermissao(['ver_cerimonias', 'gerenciar_cerimonias', 'super_admin']);

  // Tab ativa (pode vir da URL)
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'historico' ? 'historico' : tabFromUrl === 'presentes' ? 'presentes' : 'proximas');

  // Limpar parâmetro tab da URL após ler
  useEffect(() => {
    if (tabFromUrl) {
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    }
  }, [tabFromUrl, searchParams, setSearchParams]);

  // Tratar retorno do Mercado Pago
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus) {
      searchParams.delete('payment');
      setSearchParams(searchParams, { replace: true });
      queryClient.invalidateQueries({ queryKey: ['minhas-inscricoes'] });
      queryClient.invalidateQueries({ queryKey: ['vagas-cerimonias'] });

      if (paymentStatus === 'success') {
        toast.success('Pagamento realizado com sucesso!', {
          description: 'Sua inscrição foi confirmada. Você receberá um email com os detalhes.',
          duration: 6000,
        });
      } else if (paymentStatus === 'pending') {
        toast.info('Pagamento em processamento', {
          description: 'Seu pagamento está sendo processado. Você será notificado quando for confirmado.',
          duration: 6000,
        });
      } else if (paymentStatus === 'failure') {
        toast.error('Pagamento não aprovado', {
          description: 'Houve um problema com seu pagamento. Tente novamente ou escolha outra forma de pagamento.',
          duration: 6000,
        });
      }
    }
  }, [searchParams, setSearchParams, queryClient]);

  const [selectedCeremony, setSelectedCeremony] = useState<Cerimonia | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [confirmedCeremonyName, setConfirmedCeremonyName] = useState('');
  const [ceremonyToEdit, setCeremonyToEdit] = useState<Cerimonia | null>(null);
  const [ceremonyToView, setCeremonyToView] = useState<Cerimonia | null>(null);
  const [loadingCerimoniaId, setLoadingCerimoniaId] = useState<string | null>(null);

  // Filtros
  const [selectedConsagracao, setSelectedConsagracao] = useState('todas');
  const [selectedMes, setSelectedMes] = useState('todos');

  const { data: cerimonias, isLoading } = useCerimoniasFuturas();

  // Lista de espera
  const { data: minhaListaEspera } = useMinhaListaEspera(user?.id);
  const entrarListaEspera = useEntrarListaEspera();
  const sairListaEspera = useSairListaEspera();

  const { data: userAnamnese } = useQuery({
    queryKey: ['user-anamnese', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('anamneses')
        .select('id, nome_completo')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const hasAnamnese = !!userAnamnese;
  const cerimoniaIds = useMemo(() => cerimonias?.map(c => c.id) || [], [cerimonias]);
  const { data: vagasInfo } = useVagasPorCerimonia(cerimoniaIds);
  const { data: minhasInscricoes } = useMinhasInscricoes(user?.id);
  const { data: meuPerfil } = useMeuPerfil(user?.id);

  // Extrair nomes de consagrações únicos para o filtro
  const consagracoesUnicas = useMemo(() => {
    if (!cerimonias) return [];
    const nomes = cerimonias
      .map(c => c.nome)
      .filter((n): n is string => !!n);
    return [...new Set(nomes)].sort();
  }, [cerimonias]);

  // Aplicar filtros
  const cerimoniasFiltradas = useMemo(() => {
    if (!cerimonias) return [];
    return cerimonias.filter(c => {
      // Filtro por nome da consagração
      if (selectedConsagracao !== 'todas' && c.nome !== selectedConsagracao) {
        return false;
      }
      // Filtro por mês
      if (selectedMes !== 'todos') {
        const mesCerimonia = parseDateString(c.data).getMonth() + 1;
        if (mesCerimonia !== parseInt(selectedMes)) {
          return false;
        }
      }
      return true;
    });
  }, [cerimonias, selectedConsagracao, selectedMes]);

  // Mapear lista de espera para formato esperado pelo componente
  const listaEsperaFormatada = useMemo(() => {
    if (!minhaListaEspera) return [];
    return minhaListaEspera.map(le => ({
      cerimoniaId: le.cerimonia_id,
      posicao: le.posicao,
    }));
  }, [minhaListaEspera]);

  // Mutations
  const inscreverMutation = useMutation({
    mutationFn: async ({ cerimoniaId, formaPagamento }: { cerimoniaId: string, formaPagamento: string }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      // Verificar se usuário está bloqueado para cerimônias
      if (meuPerfil?.bloqueado && meuPerfil?.bloqueado_cerimonias) {
        throw new Error('Você está bloqueado e não pode se inscrever em cerimônias. Entre em contato com a administração.');
      }
      
      const { data, error } = await supabase
        .from('inscricoes')
        .insert({ user_id: user.id, cerimonia_id: cerimoniaId, forma_pagamento: formaPagamento })
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhas-inscricoes'] });
      queryClient.invalidateQueries({ queryKey: ['vagas-cerimonias'] });
      queryClient.invalidateQueries({ queryKey: ['historico-inscricoes'] });
      const ceremonyName = selectedCeremony?.nome || selectedCeremony?.medicina_principal || 'Cerimônia';
      setIsPaymentModalOpen(false);
      setSelectedCeremony(null);
      setConfirmedCeremonyName(ceremonyName);
      setIsSuccessModalOpen(true);
    },
    onError: (error) => {
      console.error(error);
      if (error.message.includes('bloqueado')) {
        toast.error('Acesso bloqueado', { description: error.message });
      } else {
        toast.error(TOAST_MESSAGES.inscricao.erro.title, { description: TOAST_MESSAGES.inscricao.erro.description });
      }
    }
  });

  const cancelarMutation = useMutation({
    mutationFn: async (cerimoniaId: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase.from('inscricoes').delete().eq('user_id', user.id).eq('cerimonia_id', cerimoniaId);
      if (error) throw error;
    },
    onSuccess: () => {
      setLoadingCerimoniaId(null);
      toast.success(TOAST_MESSAGES.inscricao.cancelada.title, { description: TOAST_MESSAGES.inscricao.cancelada.description });
      queryClient.invalidateQueries({ queryKey: ['minhas-inscricoes'] });
      queryClient.invalidateQueries({ queryKey: ['vagas-cerimonias'] });
      queryClient.invalidateQueries({ queryKey: ['historico-inscricoes'] });
    },
    onError: (error) => {
      setLoadingCerimoniaId(null);
      console.error(error);
      toast.error(TOAST_MESSAGES.inscricao.erro.title, { description: 'Não foi possível cancelar sua inscrição. Tente novamente.' });
    }
  });

  const deleteCeremonyMutation = useMutation({
    mutationFn: async (cerimoniaId: string) => {
      const { error } = await supabase.from('cerimonias').delete().eq('id', cerimoniaId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(TOAST_MESSAGES.cerimonia.removida.title, { description: TOAST_MESSAGES.cerimonia.removida.description });
      queryClient.invalidateQueries({ queryKey: ['cerimonias'] });
      queryClient.invalidateQueries({ queryKey: ['admin-cerimonias'] });
    },
    onError: (error) => {
      console.error(error);
      toast.error(TOAST_MESSAGES.cerimonia.erro.title, { description: 'Não foi possível excluir a cerimônia. Tente novamente.' });
    }
  });

  const handleOpenPayment = useCallback((cerimonia: Cerimonia) => {
    if (!hasAnamnese) {
      toast.error('Ficha de Anamnese Pendente', {
        description: 'Você precisa preencher sua ficha de anamnese antes de participar das cerimônias.',
        action: { label: 'Preencher Ficha', onClick: () => navigate(ROUTES.ANAMNESE) },
      });
      return;
    }
    setLoadingCerimoniaId(null);
    setSelectedCeremony(cerimonia);
    setIsPaymentModalOpen(true);
  }, [hasAnamnese, navigate]);

  const handleConfirmPayment = useCallback((paymentMethod: string) => {
    if (selectedCeremony) {
      inscreverMutation.mutate({ cerimoniaId: selectedCeremony.id, formaPagamento: paymentMethod });
    }
  }, [selectedCeremony, inscreverMutation]);

  const handleEditCeremony = useCallback((cerimonia: Cerimonia) => {
    setCeremonyToEdit(cerimonia);
    setIsEditModalOpen(true);
  }, []);

  const handleViewInfo = useCallback((cerimonia: Cerimonia) => {
    setCeremonyToView(cerimonia);
    setIsInfoModalOpen(true);
  }, []);

  const handleEntrarListaEspera = useCallback((cerimoniaId: string) => {
    if (!user?.id) return;
    entrarListaEspera.mutate({ userId: user.id, cerimoniaId });
  }, [user?.id, entrarListaEspera]);

  const handleSairListaEspera = useCallback((cerimoniaId: string) => {
    if (!user?.id) return;
    sairListaEspera.mutate({ userId: user.id, cerimoniaId });
  }, [user?.id, sairListaEspera]);

  const handleClearFilters = useCallback(() => {
    setSelectedConsagracao('todas');
    setSelectedMes('todos');
  }, []);

  const handleCancelarInscricao = useCallback((id: string) => {
    setLoadingCerimoniaId(id);
    cancelarMutation.mutate(id);
  }, [cancelarMutation]);

  const handleDeleteCeremony = useCallback((id: string) => {
    deleteCeremonyMutation.mutate(id);
  }, [deleteCeremonyMutation]);

  const isCerimoniaEsgotada = (cerimoniaId: string) => vagasInfo?.[cerimoniaId]?.esgotado ?? false;
  const getVagasDisponiveis = (cerimoniaId: string) => {
    const info = vagasInfo?.[cerimoniaId];
    if (!info || info.total_vagas === null) return null;
    return info.vagas_disponiveis;
  };
  const isUserInscrito = (cerimoniaId: string) => minhasInscricoes?.includes(cerimoniaId);

  if (isLoading) {
    return (
      <PageContainer maxWidth="xl">
        <PageHeader
          icon={Calendar}
          title="Cerimônias"
          description="Agenda sagrada de cura e expansão."
        />
        <div className="mb-6">
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
        <CerimoniaSkeleton count={6} />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={Calendar}
        title="Cerimônias"
        description="Agenda sagrada de cura e expansão."
      />

      {/* FAB para admin criar cerimônia */}
      {isAdmin && (
        <AdminFab
          actions={[
            {
              icon: Plus,
              label: 'Nova Cerimônia',
              onClick: () => setIsCreateModalOpen(true),
            },
          ]}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative mb-6">
          <TabsList className={cn(
            "w-full h-auto p-0 bg-transparent border-b rounded-none justify-start overflow-x-auto scrollbar-none",
            podeVerListaPresentes ? "grid grid-cols-3 md:inline-flex" : "grid grid-cols-2 md:inline-flex"
          )}>
            <TabsTrigger 
              value="proximas" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all"
            >
              <Calendar className="w-4 h-4 mr-2 hidden sm:inline" />
              Próximas
            </TabsTrigger>
            <TabsTrigger 
              value="historico" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all"
            >
              Histórico
            </TabsTrigger>
            {podeVerListaPresentes && (
              <TabsTrigger 
                value="presentes" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all"
              >
                <Users className="w-4 h-4 mr-2 hidden sm:inline" />
                Presentes
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="proximas">
          <CerimoniasFilters
            consagracoes={consagracoesUnicas}
            selectedConsagracao={selectedConsagracao}
            selectedMes={selectedMes}
            totalResults={cerimoniasFiltradas.length}
            onConsagracaoChange={setSelectedConsagracao}
            onMesChange={setSelectedMes}
            onClearFilters={handleClearFilters}
          />
          <CerimoniasLista
            cerimonias={cerimoniasFiltradas}
            minhasInscricoes={minhasInscricoes}
            minhaListaEspera={listaEsperaFormatada}
            vagasInfo={vagasInfo}
            hasAnamnese={hasAnamnese}
            isAdmin={isAdmin}
            loadingCerimoniaId={loadingCerimoniaId}
            onOpenPayment={handleOpenPayment}
            onCancelarInscricao={handleCancelarInscricao}
            onEntrarListaEspera={handleEntrarListaEspera}
            onSairListaEspera={handleSairListaEspera}
            onEditCeremony={handleEditCeremony}
            onDeleteCeremony={handleDeleteCeremony}
            onViewInfo={handleViewInfo}
          />
        </TabsContent>

        <TabsContent value="historico">
          <CerimoniasHistorico userId={user?.id} />
        </TabsContent>

        {podeVerListaPresentes && (
          <TabsContent value="presentes">
            <ListaPresentes />
          </TabsContent>
        )}
      </Tabs>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={handleConfirmPayment}
        ceremonyTitle={selectedCeremony?.nome || selectedCeremony?.medicina_principal || 'Cerimônia'}
        ceremonyValue={selectedCeremony?.valor ?? null}
        ceremonyId={selectedCeremony?.id || ''}
        userId={user?.id || ''}
        userEmail={user?.email || ''}
        userName={userAnamnese?.nome_completo || user?.email || ''}
        isPending={inscreverMutation.isPending}
      />

      <CeremonyFormDialog isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} mode="create" />
      <CeremonyFormDialog isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setCeremonyToEdit(null); }} mode="edit" ceremony={ceremonyToEdit} />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onComplete={() => { setIsSuccessModalOpen(false); navigate(ROUTES.FAQ, { state: { fromInscription: true } }); }}
        ceremonyName={confirmedCeremonyName}
      />

      <CerimoniaInfoModal
        cerimonia={ceremonyToView}
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        isEsgotada={ceremonyToView ? isCerimoniaEsgotada(ceremonyToView.id) : false}
        vagasDisponiveis={ceremonyToView ? getVagasDisponiveis(ceremonyToView.id) : null}
      />
    </PageContainer>
  );
};

export default Cerimonias;
