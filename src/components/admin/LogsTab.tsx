import { useState, useMemo, useCallback, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/ui/pagination-controls';
import {
  Search, Filter, RefreshCw, Activity, User, Calendar, FileText,
  ShoppingBag, CreditCard, MessageSquare, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { format, formatDistanceToNow, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  inscricao_cerimonia_criado: 'Inscrição em cerimônia',
  inscricao_cerimonia_excluido: 'Cancelamento de inscrição',
  pagamento_criado: 'Pagamento iniciado',
  pagamento_atualizado: 'Pagamento atualizado',
  cerimonia_criado: 'Cerimônia criada',
  cerimonia_atualizado: 'Cerimônia atualizada',
  cerimonia_excluido: 'Cerimônia excluída',
  depoimento_criado: 'Partilha enviada',
  depoimento_atualizado: 'Partilha atualizada',
  anamnese_criado: 'Anamnese preenchida',
  anamnese_atualizado: 'Anamnese atualizada',
  produto_criado: 'Produto criado',
  produto_atualizado: 'Produto atualizado',
  produto_excluido: 'Produto excluído',
  curso_criado: 'Curso criado',
  curso_atualizado: 'Curso atualizado',
  curso_excluido: 'Curso excluído',
  inscricao_curso_criado: 'Inscrição em curso',
  inscricao_curso_excluido: 'Cancelamento de inscrição em curso',
  usuario_criado: 'Novo usuário',
  usuario_atualizado: 'Perfil atualizado',
  lista_espera_criado: 'Entrou na lista de espera',
  lista_espera_excluido: 'Saiu da lista de espera',
  galeria_criado: 'Mídia adicionada',
  galeria_excluido: 'Mídia removida',
  permissao_concedida: 'Permissão concedida',
  permissao_revogada: 'Permissão revogada',
  transacao_criada: 'Transação criada',
  transacao_atualizada: 'Transação atualizada',
  transacao_excluida: 'Transação excluída',
  material_criado: 'Material criado',
  material_atualizado: 'Material atualizado',
  material_excluido: 'Material excluído',
  role_atribuido: 'Permissão atribuída',
  role_removido: 'Permissão removida',
  diario_criado: 'Entrada no diário',
  ebook_adquirido: 'Ebook adquirido',
};

// Agrupamento de ações para o select
const ACTION_GROUPS: { label: string; actions: string[] }[] = [
  {
    label: 'Cerimônias',
    actions: ['cerimonia_criado', 'cerimonia_atualizado', 'cerimonia_excluido', 'inscricao_cerimonia_criado', 'inscricao_cerimonia_excluido', 'lista_espera_criado', 'lista_espera_excluido'],
  },
  {
    label: 'Pagamentos',
    actions: ['pagamento_criado', 'pagamento_atualizado', 'transacao_criada', 'transacao_atualizada', 'transacao_excluida'],
  },
  {
    label: 'Usuários',
    actions: ['usuario_criado', 'usuario_atualizado', 'anamnese_criado', 'anamnese_atualizado', 'role_atribuido', 'role_removido', 'permissao_concedida', 'permissao_revogada'],
  },
  {
    label: 'Conteúdo',
    actions: ['produto_criado', 'produto_atualizado', 'produto_excluido', 'curso_criado', 'curso_atualizado', 'curso_excluido', 'inscricao_curso_criado', 'inscricao_curso_excluido', 'material_criado', 'material_atualizado', 'material_excluido', 'ebook_adquirido'],
  },
  {
    label: 'Outros',
    actions: ['depoimento_criado', 'depoimento_atualizado', 'galeria_criado', 'galeria_excluido', 'diario_criado'],
  },
];

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  inscricoes: <Calendar className="w-4 h-4" />,
  cerimonias: <Calendar className="w-4 h-4" />,
  pagamentos: <CreditCard className="w-4 h-4" />,
  depoimentos: <MessageSquare className="w-4 h-4" />,
  anamneses: <FileText className="w-4 h-4" />,
  produtos: <ShoppingBag className="w-4 h-4" />,
  cursos: <FileText className="w-4 h-4" />,
  inscricoes_cursos: <Calendar className="w-4 h-4" />,
  profiles: <User className="w-4 h-4" />,
  lista_espera: <Calendar className="w-4 h-4" />,
  galeria: <FileText className="w-4 h-4" />,
  permissoes: <User className="w-4 h-4" />,
  transacoes: <CreditCard className="w-4 h-4" />,
  materiais: <FileText className="w-4 h-4" />,
  user_roles: <User className="w-4 h-4" />,
  diario: <FileText className="w-4 h-4" />,
  biblioteca_usuario: <ShoppingBag className="w-4 h-4" />,
};

const ACTION_COLORS: Record<string, string> = {
  inscricao_cerimonia_criado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inscricao_cerimonia_excluido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pagamento_criado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  pagamento_atualizado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  cerimonia_criado: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  cerimonia_atualizado: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  cerimonia_excluido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  depoimento_criado: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  depoimento_atualizado: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  anamnese_criado: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  anamnese_atualizado: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  produto_criado: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  produto_atualizado: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  produto_excluido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  curso_criado: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  curso_atualizado: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  curso_excluido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  inscricao_curso_criado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inscricao_curso_excluido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  usuario_criado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  usuario_atualizado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  lista_espera_criado: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  lista_espera_excluido: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  galeria_criado: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  galeria_excluido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  permissao_concedida: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  permissao_revogada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  transacao_criada: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400',
  transacao_atualizada: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400',
  transacao_excluida: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  role_atribuido: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  role_removido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const formatFriendlyMessage = (action: string, details: Record<string, unknown>): string => {
  const nome = details?.nome_completo || details?.full_name || details?.nome || 'Usuário';
  const cerimoniaTitulo = details?.cerimonia_titulo || details?.titulo;
  const cermoniaData = details?.cerimonia_data || details?.data;
  const cursoTitulo = details?.curso_titulo || details?.titulo;
  const produtoNome = details?.produto_nome || details?.nome;
  const valor = details?.valor || details?.amount;
  const status = details?.status;

  const formatarData = (data: unknown): string => {
    if (!data) return '';
    try { return format(new Date(String(data)), 'dd/MM/yyyy', { locale: ptBR }); }
    catch { return String(data); }
  };

  switch (action) {
    case 'inscricao_cerimonia_criado':
      return cerimoniaTitulo && cermoniaData
        ? `se inscreveu na cerimônia "${cerimoniaTitulo}" do dia ${formatarData(cermoniaData)}`
        : cerimoniaTitulo ? `se inscreveu na cerimônia "${cerimoniaTitulo}"` : 'se inscreveu em uma cerimônia';
    case 'inscricao_cerimonia_excluido':
      return cerimoniaTitulo && cermoniaData
        ? `cancelou inscrição na cerimônia "${cerimoniaTitulo}" do dia ${formatarData(cermoniaData)}`
        : cerimoniaTitulo ? `cancelou inscrição na cerimônia "${cerimoniaTitulo}"` : 'cancelou inscrição em uma cerimônia';
    case 'pagamento_criado':
      return valor ? `iniciou um pagamento de R$ ${Number(valor).toFixed(2).replace('.', ',')}` : 'iniciou um pagamento';
    case 'pagamento_atualizado':
      if (status === 'approved' || status === 'aprovado')
        return valor ? `teve pagamento de R$ ${Number(valor).toFixed(2).replace('.', ',')} aprovado` : 'teve pagamento aprovado';
      if (status === 'rejected' || status === 'rejeitado') return 'teve pagamento rejeitado';
      if (status === 'pending' || status === 'pendente') return 'tem pagamento pendente';
      return `atualizou status do pagamento${status ? ` para ${status}` : ''}`;
    case 'cerimonia_criado':
      return cerimoniaTitulo && cermoniaData
        ? `criou a cerimônia "${cerimoniaTitulo}" para o dia ${formatarData(cermoniaData)}`
        : `criou uma nova cerimônia${cerimoniaTitulo ? `: "${cerimoniaTitulo}"` : ''}`;
    case 'cerimonia_atualizado': return `atualizou a cerimônia${cerimoniaTitulo ? ` "${cerimoniaTitulo}"` : ''}`;
    case 'cerimonia_excluido': return `excluiu a cerimônia${cerimoniaTitulo ? ` "${cerimoniaTitulo}"` : ''}`;
    case 'depoimento_criado': {
      const preview = details?.texto ? String(details.texto).substring(0, 50) + (String(details.texto).length > 50 ? '...' : '') : null;
      return preview ? `enviou uma partilha: "${preview}"` : 'enviou uma partilha';
    }
    case 'depoimento_atualizado': return 'atualizou sua partilha';
    case 'anamnese_criado': return 'preencheu a ficha de anamnese';
    case 'anamnese_atualizado': return 'atualizou a ficha de anamnese';
    case 'produto_criado': return `criou o produto${produtoNome ? ` "${produtoNome}"` : ''}`;
    case 'produto_atualizado': return `atualizou o produto${produtoNome ? ` "${produtoNome}"` : ''}`;
    case 'produto_excluido': return `excluiu o produto${produtoNome ? ` "${produtoNome}"` : ''}`;
    case 'curso_criado': return `criou o curso${cursoTitulo ? ` "${cursoTitulo}"` : ''}`;
    case 'curso_atualizado': return `atualizou o curso${cursoTitulo ? ` "${cursoTitulo}"` : ''}`;
    case 'curso_excluido': return `excluiu o curso${cursoTitulo ? ` "${cursoTitulo}"` : ''}`;
    case 'inscricao_curso_criado': return `se inscreveu no curso${cursoTitulo ? ` "${cursoTitulo}"` : ''}`;
    case 'inscricao_curso_excluido': return `cancelou inscrição no curso${cursoTitulo ? ` "${cursoTitulo}"` : ''}`;
    case 'usuario_criado': return 'se cadastrou no sistema';
    case 'usuario_atualizado': return 'atualizou seu perfil';
    case 'lista_espera_criado':
      return cerimoniaTitulo && cermoniaData
        ? `entrou na lista de espera da cerimônia "${cerimoniaTitulo}" do dia ${formatarData(cermoniaData)}`
        : 'entrou na lista de espera de uma cerimônia';
    case 'lista_espera_excluido':
      return cerimoniaTitulo ? `saiu da lista de espera da cerimônia "${cerimoniaTitulo}"` : 'saiu da lista de espera';
    case 'galeria_criado': {
      const tipoMidia = details?.tipo === 'video' ? 'vídeo' : 'foto';
      const tituloMidia = details?.titulo;
      return cerimoniaTitulo
        ? `adicionou ${tipoMidia}${tituloMidia ? ` "${tituloMidia}"` : ''} na galeria da cerimônia "${cerimoniaTitulo}"`
        : `adicionou ${tipoMidia}${tituloMidia ? ` "${tituloMidia}"` : ''} na galeria`;
    }
    case 'galeria_excluido': return 'removeu mídia da galeria';
    case 'permissao_concedida': {
      const perm = details?.permissao;
      const usr = details?.nome_completo;
      return perm ? `concedeu permissão "${perm}" para ${usr || 'usuário'}` : 'concedeu uma permissão';
    }
    case 'permissao_revogada': {
      const perm = details?.permissao;
      return perm ? `revogou permissão "${perm}"` : 'revogou uma permissão';
    }
    case 'transacao_criada': {
      const tipo = details?.tipo === 'entrada' ? 'entrada' : 'saída';
      const cat = details?.categoria;
      return valor
        ? `registrou ${tipo} de R$ ${Number(valor).toFixed(2).replace('.', ',')}${cat ? ` (${cat})` : ''}`
        : `registrou uma ${tipo}`;
    }
    case 'transacao_atualizada': return 'atualizou uma transação financeira';
    case 'transacao_excluida': return 'excluiu uma transação financeira';
    case 'role_atribuido': {
      const role = details?.role || details?.papel;
      return role ? `recebeu a permissão "${role}"` : 'recebeu uma permissão';
    }
    case 'role_removido': {
      const role = details?.role || details?.papel;
      return role ? `teve a permissão "${role}" removida` : 'teve uma permissão removida';
    }
    case 'diario_criado': return 'fez uma entrada no diário';
    case 'ebook_adquirido': {
      const titulo = details?.titulo || details?.nome;
      return titulo ? `adquiriu o ebook "${titulo}"` : 'adquiriu um ebook';
    }
    default: return action.replace(/_/g, ' ');
  }
};

// --- Log Item ---
const LogItem = memo(({ log }: { log: ActivityLog }) => {
  const [expanded, setExpanded] = useState(false);

  const actionLabel = ACTION_LABELS[log.action] || log.action;
  const actionColor = ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  const entityIcon = ENTITY_ICONS[log.entity_type] || <Activity className="w-4 h-4" />;
  const details = log.details as Record<string, unknown>;
  const userName = (details?.nome_completo ?? details?.full_name ?? details?.nome ?? 'Usuário') as string;
  const friendlyMessage = formatFriendlyMessage(log.action, details);
  const timeAgo = formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR });
  const fullDate = format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const hasDetails = details && Object.keys(details).length > 0;

  return (
    <div className="border-b border-border/50 last:border-0">
      <div className="flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
          {entityIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn('text-xs font-medium', actionColor)}>{actionLabel}</Badge>
            <span className="text-xs text-muted-foreground" title={fullDate}>{timeAgo}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">· {fullDate}</span>
          </div>
          <p className="mt-1 text-sm">
            <span className="font-medium">{userName}</span>
            <span className="text-muted-foreground"> {friendlyMessage}</span>
          </p>
        </div>
        {hasDetails && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Ver detalhes"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
      {expanded && hasDetails && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-md bg-muted/50 border text-xs font-mono text-muted-foreground overflow-x-auto">
          <pre>{JSON.stringify(details, null, 2)}</pre>
        </div>
      )}
    </div>
  );
});
LogItem.displayName = 'LogItem';

const LogSkeleton = () => (
  <div className="flex items-start gap-3 p-3 border-b border-border/50">
    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-4 w-48" />
    </div>
  </div>
);

// --- Date filter presets ---
type DatePreset = 'all' | 'today' | '7d' | '30d';
const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
];

const getDateFilter = (preset: DatePreset): string | null => {
  if (preset === 'today') return startOfDay(new Date()).toISOString();
  if (preset === '7d') return subDays(new Date(), 7).toISOString();
  if (preset === '30d') return subDays(new Date(), 30).toISOString();
  return null;
};

// --- Main component ---
export const LogsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Reset page when filters change
  const resetPage = useCallback(() => setCurrentPage(1), []);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['activity-logs', currentPage, pageSize, actionFilter, entityFilter, datePreset],
    queryFn: async () => {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('activity_logs')
        .select('id, user_id, action, entity_type, entity_id, details, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (actionFilter !== 'all') query = query.eq('action', actionFilter);
      if (entityFilter !== 'all') query = query.eq('entity_type', entityFilter);

      const since = getDateFilter(datePreset);
      if (since) query = query.gte('created_at', since);

      const { data, error, count } = await query;
      if (error) throw error;
      return { logs: (data ?? []) as ActivityLog[], total: count ?? 0 };
    },
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev,
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Client-side search on current page
  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter(log =>
      log.action.toLowerCase().includes(term) ||
      log.entity_type.toLowerCase().includes(term) ||
      JSON.stringify(log.details).toLowerCase().includes(term)
    );
  }, [logs, searchTerm]);

  const hasActiveFilters = searchTerm || actionFilter !== 'all' || entityFilter !== 'all' || datePreset !== 'all';

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setActionFilter('all');
    setEntityFilter('all');
    setDatePreset('all');
    setCurrentPage(1);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-primary" />
              Logs de Atividades
            </CardTitle>
            {total > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {total.toLocaleString('pt-BR')} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={cn('w-4 h-4 mr-1', isRefetching && 'animate-spin')} />
            Atualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date preset pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {DATE_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => { setDatePreset(p.value); resetPage(); }}
              className={cn(
                'h-7 px-3 rounded-full text-xs font-medium border transition-colors',
                datePreset === p.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar na página atual..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); resetPage(); }}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2 shrink-0" />
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              {ACTION_GROUPS.map(group => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.actions.map(key => (
                    <SelectItem key={key} value={key}>{ACTION_LABELS[key] ?? key}</SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); resetPage(); }}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="inscricoes">Inscrições</SelectItem>
              <SelectItem value="cerimonias">Cerimônias</SelectItem>
              <SelectItem value="pagamentos">Pagamentos</SelectItem>
              <SelectItem value="transacoes">Transações</SelectItem>
              <SelectItem value="profiles">Usuários</SelectItem>
              <SelectItem value="anamneses">Anamneses</SelectItem>
              <SelectItem value="depoimentos">Partilhas</SelectItem>
              <SelectItem value="produtos">Produtos</SelectItem>
              <SelectItem value="cursos">Cursos</SelectItem>
              <SelectItem value="inscricoes_cursos">Inscrições Cursos</SelectItem>
              <SelectItem value="lista_espera">Lista de Espera</SelectItem>
              <SelectItem value="galeria">Galeria</SelectItem>
              <SelectItem value="permissoes">Permissões</SelectItem>
              <SelectItem value="user_roles">Roles</SelectItem>
              <SelectItem value="materiais">Materiais</SelectItem>
              <SelectItem value="diario">Diário</SelectItem>
              <SelectItem value="biblioteca_usuario">Biblioteca</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} aria-label="Limpar filtros">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Log list */}
        <div className="border rounded-lg overflow-hidden">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <LogSkeleton key={i} />)
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Activity className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-sm">Nenhum log encontrado</p>
              {hasActiveFilters && (
                <Button variant="link" size="sm" onClick={clearFilters} className="mt-1">
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            filteredLogs.map(log => <LogItem key={log.id} log={log} />)
          )}
        </div>

        {/* Pagination */}
        {!isLoading && total > 0 && !searchTerm && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isLoading={isRefetching}
            pageSize={pageSize}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            pageSizeOptions={[10, 20, 50]}
            totalItems={total}
          />
        )}
        {searchTerm && (
          <p className="text-xs text-muted-foreground text-center">
            Mostrando {filteredLogs.length} resultado{filteredLogs.length !== 1 ? 's' : ''} na página atual
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(LogsTab);
