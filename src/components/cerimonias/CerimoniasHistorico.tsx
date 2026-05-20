import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  MapPin,
  Leaf,
  Clock,
  ExternalLink,
  Loader2,
  Users,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ChevronRight,
  User,
  CreditCard,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import {
  useHistoricoInscricoes,
  useMeusDepoimentosAprovados,
  useHistoricoCerimoniasAdmin,
  useParticipantesCerimonia,
} from '@/hooks/queries';
import { ROUTES } from '@/constants';
import { formatDateBR, formatDateExtensoBR, parseDateString } from '@/lib/date-utils';
import type { Cerimonia } from '@/types';
import type { CerimoniaPassada } from '@/hooks/queries';
import { useConfirmarPresenca } from '@/hooks/queries/useConfirmacaoPresenca';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface CerimoniasHistoricoProps {
  userId?: string;
  onOpenPayment?: (cerimonia: Cerimonia) => void;
  isAdmin?: boolean;
  podeVerHistoricoCompleto?: boolean;
}

// ---------- helpers ----------

function medicinaBadgeClass(medicina: string | null): string {
  const m = (medicina || '').toLowerCase();
  if (m.includes('ayahuasca') || m.includes('daime')) return 'bg-primary/10 text-primary border-primary/20';
  if (m.includes('kambo')) return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300/30';
  if (m.includes('sananga')) return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300/30';
  if (m.includes('rapé') || m.includes('rape')) return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-300/30';
  return 'bg-muted text-muted-foreground border-border';
}

function StatCard({ value, label, icon: Icon, color = 'text-primary' }: {
  value: number | string;
  label: string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-border/60 text-center">
      <Icon className={`w-4 h-4 ${color}`} />
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

// ---------- Admin view ----------

const AdminHistorico: React.FC<{ userId?: string }> = () => {
  const { data: cerimoniasPassadas, isLoading } = useHistoricoCerimoniasAdmin(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtroMedicina, setFiltroMedicina] = useState('todas');
  const [filtroAno, setFiltroAno] = useState('todos');

  const { data: participantes, isLoading: loadingParticipantes } = useParticipantesCerimonia(selectedId);

  const selectedCerimonia = useMemo(
    () => cerimoniasPassadas?.find(c => c.id === selectedId) ?? null,
    [cerimoniasPassadas, selectedId]
  );

  const medicinasDisponiveis = useMemo(() => {
    if (!cerimoniasPassadas) return [];
    return [...new Set(
      cerimoniasPassadas.map(c => c.medicina_principal).filter((m): m is string => !!m)
    )].sort();
  }, [cerimoniasPassadas]);

  const anosDisponiveis = useMemo(() => {
    if (!cerimoniasPassadas) return [];
    return [...new Set(cerimoniasPassadas.map(c => c.data.substring(0, 4)))].sort().reverse();
  }, [cerimoniasPassadas]);

  const cerimoniasFiltradasAdmin = useMemo(() => {
    if (!cerimoniasPassadas) return [];
    return cerimoniasPassadas.filter(c => {
      if (filtroMedicina !== 'todas' && c.medicina_principal !== filtroMedicina) return false;
      if (filtroAno !== 'todos' && !c.data.startsWith(filtroAno)) return false;
      return true;
    });
  }, [cerimoniasPassadas, filtroMedicina, filtroAno]);

  const globalStats = useMemo(() => {
    if (!cerimoniasPassadas) return { totalCerimonias: 0, totalParticipacoes: 0, participantesUnicos: 0 };
    const totalCerimonias = cerimoniasPassadas.length;
    const totalParticipacoes = cerimoniasPassadas.reduce((acc, c) => acc + c.total_inscritos, 0);
    const allIds = cerimoniasPassadas.flatMap(c =>
      c.inscricoes.filter(i => !i.cancelada).map(i => i.user_id)
    );
    const participantesUnicos = new Set(allIds).size;
    return { totalCerimonias, totalParticipacoes, participantesUnicos };
  }, [cerimoniasPassadas]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={globalStats.totalCerimonias} label="Cerimônias realizadas" icon={Calendar} />
        <StatCard value={globalStats.totalParticipacoes} label="Participações totais" icon={Users} color="text-amber-600" />
        <StatCard value={globalStats.participantesUnicos} label="Participantes únicos" icon={Sparkles} color="text-purple-600" />
      </div>

      {/* Filters */}
      {(medicinasDisponiveis.length > 1 || anosDisponiveis.length > 1) && (
        <div className="flex flex-wrap gap-2">
          {medicinasDisponiveis.length > 1 && (
            <Select value={filtroMedicina} onValueChange={setFiltroMedicina}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue placeholder="Medicina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as medicinas</SelectItem>
                {medicinasDisponiveis.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {anosDisponiveis.length > 1 && (
            <Select value={filtroAno} onValueChange={setFiltroAno}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os anos</SelectItem>
                {anosDisponiveis.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {(filtroMedicina !== 'todas' || filtroAno !== 'todos') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setFiltroMedicina('todas'); setFiltroAno('todos'); }}
            >
              <X className="w-3 h-3 mr-1" /> Limpar
            </Button>
          )}
          <span className="self-center text-xs text-muted-foreground ml-auto">
            {cerimoniasFiltradasAdmin.length} cerimônia{cerimoniasFiltradasAdmin.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Ceremony list */}
      {cerimoniasFiltradasAdmin.length === 0 ? (
        <Card className="text-center py-12 border-dashed border-2 bg-card/50">
          <CardContent className="space-y-3 pt-6">
            <Leaf className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
            <p className="text-muted-foreground">Nenhuma cerimônia encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cerimoniasFiltradasAdmin.map(cerimonia => (
            <AdminCerimoniaCard
              key={cerimonia.id}
              cerimonia={cerimonia}
              onSelect={() => setSelectedId(cerimonia.id)}
            />
          ))}
        </div>
      )}

      {/* Participant detail dialog */}
      <Dialog open={!!selectedId} onOpenChange={open => !open && setSelectedId(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              {selectedCerimonia?.nome || 'Cerimônia'}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-3 text-xs mt-1">
              {selectedCerimonia && (
                <>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDateExtensoBR(selectedCerimonia.data)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedCerimonia.local}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Dialog stats */}
          {selectedCerimonia && (
            <div className="grid grid-cols-3 gap-2 my-2">
              <div className="p-3 rounded-lg bg-primary/5 text-center">
                <p className="text-xl font-bold text-primary">{selectedCerimonia.total_inscritos}</p>
                <p className="text-[10px] text-muted-foreground">Inscritos</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/5 text-center">
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{selectedCerimonia.total_presentes}</p>
                <p className="text-[10px] text-muted-foreground">Presentes</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/5 text-center">
                <p className="text-xl font-bold text-amber-600">{selectedCerimonia.total_pagos}</p>
                <p className="text-[10px] text-muted-foreground">Pagos</p>
              </div>
            </div>
          )}

          {/* Participant list */}
          {loadingParticipantes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !participantes || participantes.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              Nenhum participante registrado.
            </p>
          ) : (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
                Participantes ({participantes.filter(p => !p.cancelada).length})
              </p>
              {participantes.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    p.cancelada
                      ? 'opacity-50 bg-muted/30 border-border/30'
                      : 'bg-card border-border/60'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {p.profiles?.full_name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {p.profiles?.full_name || 'Participante sem nome'}
                    </p>
                    {p.forma_pagamento && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {p.forma_pagamento}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    {p.cancelada ? (
                      <Badge variant="outline" className="text-[10px] h-5 bg-red-500/10 text-red-600 border-red-200">
                        Cancelado
                      </Badge>
                    ) : (
                      <>
                        <Badge
                          variant={p.pago ? 'default' : 'outline'}
                          className={`text-[10px] h-5 ${!p.pago ? 'border-amber-300 text-amber-700 dark:text-amber-400' : ''}`}
                        >
                          {p.pago ? '✓ Pago' : 'Pendente'}
                        </Badge>
                        {p.presenca_confirmada && (
                          <Badge variant="outline" className="text-[10px] h-5 bg-green-500/10 text-green-700 dark:text-green-400 border-green-200">
                            ✓ Presente
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AdminCerimoniaCard: React.FC<{ cerimonia: CerimoniaPassada; onSelect: () => void }> = ({
  cerimonia,
  onSelect,
}) => {
  const [year, month, day] = cerimonia.data.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayNum = dateObj.getDate();
  const monthShort = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

  return (
    <Card
      className="overflow-hidden border border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 cursor-pointer transition-all active:scale-[0.99]"
      onClick={onSelect}
    >
      <CardContent className="p-0">
        <div className="flex items-stretch">
          {/* Date badge */}
          <div className="flex flex-col items-center justify-center bg-primary/8 border-r border-border/40 px-3 py-4 min-w-[60px]">
            <span className="text-xl font-bold text-primary leading-none">{dayNum}</span>
            <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-wide mt-0.5">{monthShort}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">{year}</span>
          </div>

          {/* Content */}
          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm leading-tight truncate">{cerimonia.nome || 'Cerimônia'}</h3>
                {cerimonia.medicina_principal && (
                  <Badge variant="outline" className={`text-[10px] h-4 mt-0.5 ${medicinaBadgeClass(cerimonia.medicina_principal)}`}>
                    {cerimonia.medicina_principal}
                  </Badge>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{cerimonia.local}</span>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-3 h-3" />
                <span><strong className="text-foreground">{cerimonia.total_inscritos}</strong> inscritos</span>
              </span>
              <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-3 h-3" />
                <strong>{cerimonia.total_presentes}</strong> presentes
              </span>
              <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <TrendingUp className="w-3 h-3" />
                <strong>{cerimonia.total_pagos}</strong> pagos
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ---------- User view ----------

const UserHistorico: React.FC<{
  userId?: string;
  onOpenPayment?: (cerimonia: Cerimonia) => void;
}> = ({ userId, onOpenPayment }) => {
  const navigate = useNavigate();
  const { data: inscricoes, isLoading } = useHistoricoInscricoes(userId);
  const { data: depoimentosAprovados } = useMeusDepoimentosAprovados(userId);
  const confirmarPresenca = useConfirmarPresenca();

  const handleConfirmarPresenca = (inscricaoId: string, cerimoniaId: string) => {
    confirmarPresenca.mutate(inscricaoId, {
      onSuccess: () => {
        toast.success('Presença confirmada!', {
          description: 'Gostaria de compartilhar como foi sua experiência?',
          action: {
            label: 'Partilhar',
            onClick: () => navigate(`${ROUTES.PARTILHAS}?cerimonia=${cerimoniaId}`),
          },
          duration: 8000,
        });
      },
    });
  };

  const { passadas, futuras } = useMemo(() => {
    if (!inscricoes) return { passadas: [], futuras: [] };
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return {
      passadas: inscricoes.filter(i => parseDateString(i.cerimonias.data) < hoje),
      futuras: inscricoes.filter(i => parseDateString(i.cerimonias.data) >= hoje),
    };
  }, [inscricoes]);

  const userStats = useMemo(() => {
    const total = passadas.length;
    const medicinas = [...new Set(
      passadas.map(i => i.cerimonias.medicina_principal).filter((m): m is string => !!m)
    )];
    const primeiraData = passadas.length > 0
      ? passadas[passadas.length - 1].cerimonias.data
      : null;
    return { total, medicinas, primeiraData };
  }, [passadas]);

  const cerimoniaComDepoimento = useMemo(() => {
    if (!depoimentosAprovados) return new Set<string>();
    return new Set(depoimentosAprovados.filter(d => d.cerimonia_id).map(d => d.cerimonia_id));
  }, [depoimentosAprovados]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Personal stats */}
      {passadas.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={userStats.total} label="Cerimônias" icon={Calendar} />
          <StatCard value={userStats.medicinas.length} label="Medicinas" icon={Leaf} color="text-amber-600" />
          <StatCard
            value={userStats.primeiraData
              ? format(parseDateString(userStats.primeiraData), 'MMM/yy', { locale: ptBR })
              : '-'}
            label="Primeira"
            icon={Sparkles}
            color="text-purple-600"
          />
        </div>
      )}

      {/* Upcoming inscriptions */}
      {futuras.length > 0 && (
        <section>
          <h2 className="text-lg font-display font-semibold mb-3">Próximas Participações</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {futuras.map(inscricao => (
              <Card key={inscricao.id} className="overflow-hidden border-border/60 bg-card">
                {inscricao.cerimonias.banner_url && (
                  <div className="h-28 w-full overflow-hidden relative">
                    <img
                      src={inscricao.cerimonias.banner_url}
                      alt={inscricao.cerimonias.nome || 'Cerimônia'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                )}
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display font-semibold text-sm">
                        {inscricao.cerimonias.nome || 'Cerimônia'}
                      </h3>
                      {inscricao.cerimonias.medicina_principal && (
                        <Badge variant="outline" className={`text-[10px] h-4 mt-0.5 ${medicinaBadgeClass(inscricao.cerimonias.medicina_principal)}`}>
                          {inscricao.cerimonias.medicina_principal}
                        </Badge>
                      )}
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 shrink-0 text-xs">
                      Próxima
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {formatDateBR(inscricao.cerimonias.data)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      {inscricao.cerimonias.horario.slice(0, 5)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span className="truncate max-w-[120px]">{inscricao.cerimonias.local}</span>
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                    {!inscricao.pago && onOpenPayment ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={() => onOpenPayment(inscricao.cerimonias as unknown as Cerimonia)}
                      >
                        Pagar Agora
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        {!inscricao.presenca_confirmada && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/10 flex-1"
                            onClick={() => handleConfirmarPresenca(inscricao.id, inscricao.cerimonia_id)}
                            disabled={confirmarPresenca.isPending}
                          >
                            Confirmar Presença
                          </Button>
                        )}
                        <Badge variant={inscricao.pago ? 'default' : 'outline'} className="text-xs shrink-0">
                          {inscricao.pago ? '✓ Pago' : 'Pendente'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Past ceremonies */}
      <section>
        <h2 className="text-lg font-display font-semibold mb-3">Cerimônias Realizadas</h2>

        {passadas.length === 0 ? (
          <Card className="text-center py-12 border-dashed border-2 bg-card/50">
            <CardContent className="space-y-4 pt-6">
              <Leaf className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div>
                <p className="text-base text-muted-foreground font-display">
                  Você ainda não participou de nenhuma cerimônia.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Explore as próximas e comece sua jornada!
                </p>
              </div>
              <Link to={ROUTES.CERIMONIAS}>
                <Button className="mt-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  Ver próximas cerimônias
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {passadas.map(inscricao => {
              const [year, month, day] = inscricao.cerimonias.data.split('-').map(Number);
              const dateObj = new Date(year, month - 1, day);
              const dayNum = dateObj.getDate();
              const monthShort = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

              return (
                <Card key={inscricao.id} className="overflow-hidden border border-border/60 shadow-sm">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      {/* Date badge */}
                      <div className="flex flex-col items-center justify-center bg-muted/40 border-r border-border/40 px-3 py-4 min-w-[56px]">
                        <span className="text-lg font-bold text-foreground leading-none">{dayNum}</span>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">{monthShort}</span>
                        <span className="text-[10px] text-muted-foreground/70">{year}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-3 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            <h3 className="font-display font-semibold text-sm leading-tight truncate">
                              {inscricao.cerimonias.nome || 'Cerimônia'}
                            </h3>
                            {inscricao.cerimonias.medicina_principal && (
                              <Badge variant="outline" className={`text-[10px] h-4 mt-0.5 ${medicinaBadgeClass(inscricao.cerimonias.medicina_principal)}`}>
                                {inscricao.cerimonias.medicina_principal}
                              </Badge>
                            )}
                          </div>
                          <Badge
                            variant={inscricao.pago ? 'default' : 'outline'}
                            className="text-[10px] h-5 shrink-0"
                          >
                            {inscricao.pago ? '✓ Pago' : 'Pendente'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{inscricao.cerimonias.local}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {inscricao.presenca_confirmada && (
                            <span className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400">
                              <CheckCircle2 className="w-3 h-3" /> Presença confirmada
                            </span>
                          )}
                          {cerimoniaComDepoimento.has(inscricao.cerimonia_id) && (
                            <Link to={ROUTES.PARTILHAS}>
                              <Badge variant="outline" className="text-[10px] h-5 cursor-pointer hover:bg-primary/10">
                                <ExternalLink className="w-3 h-3 mr-1" /> Ver minha partilha
                              </Badge>
                            </Link>
                          )}
                          {!cerimoniaComDepoimento.has(inscricao.cerimonia_id) && inscricao.pago && (
                            <Link to={`${ROUTES.PARTILHAS}?cerimonia=${inscricao.cerimonia_id}`}>
                              <Badge variant="outline" className="text-[10px] h-5 cursor-pointer hover:bg-primary/10 text-primary border-primary/30">
                                + Escrever partilha
                              </Badge>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Published partilhas */}
      {depoimentosAprovados && depoimentosAprovados.length > 0 && (
        <section>
          <h2 className="text-lg font-display font-semibold mb-3">Minhas Partilhas Publicadas</h2>
          <div className="space-y-3">
            {depoimentosAprovados.map(depoimento => (
              <Card key={depoimento.id} className="border-border/60 bg-card">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm italic leading-relaxed text-foreground">
                    "{depoimento.texto}"
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(depoimento.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                      ✓ Publicada
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// ---------- Main component ----------

const CerimoniasHistorico: React.FC<CerimoniasHistoricoProps> = ({
  userId,
  onOpenPayment,
  isAdmin = false,
  podeVerHistoricoCompleto = false,
}) => {
  const isAdminView = isAdmin || podeVerHistoricoCompleto;

  if (isAdminView) {
    return <AdminHistorico userId={userId} />;
  }

  return <UserHistorico userId={userId} onOpenPayment={onOpenPayment} />;
};

export default CerimoniasHistorico;
