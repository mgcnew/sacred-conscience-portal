import { memo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users, Leaf, CheckCircle2, XCircle, Pencil, Trash2, AlertCircle, FileText, Info, Bell, BellOff, Loader2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { formatDateCurtoBR } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { medicinaDoTexto } from '@/constants/medicinas';
import type { Cerimonia } from '@/types';

interface ListaEsperaInfo {
  cerimoniaId: string;
  posicao: number;
}

interface CerimoniasListaProps {
  cerimonias: Cerimonia[];
  minhasInscricoes?: string[];
  minhaListaEspera?: ListaEsperaInfo[];
  vagasInfo?: Record<string, { vagas_disponiveis: number; total_vagas: number | null; esgotado: boolean }>;
  hasAnamnese: boolean;
  isAdmin: boolean;
  loadingCerimoniaId?: string | null;
  onOpenPayment: (cerimonia: Cerimonia) => void;
  onCancelarInscricao: (cerimoniaId: string) => void;
  onEntrarListaEspera: (cerimoniaId: string) => void;
  onSairListaEspera: (cerimoniaId: string) => void;
  onEditCeremony: (cerimonia: Cerimonia) => void;
  onDeleteCeremony: (cerimoniaId: string) => void;
  onViewInfo: (cerimonia: Cerimonia) => void;
}

const CerimoniasLista: React.FC<CerimoniasListaProps> = ({
  cerimonias,
  minhasInscricoes = [],
  minhaListaEspera = [],
  vagasInfo = {},
  hasAnamnese,
  isAdmin,
  loadingCerimoniaId,
  onOpenPayment,
  onCancelarInscricao,
  onEntrarListaEspera,
  onSairListaEspera,
  onEditCeremony,
  onDeleteCeremony,
  onViewInfo,
}) => {
  const isUserInscrito = (cerimoniaId: string) => minhasInscricoes.includes(cerimoniaId);
  const isCerimoniaEsgotada = (cerimoniaId: string) => vagasInfo[cerimoniaId]?.esgotado ?? false;
  const getVagasDisponiveis = (cerimoniaId: string) => {
    const info = vagasInfo[cerimoniaId];
    if (!info || info.total_vagas === null) return null;
    return info.vagas_disponiveis;
  };
  const getPosicaoListaEspera = (cerimoniaId: string) => {
    const item = minhaListaEspera.find(le => le.cerimoniaId === cerimoniaId);
    return item?.posicao ?? null;
  };
  const isUltimasVagas = (cerimoniaId: string) => {
    const vagas = getVagasDisponiveis(cerimoniaId);
    return vagas !== null && vagas > 0 && vagas <= 5;
  };

  if (!cerimonias || cerimonias.length === 0) {
    return (
      <Card className="text-center py-12 border-dashed border-2 bg-card/50">
        <CardContent>
          <Leaf className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-xl text-muted-foreground font-display">
            Nenhuma cerimônia agendada para os próximos dias.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cerimonias.map((cerimonia, index) => (
        <Card 
          key={cerimonia.id} 
          className="border-border/50 bg-card overflow-hidden flex flex-col opacity-0 animate-fade-in-up content-auto"
          style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
        >
          {/* Imagem */}
          <div className="h-44 w-full overflow-hidden relative bg-muted">
            {cerimonia.banner_url ? (
              <img
                src={cerimonia.banner_url}
                alt={cerimonia.nome || cerimonia.medicina_principal || 'Cerimônia'}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Leaf className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40" />
            
            <div className="absolute top-2 right-2 flex items-center gap-2">
              {/* Era "🔥 Últimas vagas!". A informação é útil e fica; o tom de
                  liquidação, não — a tela seguinte pede que a pessoa tenha
                  certeza antes de ocupar a vaga de outra. */}
              {isUltimasVagas(cerimonia.id) && (
                <Badge className="bg-warning text-warning-foreground border-none text-xs font-semibold">
                  Poucas vagas
                </Badge>
              )}
              <button
                type="button"
                aria-label={`Detalhes de ${cerimonia.nome || 'cerimônia'}`}
                className="h-8 w-8 rounded-full bg-background/80 flex items-center justify-center shadow-md active:scale-95"
                onClick={(e) => { e.stopPropagation(); onViewInfo(cerimonia); }}
              >
                <Info className="w-4 h-4 text-primary" />
              </button>
            </div>

            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="text-white font-display text-lg font-semibold drop-shadow-md leading-tight mb-1">
                {cerimonia.nome || 'Cerimônia'}
              </h3>
              {/* A etiqueta pega a cor da medicina que abre o texto. Era
                  `bg-primary/90` para todas: no único lugar do app em que a
                  pessoa escolhe entre medicinas, todas apareciam iguais. */}
              {cerimonia.medicina_principal && (
                <Badge
                  className={cn(
                    'border-none font-medium text-xs',
                    medicinaDoTexto(cerimonia.medicina_principal)?.corBadge ??
                      'bg-primary text-primary-foreground'
                  )}
                >
                  {cerimonia.medicina_principal.trim()}
                </Badge>
              )}
            </div>
          </div>

          <CardHeader className="pb-2 pt-4">
            {isUserInscrito(cerimonia.id) && (
              <div className="mb-2">
                <Badge className="bg-success-subtle text-success border-success/30 flex gap-1 items-center w-fit">
                  <CheckCircle2 className="w-3 h-3" /> Inscrito
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-2 text-foreground font-medium mt-1">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formatDateCurtoBR(cerimonia.data)}</span>
            </div>
            <CardDescription className="flex items-center gap-2 text-base text-muted-foreground">
              <Clock className="w-4 h-4 text-primary" />
              {cerimonia.horario.slice(0, 5)}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 flex-grow">
            <div className="flex items-start gap-3 text-muted-foreground">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm leading-tight">{cerimonia.local}</span>
            </div>

            {cerimonia.descricao && (
              <p className="text-sm text-muted-foreground line-clamp-3 italic border-l-2 border-primary/20 pl-3">
                "{cerimonia.descricao}"
              </p>
            )}

            {cerimonia.vagas && (
              <div className={`flex items-center gap-2 text-sm font-medium p-2 rounded-lg ${
                isCerimoniaEsgotada(cerimonia.id) 
                  ? 'bg-destructive/10 text-destructive' 
                  : 'bg-secondary/10 text-foreground'
              }`}>
                {isCerimoniaEsgotada(cerimonia.id) ? (
                  <><AlertCircle className="w-4 h-4" /><span>Esgotado</span></>
                ) : (
                  <>
                    <Users className="w-4 h-4 text-primary" />
                    <span>
                      {getVagasDisponiveis(cerimonia.id) !== null 
                        ? `${getVagasDisponiveis(cerimonia.id)} vagas disponíveis`
                        : `${cerimonia.vagas} vagas totais`}
                    </span>
                  </>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-4 border-t border-border/50 bg-muted/30 flex flex-col gap-2">
            {isUserInscrito(cerimonia.id) ? (
              <div className="w-full flex flex-col gap-2">
                <Button className="w-full bg-success hover:bg-success text-success-foreground shadow-md cursor-default opacity-90">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Vaga Garantida
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="w-full text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                      <XCircle className="w-4 h-4 mr-2" /> Cancelar Inscrição
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar Inscrição?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja cancelar sua participação nesta cerimônia? Sua vaga será liberada para outra pessoa.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onCancelarInscricao(cerimonia.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sim, Cancelar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : isCerimoniaEsgotada(cerimonia.id) ? (
              <div className="w-full space-y-2">
                {getPosicaoListaEspera(cerimonia.id) ? (
                  <>
                    <div className="text-center p-2 bg-warning-subtle rounded-lg">
                      <p className="text-sm font-medium text-warning">
                        Você está na lista de espera
                      </p>
                      <p className="text-xs text-warning">
                        Posição: {getPosicaoListaEspera(cerimonia.id)}º lugar
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={() => onSairListaEspera(cerimonia.id)}
                    >
                      <BellOff className="w-4 h-4 mr-2" /> Sair da lista
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="w-full bg-muted text-muted-foreground font-medium" disabled>
                      <AlertCircle className="w-4 h-4 mr-2" /> Vagas Esgotadas
                    </Button>
                    {hasAnamnese && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => onEntrarListaEspera(cerimonia.id)}
                      >
                        <Bell className="w-4 h-4 mr-2" /> Entrar na lista de espera
                      </Button>
                    )}
                  </>
                )}
              </div>
            ) : !hasAnamnese ? (
              <div className="w-full space-y-2">
                <Button className="w-full bg-muted text-muted-foreground font-medium" onClick={() => onOpenPayment(cerimonia)}>
                  <FileText className="w-4 h-4 mr-2" /> Confirmar Presença
                </Button>
                <p className="text-xs text-center text-warning flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Preencha sua ficha de anamnese primeiro
                </p>
              </div>
            ) : (
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md hover:shadow-lg transition-all"
                onClick={() => onOpenPayment(cerimonia)}
                disabled={loadingCerimoniaId === cerimonia.id}
              >
                {loadingCerimoniaId === cerimonia.id ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</>
                ) : (
                  'Confirmar Presença'
                )}
              </Button>
            )}

            {isAdmin && (
              <div className="w-full flex gap-2 mt-2 pt-2 border-t border-border/30">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onEditCeremony(cerimonia)}>
                  <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Cerimônia?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Todas as inscrições associadas a esta cerimônia também serão removidas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDeleteCeremony(cerimonia.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sim, Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default memo(CerimoniasLista);
