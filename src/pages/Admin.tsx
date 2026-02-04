import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton, CardSkeleton } from '@/components/ui/table-skeleton';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { PaginationControls } from '@/components/ui/pagination-controls';
import {
  MobileCard,
  MobileCardHeader,
  MobileCardRow,
  MobileCardActions,
} from '@/components/ui/responsive-table';
import { HistoricoConsagracoesDialog } from '@/components/admin/HistoricoConsagracoesDialog';
import { ConsagradorActions, BloqueadoBadge } from '@/components/admin/ConsagradorActions';
import ParticipantesList from '@/components/admin/ParticipantesList';
import { CursosTab } from '@/components/admin/CursosTab';
import { FluxoCaixaTab } from '@/components/admin/FluxoCaixaTab';
import { LogsTab } from '@/components/admin/LogsTab';
import { TaxasMPTab } from '@/components/admin/TaxasMPTab';
import { DashboardTab } from '@/components/admin/DashboardTab';
import { VendasTab } from '@/components/admin/VendasTab';
import { DepoimentosTab } from '@/components/admin/DepoimentosTab';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Users,
  User,
  Calendar,
  Search,
  FileText,
  Shield,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  DollarSign,
  CreditCard,
  MessageSquareQuote,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  History,
  ShoppingBag,
  GraduationCap,
  Wallet,
  Info,
  Activity,
  Percent,
  RotateCcw,
  Save,
  Check,
  Loader2,
} from 'lucide-react';
import { useCategoriasFinanceiras, useCreateTransacao } from '@/hooks/queries/useFluxoCaixa';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

// Helper para formatar data sem problemas de timezone
// Recebe string no formato YYYY-MM-DD e retorna DD/MM/YYYY
import { formatDateBR, isDatePast } from '@/lib/date-utils';
import { TOAST_MESSAGES, PAGINATION } from '@/constants';
import { exportToCSV } from '@/lib/csv-export';
import {
  useProfiles,
  useAnamneses,
  useCerimoniasAdmin,
  useInscricoesAdmin,
  useDepoimentosPendentes,
  useRoles,
  useUserRoles,

  useMinhasPermissoes,
  usePagamentosProdutos,
} from '@/hooks/queries';
import { useCheckPermissao } from '@/components/auth/PermissionGate';
import { PermissoesTab } from '@/components/admin/PermissoesTab';
import type {
  Profile,
  Anamnese,
  AnamneseFilterType,
  DateFilterType,
} from '@/types';

const ITEMS_PER_PAGE = PAGINATION.ITEMS_PER_PAGE;

const Admin: React.FC = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedAnamnese, setSelectedAnamnese] = useState<Anamnese | null>(null);
  const [expandedAnamnese, setExpandedAnamnese] = useState(false);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);
  const [consagradoresPage, setConsagradoresPage] = useState(1);
  const [inscricoesPage, setInscricoesPage] = useState(1);
  
  // State para o dialog de histórico de consagrações (Requirements: 1.1)
  const [historicoDialogUserId, setHistoricoDialogUserId] = useState<string | null>(null);
  const [historicoDialogUserName, setHistoricoDialogUserName] = useState<string>('');
  
  // State para drawer de detalhes do usuário (mobile)
  const [detalhesDrawerOpen, setDetalhesDrawerOpen] = useState(false);
  const [detalhesDrawerProfile, setDetalhesDrawerProfile] = useState<Profile | null>(null);
  const [detalhesDrawerAnamnese, setDetalhesDrawerAnamnese] = useState<Anamnese | null>(null);
  
  // Handlers para abrir/fechar dialog de histórico
  const handleOpenHistorico = (userId: string, userName: string) => {
    setHistoricoDialogUserId(userId);
    setHistoricoDialogUserName(userName);
  };
  
  const handleCloseHistorico = () => {
    setHistoricoDialogUserId(null);
    setHistoricoDialogUserName('');
  };
  
  // Handler para abrir drawer de detalhes (mobile)
  const handleOpenDetalhesDrawer = (profile: Profile, anamnese: Anamnese | null) => {
    setDetalhesDrawerProfile(profile);
    setDetalhesDrawerAnamnese(anamnese);
    setExpandedAnamnese(false);
    setDetalhesDrawerOpen(true);
  };
  
  // New filter states
  const [dateFilter, setDateFilter] = useState<DateFilterType>('todos');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [anamneseFilter, setAnamneseFilter] = useState<AnamneseFilterType>('todos');
  const [expandedCerimonias, setExpandedCerimonias] = useState<Set<string>>(new Set());
  const [selectedCerimoniaId, setSelectedCerimoniaId] = useState<string>('todas');
  
  // State para cancelamento de inscrição
  const [cancelInscricaoDialog, setCancelInscricaoDialog] = useState<{
    open: boolean;
    inscricaoId: string | null;
    userName: string;
  }>({ open: false, inscricaoId: null, userName: '' });
  const [motivoCancelamento, setMotivoCancelamento] = useState('');

  // Queries usando hooks customizados (Requirements: 6.2)
  const { data: profiles, isLoading: isLoadingProfiles } = useProfiles();
  const { data: roles } = useRoles();
  const { data: userRoles } = useUserRoles();
  const { data: anamneses } = useAnamneses();
  const { data: cerimonias, isLoading: isLoadingCerimonias } = useCerimoniasAdmin();
  const { data: inscricoes, isLoading: isLoadingInscricoes } = useInscricoesAdmin();
  const { data: categoriasFinanceiras } = useCategoriasFinanceiras();

  const { data: depoimentosPendentes, isLoading: isLoadingDepoimentos, error: depoimentosError } = useDepoimentosPendentes();
  const { data: pagamentosProdutos, isLoading: isLoadingPagamentos } = usePagamentosProdutos();
  
  // Estado para confirmação de pagamento e valor
  const [paymentConfirmDialog, setPaymentConfirmDialog] = useState<{
    open: boolean;
    inscricaoId: string | null;
    valor: string;
    nomeParticipante: string;
    nomeCerimonia: string;
    cerimoniaId: string | null;
    userId: string | null;
    formaPagamento: string | null;
  }>({
    open: false,
    inscricaoId: null,
    valor: '',
    nomeParticipante: '',
    nomeCerimonia: '',
    cerimoniaId: null,
    userId: null,
    formaPagamento: null,
  });

  // Permissões
  const { temPermissao, temPermissaoExplicita, isSuperAdmin } = useCheckPermissao();



  // Mutation para aprovar depoimento
  const approveDepoimentoMutation = useMutation({
    mutationFn: async (depoimentoId: string) => {
      const { error } = await supabase
        .from('depoimentos')
        .update({ aprovado: true, approved_at: new Date().toISOString() })
        .eq('id', depoimentoId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(TOAST_MESSAGES.depoimento.aprovado.title, {
        description: TOAST_MESSAGES.depoimento.aprovado.description,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-depoimentos-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['depoimentos-aprovados'] });
    },
    onError: () => {
      toast.error(TOAST_MESSAGES.depoimento.erroAprovar.title, {
        description: TOAST_MESSAGES.depoimento.erroAprovar.description,
      });
    }
  });

  // Mutation para rejeitar/deletar depoimento
  const rejectDepoimentoMutation = useMutation({
    mutationFn: async (depoimentoId: string) => {
      const { error } = await supabase
        .from('depoimentos')
        .delete()
        .eq('id', depoimentoId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(TOAST_MESSAGES.depoimento.rejeitado.title, {
        description: TOAST_MESSAGES.depoimento.rejeitado.description,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-depoimentos-pendentes'] });
    },
    onError: () => {
      toast.error(TOAST_MESSAGES.depoimento.erroRejeitar.title, {
        description: TOAST_MESSAGES.depoimento.erroRejeitar.description,
      });
    }
  });

  // Mutation para atualizar status de pagamento
  const togglePaymentMutation = useMutation({
    mutationFn: async ({ inscricaoId, pago, valor, cerimoniaId, userId, formaPagamento, nomeParticipante }: { 
      inscricaoId: string; 
      pago: boolean;
      valor?: number;
      cerimoniaId?: string;
      userId?: string;
      formaPagamento?: string | null;
      nomeParticipante?: string;
    }) => {
      setUpdatingPaymentId(inscricaoId);
      
      // 1. Atualizar status da inscrição
      const { error: errorInscricao } = await supabase
        .from('inscricoes')
        .update({ pago })
        .eq('id', inscricaoId);
      
      if (errorInscricao) throw errorInscricao;

      // 2. Se for marcado como pago e tiver valor, criar entrada no financeiro
      if (pago && valor && valor > 0) {
        // Buscar categoria 'Cerimônias'
        const categoriaCerimonias = categoriasFinanceiras?.find(c => c.nome === 'Cerimônias' && c.tipo === 'entrada');
        
        const { error: errorFinanceiro } = await supabase
          .from('transacoes_financeiras')
          .insert({
            tipo: 'entrada',
            descricao: `Pagamento Inscrição - ${nomeParticipante || inscricaoId}`,
            valor: valor, // valor já vem em centavos
            data: new Date().toISOString().split('T')[0],
            categoria_id: categoriaCerimonias?.id || null,
            forma_pagamento: formaPagamento || 'Outros',
            referencia_tipo: 'inscricao',
            referencia_id: inscricaoId,
            created_by: userId || null,
          });
        
        if (errorFinanceiro) {
          console.error('Erro ao criar registro financeiro:', errorFinanceiro);
          // Não lançamos erro aqui para não travar a atualização da inscrição, 
          // mas notificamos o log
        }
      }

      return pago;
    },
    onSuccess: (pago) => {
      const msg = pago ? TOAST_MESSAGES.pagamento.confirmado : TOAST_MESSAGES.pagamento.pendente;
      toast.success(msg.title, {
        description: pago 
          ? 'Pagamento confirmado e entrada registrada no caixa.' 
          : 'Status de pagamento alterado para pendente.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-inscricoes'] });
      queryClient.invalidateQueries({ queryKey: ['transacoes-financeiras'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-financeiro'] });
      setUpdatingPaymentId(null);
      setPaymentConfirmDialog(prev => ({ ...prev, open: false }));
    },
    onError: () => {
      toast.error(TOAST_MESSAGES.pagamento.erro.title, {
        description: TOAST_MESSAGES.pagamento.erro.description,
      });
      setUpdatingPaymentId(null);
    }
  });

  // Mutation para cancelar inscrição
  const cancelInscricaoMutation = useMutation({
    mutationFn: async ({ inscricaoId, motivo }: { inscricaoId: string; motivo: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('inscricoes')
        .update({
          cancelada: true,
          cancelada_em: new Date().toISOString(),
          cancelada_por: user?.id,
          motivo_cancelamento: motivo || null,
        })
        .eq('id', inscricaoId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Inscrição cancelada', {
        description: 'A inscrição foi cancelada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-inscricoes'] });
      setCancelInscricaoDialog({ open: false, inscricaoId: null, userName: '' });
      setMotivoCancelamento('');
    },
    onError: () => {
      toast.error('Erro ao cancelar', {
        description: 'Não foi possível cancelar a inscrição.',
      });
    }
  });

  const handleCancelInscricao = () => {
    if (cancelInscricaoDialog.inscricaoId) {
      cancelInscricaoMutation.mutate({
        inscricaoId: cancelInscricaoDialog.inscricaoId,
        motivo: motivoCancelamento,
      });
    }
  };

  const handleTogglePayment = (inscricao: any, checked: boolean) => {
    if (checked) {
      // Se estiver marcando como pago, abrir diálogo de confirmação de valor
      const valorSugerido = inscricao.cerimonias?.valor 
        ? (inscricao.cerimonias.valor / 100).toString() 
        : '';
        
      setPaymentConfirmDialog({
        open: true,
        inscricaoId: inscricao.id,
        valor: valorSugerido,
        nomeParticipante: inscricao.profiles?.full_name || 'Participante',
        nomeCerimonia: inscricao.cerimonias?.nome || inscricao.cerimonias?.medicina_principal || 'Cerimônia',
        cerimoniaId: inscricao.cerimonia_id,
        userId: inscricao.user_id,
        formaPagamento: inscricao.forma_pagamento,
      });
    } else {
      // Se estiver desmarcando, apenas atualizar status
      togglePaymentMutation.mutate({ inscricaoId: inscricao.id, pago: false });
    }
  };

  // Mutation para alterar role de usuário
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string | null }) => {
      setUpdatingRoleUserId(userId);
      // Primeiro, remover roles existentes do usuário
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Se newRole é null (consagrador), não adiciona nenhum role
      if (newRole === null) return;

      // Buscar o ID do role
      const roleData = roles?.find(r => r.role === newRole);
      if (!roleData) throw new Error('Role não encontrado');

      // Adicionar novo role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleData.id });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success(TOAST_MESSAGES.role.atualizado.title, {
        description: TOAST_MESSAGES.role.atualizado.description,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      setUpdatingRoleUserId(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error(TOAST_MESSAGES.role.erro.title, {
        description: TOAST_MESSAGES.role.erro.description,
      });
      setUpdatingRoleUserId(null);
    }
  });

  // Helper to get date range based on filter
  const getDateRange = (filter: DateFilterType): { from: Date | null; to: Date | null } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'hoje':
        return { from: today, to: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'semana': {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { from: weekAgo, to: now };
      }
      case 'mes': {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { from: monthAgo, to: now };
      }
      case 'personalizado':
        return {
          from: dateFrom ? new Date(dateFrom) : null,
          to: dateTo ? new Date(dateTo + 'T23:59:59') : null
        };
      default:
        return { from: null, to: null };
    }
  };

  // Filtered Profiles with date and anamnese filters (memoized for performance)
  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    
    return profiles.filter(profile => {
      // Text search filter
      const matchesSearch = 
        profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.referral_source?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      // Date filter
      const { from, to } = getDateRange(dateFilter);
      if (from || to) {
        const createdAt = new Date(profile.created_at);
        if (from && createdAt < from) return false;
        if (to && createdAt > to) return false;
      }
      
      // Anamnese filter
      if (anamneseFilter !== 'todos') {
        const hasAnamnese = anamneses?.some(a => a.user_id === profile.id);
        if (anamneseFilter === 'com_ficha' && !hasAnamnese) return false;
        if (anamneseFilter === 'sem_ficha' && hasAnamnese) return false;
      }
      
      return true;
    });
  }, [profiles, searchTerm, dateFilter, dateFrom, dateTo, anamneseFilter, anamneses]);

  // Helper to toggle ceremony expansion
  const toggleCerimonia = (cerimoniaId: string) => {
    setExpandedCerimonias(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cerimoniaId)) {
        newSet.delete(cerimoniaId);
      } else {
        newSet.add(cerimoniaId);
      }
      return newSet;
    });
  };

  // Helper to get inscriptions for a specific ceremony
  const getInscritosByCerimonia = (cerimoniaId: string) => {
    return inscricoes?.filter(i => i.cerimonia_id === cerimoniaId) || [];
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('todos');
    setDateFrom('');
    setDateTo('');
    setAnamneseFilter('todos');
    setConsagradoresPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = searchTerm || dateFilter !== 'todos' || anamneseFilter !== 'todos';

  // Paginated Profiles (memoized)
  const { totalConsagradoresPages, paginatedConsagradores } = useMemo(() => ({
    totalConsagradoresPages: Math.ceil((filteredProfiles?.length || 0) / ITEMS_PER_PAGE),
    paginatedConsagradores: filteredProfiles?.slice(
      (consagradoresPage - 1) * ITEMS_PER_PAGE,
      consagradoresPage * ITEMS_PER_PAGE
    )
  }), [filteredProfiles, consagradoresPage]);

  // Filtrar inscrições baseado na cerimônia selecionada
  const inscricoesFiltradas = useMemo(() => {
    if (!inscricoes) return [];
    
    // Filtro por cerimônia
    if (selectedCerimoniaId !== 'todas') {
      return inscricoes.filter(i => i.cerimonia_id === selectedCerimoniaId);
    }
    
    // Se "todas", ordenar por data da cerimônia (mais próxima primeiro)
    return [...inscricoes].sort((a, b) => {
      const dataA = new Date(a.cerimonias?.data || 0).getTime();
      const dataB = new Date(b.cerimonias?.data || 0).getTime();
      return dataB - dataA; // Decrescente (mais recente primeiro)
    });
  }, [inscricoes, selectedCerimoniaId]);

  // Encontrar a próxima cerimônia ativa para selecionar por padrão
  React.useEffect(() => {
    if (cerimonias && cerimonias.length > 0 && selectedCerimoniaId === 'todas') {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      // Encontrar a próxima cerimônia (data >= hoje)
      const proximaCerimonia = cerimonias
        .filter(c => new Date(c.data) >= hoje)
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())[0];
        
      if (proximaCerimonia) {
        setSelectedCerimoniaId(proximaCerimonia.id);
      }
    }
  }, [cerimonias]); // Executar apenas quando as cerimônias forem carregadas

  // Paginated Inscricoes (memoized)
  const { totalInscricoesPages, paginatedInscricoes } = useMemo(() => ({
    totalInscricoesPages: Math.ceil((inscricoesFiltradas?.length || 0) / ITEMS_PER_PAGE),
    paginatedInscricoes: inscricoesFiltradas?.slice(
      (inscricoesPage - 1) * ITEMS_PER_PAGE,
      inscricoesPage * ITEMS_PER_PAGE
    )
  }), [inscricoesFiltradas, inscricoesPage]);

  // Helper to get anamnese for a user
  const getAnamnese = (userId: string) => {
    return anamneses?.find(a => a.user_id === userId);
  };

  // Helper to get user's role
  const getUserRole = (userId: string): string => {
    const userRole = userRoles?.find(ur => ur.user_id === userId);
    if (!userRole) return 'consagrador';
    const role = roles?.find(r => r.id === userRole.role_id);
    return role?.role || 'consagrador';
  };

  // Helper to export consagradores to CSV
  const handleExportConsagradores = () => {
    if (!filteredProfiles || filteredProfiles.length === 0) {
      toast.error('Nenhum consagrador para exportar');
      return;
    }

    const dataToExport = filteredProfiles.map(profile => {
      const ficha = getAnamnese(profile.id);
      return {
        'Nome Completo': profile.full_name || '-',
        'Email': profile.email || '-',
        'Data Cadastro': profile.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '-',
        'Status Anamnese': ficha ? 'Preenchida' : 'Pendente',
        'Origem': profile.referral_source || '-',
        'Indicado por': profile.referral_name || '-',
      };
    });

    const filename = `consagradores_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(dataToExport, filename);
    toast.success('Consagradores exportados com sucesso!');
  };

  // Helper to export inscricoes to CSV
  const handleExportInscricoes = () => {
    if (!inscricoes || inscricoes.length === 0) {
      toast.error('Nenhuma inscrição para exportar');
      return;
    }

    const dataToExport = inscricoes.map(inscricao => {
      return {
        'Consagrador': inscricao.profiles?.full_name || '-',
        'Cerimônia': inscricao.cerimonias?.nome || inscricao.cerimonias?.medicina_principal || '-',
        'Data Cerimônia': formatDateBR(inscricao.cerimonias?.data),
        'Data Inscrição': inscricao.data_inscricao ? format(new Date(inscricao.data_inscricao), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-',
        'Forma Pagamento': inscricao.forma_pagamento || '-',
        'Status Pagamento': inscricao.pago ? 'Pago' : 'Pendente',
      };
    });

    const filename = `inscricoes_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(dataToExport, filename);
    toast.success('Inscrições exportadas com sucesso!');
  };

  // Helper to get role label
  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'guardiao': return 'Guardião';
      default: return 'Consagrador';
    }
  };

  // Helper to get role badge color
  const getRoleBadgeClass = (role: string): string => {
    switch (role) {
      case 'admin': return 'bg-primary text-primary-foreground';
      case 'guardiao': return 'bg-amber-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Helper to count inscriptions per ceremony
  const getInscritosCount = (cerimoniaId: string) => {
    return inscricoes?.filter(i => i.cerimonia_id === cerimoniaId).length || 0;
  };

  // Helper to get paid count
  const getPagosCount = (cerimoniaId: string) => {
    return inscricoes?.filter(i => i.cerimonia_id === cerimoniaId && i.pago).length || 0;
  };

  const hasContraindicacao = (anamnese: Anamnese) => {
    return anamnese.pressao_alta === true ||
      anamnese.problemas_cardiacos === true ||
      anamnese.historico_convulsivo === true ||
      anamnese.uso_antidepressivos === true;
  };

  // Helper para obter lista de condições de saúde relatadas
  const getCondicoesRelatadas = (anamnese: Anamnese): string[] => {
    const condicoes: string[] = [];
    if (anamnese.pressao_alta === true) condicoes.push('Pressão Alta');
    if (anamnese.problemas_cardiacos === true) condicoes.push('Problemas Cardíacos');
    if (anamnese.historico_convulsivo === true) condicoes.push('Histórico Convulsivo');
    if (anamnese.diabetes === true) condicoes.push('Diabetes');
    if (anamnese.problemas_respiratorios === true) condicoes.push('Problemas Respiratórios');
    if (anamnese.problemas_renais === true) condicoes.push('Problemas Renais');
    if (anamnese.problemas_hepaticos === true) condicoes.push('Problemas Hepáticos');
    if (anamnese.transtorno_psiquiatrico === true) condicoes.push('Transtorno Psiquiátrico');
    if (anamnese.gestante_lactante === true) condicoes.push('Gestante/Lactante');
    if (anamnese.uso_antidepressivos === true) condicoes.push('Uso de Antidepressivos');
    return condicoes;
  };

  // Helper para obter substâncias relatadas
  const getSubstanciasRelatadas = (anamnese: Anamnese): string[] => {
    const substancias: string[] = [];
    if (anamnese.tabaco === true) substancias.push(anamnese.tabaco_frequencia ? `Tabaco (${anamnese.tabaco_frequencia})` : 'Tabaco');
    if (anamnese.alcool === true) substancias.push(anamnese.alcool_frequencia ? `Álcool (${anamnese.alcool_frequencia})` : 'Álcool');
    if (anamnese.cannabis === true) substancias.push('Cannabis');
    if (anamnese.outras_substancias) substancias.push(anamnese.outras_substancias);
    return substancias;
  };

  const [activeTab, setActiveTab] = useState('dashboard');

  // Define available tabs based on permissions
  const availableTabs = useMemo(() => {
    const tabs = [
      { value: 'dashboard', label: isMobile ? 'Home' : 'Dashboard' },
    ];

    if (temPermissao('ver_consagradores')) {
      tabs.push({ value: 'consagradores', label: isMobile ? 'Usuários' : 'Consagradores' });
    }
    if (temPermissao('gerenciar_pagamentos')) {
      tabs.push({ value: 'inscricoes', label: 'Inscrições' });
    }
    if (temPermissao('aprovar_depoimentos')) {
      tabs.push({ 
        value: 'depoimentos', 
        label: isMobile ? 'Partilhas' : 'Partilhas',
        badge: depoimentosPendentes?.length || 0
      });
    }
    if (temPermissao('ver_cerimonias')) {
      tabs.push({ value: 'cerimonias', label: isMobile ? 'Eventos' : 'Cerimônias' });
    }
    if (isSuperAdmin()) {
      tabs.push({ value: 'cursos', label: isMobile ? 'Cursos' : 'Cursos/Eventos' });
      tabs.push({ value: 'financeiro', label: isMobile ? 'Caixa' : 'Financeiro' });
      tabs.push({ value: 'vendas', label: isMobile ? 'Loja' : 'Vendas Loja' });
      tabs.push({ value: 'permissoes', label: isMobile ? 'Perms' : 'Permissões' });
    }
    if (temPermissaoExplicita('ver_logs')) {
      tabs.push({ value: 'logs', label: 'Logs' });
    }
    if (isSuperAdmin()) {
      tabs.push({ value: 'taxas', label: 'Taxas' });
    }

    return tabs;
  }, [isMobile, temPermissao, temPermissaoExplicita, isSuperAdmin, depoimentosPendentes]);

  return (
    <div className="min-h-screen py-4 md:py-6 bg-background/50 pb-20">
      <div className="container max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-row items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-lg md:text-3xl font-medium text-foreground truncate">
                Painel Admin
              </h1>
              <p className="text-sm md:text-base text-muted-foreground font-body hidden md:block">
                Gestão do portal.
              </p>
            </div>
          </div>

          {/* Minimalist Tab Selector Dropdown */}
          <div className="flex items-center shrink-0">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-[130px] md:w-[200px] h-10 rounded-xl border-muted bg-card shadow-sm hover:border-primary/50 transition-all">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Menu" />
                </div>
              </SelectTrigger>
              <SelectContent 
                align="end" 
                position="popper" 
                sideOffset={4}
                className="rounded-xl border-muted shadow-2xl w-[200px] md:w-[240px] max-h-[80vh] overflow-y-auto scrollbar-none data-[state=open]:animate-none data-[state=closed]:animate-none"
              >
                <div className="p-1 space-y-1">
                  {availableTabs.map((tab) => (
                    <SelectItem 
                      key={tab.value} 
                      value={tab.value}
                      className="rounded-lg focus:bg-primary/10 focus:text-primary transition-colors py-2.5 pl-10 pr-3 cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full gap-3">
                        <span className="text-sm font-medium">{tab.label}</span>
                        {tab.badge > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black shrink-0">
                            {tab.badge}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Hidden TabsList to keep Radix functionality but using custom dropdown above */}
          <TabsList className="hidden" />


          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardTab
              profiles={profiles}
              anamneses={anamneses}
              cerimonias={cerimonias}
              inscricoes={inscricoes}
              isLoadingProfiles={isLoadingProfiles}
              getAnamnese={getAnamnese}
            />
          </TabsContent>

          {/* CONSAGRADORES TAB */}
          <TabsContent value="consagradores" className="space-y-6 ">
            {/* Search and Filters Card */}
            <Card className="border-primary/10">
              <CardContent className="p-4 space-y-4">
                {/* Search Bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Buscar consagrador por nome..."
                      className="pl-10 h-11"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setConsagradoresPage(1);
                      }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleExportConsagradores}
                    className="gap-2 whitespace-nowrap w-full md:w-auto h-11"
                  >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </Button>
                </div>

                {/* Filter Row */}
                <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-3 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Filtros:</span>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                  {/* Date Filter */}
                  <Select 
                    value={dateFilter} 
                    onValueChange={(value: DateFilterType) => {
                      setDateFilter(value);
                      setConsagradoresPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-[160px] h-9">
                      <SelectValue placeholder="Data de cadastro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as datas</SelectItem>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="semana">Última semana</SelectItem>
                      <SelectItem value="mes">Último mês</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Custom Date Range */}
                  {dateFilter === 'personalizado' && (
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => {
                          setDateFrom(e.target.value);
                          setConsagradoresPage(1);
                        }}
                        className="w-full md:w-[140px] h-9"
                        placeholder="De"
                      />
                      <span className="text-muted-foreground text-center">até</span>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => {
                          setDateTo(e.target.value);
                          setConsagradoresPage(1);
                        }}
                        className="w-full md:w-[140px] h-9"
                        placeholder="Até"
                      />
                    </div>
                  )}

                  {/* Anamnese Filter */}
                  <Select 
                    value={anamneseFilter} 
                    onValueChange={(value: AnamneseFilterType) => {
                      setAnamneseFilter(value);
                      setConsagradoresPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-[160px] h-9">
                      <SelectValue placeholder="Status anamnese" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="com_ficha">Com ficha</SelectItem>
                      <SelectItem value="sem_ficha">Sem ficha</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-9 px-2 text-muted-foreground hover:text-foreground w-full md:w-auto"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </div>

              {/* Results count */}
              {hasActiveFilters && (
                <p className="text-sm text-muted-foreground mt-2">
                  {filteredProfiles?.length || 0} consagrador(es) encontrado(s)
                </p>
              )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0 md:p-0">
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome Completo</TableHead>
                        <TableHead>Nascimento</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Anamnese</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    {isLoadingProfiles ? (
                      <TableSkeleton rows={8} columns={5} />
                    ) : (
                    <TableBody>
                      {paginatedConsagradores?.map((profile) => {
                        const ficha = getAnamnese(profile.id);
                        const alerta = ficha && hasContraindicacao(ficha);
                        const currentRole = getUserRole(profile.id);

                        return (
                          <TableRow key={profile.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8 shrink-0">
                                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || ''} loading="lazy" />
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {profile.full_name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate">{profile.full_name}</span>
                                    <BloqueadoBadge profile={profile} />
                                  </div>
                                  {profile.referral_source && (
                                    <span className="text-xs text-muted-foreground truncate">
                                      via {profile.referral_source}
                                      {profile.referral_name && ` (${profile.referral_name})`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDateBR(profile.birth_date)}
                            </TableCell>
                            <TableCell>
                              {updatingRoleUserId === profile.id ? (
                                <div className="flex items-center gap-2 px-2 py-1">
                                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                  <span className="text-xs text-muted-foreground">Atualizando...</span>
                                </div>
                              ) : (
                                <select
                                  value={currentRole}
                                  onChange={(e) => {
                                    const newValue = e.target.value === 'consagrador' ? null : e.target.value;
                                    changeRoleMutation.mutate({ userId: profile.id, newRole: newValue });
                                  }}
                                  disabled={changeRoleMutation.isPending}
                                  className={`px-2 py-1 rounded-md text-xs font-medium border cursor-pointer ${getRoleBadgeClass(currentRole)} disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  <option value="consagrador">Consagrador</option>
                                  <option value="guardiao">Guardião</option>
                                  <option value="admin">Administrador</option>
                                </select>
                              )}
                            </TableCell>
                            <TableCell>
                              {ficha ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">OK</Badge>
                                  {alerta && (
                                    <Badge variant="destructive" className="flex gap-1 items-center">
                                      <AlertTriangle className="w-3 h-3" /> Atenção
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="secondary">Pendente</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleOpenHistorico(profile.id, profile.full_name || 'Sem nome')}
                                  title="Ver Histórico"
                                >
                                  <History className="w-4 h-4" />
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => {
                                      setSelectedUser(profile);
                                      setSelectedAnamnese(ficha || null);
                                      setExpandedAnamnese(false);
                                    }}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Detalhes do Consagrador</DialogTitle>
                                  <DialogDescription>Informações completas e ficha de saúde.</DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-6 py-4">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Nome</h4>
                                      <p className="break-words">{profile.full_name}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Data de Nascimento</h4>
                                      <p>{formatDateBR(ficha?.data_nascimento || profile.birth_date)}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Origem</h4>
                                      <p>{profile.referral_source || '-'}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Cadastro em</h4>
                                      <p>{new Date(profile.created_at).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                  </div>

                                  {selectedAnamnese ? (
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between flex-wrap gap-2">
                                        <h3 className="font-display text-lg font-medium flex items-center gap-2">
                                          <FileText className="w-5 h-5 text-primary" />
                                          Ficha de Anamnese
                                        </h3>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-muted-foreground">
                                            Atualizada em {selectedAnamnese.updated_at ? new Date(selectedAnamnese.updated_at).toLocaleDateString('pt-BR') : '-'}
                                          </span>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setExpandedAnamnese(!expandedAnamnese)}
                                            className="text-xs"
                                          >
                                            {expandedAnamnese ? (
                                              <><ChevronUp className="w-3 h-3 mr-1" /> Resumir</>
                                            ) : (
                                              <><ChevronDown className="w-3 h-3 mr-1" /> Ver Completa</>
                                            )}
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Resumo simplificado */}
                                      {!expandedAnamnese && (
                                        <div className="border rounded-lg p-4 space-y-4">
                                          {/* Condições de Saúde - Simplificado */}
                                          <div>
                                            <h4 className="font-medium text-sm mb-2">Condições de Saúde</h4>
                                            {(() => {
                                              const condicoes = getCondicoesRelatadas(selectedAnamnese);
                                              if (selectedAnamnese.sem_doencas === true || condicoes.length === 0) {
                                                return (
                                                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 p-2 rounded">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span>Nenhuma condição relatada</span>
                                                  </div>
                                                );
                                              }
                                              return (
                                                <div className="flex flex-wrap gap-2">
                                                  {condicoes.map((c, i) => (
                                                    <Badge key={i} variant="destructive" className="text-xs">
                                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                                      {c}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              );
                                            })()}
                                          </div>

                                          {/* Medicamentos e Alergias - Resumido */}
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <h4 className="font-medium text-sm mb-1">Medicamentos</h4>
                                              <p className="text-sm text-muted-foreground">
                                                {selectedAnamnese.uso_medicamentos || 'Nenhum'}
                                              </p>
                                            </div>
                                            <div>
                                              <h4 className="font-medium text-sm mb-1">Alergias</h4>
                                              <p className="text-sm text-muted-foreground">
                                                {selectedAnamnese.alergias || 'Nenhuma'}
                                              </p>
                                            </div>
                                          </div>

                                          {/* Experiência */}
                                          <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                                            <span className="text-muted-foreground">Já consagrou:</span>
                                            <span className="font-medium">
                                              {selectedAnamnese.ja_consagrou === true 
                                                ? (selectedAnamnese.quantas_vezes_consagrou ? `Sim (${selectedAnamnese.quantas_vezes_consagrou})` : 'Sim')
                                                : 'Não'}
                                            </span>
                                          </div>
                                        </div>
                                      )}

                                      {/* Ficha Completa Expandida */}
                                      {expandedAnamnese && (
                                        <div className="border rounded-lg p-4 space-y-4 max-h-[50vh] overflow-y-auto">
                                          {/* Dados Pessoais */}
                                          <div>
                                            <h4 className="font-medium text-sm mb-2 text-primary">Dados Pessoais</h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                              <div><span className="text-muted-foreground">Nome:</span> {selectedAnamnese.nome_completo}</div>
                                              <div><span className="text-muted-foreground">Nascimento:</span> {selectedAnamnese.data_nascimento || '-'}</div>
                                              <div><span className="text-muted-foreground">Telefone:</span> {selectedAnamnese.telefone || '-'}</div>
                                              <div><span className="text-muted-foreground">Contato Emergência:</span> {selectedAnamnese.contato_emergencia || '-'}</div>
                                            </div>
                                          </div>

                                          {/* Condições de Saúde - Completo */}
                                          <div>
                                            <h4 className="font-medium text-sm mb-2 text-primary">Condições de Saúde</h4>
                                            {selectedAnamnese.sem_doencas === true ? (
                                              <p className="text-sm text-green-600">Declarou não possuir nenhuma condição de saúde</p>
                                            ) : (
                                              <div className="grid grid-cols-2 gap-1 text-sm">
                                                {[
                                                  { key: 'pressao_alta', label: 'Pressão Alta' },
                                                  { key: 'problemas_cardiacos', label: 'Problemas Cardíacos' },
                                                  { key: 'historico_convulsivo', label: 'Histórico Convulsivo' },
                                                  { key: 'diabetes', label: 'Diabetes' },
                                                  { key: 'problemas_respiratorios', label: 'Problemas Respiratórios' },
                                                  { key: 'problemas_renais', label: 'Problemas Renais' },
                                                  { key: 'problemas_hepaticos', label: 'Problemas Hepáticos' },
                                                  { key: 'transtorno_psiquiatrico', label: 'Transtorno Psiquiátrico' },
                                                  { key: 'gestante_lactante', label: 'Gestante/Lactante' },
                                                  { key: 'uso_antidepressivos', label: 'Uso de Antidepressivos' },
                                                ].map(({ key, label }) => (
                                                  <div key={key} className="flex items-center gap-2">
                                                    {(selectedAnamnese as unknown as Record<string, unknown>)[key] === true 
                                                      ? <XCircle className="w-3 h-3 text-red-500" /> 
                                                      : <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                                    <span>{label}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                            {selectedAnamnese.transtorno_psiquiatrico === true && selectedAnamnese.transtorno_psiquiatrico_qual && (
                                              <p className="text-sm mt-1 text-muted-foreground">Qual: {selectedAnamnese.transtorno_psiquiatrico_qual}</p>
                                            )}
                                            {selectedAnamnese.uso_antidepressivos === true && selectedAnamnese.tipo_antidepressivo && (
                                              <p className="text-sm mt-1 text-muted-foreground">Tipo: {selectedAnamnese.tipo_antidepressivo}</p>
                                            )}
                                          </div>

                                          {/* Medicamentos e Alergias */}
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <h4 className="font-medium text-sm mb-1 text-primary">Medicamentos em uso</h4>
                                              <p className="text-sm text-muted-foreground bg-muted p-2 rounded whitespace-pre-wrap">
                                                {selectedAnamnese.uso_medicamentos || 'Nenhum relatado'}
                                              </p>
                                            </div>
                                            <div>
                                              <h4 className="font-medium text-sm mb-1 text-primary">Alergias</h4>
                                              <p className="text-sm text-muted-foreground bg-muted p-2 rounded whitespace-pre-wrap">
                                                {selectedAnamnese.alergias || 'Nenhuma relatada'}
                                              </p>
                                            </div>
                                          </div>

                                          {/* Cirurgias */}
                                          {selectedAnamnese.cirurgias_recentes && (
                                            <div>
                                              <h4 className="font-medium text-sm mb-1 text-primary">Cirurgias Recentes</h4>
                                              <p className="text-sm text-muted-foreground">{selectedAnamnese.cirurgias_recentes}</p>
                                            </div>
                                          )}

                                          {/* Substâncias */}
                                          <div>
                                            <h4 className="font-medium text-sm mb-2 text-primary">Uso de Substâncias</h4>
                                            {selectedAnamnese.sem_vicios === true ? (
                                              <p className="text-sm text-green-600">Declarou não fazer uso de substâncias</p>
                                            ) : (
                                              <div className="text-sm">
                                                {(() => {
                                                  const substancias = getSubstanciasRelatadas(selectedAnamnese);
                                                  return substancias.length > 0 
                                                    ? substancias.join(', ')
                                                    : 'Nenhuma relatada';
                                                })()}
                                              </div>
                                            )}
                                          </div>

                                          {/* Experiência */}
                                          <div>
                                            <h4 className="font-medium text-sm mb-2 text-primary">Experiência com Consagração</h4>
                                            <div className="text-sm space-y-1">
                                              <p><span className="text-muted-foreground">Já consagrou:</span> {selectedAnamnese.ja_consagrou === true ? 'Sim' : 'Não'}</p>
                                              {selectedAnamnese.ja_consagrou === true && selectedAnamnese.quantas_vezes_consagrou && (
                                                <p><span className="text-muted-foreground">Quantas vezes:</span> {selectedAnamnese.quantas_vezes_consagrou}</p>
                                              )}
                                              {selectedAnamnese.como_foi_experiencia && (
                                                <p><span className="text-muted-foreground">Como foi:</span> {selectedAnamnese.como_foi_experiencia}</p>
                                              )}
                                            </div>
                                          </div>

                                          {/* Intenção e Restrições */}
                                          {(selectedAnamnese.intencao || selectedAnamnese.restricao_alimentar) && (
                                            <div className="grid grid-cols-2 gap-4">
                                              {selectedAnamnese.intencao && (
                                                <div>
                                                  <h4 className="font-medium text-sm mb-1 text-primary">Intenção</h4>
                                                  <p className="text-sm text-muted-foreground">{selectedAnamnese.intencao}</p>
                                                </div>
                                              )}
                                              {selectedAnamnese.restricao_alimentar && (
                                                <div>
                                                  <h4 className="font-medium text-sm mb-1 text-primary">Restrição Alimentar</h4>
                                                  <p className="text-sm text-muted-foreground">{selectedAnamnese.restricao_alimentar}</p>
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Autorizações e Termos */}
                                          <div>
                                            <h4 className="font-medium text-sm mb-2 text-primary">Autorizações e Termos</h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                              <div className={`flex items-center gap-2 p-2 rounded ${selectedAnamnese.aceite_uso_imagem ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'}`}>
                                                {selectedAnamnese.aceite_uso_imagem ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                <span>Uso de imagem {selectedAnamnese.aceite_uso_imagem ? 'autorizado' : 'não autorizado'}</span>
                                              </div>
                                              <div className={`flex items-center gap-2 p-2 rounded ${selectedAnamnese.aceite_permanencia ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'}`}>
                                                {selectedAnamnese.aceite_permanencia ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                <span>Permanência no templo {selectedAnamnese.aceite_permanencia ? 'aceita' : 'não aceita'}</span>
                                              </div>
                                              <div className={`flex items-center gap-2 p-2 rounded ${selectedAnamnese.aceite_livre_vontade ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'}`}>
                                                {selectedAnamnese.aceite_livre_vontade ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                <span>Livre vontade {selectedAnamnese.aceite_livre_vontade ? 'confirmada' : 'não confirmada'}</span>
                                              </div>
                                              <div className={`flex items-center gap-2 p-2 rounded ${selectedAnamnese.aceite_termo_responsabilidade ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'}`}>
                                                {selectedAnamnese.aceite_termo_responsabilidade ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                <span>Termo de responsabilidade {selectedAnamnese.aceite_termo_responsabilidade ? 'aceito' : 'não aceito'}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                                      <FileText className="w-8 h-8 mb-2 opacity-50" />
                                      <p>Usuário ainda não preencheu a ficha de anamnese.</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                                <ConsagradorActions 
                                  profile={profile}
                                  onOpenHistorico={() => handleOpenHistorico(profile.id, profile.full_name || 'Sem nome')}
                                  onOpenDetalhes={() => {
                                    setSelectedUser(profile);
                                    setSelectedAnamnese(ficha || null);
                                    setExpandedAnamnese(false);
                                  }}
                                />
                              </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  )}
                </Table>
                </div>

                {/* Mobile Cards - Consagradores */}
                <div className="md:hidden p-4 space-y-3">
                  {isLoadingProfiles ? (
                    <CardSkeleton count={5} />
                  ) : (
                    paginatedConsagradores?.map((profile) => {
                      const ficha = getAnamnese(profile.id);
                      const alerta = ficha && hasContraindicacao(ficha);
                      const currentRole = getUserRole(profile.id);

                      return (
                        <MobileCard key={profile.id}>
                          <MobileCardHeader>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="w-10 h-10 shrink-0">
                                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || ''} loading="lazy" />
                                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                    {profile.full_name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="block truncate">{profile.full_name || 'Sem nome'}</span>
                                    <BloqueadoBadge profile={profile} />
                                  </div>
                                  {profile.referral_source && (
                                    <span className="text-xs text-muted-foreground font-normal truncate block">
                                      via {profile.referral_source}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {alerta && (
                                <Badge variant="destructive" className="flex gap-1 items-center text-xs shrink-0">
                                  <AlertTriangle className="w-3 h-3" />
                                </Badge>
                              )}
                            </div>
                          </MobileCardHeader>
                          <MobileCardRow label="Nascimento">
                            {formatDateBR(profile.birth_date)}
                          </MobileCardRow>
                          <MobileCardRow label="Papel">
                            {updatingRoleUserId === profile.id ? (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs">...</span>
                              </div>
                            ) : (
                              <select
                                value={currentRole}
                                onChange={(e) => {
                                  const newValue = e.target.value === 'consagrador' ? null : e.target.value;
                                  changeRoleMutation.mutate({ userId: profile.id, newRole: newValue });
                                }}
                                disabled={changeRoleMutation.isPending}
                                className={`px-2 py-1 rounded-md text-xs font-medium border cursor-pointer ${getRoleBadgeClass(currentRole)} disabled:opacity-50`}
                              >
                                <option value="consagrador">Consagrador</option>
                                <option value="guardiao">Guardião</option>
                                <option value="admin">Admin</option>
                              </select>
                            )}
                          </MobileCardRow>
                          <MobileCardRow label="Ficha">
                            {ficha ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">OK</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Pendente</Badge>
                            )}
                          </MobileCardRow>
                          <MobileCardActions>
                            <div className="flex gap-2 items-center">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleOpenHistorico(profile.id, profile.full_name || 'Sem nome')}
                              >
                                <History className="w-4 h-4 mr-2" /> Histórico
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleOpenDetalhesDrawer(profile, ficha || null)}
                              >
                                <Eye className="w-4 h-4 mr-2" /> Detalhes
                              </Button>
                              <ConsagradorActions 
                                profile={profile}
                                onOpenHistorico={() => handleOpenHistorico(profile.id, profile.full_name || 'Sem nome')}
                                onOpenDetalhes={() => handleOpenDetalhesDrawer(profile, ficha || null)}
                              />
                            </div>
                          </MobileCardActions>
                        </MobileCard>
                      );
                    })
                  )}
                </div>

                {/* Drawer de Detalhes do Usuário (Mobile) */}
                <Drawer open={detalhesDrawerOpen} onOpenChange={setDetalhesDrawerOpen}>
                  <DrawerContent className="h-[85vh] max-h-[85vh]">
                    <DrawerHeader className="pb-2 shrink-0">
                      <DrawerTitle>Detalhes do Consagrador</DrawerTitle>
                      <DrawerDescription>Informações completas e ficha de saúde.</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-6 overflow-y-auto flex-1">
                      {detalhesDrawerProfile && (
                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg text-sm">
                            <div>
                              <h4 className="font-medium text-muted-foreground mb-1">Nome</h4>
                              <p className="break-words">{detalhesDrawerProfile.full_name}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-muted-foreground mb-1">Nascimento</h4>
                              <p>{formatDateBR(detalhesDrawerAnamnese?.data_nascimento || detalhesDrawerProfile.birth_date)}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-muted-foreground mb-1">Origem</h4>
                              <p>{detalhesDrawerProfile.referral_source || '-'}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-muted-foreground mb-1">Cadastro</h4>
                              <p>{new Date(detalhesDrawerProfile.created_at).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          {detalhesDrawerAnamnese ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-primary" />
                                  Ficha de Anamnese
                                </h3>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setExpandedAnamnese(!expandedAnamnese)}
                                  className="text-xs h-7"
                                >
                                  {expandedAnamnese ? 'Resumir' : 'Ver Completa'}
                                </Button>
                              </div>
                              
                              {/* Resumo simplificado */}
                              {!expandedAnamnese && (
                                <div className="space-y-3">
                                  <div className="border rounded-lg p-3">
                                    <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">Condições de Saúde</h4>
                                    {(() => {
                                      const condicoes = getCondicoesRelatadas(detalhesDrawerAnamnese);
                                      if (detalhesDrawerAnamnese.sem_doencas === true || condicoes.length === 0) {
                                        return (
                                          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 p-2 rounded">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Nenhuma condição relatada</span>
                                          </div>
                                        );
                                      }
                                      return (
                                        <div className="flex flex-wrap gap-1">
                                          {condicoes.map((c, i) => (
                                            <Badge key={i} variant="destructive" className="text-xs">{c}</Badge>
                                          ))}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Medicamentos:</span>
                                      <p className="font-medium">{detalhesDrawerAnamnese.uso_medicamentos || 'Nenhum'}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Alergias:</span>
                                      <p className="font-medium">{detalhesDrawerAnamnese.alergias || 'Nenhuma'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                                    <span className="text-muted-foreground">Já consagrou:</span>
                                    <span className="font-medium">
                                      {detalhesDrawerAnamnese.ja_consagrou === true 
                                        ? (detalhesDrawerAnamnese.quantas_vezes_consagrou ? `Sim (${detalhesDrawerAnamnese.quantas_vezes_consagrou})` : 'Sim')
                                        : 'Não'}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Ficha Completa Expandida */}
                              {expandedAnamnese && (
                                <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                                  <div className="border rounded-lg p-3">
                                    <h4 className="font-medium text-xs text-primary uppercase tracking-wide mb-2">Dados Pessoais</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div><span className="text-muted-foreground">Nome:</span> {detalhesDrawerAnamnese.nome_completo}</div>
                                      <div><span className="text-muted-foreground">Telefone:</span> {detalhesDrawerAnamnese.telefone || '-'}</div>
                                      <div className="col-span-2"><span className="text-muted-foreground">Emergência:</span> {detalhesDrawerAnamnese.contato_emergencia || '-'}</div>
                                    </div>
                                  </div>
                                  <div className="border rounded-lg p-3">
                                    <h4 className="font-medium text-xs text-primary uppercase tracking-wide mb-2">Condições de Saúde</h4>
                                    {detalhesDrawerAnamnese.sem_doencas === true ? (
                                      <p className="text-xs text-green-600">Declarou não possuir nenhuma condição</p>
                                    ) : (
                                      <div className="grid grid-cols-2 gap-1 text-xs">
                                        {[
                                          { key: 'pressao_alta', label: 'Pressão Alta' },
                                          { key: 'problemas_cardiacos', label: 'Prob. Cardíacos' },
                                          { key: 'historico_convulsivo', label: 'Hist. Convulsivo' },
                                          { key: 'diabetes', label: 'Diabetes' },
                                          { key: 'uso_antidepressivos', label: 'Antidepressivos' },
                                        ].map(({ key, label }) => (
                                          <div key={key} className="flex items-center gap-1">
                                            {(detalhesDrawerAnamnese as unknown as Record<string, unknown>)[key] === true 
                                              ? <XCircle className="w-3 h-3 text-red-500 shrink-0" /> 
                                              : <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />}
                                            <span className="truncate">{label}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="border rounded-lg p-3 space-y-2">
                                    <div>
                                      <h4 className="font-medium text-xs text-primary">Medicamentos</h4>
                                      <p className="text-xs text-muted-foreground">{detalhesDrawerAnamnese.uso_medicamentos || 'Nenhum'}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-xs text-primary">Alergias</h4>
                                      <p className="text-xs text-muted-foreground">{detalhesDrawerAnamnese.alergias || 'Nenhuma'}</p>
                                    </div>
                                  </div>
                                  <div className="border rounded-lg p-3">
                                    <h4 className="font-medium text-xs text-primary uppercase tracking-wide mb-1">Experiência</h4>
                                    <p className="text-xs">
                                      {detalhesDrawerAnamnese.ja_consagrou === true 
                                        ? `Já consagrou${detalhesDrawerAnamnese.quantas_vezes_consagrou ? ` (${detalhesDrawerAnamnese.quantas_vezes_consagrou})` : ''}`
                                        : 'Primeira vez'}
                                    </p>
                                  </div>
                                  {/* Autorizações e Termos */}
                                  <div className="border rounded-lg p-3">
                                    <h4 className="font-medium text-xs text-primary uppercase tracking-wide mb-2">Autorizações</h4>
                                    <div className="grid grid-cols-1 gap-1 text-xs">
                                      <div className={`flex items-center gap-2 p-1.5 rounded ${detalhesDrawerAnamnese.aceite_uso_imagem ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'}`}>
                                        {detalhesDrawerAnamnese.aceite_uso_imagem ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                                        <span>Uso de imagem {detalhesDrawerAnamnese.aceite_uso_imagem ? 'autorizado' : 'não autorizado'}</span>
                                      </div>
                                      <div className={`flex items-center gap-2 p-1.5 rounded ${detalhesDrawerAnamnese.aceite_permanencia ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'}`}>
                                        {detalhesDrawerAnamnese.aceite_permanencia ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                                        <span>Permanência {detalhesDrawerAnamnese.aceite_permanencia ? 'aceita' : 'não aceita'}</span>
                                      </div>
                                      <div className={`flex items-center gap-2 p-1.5 rounded ${detalhesDrawerAnamnese.aceite_livre_vontade ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'}`}>
                                        {detalhesDrawerAnamnese.aceite_livre_vontade ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                                        <span>Livre vontade {detalhesDrawerAnamnese.aceite_livre_vontade ? 'confirmada' : 'não confirmada'}</span>
                                      </div>
                                      <div className={`flex items-center gap-2 p-1.5 rounded ${detalhesDrawerAnamnese.aceite_termo_responsabilidade ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'}`}>
                                        {detalhesDrawerAnamnese.aceite_termo_responsabilidade ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                                        <span>Termo {detalhesDrawerAnamnese.aceite_termo_responsabilidade ? 'aceito' : 'não aceito'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg text-muted-foreground">
                              <FileText className="w-6 h-6 mb-2 opacity-50" />
                              <p className="text-sm">Ficha não preenchida</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </DrawerContent>
                </Drawer>

                {/* Pagination */}
                {totalConsagradoresPages > 1 && (
                  <PaginationControls
                    currentPage={consagradoresPage}
                    totalPages={totalConsagradoresPages}
                    onPageChange={setConsagradoresPage}
                    isLoading={isLoadingProfiles}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* INSCRICOES TAB */}
          <TabsContent value="inscricoes" className="space-y-6 ">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-end">
              {/* Filtro de Cerimônia */}
              <div className="w-full md:w-[300px] space-y-1.5">
                <Label className="text-sm text-muted-foreground ml-1">Filtrar por Cerimônia</Label>
                <Select value={selectedCerimoniaId} onValueChange={(value) => {
                  setSelectedCerimoniaId(value);
                  setInscricoesPage(1);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma cerimônia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Cerimônias</SelectItem>
                    {cerimonias?.map((cerimonia) => (
                      <SelectItem key={cerimonia.id} value={cerimonia.id}>
                        {cerimonia.nome || cerimonia.medicina_principal} - {formatDateBR(cerimonia.data)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportInscricoes}
                className="gap-2 w-full md:w-auto"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Gestão de Pagamentos
                </CardTitle>
                <CardDescription>
                  {selectedCerimoniaId === 'todas' 
                    ? 'Visualizando todas as inscrições.' 
                    : `Inscrições para ${cerimonias?.find(c => c.id === selectedCerimoniaId)?.nome || 'cerimônia selecionada'}.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Consagrador</TableHead>
                        <TableHead>Cerimônia</TableHead>
                        <TableHead>Data Inscrição</TableHead>
                        <TableHead>Forma Pagamento</TableHead>
                        <TableHead className="text-center">Pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    {isLoadingInscricoes ? (
                      <TableSkeleton rows={8} columns={5} />
                    ) : (
                    <TableBody>
                      {paginatedInscricoes?.map((inscricao) => (
                        <TableRow key={inscricao.id}>
                          <TableCell className="font-medium">
                            {inscricao.profiles?.full_name || 'Sem nome'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{inscricao.cerimonias?.nome || inscricao.cerimonias?.medicina_principal}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDateBR(inscricao.cerimonias?.data)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {inscricao.data_inscricao ? format(new Date(inscricao.data_inscricao), "dd/MM 'às' HH:mm", { locale: ptBR }) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {inscricao.forma_pagamento || 'Não informado'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {updatingPaymentId === inscricao.id ? (
                                <div className="w-9 h-5 flex items-center justify-center">
                                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                              ) : (
                                <Switch
                                  checked={inscricao.pago || false}
                                  onCheckedChange={(checked) => handleTogglePayment(inscricao, checked)}
                                  disabled={togglePaymentMutation.isPending}
                                />
                              )}
                              {inscricao.pago ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                  <DollarSign className="w-3 h-3 mr-1" /> Pago
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-600 border-amber-300">
                                  Pendente
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    )}
                  </Table>
                </div>

                {/* Mobile Cards - Inscrições */}
                <div className="md:hidden space-y-3">
                  {isLoadingInscricoes ? (
                    <CardSkeleton count={5} />
                  ) : (
                    paginatedInscricoes?.map((inscricao) => (
                      <MobileCard key={inscricao.id}>
                        <MobileCardHeader>
                          <div className="flex items-center justify-between">
                            <span>{inscricao.profiles?.full_name || 'Sem nome'}</span>
                            {inscricao.pago ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                                <DollarSign className="w-3 h-3 mr-1" /> Pago
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                                Pendente
                              </Badge>
                            )}
                          </div>
                        </MobileCardHeader>
                        <MobileCardRow label="Cerimônia">
                          <div className="text-right">
                            <span className="block">{inscricao.cerimonias?.nome || inscricao.cerimonias?.medicina_principal}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateBR(inscricao.cerimonias?.data)}
                            </span>
                          </div>
                        </MobileCardRow>
                        <MobileCardRow label="Inscrição">
                          {inscricao.data_inscricao ? format(new Date(inscricao.data_inscricao), "dd/MM HH:mm", { locale: ptBR }) : '-'}
                        </MobileCardRow>
                        <MobileCardRow label="Pagamento">
                          <Badge variant="outline" className="capitalize text-xs">
                            {inscricao.forma_pagamento || 'Não informado'}
                          </Badge>
                        </MobileCardRow>
                        <MobileCardActions>
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm text-muted-foreground">Marcar como pago</span>
                            {updatingPaymentId === inscricao.id ? (
                              <div className="w-9 h-5 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              </div>
                            ) : (
                              <Switch
                                checked={inscricao.pago || false}
                                onCheckedChange={(checked) => handleTogglePayment(inscricao, checked)}
                                disabled={togglePaymentMutation.isPending}
                              />
                            )}
                          </div>
                        </MobileCardActions>
                      </MobileCard>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {totalInscricoesPages > 1 && (
                  <PaginationControls
                    currentPage={inscricoesPage}
                    totalPages={totalInscricoesPages}
                    onPageChange={setInscricoesPage}
                    isLoading={isLoadingInscricoes}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* DEPOIMENTOS TAB */}
          <TabsContent value="depoimentos" className="space-y-6 ">
            <DepoimentosTab
              depoimentosPendentes={depoimentosPendentes}
              isLoadingDepoimentos={isLoadingDepoimentos}
              depoimentosError={depoimentosError}
              approveDepoimentoMutation={approveDepoimentoMutation}
              rejectDepoimentoMutation={rejectDepoimentoMutation}
            />
          </TabsContent>

          {/* CERIMONIAS TAB */}
          <TabsContent value="cerimonias" className="space-y-6 ">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Cerimônias</CardTitle>
                <CardDescription>
                  Clique em uma cerimônia para expandir e ver a lista de inscritos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Desktop View */}
                <div className="hidden md:block space-y-2">
                  {isLoadingCerimonias ? (
                    <TableSkeleton rows={6} columns={5} />
                  ) : (
                    cerimonias?.map((cerimonia) => {
                      const inscritos = getInscritosCount(cerimonia.id);
                      const pagos = getPagosCount(cerimonia.id);
                      const isPast = isDatePast(cerimonia.data);
                      const isExpanded = expandedCerimonias.has(cerimonia.id);
                      const inscritosList = getInscritosByCerimonia(cerimonia.id);

                      return (
                        <Collapsible
                          key={cerimonia.id}
                          open={isExpanded}
                          onOpenChange={() => toggleCerimonia(cerimonia.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${isPast ? 'opacity-60' : ''} ${isExpanded ? 'bg-muted/30 border-primary/30' : ''}`}>
                              <div className="flex items-center gap-6">
                                <div className="min-w-[100px]">
                                  <p className="font-medium">{formatDateBR(cerimonia.data)}</p>
                                  <p className="text-xs text-muted-foreground">{cerimonia.horario.slice(0, 5)}</p>
                                </div>
                                <div className="min-w-[120px]">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-medium">{cerimonia.nome || cerimonia.medicina_principal}</p>
                                    {cerimonia.nome && cerimonia.medicina_principal && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Medicina: {cerimonia.medicina_principal}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </div>
                                <div className="min-w-[150px] text-muted-foreground">
                                  {cerimonia.local}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 min-w-[100px]">
                                  <Users className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{inscritos}</span>
                                  <span className="text-muted-foreground">/ {cerimonia.vagas || '∞'}</span>
                                </div>
                                <div className="min-w-[80px]">
                                  {isPast ? (
                                    <Badge variant="secondary">Realizada</Badge>
                                  ) : (
                                    <Badge className="bg-green-600">Agendada</Badge>
                                  )}
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <ParticipantesList
                              inscricoes={inscritosList}
                              cerimonia={cerimonia}
                              getAnamnese={getAnamnese}
                              onCancelInscricao={(inscricaoId, userName) => setCancelInscricaoDialog({
                                open: true,
                                inscricaoId,
                                userName,
                              })}
                              pagosCount={pagos}
                              totalCount={inscritos}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })
                  )}
                </div>

                {/* Mobile Cards - Cerimônias */}
                <div className="md:hidden space-y-3">
                  {isLoadingCerimonias ? (
                    <CardSkeleton count={4} />
                  ) : (
                    cerimonias?.map((cerimonia) => {
                      const inscritos = getInscritosCount(cerimonia.id);
                      const pagos = getPagosCount(cerimonia.id);
                      const isPast = isDatePast(cerimonia.data);
                      const isExpanded = expandedCerimonias.has(cerimonia.id);
                      const inscritosList = getInscritosByCerimonia(cerimonia.id);

                      return (
                        <Collapsible
                          key={cerimonia.id}
                          open={isExpanded}
                          onOpenChange={() => toggleCerimonia(cerimonia.id)}
                        >
                          <MobileCard className={isPast ? 'opacity-60' : ''}>
                            <CollapsibleTrigger asChild>
                              <div className="cursor-pointer">
                                <MobileCardHeader>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span>{cerimonia.nome || cerimonia.medicina_principal}</span>
                                      {cerimonia.nome && cerimonia.medicina_principal && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Info className="w-3.5 h-3.5 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Medicina: {cerimonia.medicina_principal}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {isPast ? (
                                        <Badge variant="secondary" className="text-xs">Realizada</Badge>
                                      ) : (
                                        <Badge className="bg-green-600 text-xs">Agendada</Badge>
                                      )}
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>
                                </MobileCardHeader>
                                <MobileCardRow label="Data">
                                  <div className="text-right">
                                    <span className="block">{formatDateBR(cerimonia.data)}</span>
                                    <span className="text-xs text-muted-foreground">{cerimonia.horario.slice(0, 5)}</span>
                                  </div>
                                </MobileCardRow>
                                <MobileCardRow label="Local">
                                  {cerimonia.local}
                                </MobileCardRow>
                                <MobileCardRow label="Inscritos">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-muted-foreground" />
                                    <span>{inscritos} / {cerimonia.vagas || '∞'}</span>
                                  </div>
                                </MobileCardRow>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="mt-3 pt-3 border-t border-dashed">
                                <ParticipantesList
                                  inscricoes={inscritosList}
                                  cerimonia={cerimonia}
                                  getAnamnese={getAnamnese}
                                  onCancelInscricao={(inscricaoId, userName) => setCancelInscricaoDialog({
                                    open: true,
                                    inscricaoId,
                                    userName,
                                  })}
                                  pagosCount={pagos}
                                  totalCount={inscritos}
                                />
                              </div>
                            </CollapsibleContent>
                          </MobileCard>
                        </Collapsible>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VENDAS LOJA TAB - Apenas Super Admin */}
          {isSuperAdmin() && (
            <TabsContent value="vendas" className="space-y-6 ">
              <VendasTab
                pagamentosProdutos={pagamentosProdutos}
                isLoadingPagamentos={isLoadingPagamentos}
              />
            </TabsContent>
          )}

          {/* CURSOS/EVENTOS TAB - Apenas Super Admin */}
          {isSuperAdmin() && (
            <TabsContent value="cursos" className="space-y-6 ">
              <CursosTab />
            </TabsContent>
          )}

          {/* FLUXO DE CAIXA TAB - Apenas Super Admin */}
          {isSuperAdmin() && (
            <TabsContent value="financeiro" className="space-y-6 ">
              <FluxoCaixaTab />
            </TabsContent>
          )}

          {/* PERMISSÕES TAB - Apenas Super Admin */}
          {isSuperAdmin() && (
            <TabsContent value="permissoes" className="space-y-6 ">
              <PermissoesTab />
            </TabsContent>
          )}

          {/* LOGS TAB - Apenas com permissão explícita ver_logs (não herdada por super_admin) */}
          {temPermissaoExplicita('ver_logs') && (
            <TabsContent value="logs" className="space-y-6 ">
              <LogsTab />
            </TabsContent>
          )}

          {/* TAXAS MP TAB - Apenas Super Admin */}
          {isSuperAdmin() && (
            <TabsContent value="taxas" className="space-y-6 ">
              <TaxasMPTab />
            </TabsContent>
          )}

        </Tabs>
      </div>
      
      {/* Dialog de Histórico de Consagrações - Requirements: 1.1 */}
      <HistoricoConsagracoesDialog
        userId={historicoDialogUserId || ''}
        userName={historicoDialogUserName}
        isOpen={!!historicoDialogUserId}
        onClose={handleCloseHistorico}
      />

      {/* Dialog de Cancelamento de Inscrição */}
      <Dialog 
        open={cancelInscricaoDialog.open} 
        onOpenChange={(open) => {
          if (!open) {
            setCancelInscricaoDialog({ open: false, inscricaoId: null, userName: '' });
            setMotivoCancelamento('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Cancelar Inscrição
            </DialogTitle>
            <DialogDescription>
              Você está prestes a cancelar a inscrição de <strong>{cancelInscricaoDialog.userName}</strong>. 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo do cancelamento (opcional)</Label>
              <Textarea
                id="motivo"
                placeholder="Ex: Desistência do participante, conflito de agenda..."
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setCancelInscricaoDialog({ open: false, inscricaoId: null, userName: '' });
                setMotivoCancelamento('');
              }}
            >
              Voltar
            </Button>
            <LoadingButton
              variant="destructive"
              onClick={handleCancelInscricao}
              loading={cancelInscricaoMutation.isPending}
              loadingText="Cancelando..."
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Confirmar Cancelamento
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Pagamento e Valor */}
      <Dialog 
        open={paymentConfirmDialog.open} 
        onOpenChange={(open) => !open && setPaymentConfirmDialog(prev => ({ ...prev, open: false }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Confirmar Pagamento
            </DialogTitle>
            <DialogDescription>
              Confirme o valor pago por <strong>{paymentConfirmDialog.nomeParticipante}</strong> para a cerimônia <strong>{paymentConfirmDialog.nomeCerimonia}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="valor_pago">Valor Recebido (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-medium">R$</span>
                <Input
                  id="valor_pago"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className="pl-9"
                  value={paymentConfirmDialog.valor}
                  onChange={(e) => setPaymentConfirmDialog(prev => ({ ...prev, valor: e.target.value }))}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Este valor será registrado automaticamente como uma entrada no Fluxo de Caixa.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setPaymentConfirmDialog(prev => ({ ...prev, open: false }))}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const valorFloat = parseFloat(paymentConfirmDialog.valor.replace(',', '.'));
                if (isNaN(valorFloat) || valorFloat <= 0) {
                  toast.error('Informe um valor válido');
                  return;
                }
                
                togglePaymentMutation.mutate({
                  inscricaoId: paymentConfirmDialog.inscricaoId!,
                  pago: true,
                  valor: Math.round(valorFloat * 100),
                  cerimoniaId: paymentConfirmDialog.cerimoniaId!,
                  userId: paymentConfirmDialog.userId!,
                  formaPagamento: paymentConfirmDialog.formaPagamento,
                  nomeParticipante: paymentConfirmDialog.nomeParticipante,
                });
              }}
              disabled={togglePaymentMutation.isPending}
              className="gap-2"
            >
              {togglePaymentMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Confirmar e Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
