import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Calendar, BookHeart, Flame, Plus, Pencil, Trash2, CheckCircle2, Clock, Eye, Share2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OrganicDivider } from '@/components/ui/organic-divider';
import {
  useJornadaStats,
  useTimelineCerimonias,
  useDiarioEntradas,
  useCreateDiarioEntrada,
  useUpdateDiarioEntrada,
  useDeleteDiarioEntrada,
} from '@/hooks/queries/useInsights';
import type { DiarioEntrada, HumorType } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import FadeIn from '@/components/ui/FadeIn';
import { PageHeader } from '@/components/shared';

// -------------------------------------------------------
// Constantes
// -------------------------------------------------------

const HUMOR_OPTIONS: { value: HumorType; emoji: string; label: string; color: string }[] = [
  { value: 'ótimo', emoji: '✨', label: 'Ótimo', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  { value: 'bem', emoji: '😊', label: 'Bem', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
  { value: 'neutro', emoji: '😐', label: 'Neutro', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
  { value: 'difícil', emoji: '😔', label: 'Difícil', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40' },
  { value: 'intenso', emoji: '🌊', label: 'Intenso', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
];

function getHumorOption(humor: HumorType | null) {
  return HUMOR_OPTIONS.find((h) => h.value === humor) ?? null;
}

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function formatDateShort(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'MMM yyyy', { locale: ptBR });
  } catch {
    return dateStr;
  }
}

// -------------------------------------------------------
// Stat Card
// -------------------------------------------------------

function StatCard({ icon: Icon, label, value, sub, iconClass }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconClass?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={cn('rounded-xl p-2.5 shrink-0', iconClass ?? 'bg-primary/10')}>
          <Icon className={cn('w-5 h-5', iconClass ? 'text-inherit' : 'text-primary')} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground leading-none mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------
// DiárioForm (criar / editar)
// -------------------------------------------------------

interface DiarioFormProps {
  userId: string;
  entry?: DiarioEntrada;
  onClose: () => void;
}

function DiarioForm({ userId, entry, onClose }: DiarioFormProps) {
  const [conteudo, setConteudo] = useState(entry?.conteudo ?? '');
  const [humor, setHumor] = useState<HumorType | null>(entry?.humor ?? null);

  const create = useCreateDiarioEntrada();
  const update = useUpdateDiarioEntrada();
  const isLoading = create.isPending || update.isPending;

  const handleSave = async () => {
    if (!conteudo.trim()) {
      toast.error('Escreva algo antes de salvar.');
      return;
    }

    if (entry) {
      await update.mutateAsync({ id: entry.id, userId, conteudo, humor });
      toast.success('Entrada atualizada.');
    } else {
      await create.mutateAsync({
        userId,
        conteudo,
        humor,
        data: new Date().toISOString().split('T')[0],
      });
      toast.success('Entrada criada.');
    }
    onClose();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Humor selector */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Como você está?</p>
        <div className="flex flex-wrap gap-2">
          {HUMOR_OPTIONS.map((h) => (
            <button
              key={h.value}
              type="button"
              onClick={() => setHumor(humor === h.value ? null : h.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                humor === h.value
                  ? `${h.color} border-current`
                  : 'border-border text-muted-foreground hover:border-primary/40'
              )}
            >
              <span>{h.emoji}</span>
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Texto */}
      <Textarea
        placeholder="Como foi sua experiência? O que sente agora? Escreva livremente..."
        className="min-h-[160px] resize-none text-sm"
        value={conteudo}
        onChange={(e) => setConteudo(e.target.value)}
      />

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancelar</Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Salvando...' : entry ? 'Salvar alterações' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Entrada do diário (card)
// -------------------------------------------------------

function EntradaGuardiaoCard({ entry, userId }: { entry: DiarioEntrada; userId: string }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteEntry = useDeleteDiarioEntrada();

  const handleDelete = async () => {
    await deleteEntry.mutateAsync({ id: entry.id, userId });
    toast.success('Entrada removida.');
    setConfirmDelete(false);
  };

  const linhas = entry.conteudo.split('\n\n─────\n\n');

  return (
    <Card className="border-violet-500/20 hover:border-violet-500/40 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Guardião das Visões</span>
            </div>
            <span className="text-xs text-muted-foreground">{formatDate(entry.data)}</span>
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="space-y-3">
          {linhas.map((bloco, i) => {
            const isGuardiao = bloco.startsWith('🌿 Guardião:');
            const texto = bloco.replace(/^(🧑 Você:|🌿 Guardião:)\n/, '');
            return (
              <div key={i} className={cn('rounded-xl px-3 py-2.5 text-sm leading-relaxed', isGuardiao ? 'bg-violet-500/8 border border-violet-500/15 text-foreground/90' : 'bg-muted/50 text-muted-foreground')}>
                <p className={cn('text-[10px] font-semibold uppercase tracking-wider mb-1', isGuardiao ? 'text-violet-500' : 'text-muted-foreground/60')}>
                  {isGuardiao ? '🌿 Guardião' : '🧑 Você'}
                </p>
                <p className="whitespace-pre-wrap">{texto}</p>
              </div>
            );
          })}
        </div>

        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Remover visão do diário?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteEntry.isPending}>
                {deleteEntry.isPending ? 'Removendo...' : 'Remover'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function EntradaCard({ entry, userId }: { entry: DiarioEntrada; userId: string }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteEntry = useDeleteDiarioEntrada();
  const humOpt = getHumorOption(entry.humor);

  if (entry.tipo === 'guardiao') {
    return <EntradaGuardiaoCard entry={entry} userId={userId} />;
  }

  const handleDelete = async () => {
    await deleteEntry.mutateAsync({ id: entry.id, userId });
    toast.success('Entrada removida.');
    setConfirmDelete(false);
  };

  return (
    <Card className="border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{formatDate(entry.data)}</span>
            {humOpt && (
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', humOpt.color)}>
                {humOpt.emoji} {humOpt.label}
              </span>
            )}
            {entry.cerimonias?.nome && (
              <Badge variant="outline" className="text-xs py-0 h-5">
                {entry.cerimonias.nome}
              </Badge>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setEditing(true)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Conteúdo */}
        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{entry.conteudo}</p>

        {/* Edit dialog */}
        <Dialog open={editing} onOpenChange={setEditing}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar entrada</DialogTitle>
            </DialogHeader>
            <DiarioForm userId={userId} entry={entry} onClose={() => setEditing(false)} />
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Remover entrada?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteEntry.isPending}>
                {deleteEntry.isPending ? 'Removendo...' : 'Remover'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------
// Página principal
// -------------------------------------------------------

const Insights: React.FC = () => {
  const { user } = useAuth();
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'diario' | 'guardiao'>('todos');
  const [diarioFilter, setDiarioFilter] = useState<'todos' | HumorType>('todos');

  const { data: stats, isLoading: loadingStats } = useJornadaStats(user?.id);
  const { data: timeline, isLoading: loadingTimeline } = useTimelineCerimonias(user?.id);
  const { data: entradas, isLoading: loadingDiario } = useDiarioEntradas(user?.id);

  const entradasPorTipo = tipoFilter === 'todos'
    ? (entradas ?? [])
    : (entradas ?? []).filter((e) => e.tipo === tipoFilter);

  const entradasFiltradas = diarioFilter === 'todos'
    ? entradasPorTipo
    : entradasPorTipo.filter((e) => e.humor === diarioFilter);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <FadeIn>
      <PageHeader
        size="compact"
        icon={Sparkles}
        title="Minha Jornada"
        description="Sua história com as medicinas sagradas"
        className="mb-0"
      />
      </FadeIn>

      {/* ── Estatísticas ── */}
      <FadeIn delay={80}>
      <section>
        <h2 className="font-display text-base font-semibold text-foreground mb-3">Visão Geral</h2>
        {loadingStats ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Flame}
              label="Cerimônias"
              value={stats?.totalCerimonias ?? 0}
              sub="com presença confirmada"
              iconClass="bg-orange-100 dark:bg-orange-950/40 text-orange-500"
            />
            <StatCard
              icon={Sparkles}
              label="Medicinas"
              value={stats?.medicinasExperimentadas.length ?? 0}
              sub="experienciadas"
              iconClass="bg-primary/12 dark:bg-primary/20 dark:bg-purple-950/40 text-purple-500"
            />
            <StatCard
              icon={Calendar}
              label="Primeira"
              value={stats?.primeiraCerimonia ? formatDateShort(stats.primeiraCerimonia) : '—'}
              sub="cerimônia"
              iconClass="bg-green-100 dark:bg-green-950/40 text-green-600"
            />
            <StatCard
              icon={BookHeart}
              label="Diário"
              value={entradas?.length ?? 0}
              sub="registros"
              iconClass="bg-rose-100 dark:bg-rose-950/40 text-rose-500"
            />
          </div>
        )}
        {stats?.medicinasExperimentadas.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {stats.medicinasExperimentadas.map((m) => (
              <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
            ))}
          </div>
        ) : null}
      </section>
      </FadeIn>

      <OrganicDivider variant="dots" />

      {/* ── Timeline ── */}
      <FadeIn delay={80}>
      <section>
        <h2 className="font-display text-base font-semibold text-foreground mb-4">Histórico de Cerimônias</h2>
        {loadingTimeline ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : !timeline?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma cerimônia registrada ainda.
          </p>
        ) : (
          <div className="relative pl-5">
            {/* Linha vertical */}
            <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />

            <div className="space-y-4">
              {timeline.map((inscricao) => {
                const isPresente = inscricao.presenca_confirmada;
                const cer = inscricao.cerimonias;
                return (
                  <div key={inscricao.id} className="relative flex gap-4">
                    {/* Dot */}
                    <div className={cn(
                      'absolute -left-[3px] top-1.5 w-3 h-3 rounded-full border-2 shrink-0',
                      isPresente
                        ? 'bg-primary border-primary'
                        : 'bg-background border-border'
                    )} />

                    {/* Content */}
                    <div className="ml-5 flex-1 pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground leading-snug">
                            {cer?.nome ?? 'Cerimônia'}
                          </p>
                          {cer?.medicina_principal && (
                            <p className="text-xs text-muted-foreground">{cer.medicina_principal}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {cer?.data ? formatDate(cer.data) : '—'}
                          </span>
                          {isPresente ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Presente
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="w-3 h-3" /> Inscrito
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
      </FadeIn>

      <OrganicDivider variant="dots" />

      {/* ── Diário ── */}
      <FadeIn delay={80}>
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-semibold text-foreground">Diário Pessoal</h2>
            <button
              onClick={async () => {
                const texto = `📓 *Diário Pessoal — Consciência Divinal*\n\nVocê sabia que no app Consciência Divinal temos um diário pessoal e completamente privado?\n\nÉ um espaço só seu — ninguém além de você tem acesso ao que escreve.\n\nLá você pode registrar intenções, reflexões e tudo que deseja meditar e levar para a próxima cerimônia. Uma forma de chegar mais preparado(a) e presente.\n\nVenha trilhar sua jornada conosco 🌿`;
                const url = `${window.location.origin}/insights`;
                if (navigator.share) {
                  try { await navigator.share({ title: 'Diário Pessoal — Consciência Divinal', text: texto, url }); } catch { /* cancelado */ }
                } else {
                  await navigator.clipboard.writeText(`${texto}\n\n${url}`);
                  toast.success('Texto copiado!');
                }
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/50"
              title="Compartilhar o diário"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compartilhar</span>
            </button>
          </div>
          <Dialog open={newEntryOpen} onOpenChange={setNewEntryOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                Nova entrada
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova entrada no diário</DialogTitle>
              </DialogHeader>
              {user && (
                <DiarioForm userId={user.id} onClose={() => setNewEntryOpen(false)} />
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        {(entradas?.length ?? 0) > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            {/* Tipo */}
            <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
              {([
                { value: 'todos', label: 'Todos' },
                { value: 'diario', label: '📓 Diário' },
                { value: 'guardiao', label: '🌿 Guardião' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setTipoFilter(opt.value); setDiarioFilter('todos'); }}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-xs font-medium transition-colors',
                    tipoFilter === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Humor — só para entradas de diário */}
            {tipoFilter !== 'guardiao' && (
              <Select value={diarioFilter} onValueChange={(v) => setDiarioFilter(v as typeof diarioFilter)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os estados</SelectItem>
                  {HUMOR_OPTIONS.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      {h.emoji} {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {loadingDiario ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : !entradasFiltradas.length ? (
          <div className="text-center py-10 flex flex-col items-center gap-3">
            <BookHeart className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {diarioFilter === 'todos'
                ? 'Nenhuma entrada ainda. Comece a registrar sua jornada.'
                : 'Nenhuma entrada com esse estado.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entradasFiltradas.map((e) => (
              user && <EntradaCard key={e.id} entry={e} userId={user.id} />
            ))}
          </div>
        )}
      </section>
      </FadeIn>
    </div>
  );
};

export default Insights;
