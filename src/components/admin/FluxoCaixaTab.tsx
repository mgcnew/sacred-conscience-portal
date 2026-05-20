import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaginationControls } from '@/components/ui/pagination-controls';
import {
  Plus, Trash2, TrendingUp, TrendingDown, DollarSign, ArrowUpCircle, ArrowDownCircle,
  BarChart3, PieChart, Wallet, Tag, RefreshCw, Download, FileText, Target, AlertTriangle, Settings,
  Paperclip, Upload, Eye, File, CheckCircle, Circle, CheckCheck, CheckCircle2, Calendar as CalendarIcon,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCategoriasFinanceiras,
  useTransacoes,
  useResumoFinanceiro,
  useDadosMensais,
  useCreateTransacao,
  useDeleteTransacao,
  useCreateCategoria,
  useDespesasRecorrentes,
  useCreateDespesaRecorrente,
  useDeleteDespesaRecorrente,
  useProgressoMetas,
  useCreateMetaFinanceira,
  useDeleteMetaFinanceira,
  useConfigAlertas,
  useUpdateConfigAlerta,
  useAnexosTransacao,
  useUploadAnexo,
  useDeleteAnexo,
  useReconciliarTransacao,
  useReconciliarLote,
  useEstatisticasReconciliacao,
} from '@/hooks/queries/useFluxoCaixa';
import type { TipoTransacao } from '@/types';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const FluxoCaixaTab: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'resumo' | 'transacoes' | 'categorias'>('resumo');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoriaFormOpen, setIsCategoriaFormOpen] = useState(false);
  const [tipoTransacao, setTipoTransacao] = useState<TipoTransacao>('entrada');
  
  // Filtros
  const hoje = new Date();
  const [filtroDataInicio, setFiltroDataInicio] = useState(format(startOfMonth(hoje), 'yyyy-MM-dd'));
  const [filtroDataFim, setFiltroDataFim] = useState(format(endOfMonth(hoje), 'yyyy-MM-dd'));
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida'>('todos');

  // Form state
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data: format(hoje, 'yyyy-MM-dd'),
    categoria_id: '',
    forma_pagamento: '',
    observacoes: '',
  });

  const [categoriaForm, setCategoriaForm] = useState({
    nome: '',
    tipo: 'saida' as TipoTransacao,
    cor: '#6b7280',
  });

  const [isDespesaFormOpen, setIsDespesaFormOpen] = useState(false);
  const [despesaForm, setDespesaForm] = useState({
    nome: '',
    valor: '',
    categoria_id: '',
    dia_vencimento: '',
    observacoes: '',
  });

  // Metas financeiras
  const [isMetaFormOpen, setIsMetaFormOpen] = useState(false);
  const [metaForm, setMetaForm] = useState({
    nome: '',
    tipo: 'receita' as 'receita' | 'economia' | 'reducao_despesa',
    valor_meta: '',
    descricao: '',
  });

  // Anexos
  const [selectedTransacaoId, setSelectedTransacaoId] = useState<string | null>(null);
  const [isAnexosDialogOpen, setIsAnexosDialogOpen] = useState(false);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);

  // Reconciliação
  const [transacoesSelecionadas, setTransacoesSelecionadas] = useState<Set<string>>(new Set());
  const [mostrarApenasNaoReconciliadas, setMostrarApenasNaoReconciliadas] = useState(false);

  // Paginação do extrato
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Queries
  const { data: categorias } = useCategoriasFinanceiras();
  const { data: transacoes, isLoading } = useTransacoes({
    dataInicio: filtroDataInicio,
    dataFim: filtroDataFim,
    tipo: filtroTipo === 'todos' ? undefined : filtroTipo,
  });
  const { data: resumo } = useResumoFinanceiro(filtroDataInicio, filtroDataFim);
  const { data: dadosMensais } = useDadosMensais(hoje.getFullYear());

  // Mutations
  const createTransacao = useCreateTransacao();
  const deleteTransacao = useDeleteTransacao();
  const createCategoria = useCreateCategoria();
  const createDespesaRecorrente = useCreateDespesaRecorrente();
  const deleteDespesaRecorrente = useDeleteDespesaRecorrente();

  // Despesas recorrentes
  const { data: despesasRecorrentes } = useDespesasRecorrentes();

  // Metas e alertas
  const { metas: metasComProgresso } = useProgressoMetas();
  const { data: configAlertas } = useConfigAlertas();
  const createMeta = useCreateMetaFinanceira();
  const deleteMeta = useDeleteMetaFinanceira();
  const updateAlerta = useUpdateConfigAlerta();

  // Anexos
  const { data: anexosTransacao } = useAnexosTransacao(selectedTransacaoId);
  const uploadAnexo = useUploadAnexo();
  const deleteAnexo = useDeleteAnexo();

  // Reconciliação
  const reconciliarTransacao = useReconciliarTransacao();
  const reconciliarLote = useReconciliarLote();
  const { data: estatisticasReconciliacao } = useEstatisticasReconciliacao(filtroDataInicio, filtroDataFim);

  // Verificar alerta de saldo baixo (memoizado)
  const alertaSaldoBaixo = useMemo(() => configAlertas?.find(a => a.tipo === 'saldo_baixo'), [configAlertas]);
  const saldoAtual = resumo?.saldo || 0;
  const mostrarAlertaSaldo = alertaSaldoBaixo?.ativo && alertaSaldoBaixo.valor_limite && saldoAtual < alertaSaldoBaixo.valor_limite;

  // Memoizar total de despesas recorrentes
  const totalRecorrenteMemo = useMemo(() => despesasRecorrentes?.reduce((acc, d) => acc + d.valor, 0) || 0, [despesasRecorrentes]);

  // Memoizar agrupamento de entradas por categoria (para gráfico de pizza)
  const entradasPorCategoria = useMemo(() => {
    if (!transacoes) return { dados: [], total: 0 };
    const entradas = transacoes.filter(t => t.tipo === 'entrada');
    if (entradas.length === 0) return { dados: [], total: 0 };
    
    const agrupado = entradas.reduce((acc, t) => {
      const cat = t.categoria?.nome || 'Sem categoria';
      acc[cat] = (acc[cat] || 0) + t.valor;
      return acc;
    }, {} as Record<string, number>);
    
    const total = Object.values(agrupado).reduce((a, b) => a + b, 0);
    const dados = Object.entries(agrupado).sort((a, b) => b[1] - a[1]);
    
    return { dados, total };
  }, [transacoes]);

  // Memoizar agrupamento de saídas por categoria (para gráfico de pizza)
  const saidasPorCategoria = useMemo(() => {
    if (!transacoes) return { dados: [], total: 0 };
    const saidas = transacoes.filter(t => t.tipo === 'saida');
    if (saidas.length === 0) return { dados: [], total: 0 };
    
    const agrupado = saidas.reduce((acc, t) => {
      const cat = t.categoria?.nome || 'Sem categoria';
      acc[cat] = (acc[cat] || 0) + t.valor;
      return acc;
    }, {} as Record<string, number>);
    
    const total = Object.values(agrupado).reduce((a, b) => a + b, 0);
    const dados = Object.entries(agrupado).sort((a, b) => b[1] - a[1]);
    
    return { dados, total };
  }, [transacoes]);

  const categoriasEntrada = useMemo(() => categorias?.filter(c => c.tipo === 'entrada') || [], [categorias]);
  const categoriasSaida = useMemo(() => categorias?.filter(c => c.tipo === 'saida') || [], [categorias]);

  const formatarValor = (valor: number) => {
    return (valor / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleOpenForm = (tipo: TipoTransacao) => {
    setTipoTransacao(tipo);
    setFormData({
      descricao: '',
      valor: '',
      data: format(hoje, 'yyyy-MM-dd'),
      categoria_id: '',
      forma_pagamento: '',
      observacoes: '',
    });
    setIsFormOpen(true);
  };

  const handleSubmitTransacao = () => {
    if (!formData.descricao || !formData.valor) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    createTransacao.mutate({
      tipo: tipoTransacao,
      descricao: formData.descricao,
      valor: Math.round(parseFloat(formData.valor) * 100),
      data: formData.data,
      categoria_id: formData.categoria_id || null,
      forma_pagamento: formData.forma_pagamento || null,
      observacoes: formData.observacoes || null,
      referencia_tipo: 'manual',
      referencia_id: null,
      created_by: user?.id || null,
    }, {
      onSuccess: () => {
        toast.success(`${tipoTransacao === 'entrada' ? 'Entrada' : 'Saída'} registrada!`);
        setIsFormOpen(false);
      },
      onError: () => toast.error('Erro ao registrar transação'),
    });
  };

  const handleSubmitCategoria = () => {
    if (!categoriaForm.nome) {
      toast.error('Informe o nome da categoria');
      return;
    }

    createCategoria.mutate({
      nome: categoriaForm.nome,
      tipo: categoriaForm.tipo,
      cor: categoriaForm.cor,
      icone: null,
      ativo: true,
    }, {
      onSuccess: () => {
        toast.success('Categoria criada!');
        setIsCategoriaFormOpen(false);
        setCategoriaForm({ nome: '', tipo: 'saida', cor: '#6b7280' });
      },
      onError: () => toast.error('Erro ao criar categoria'),
    });
  };

  const handleDelete = (id: string) => {
    deleteTransacao.mutate(id, {
      onSuccess: () => toast.success('Transação excluída'),
      onError: () => toast.error('Erro ao excluir'),
    });
  };

  const handleSubmitDespesa = () => {
    if (!despesaForm.nome || !despesaForm.valor) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    createDespesaRecorrente.mutate({
      nome: despesaForm.nome,
      valor: Math.round(parseFloat(despesaForm.valor) * 100),
      categoria_id: despesaForm.categoria_id || null,
      dia_vencimento: despesaForm.dia_vencimento ? parseInt(despesaForm.dia_vencimento) : null,
      observacoes: despesaForm.observacoes || null,
      ativo: true,
    }, {
      onSuccess: () => {
        toast.success('Despesa recorrente cadastrada!');
        setIsDespesaFormOpen(false);
        setDespesaForm({ nome: '', valor: '', categoria_id: '', dia_vencimento: '', observacoes: '' });
      },
      onError: () => toast.error('Erro ao cadastrar despesa'),
    });
  };

  const handleDeleteDespesa = (id: string) => {
    deleteDespesaRecorrente.mutate(id, {
      onSuccess: () => toast.success('Despesa removida'),
      onError: () => toast.error('Erro ao remover'),
    });
  };

  const handleSubmitMeta = () => {
    if (!metaForm.nome || !metaForm.valor_meta) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    createMeta.mutate({
      nome: metaForm.nome,
      tipo: metaForm.tipo,
      valor_meta: Math.round(parseFloat(metaForm.valor_meta) * 100),
      mes: hoje.getMonth() + 1,
      ano: hoje.getFullYear(),
      categoria_id: null,
      descricao: metaForm.descricao || null,
      ativo: true,
    }, {
      onSuccess: () => {
        toast.success('Meta criada!');
        setIsMetaFormOpen(false);
        setMetaForm({ nome: '', tipo: 'receita', valor_meta: '', descricao: '' });
      },
      onError: () => toast.error('Erro ao criar meta'),
    });
  };

  const handleDeleteMeta = (id: string) => {
    deleteMeta.mutate(id, {
      onSuccess: () => toast.success('Meta removida'),
      onError: () => toast.error('Erro ao remover'),
    });
  };

  const handleOpenAnexos = (transacaoId: string) => {
    setSelectedTransacaoId(transacaoId);
    setIsAnexosDialogOpen(true);
  };

  const handleUploadAnexo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTransacaoId) return;

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    // Validar tipo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!tiposPermitidos.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use JPG, PNG, WebP ou PDF.');
      return;
    }

    setUploadingAnexo(true);
    uploadAnexo.mutate(
      { transacaoId: selectedTransacaoId, file },
      {
        onSuccess: () => {
          toast.success('Anexo enviado!');
          setUploadingAnexo(false);
        },
        onError: () => {
          toast.error('Erro ao enviar anexo');
          setUploadingAnexo(false);
        },
      }
    );

    // Limpar input
    e.target.value = '';
  };

  const handleDeleteAnexo = (anexoId: string, url: string) => {
    if (!selectedTransacaoId) return;
    
    deleteAnexo.mutate(
      { id: anexoId, url, transacaoId: selectedTransacaoId },
      {
        onSuccess: () => toast.success('Anexo removido'),
        onError: () => toast.error('Erro ao remover anexo'),
      }
    );
  };

  const formatarTamanho = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handlers de reconciliação
  const handleToggleReconciliacao = (transacaoId: string, reconciliada: boolean) => {
    if (!user?.id) return;
    reconciliarTransacao.mutate(
      { id: transacaoId, reconciliada: !reconciliada, userId: user.id },
      {
        onSuccess: () => toast.success(reconciliada ? 'Reconciliação removida' : 'Transação reconciliada'),
        onError: () => toast.error('Erro ao atualizar'),
      }
    );
  };

  const handleToggleSelecao = (transacaoId: string) => {
    setTransacoesSelecionadas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transacaoId)) {
        newSet.delete(transacaoId);
      } else {
        newSet.add(transacaoId);
      }
      return newSet;
    });
  };

  const handleSelecionarTodas = () => {
    const transacoesManuais = transacoes?.filter(t => t.referencia_tipo === 'manual' && !t.id.startsWith('mp-')) || [];
    if (transacoesSelecionadas.size === transacoesManuais.length) {
      setTransacoesSelecionadas(new Set());
    } else {
      setTransacoesSelecionadas(new Set(transacoesManuais.map(t => t.id)));
    }
  };

  const handleReconciliarSelecionadas = (reconciliada: boolean) => {
    if (!user?.id || transacoesSelecionadas.size === 0) return;
    
    reconciliarLote.mutate(
      { ids: Array.from(transacoesSelecionadas), reconciliada, userId: user.id },
      {
        onSuccess: () => {
          toast.success(`${transacoesSelecionadas.size} transações ${reconciliada ? 'reconciliadas' : 'desmarcadas'}`);
          setTransacoesSelecionadas(new Set());
        },
        onError: () => toast.error('Erro ao atualizar transações'),
      }
    );
  };

  // Filtrar transações por reconciliação
  const transacoesFiltradas = useMemo(() => {
    if (!mostrarApenasNaoReconciliadas) return transacoes;
    return transacoes?.filter(t => !t.reconciliada);
  }, [transacoes, mostrarApenasNaoReconciliadas]);

  // Paginação do extrato (client-side — dados já filtrados por período)
  const totalTransacoes = transacoesFiltradas?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalTransacoes / pageSize));
  const transacoesPage = useMemo(() => {
    const from = (currentPage - 1) * pageSize;
    return transacoesFiltradas?.slice(from, from + pageSize) ?? [];
  }, [transacoesFiltradas, currentPage, pageSize]);

  // Resetar para p.1 quando filtros mudam
  const handleFiltroChange = (fn: () => void) => { fn(); setCurrentPage(1); };

  const exportarRelatorio = () => {
    if (!transacoes?.length) {
      toast.error('Nenhuma transação para exportar');
      return;
    }

    const linhas = [
      'Data,Tipo,Descrição,Categoria,Valor,Forma Pagamento',
      ...transacoes.map(t => 
        `${t.data},${t.tipo},${t.descricao.replace(/,/g, ';')},${t.categoria?.nome || '-'},${(t.valor / 100).toFixed(2)},${t.forma_pagamento || '-'}`
      )
    ];

    const csv = linhas.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fluxo-caixa-${filtroDataInicio}-${filtroDataFim}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Relatório exportado!');
  };

  // Calcular maior valor para o gráfico
  const maxValorMensal = useMemo(() => {
    if (!dadosMensais) return 1;
    return Math.max(...dadosMensais.map(m => Math.max(m.entradas, m.saidas)), 1);
  }, [dadosMensais]);

  // Filtros rápidos
  const aplicarFiltroRapido = (periodo: 'mes' | 'trimestre' | 'ano') => {
    const fim = endOfMonth(hoje);
    let inicio;
    
    switch (periodo) {
      case 'mes':
        inicio = startOfMonth(hoje);
        break;
      case 'trimestre':
        inicio = startOfMonth(subMonths(hoje, 2));
        break;
      case 'ano':
        inicio = new Date(hoje.getFullYear(), 0, 1);
        break;
    }
    
    setFiltroDataInicio(format(inicio, 'yyyy-MM-dd'));
    setFiltroDataFim(format(fim, 'yyyy-MM-dd'));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* Resumo Fixo Mobile (Sticky Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t p-3 md:hidden flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Saldo Atual</span>
          <span className={`text-lg font-bold ${(resumo?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatarValor(resumo?.saldo || 0)}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 h-11 w-11 p-0 rounded-full shadow-lg shadow-primary/20 flex items-center justify-center"
            onClick={() => handleOpenForm('entrada')}
          >
            <ArrowUpCircle className="w-6 h-6 text-white" />
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            className="h-11 w-11 p-0 rounded-full shadow-lg shadow-red-500/20 flex items-center justify-center"
            onClick={() => handleOpenForm('saida')}
          >
            <ArrowDownCircle className="w-6 h-6 text-white" />
          </Button>
        </div>
      </div>

      {/* Alerta de Saldo Baixo */}
      {mostrarAlertaSaldo && (
        <div className="p-4 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-300 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
          <div>
            <p className="font-bold text-red-800 dark:text-red-200">Atenção: Saldo Baixo!</p>
            <p className="text-sm text-red-700 dark:text-red-300">
              Limite: {formatarValor(alertaSaldoBaixo?.valor_limite || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] md:text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ArrowUpCircle className="w-3.5 h-3.5 text-green-600" />
              Entradas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl md:text-2xl font-black text-green-700 dark:text-green-300">
              {formatarValor(resumo?.entradas || 0)}
            </div>
            {resumo?.entradasMP ? (
              <p className="text-[10px] text-green-600/80 mt-1 hidden md:block">
                💳 MP: {formatarValor(resumo.entradasMP)} | ✍️ Manual: {formatarValor(resumo.entradasManuais || 0)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] md:text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ArrowDownCircle className="w-3.5 h-3.5 text-red-500" />
              Saídas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl md:text-2xl font-black text-red-700 dark:text-red-300">
              {formatarValor(resumo?.saidas || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className={`col-span-2 md:col-span-1 border-2 ${(resumo?.saldo || 0) >= 0 ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] md:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              Saldo Líquido
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 flex items-center justify-between md:block">
            <div className={`text-2xl font-black ${(resumo?.saldo || 0) >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {formatarValor(resumo?.saldo || 0)}
            </div>
            <Badge variant="outline" className={`md:mt-1 text-[10px] border-none p-0 ${(resumo?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(resumo?.saldo || 0) >= 0 ? '✅ Saudável' : '⚠️ Atenção'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Desktop: botões com texto; Mobile: apenas ícones visíveis via FAB sticky */}
        <Button onClick={() => handleOpenForm('entrada')} className="bg-primary hover:bg-primary/90 hidden md:inline-flex" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nova Entrada
        </Button>
        <Button onClick={() => handleOpenForm('saida')} variant="destructive" className="hidden md:inline-flex" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nova Saída
        </Button>
        <div className="flex-1" />
        <div className="flex gap-1 bg-muted p-0.5 rounded-lg">
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2 md:px-3" onClick={() => aplicarFiltroRapido('mes')}>Mês</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2 md:px-3" onClick={() => aplicarFiltroRapido('trimestre')}>Tri</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2 md:px-3" onClick={() => aplicarFiltroRapido('ano')}>Ano</Button>
        </div>
        <Button variant="outline" size="sm" onClick={exportarRelatorio} className="h-7 px-2 md:px-3">
          <Download className="w-4 h-4 md:mr-1" />
          <span className="hidden md:inline">Exportar CSV</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <div className="relative mb-6">
          <TabsList className="w-full h-auto p-0 bg-transparent border-b rounded-none justify-start overflow-x-auto scrollbar-none flex-nowrap">
            {[
              { value: 'resumo', icon: <BarChart3 className="w-4 h-4 shrink-0" />, label: 'Painel' },
              { value: 'transacoes', icon: <DollarSign className="w-4 h-4 shrink-0" />, label: 'Extrato' },
              { value: 'recorrentes', icon: <RefreshCw className="w-4 h-4 shrink-0" />, label: 'Fixos' },
              { value: 'categorias', icon: <Tag className="w-4 h-4 shrink-0" />, label: 'Tags' },
              { value: 'metas', icon: <Target className="w-4 h-4 shrink-0" />, label: 'Metas' },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent py-3 px-3 md:px-5 text-xs md:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap"
              >
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Gráficos */}
        <TabsContent value="resumo" className="space-y-6 animate-in fade-in duration-500">
          {/* Comparativo Mês Atual vs Anterior */}
          <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                Desempenho Mensal
              </CardTitle>
              <CardDescription>
                Comparativo com o mês anterior
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 md:px-6">
              {dadosMensais && (
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
                  <div className="text-center p-4 rounded-2xl bg-background border shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                      <CalendarIcon className="w-12 h-12" />
                    </div>
                    <p className="text-[10px] uppercase tracking-tighter text-muted-foreground mb-1 font-bold">Mês Atual ({MESES[hoje.getMonth()]})</p>
                    <div className="space-y-1">
                      <p className="text-2xl font-black text-green-600">
                        {formatarValor(dadosMensais[hoje.getMonth()]?.entradas || 0)}
                      </p>
                      <p className="text-xs font-medium text-red-500 flex items-center justify-center gap-1">
                        <ArrowDownCircle className="w-3 h-3" />
                        {formatarValor(dadosMensais[hoje.getMonth()]?.saidas || 0)}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-bold">
                        Saldo: {formatarValor((dadosMensais[hoje.getMonth()]?.entradas || 0) - (dadosMensais[hoje.getMonth()]?.saidas || 0))}
                      </p>
                    </div>
                  </div>

                  <div className="text-center p-4 rounded-2xl bg-muted/30 border border-dashed relative overflow-hidden">
                    <p className="text-[10px] uppercase tracking-tighter text-muted-foreground mb-1 font-bold">Mês Anterior ({MESES[hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1]})</p>
                    <div className="space-y-1 opacity-70">
                      <p className="text-xl font-bold text-green-600/80">
                        {formatarValor(dadosMensais[hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1]?.entradas || 0)}
                      </p>
                      <p className="text-xs font-medium text-red-500/80">
                        -{formatarValor(dadosMensais[hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1]?.saidas || 0)}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-muted">
                      <p className="text-sm font-semibold text-muted-foreground">
                        Saldo: {formatarValor(
                          (dadosMensais[hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1]?.entradas || 0) - 
                          (dadosMensais[hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1]?.saidas || 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Barras Mensal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Fluxo Mensal - {hoje.getFullYear()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-1 md:gap-2">
                {dadosMensais?.map((mes, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="w-full flex gap-0.5 h-48 items-end">
                      <div
                        className="flex-1 bg-green-500 rounded-t transition-all hover:bg-green-400"
                        style={{ height: `${(mes.entradas / maxValorMensal) * 100}%`, minHeight: mes.entradas > 0 ? '4px' : '0' }}
                        title={`Entradas ${MESES[i]}: ${formatarValor(mes.entradas)}`}
                      />
                      <div
                        className="flex-1 bg-red-500 rounded-t transition-all hover:bg-red-400"
                        style={{ height: `${(mes.saidas / maxValorMensal) * 100}%`, minHeight: mes.saidas > 0 ? '4px' : '0' }}
                        title={`Saídas ${MESES[i]}: ${formatarValor(mes.saidas)}`}
                      />
                    </div>
                    <span className={`text-[9px] md:text-xs truncate w-full text-center ${i === hoje.getMonth() ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {MESES[i]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span className="text-sm">Entradas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded" />
                  <span className="text-sm">Saídas</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distribuição por Categoria (Gráfico de Pizza simulado) */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-green-600" />
                  Entradas por Origem
                </CardTitle>
              </CardHeader>
              <CardContent>
                {entradasPorCategoria.dados.length > 0 ? (
                  <div className="space-y-3">
                    {entradasPorCategoria.dados.map(([cat, valor], i) => {
                      const cores = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{cat}</span>
                            <span className="font-medium">{formatarValor(valor)}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ 
                                width: `${(valor / entradasPorCategoria.total) * 100}%`,
                                backgroundColor: cores[i % cores.length]
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-right">
                            {((valor / entradasPorCategoria.total) * 100).toFixed(1)}%
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">Sem entradas no período</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-red-500" />
                  Saídas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                {saidasPorCategoria.dados.length > 0 ? (
                  <div className="space-y-3">
                    {saidasPorCategoria.dados.map(([cat, valor], i) => {
                      const cores = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#14b8a6', '#6366f1'];
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{cat}</span>
                            <span className="font-medium">{formatarValor(valor)}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ 
                                width: `${(valor / saidasPorCategoria.total) * 100}%`,
                                backgroundColor: cores[i % cores.length]
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-right">
                            {((valor / saidasPorCategoria.total) * 100).toFixed(1)}%
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">Sem saídas no período</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Transações */}
        <TabsContent value="transacoes" className="space-y-4">
          {/* Estatísticas de Reconciliação */}
          {estatisticasReconciliacao && estatisticasReconciliacao.total > 0 && (
            <Card className="border-border bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <CheckCheck className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Reconciliação do Período</p>
                      <p className="text-xs text-muted-foreground">
                        {estatisticasReconciliacao.reconciliadas} de {estatisticasReconciliacao.total} transações conferidas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${estatisticasReconciliacao.percentual}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {estatisticasReconciliacao.percentual.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filtros */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="grid gap-1.5 flex-1 min-w-[130px]">
                  <Label className="text-xs">De</Label>
                  <Input
                    type="date"
                    value={filtroDataInicio}
                    onChange={(e) => handleFiltroChange(() => setFiltroDataInicio(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="grid gap-1.5 flex-1 min-w-[130px]">
                  <Label className="text-xs">Até</Label>
                  <Input
                    type="date"
                    value={filtroDataFim}
                    onChange={(e) => handleFiltroChange(() => setFiltroDataFim(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="grid gap-1.5 w-[120px]">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={filtroTipo} onValueChange={(v: any) => handleFiltroChange(() => setFiltroTipo(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="entrada">Entradas</SelectItem>
                      <SelectItem value="saida">Saídas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant={mostrarApenasNaoReconciliadas ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFiltroChange(() => setMostrarApenasNaoReconciliadas(!mostrarApenasNaoReconciliadas))}
                  >
                    <Circle className="w-3 h-3 mr-1" />
                    Pendentes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações em lote */}
          {transacoesSelecionadas.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted">
              <span className="text-sm font-medium">{transacoesSelecionadas.size} selecionadas</span>
              <div className="flex-1" />
              <Button size="sm" variant="outline" onClick={() => handleReconciliarSelecionadas(true)}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Reconciliar
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleReconciliarSelecionadas(false)}>
                <Circle className="w-4 h-4 mr-1" />
                Desmarcar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setTransacoesSelecionadas(new Set())}>
                Limpar
              </Button>
            </div>
          )}

          {/* Lista de Transações */}
          <Card>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : !totalTransacoes ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma transação no período</p>
                </div>
              ) : (
                <>
                  {/* Versão Desktop - Tabela */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={handleSelecionarTodas}
                              title="Selecionar todas"
                            >
                              {transacoesSelecionadas.size > 0 ? (
                                <CheckCircle className="w-4 h-4 text-primary" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </Button>
                          </TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Pagamento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="w-20"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transacoesPage.map((t) => (
                          <TableRow key={t.id} className={t.reconciliada ? 'bg-green-50/50 dark:bg-green-900/10' : ''}>
                            <TableCell>
                              {t.referencia_tipo === 'manual' && !t.id.startsWith('mp-') ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleToggleSelecao(t.id)}
                                >
                                  {transacoesSelecionadas.has(t.id) ? (
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                  ) : (
                                    <Circle className="w-4 h-4" />
                                  )}
                                </Button>
                              ) : (
                                <span className="w-6" />
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(t.data), 'dd/MM/yy', { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {t.tipo === 'entrada' ? (
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                )}
                                <span className="text-sm">{t.descricao}</span>
                                {t.reconciliada && (
                                  <span title="Reconciliada">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {t.categoria && (
                                <Badge variant="outline" style={{ borderColor: t.categoria.cor || undefined }}>
                                  {t.categoria.nome}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {t.forma_pagamento || '-'}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${t.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                              {t.tipo === 'entrada' ? '+' : '-'} {formatarValor(t.valor)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {t.referencia_tipo === 'manual' && !t.id.startsWith('mp-') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-8 w-8 ${t.reconciliada ? 'text-green-600' : 'text-muted-foreground'}`}
                                    onClick={() => handleToggleReconciliacao(t.id, !!t.reconciliada)}
                                    title={t.reconciliada ? 'Remover reconciliação' : 'Marcar como reconciliada'}
                                  >
                                    {t.reconciliada ? (
                                      <CheckCircle className="w-4 h-4" />
                                    ) : (
                                      <Circle className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                                {t.referencia_tipo === 'manual' && !t.id.startsWith('mp-') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleOpenAnexos(t.id)}
                                    title="Ver/Adicionar anexos"
                                  >
                                    <Paperclip className="w-4 h-4" />
                                  </Button>
                                )}
                                {t.referencia_tipo === 'manual' || t.referencia_tipo === 'inscricao' ? (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                                        <AlertDialogDescription>Esta ação não pode ser desfeita e o valor será removido do saldo total.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-destructive">
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Versão Mobile - Cards Modernos */}
                  <div className="md:hidden space-y-4">
                    {/* Botão selecionar todas no mobile */}
                    <div className="flex items-center justify-between px-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelecionarTodas}
                        className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground"
                      >
                        {transacoesSelecionadas.size > 0 ? (
                          <CheckCircle className="w-3 h-3 mr-1.5 text-primary" />
                        ) : (
                          <Circle className="w-3 h-3 mr-1.5" />
                        )}
                        {transacoesSelecionadas.size > 0 ? `${transacoesSelecionadas.size} selecionadas` : 'Selecionar todas'}
                      </Button>
                    </div>

                    {transacoesPage.map((t) => (
                      <div
                        key={t.id}
                        className={`relative overflow-hidden rounded-2xl border shadow-sm transition-all active:scale-[0.98] ${
                          t.reconciliada 
                            ? 'bg-green-50/30 dark:bg-green-900/5 border-green-200/50' 
                            : 'bg-card border-border/50'
                        }`}
                      >
                        {/* Indicador Lateral de Tipo */}
                        <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${t.tipo === 'entrada' ? 'bg-green-500' : 'bg-red-500'}`} />
                        
                        <div className="p-4 pl-5">
                          {/* Header: Data e Reconciliação */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                                {format(new Date(t.data), 'dd MMM yyyy', { locale: ptBR })}
                              </span>
                              {t.reconciliada && (
                                <Badge variant="secondary" className="h-4 text-[8px] bg-green-100 text-green-700 hover:bg-green-100 border-none px-1">
                                  CONFERIDO
                                </Badge>
                              )}
                            </div>
                            <span className={`text-base font-black ${t.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                              {t.tipo === 'entrada' ? '+' : '-'} {formatarValor(t.valor)}
                            </span>
                          </div>

                          {/* Conteúdo: Descrição e Detalhes */}
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-bold leading-tight line-clamp-2">{t.descricao}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {t.categoria && (
                                  <span 
                                    className="text-[10px] px-2 py-0.5 rounded-full border font-medium" 
                                    style={{ 
                                      borderColor: t.categoria.cor || 'currentColor',
                                      color: t.categoria.cor || 'inherit',
                                      backgroundColor: `${t.categoria.cor}10`
                                    }}
                                  >
                                    {t.categoria.nome}
                                  </span>
                                )}
                                {t.forma_pagamento && (
                                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {t.forma_pagamento.toLowerCase()}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Ações Rápidas Mobile */}
                            <div className="flex items-center justify-between pt-3 border-t border-dashed">
                              <div className="flex gap-1">
                                {t.referencia_tipo === 'manual' && !t.id.startsWith('mp-') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleSelecao(t.id)}
                                    className={`h-8 px-2 text-[10px] font-bold ${transacoesSelecionadas.has(t.id) ? 'text-primary' : 'text-muted-foreground'}`}
                                  >
                                    {transacoesSelecionadas.has(t.id) ? (
                                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                    ) : (
                                      <Circle className="w-3.5 h-3.5 mr-1" />
                                    )}
                                    FOCO
                                  </Button>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1">
                                {t.referencia_tipo === 'manual' && !t.id.startsWith('mp-') && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className={`h-8 w-8 rounded-full border-none shadow-none ${t.reconciliada ? 'text-green-600 bg-green-50' : 'text-muted-foreground bg-muted/50'}`}
                                      onClick={() => handleToggleReconciliacao(t.id, !!t.reconciliada)}
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 rounded-full border-none shadow-none bg-muted/50"
                                      onClick={() => handleOpenAnexos(t.id)}
                                    >
                                      <Paperclip className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                {t.referencia_tipo === 'manual' || t.referencia_tipo === 'inscricao' ? (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-none shadow-none bg-red-50 text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="w-[90%] rounded-2xl">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-xs">
                                          Esta ação removerá o valor do saldo permanentemente.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="flex-row gap-2">
                                        <AlertDialogCancel className="flex-1 rounded-xl">Não</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(t.id)} className="flex-1 bg-destructive rounded-xl">Sim</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      isLoading={isLoading}
                      pageSize={pageSize}
                      onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                      pageSizeOptions={[10, 20, 50]}
                      totalItems={totalTransacoes}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Despesas Recorrentes */}
        <TabsContent value="recorrentes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <RefreshCw className="w-5 h-5" />
                  Despesas Recorrentes
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Cadastre despesas fixas mensais para projeção de gastos
                </CardDescription>
              </div>
              <Button onClick={() => setIsDespesaFormOpen(true)} size="sm" className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Nova Despesa
              </Button>
            </CardHeader>
            <CardContent>
              {/* Resumo */}
              <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Projeção de Gastos Fixos Mensais</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatarValor(totalRecorrenteMemo)}
                    </p>
                  </div>
                  <FileText className="w-10 h-10 text-muted-foreground opacity-40" />
                </div>
              </div>

              {/* Lista */}
              {!despesasRecorrentes?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma despesa recorrente cadastrada</p>
                </div>
              ) : (
                <>
                  {/* Versão Desktop - Tabela */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Despesa</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {despesasRecorrentes.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium">{d.nome}</TableCell>
                            <TableCell>
                              {d.categoria && (
                                <Badge variant="outline" style={{ borderColor: d.categoria.cor || undefined }}>
                                  {d.categoria.nome}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {d.dia_vencimento ? `Dia ${d.dia_vencimento}` : '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium text-red-600">
                              {formatarValor(d.valor)}
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remover despesa?</AlertDialogTitle>
                                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteDespesa(d.id)} className="bg-destructive">
                                      Remover
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Versão Mobile - Cards */}
                  <div className="md:hidden space-y-3">
                    {despesasRecorrentes.map((d) => (
                      <div key={d.id} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{d.nome}</p>
                            {d.categoria && (
                              <Badge variant="outline" className="text-xs mt-1" style={{ borderColor: d.categoria.cor || undefined }}>
                                {d.categoria.nome}
                              </Badge>
                            )}
                          </div>
                          <span className="font-bold text-red-600">{formatarValor(d.valor)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-muted-foreground">
                            {d.dia_vencimento ? `Vence dia ${d.dia_vencimento}` : 'Sem vencimento'}
                          </span>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover despesa?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteDespesa(d.id)} className="bg-destructive">
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Categorias */}
        <TabsContent value="categorias" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsCategoriaFormOpen(true)} size="sm" className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpCircle className="w-5 h-5 text-green-600" />
                  Categorias de Entrada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoriasEntrada.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.cor || '#6b7280' }} />
                      <span className="text-sm">{c.nome}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownCircle className="w-5 h-5 text-red-500" />
                  Categorias de Saída
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoriasSaida.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.cor || '#6b7280' }} />
                      <span className="text-sm">{c.nome}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Metas */}
        <TabsContent value="metas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Target className="w-5 h-5" />
                  Metas - {MESES[hoje.getMonth()]} {hoje.getFullYear()}
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Defina objetivos e acompanhe o progresso
                </CardDescription>
              </div>
              <Button onClick={() => setIsMetaFormOpen(true)} size="sm" className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Nova Meta
              </Button>
            </CardHeader>
            <CardContent>
              {!metasComProgresso?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma meta definida para este mês</p>
                  <p className="text-sm">Crie metas para acompanhar seus objetivos financeiros</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {metasComProgresso.map((meta) => (
                    <div key={meta.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {meta.nome}
                            {meta.atingida && (
                              <span className="text-green-600 text-sm">✅ Atingida!</span>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {meta.tipo === 'receita' && '📈 Meta de Receita'}
                            {meta.tipo === 'economia' && '💰 Meta de Economia'}
                            {meta.tipo === 'reducao_despesa' && '📉 Redução de Despesa'}
                          </p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover meta?</AlertDialogTitle>
                              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteMeta(meta.id)} className="bg-destructive">
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      
                      {/* Barra de progresso */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso: {meta.percentual.toFixed(1)}%</span>
                          <span>
                            {formatarValor(meta.valor_atual)} / {formatarValor(meta.valor_meta)}
                          </span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              meta.percentual >= 100 ? 'bg-green-500' :
                              meta.percentual >= 75 ? 'bg-blue-500' :
                              meta.percentual >= 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, meta.percentual)}%` }}
                          />
                        </div>
                      </div>

                      {meta.descricao && (
                        <p className="text-sm text-muted-foreground mt-2">{meta.descricao}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuração de Alertas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuração de Alertas
              </CardTitle>
              <CardDescription>
                Configure alertas automáticos para monitorar a saúde financeira
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertaSaldoBaixo && (
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Alerta de Saldo Baixo
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Notifica quando o saldo ficar abaixo de {formatarValor(alertaSaldoBaixo.valor_limite || 0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        className="w-32"
                        defaultValue={((alertaSaldoBaixo.valor_limite || 0) / 100).toFixed(2)}
                        onBlur={(e) => {
                          const novoValor = Math.round(parseFloat(e.target.value || '0') * 100);
                          if (novoValor !== alertaSaldoBaixo.valor_limite) {
                            updateAlerta.mutate({
                              id: alertaSaldoBaixo.id,
                              valor_limite: novoValor,
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal/Drawer Nova Transação */}
      {isMobile ? (
        <Drawer open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DrawerContent className="h-[85vh] max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle className={tipoTransacao === 'entrada' ? 'text-primary' : 'text-destructive'}>
                {tipoTransacao === 'entrada' ? '➕ Nova Entrada' : '➖ Nova Saída'}
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto flex-1">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Descrição *</Label>
                  <Input
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Ex: Pagamento cerimônia João"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Valor (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.categoria_id}
                    onValueChange={(v) => setFormData({ ...formData, categoria_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(tipoTransacao === 'entrada' ? categoriasEntrada : categoriasSaida).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Forma de Pagamento</Label>
                  <Select
                    value={formData.forma_pagamento}
                    onValueChange={(v) => setFormData({ ...formData, forma_pagamento: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                      <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Informações adicionais..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsFormOpen(false)} className="flex-1">Cancelar</Button>
                  <Button
                    onClick={handleSubmitTransacao}
                    disabled={createTransacao.isPending}
                    className={`flex-1 ${tipoTransacao === 'entrada' ? 'bg-primary hover:bg-primary/90' : 'bg-destructive hover:bg-destructive/90'}`}
                  >
                    {createTransacao.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className={tipoTransacao === 'entrada' ? 'text-primary' : 'text-destructive'}>
                {tipoTransacao === 'entrada' ? '➕ Nova Entrada' : '➖ Nova Saída'}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Descrição *</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Pagamento cerimônia João"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Valor (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.categoria_id}
                  onValueChange={(v) => setFormData({ ...formData, categoria_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(tipoTransacao === 'entrada' ? categoriasEntrada : categoriasSaida).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Forma de Pagamento</Label>
                <Select
                  value={formData.forma_pagamento}
                  onValueChange={(v) => setFormData({ ...formData, forma_pagamento: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
              <Button
                onClick={handleSubmitTransacao}
                disabled={createTransacao.isPending}
                className={tipoTransacao === 'entrada' ? 'bg-primary hover:bg-primary/90' : 'bg-destructive hover:bg-destructive/90'}
              >
                {createTransacao.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal/Drawer Nova Categoria */}
      {isMobile ? (
        <Drawer open={isCategoriaFormOpen} onOpenChange={setIsCategoriaFormOpen}>
          <DrawerContent className="h-[85vh] max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Nova Categoria</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto flex-1">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Nome *</Label>
                  <Input
                    value={categoriaForm.nome}
                    onChange={(e) => setCategoriaForm({ ...categoriaForm, nome: e.target.value })}
                    placeholder="Ex: Combustível"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select
                      value={categoriaForm.tipo}
                      onValueChange={(v: TipoTransacao) => setCategoriaForm({ ...categoriaForm, tipo: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Cor</Label>
                    <Input
                      type="color"
                      value={categoriaForm.cor}
                      onChange={(e) => setCategoriaForm({ ...categoriaForm, cor: e.target.value })}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsCategoriaFormOpen(false)} className="flex-1">Cancelar</Button>
                  <Button onClick={handleSubmitCategoria} disabled={createCategoria.isPending} className="flex-1">
                    {createCategoria.isPending ? 'Salvando...' : 'Criar Categoria'}
                  </Button>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isCategoriaFormOpen} onOpenChange={setIsCategoriaFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Categoria</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome *</Label>
                <Input
                  value={categoriaForm.nome}
                  onChange={(e) => setCategoriaForm({ ...categoriaForm, nome: e.target.value })}
                  placeholder="Ex: Combustível"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select
                    value={categoriaForm.tipo}
                    onValueChange={(v: TipoTransacao) => setCategoriaForm({ ...categoriaForm, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Cor</Label>
                  <Input
                    type="color"
                    value={categoriaForm.cor}
                    onChange={(e) => setCategoriaForm({ ...categoriaForm, cor: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCategoriaFormOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmitCategoria} disabled={createCategoria.isPending}>
                {createCategoria.isPending ? 'Salvando...' : 'Criar Categoria'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal/Drawer Nova Despesa Recorrente */}
      {isMobile ? (
        <Drawer open={isDespesaFormOpen} onOpenChange={setIsDespesaFormOpen}>
          <DrawerContent className="h-[85vh] max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>📅 Nova Despesa Recorrente</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto flex-1">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Nome da Despesa *</Label>
                  <Input
                    value={despesaForm.nome}
                    onChange={(e) => setDespesaForm({ ...despesaForm, nome: e.target.value })}
                    placeholder="Ex: Aluguel, Energia, Internet..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Valor Mensal (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={despesaForm.valor}
                      onChange={(e) => setDespesaForm({ ...despesaForm, valor: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Dia do Vencimento</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={despesaForm.dia_vencimento}
                      onChange={(e) => setDespesaForm({ ...despesaForm, dia_vencimento: e.target.value })}
                      placeholder="1-31"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select
                    value={despesaForm.categoria_id}
                    onValueChange={(v) => setDespesaForm({ ...despesaForm, categoria_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasSaida.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={despesaForm.observacoes}
                    onChange={(e) => setDespesaForm({ ...despesaForm, observacoes: e.target.value })}
                    placeholder="Informações adicionais..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsDespesaFormOpen(false)} className="flex-1">Cancelar</Button>
                  <Button
                    onClick={handleSubmitDespesa}
                    disabled={createDespesaRecorrente.isPending}
                    className="flex-1"
                  >
                    {createDespesaRecorrente.isPending ? 'Salvando...' : 'Cadastrar'}
                  </Button>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isDespesaFormOpen} onOpenChange={setIsDespesaFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>📅 Nova Despesa Recorrente</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome da Despesa *</Label>
                <Input
                  value={despesaForm.nome}
                  onChange={(e) => setDespesaForm({ ...despesaForm, nome: e.target.value })}
                  placeholder="Ex: Aluguel, Energia, Internet..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Valor Mensal (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={despesaForm.valor}
                    onChange={(e) => setDespesaForm({ ...despesaForm, valor: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Dia do Vencimento</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={despesaForm.dia_vencimento}
                    onChange={(e) => setDespesaForm({ ...despesaForm, dia_vencimento: e.target.value })}
                    placeholder="1-31"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select
                  value={despesaForm.categoria_id}
                  onValueChange={(v) => setDespesaForm({ ...despesaForm, categoria_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasSaida.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea
                  value={despesaForm.observacoes}
                  onChange={(e) => setDespesaForm({ ...despesaForm, observacoes: e.target.value })}
                  placeholder="Informações adicionais..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDespesaFormOpen(false)}>Cancelar</Button>
              <Button
                onClick={handleSubmitDespesa}
                disabled={createDespesaRecorrente.isPending}
                className=""
              >
                {createDespesaRecorrente.isPending ? 'Salvando...' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal/Drawer Nova Meta Financeira */}
      {isMobile ? (
        <Drawer open={isMetaFormOpen} onOpenChange={setIsMetaFormOpen}>
          <DrawerContent className="h-[85vh] max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle className="text-primary">🎯 Nova Meta Financeira</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto flex-1">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Nome da Meta *</Label>
                  <Input
                    value={metaForm.nome}
                    onChange={(e) => setMetaForm({ ...metaForm, nome: e.target.value })}
                    placeholder="Ex: Arrecadar R$ 5.000 em cerimônias"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Tipo de Meta</Label>
                  <Select
                    value={metaForm.tipo}
                    onValueChange={(v: 'receita' | 'economia' | 'reducao_despesa') => setMetaForm({ ...metaForm, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">📈 Meta de Receita</SelectItem>
                      <SelectItem value="economia">💰 Meta de Economia</SelectItem>
                      <SelectItem value="reducao_despesa">📉 Redução de Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Valor da Meta (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={metaForm.valor_meta}
                    onChange={(e) => setMetaForm({ ...metaForm, valor_meta: e.target.value })}
                    placeholder="0,00"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    value={metaForm.descricao}
                    onChange={(e) => setMetaForm({ ...metaForm, descricao: e.target.value })}
                    placeholder="Detalhes sobre a meta..."
                    rows={2}
                  />
                </div>

                <div className="p-3 rounded-lg bg-muted text-sm">
                  <p className="font-medium mb-1">ℹ️ Tipos de Meta:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li><strong>Receita:</strong> Total de entradas no mês</li>
                    <li><strong>Economia:</strong> Diferença entre entradas e saídas</li>
                    <li><strong>Redução:</strong> Manter saídas abaixo do valor</li>
                  </ul>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsMetaFormOpen(false)} className="flex-1">Cancelar</Button>
                  <Button
                    onClick={handleSubmitMeta}
                    disabled={createMeta.isPending}
                    className="flex-1"
                  >
                    {createMeta.isPending ? 'Salvando...' : 'Criar Meta'}
                  </Button>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isMetaFormOpen} onOpenChange={setIsMetaFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-primary">🎯 Nova Meta Financeira</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome da Meta *</Label>
                <Input
                  value={metaForm.nome}
                  onChange={(e) => setMetaForm({ ...metaForm, nome: e.target.value })}
                  placeholder="Ex: Arrecadar R$ 5.000 em cerimônias"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo de Meta</Label>
                  <Select
                    value={metaForm.tipo}
                    onValueChange={(v: 'receita' | 'economia' | 'reducao_despesa') => setMetaForm({ ...metaForm, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">📈 Meta de Receita</SelectItem>
                      <SelectItem value="economia">💰 Meta de Economia</SelectItem>
                      <SelectItem value="reducao_despesa">📉 Redução de Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Valor da Meta (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={metaForm.valor_meta}
                    onChange={(e) => setMetaForm({ ...metaForm, valor_meta: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={metaForm.descricao}
                  onChange={(e) => setMetaForm({ ...metaForm, descricao: e.target.value })}
                  placeholder="Detalhes sobre a meta..."
                  rows={2}
                />
              </div>

              <div className="p-3 rounded-lg bg-muted text-sm">
                <p className="font-medium mb-1">ℹ️ Tipos de Meta:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li><strong>Receita:</strong> Total de entradas no mês</li>
                  <li><strong>Economia:</strong> Diferença entre entradas e saídas</li>
                  <li><strong>Redução:</strong> Manter saídas abaixo do valor</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMetaFormOpen(false)}>Cancelar</Button>
              <Button
                onClick={handleSubmitMeta}
                disabled={createMeta.isPending}
                className=""
              >
                {createMeta.isPending ? 'Salvando...' : 'Criar Meta'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal/Drawer de Anexos */}
      {isMobile ? (
        <Drawer open={isAnexosDialogOpen} onOpenChange={setIsAnexosDialogOpen}>
          <DrawerContent className="h-[85vh] max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                Anexos da Transação
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                {/* Upload */}
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="anexo-upload-mobile"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleUploadAnexo}
                    disabled={uploadingAnexo}
                  />
                  <label
                    htmlFor="anexo-upload-mobile"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className={`w-8 h-8 ${uploadingAnexo ? 'animate-pulse text-muted-foreground' : 'text-primary'}`} />
                    <span className="text-sm text-muted-foreground">
                      {uploadingAnexo ? 'Enviando...' : 'Toque para enviar comprovante'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      JPG, PNG, WebP ou PDF (máx. 5MB)
                    </span>
                  </label>
                </div>

                {/* Lista de anexos */}
                <div className="space-y-2">
                  {!anexosTransacao?.length ? (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      Nenhum anexo adicionado
                    </p>
                  ) : (
                    anexosTransacao.map((anexo) => (
                      <div
                        key={anexo.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                          {anexo.tipo_arquivo?.startsWith('image/') ? (
                            <img
                              src={anexo.url}
                              alt={anexo.nome_arquivo}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <File className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{anexo.nome_arquivo}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatarTamanho(anexo.tamanho)} • {format(new Date(anexo.created_at), 'dd/MM/yy HH:mm')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(anexo.url, '_blank')}
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover anexo?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  O arquivo será excluído permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteAnexo(anexo.id, anexo.url)}
                                  className="bg-destructive"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Button variant="outline" onClick={() => setIsAnexosDialogOpen(false)} className="w-full">
                  Fechar
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isAnexosDialogOpen} onOpenChange={setIsAnexosDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                Anexos da Transação
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Upload */}
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file"
                  id="anexo-upload"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleUploadAnexo}
                  disabled={uploadingAnexo}
                />
                <label
                  htmlFor="anexo-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className={`w-8 h-8 ${uploadingAnexo ? 'animate-pulse text-muted-foreground' : 'text-primary'}`} />
                  <span className="text-sm text-muted-foreground">
                    {uploadingAnexo ? 'Enviando...' : 'Clique para enviar comprovante'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    JPG, PNG, WebP ou PDF (máx. 5MB)
                  </span>
                </label>
              </div>

              {/* Lista de anexos */}
              <div className="space-y-2">
                {!anexosTransacao?.length ? (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    Nenhum anexo adicionado
                  </p>
                ) : (
                  anexosTransacao.map((anexo) => (
                    <div
                      key={anexo.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                        {anexo.tipo_arquivo?.startsWith('image/') ? (
                          <img
                            src={anexo.url}
                            alt={anexo.nome_arquivo}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <File className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{anexo.nome_arquivo}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatarTamanho(anexo.tamanho)} • {format(new Date(anexo.created_at), 'dd/MM/yy HH:mm')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(anexo.url, '_blank')}
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover anexo?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O arquivo será excluído permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAnexo(anexo.id, anexo.url)}
                                className="bg-destructive"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAnexosDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FluxoCaixaTab;
