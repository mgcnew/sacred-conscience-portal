import { memo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Users,
  DollarSign,
  Trash2,
  Download,
  Printer,
  Heart,
  Camera,
  Home,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Info,
  Utensils,
  Star,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatDateExtensoBR, formatDateBR } from '@/lib/date-utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { Anamnese, Cerimonia } from '@/types';

interface Inscricao {
  id: string;
  user_id: string;
  data_inscricao: string;
  forma_pagamento: string | null;
  pago: boolean;
  cancelada?: boolean;
  profiles?: {
    full_name: string | null;
    email?: string;
  } | null;
}

interface ParticipantesListProps {
  inscricoes: Inscricao[];
  cerimonia: Cerimonia;
  getAnamnese: (userId: string) => Anamnese | undefined;
  onCancelInscricao: (inscricaoId: string, userName: string) => void;
  pagosCount: number;
  totalCount: number;
}

// Verifica se tem contraindicação
const hasContraindicacao = (anamnese: Anamnese) => {
  return (
    anamnese.pressao_alta === true ||
    anamnese.problemas_cardiacos === true ||
    anamnese.historico_convulsivo === true ||
    anamnese.uso_antidepressivos === true
  );
};

// Componente de indicadores de saúde
const HealthIndicators: React.FC<{ anamnese: Anamnese | undefined }> = ({ anamnese }) => {
  if (!anamnese) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 dark:bg-muted text-gray-500">
              <Info className="w-3 h-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ficha não preenchida</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const temContraindicacao = hasContraindicacao(anamnese);
  const foiLiberado = anamnese.liberado_participar === true;
  const autorizaImagem = anamnese.aceite_uso_imagem === true;
  const permanece = anamnese.aceite_permanencia === true;
  const primeiraVez = anamnese.ja_consagrou !== true;
  const temRestricaoAlimentar = !!anamnese.restricao_alimentar;

  return (
    <div className="flex items-center gap-1">
      {/* Saúde */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span
              className={cn(
                'inline-flex items-center justify-center w-5 h-5 rounded-full',
                temContraindicacao
                  ? foiLiberado
                    ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-600'
                    : 'bg-red-100 dark:bg-red-500/15 text-red-600'
                  : 'bg-green-100 dark:bg-green-500/15 text-green-600'
              )}
            >
              <Heart className="w-3 h-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {temContraindicacao
                ? foiLiberado
                  ? 'Tem condições, mas foi liberado'
                  : 'Contraindicação - NÃO liberado'
                : 'Saúde OK'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Imagem */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span
              className={cn(
                'inline-flex items-center justify-center w-5 h-5 rounded-full',
                autorizaImagem ? 'bg-green-100 dark:bg-green-500/15 text-green-600' : 'bg-gray-100 text-gray-400'
              )}
            >
              <Camera className="w-3 h-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{autorizaImagem ? 'Autoriza uso de imagem' : 'NÃO autoriza imagem'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Permanência */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span
              className={cn(
                'inline-flex items-center justify-center w-5 h-5 rounded-full',
                permanece ? 'bg-green-100 dark:bg-green-500/15 text-green-600' : 'bg-gray-100 text-gray-400'
              )}
            >
              <Home className="w-3 h-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{permanece ? 'Permanece no templo' : 'NÃO permanece no templo'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Primeira vez */}
      {primeiraVez && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/12 dark:bg-primary/20 text-purple-600">
                <Star className="w-3 h-3" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Primeira consagração</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Restrição alimentar */}
      {temRestricaoAlimentar && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/15 text-orange-600">
                <Utensils className="w-3 h-3" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Restrição: {anamnese.restricao_alimentar}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};


// Popover com detalhes do participante
const ParticipanteDetails: React.FC<{ anamnese: Anamnese | undefined; userName: string }> = ({
  anamnese,
  userName,
}) => {
  if (!anamnese) {
    return (
      <div className="text-sm text-muted-foreground">
        <p>Ficha não preenchida</p>
      </div>
    );
  }

  const condicoes: string[] = [];
  if (anamnese.pressao_alta) condicoes.push('Pressão Alta');
  if (anamnese.problemas_cardiacos) condicoes.push('Problemas Cardíacos');
  if (anamnese.historico_convulsivo) condicoes.push('Histórico Convulsivo');
  if (anamnese.diabetes) condicoes.push('Diabetes');
  if (anamnese.problemas_respiratorios) condicoes.push('Problemas Respiratórios');
  if (anamnese.uso_antidepressivos) condicoes.push(`Antidepressivos${anamnese.tipo_antidepressivo ? `: ${anamnese.tipo_antidepressivo}` : ''}`);
  if (anamnese.transtorno_psiquiatrico) condicoes.push(`Transtorno Psiq.${anamnese.transtorno_psiquiatrico_qual ? `: ${anamnese.transtorno_psiquiatrico_qual}` : ''}`);
  if (anamnese.gestante_lactante) condicoes.push('Gestante/Lactante');

  return (
    <div className="space-y-3 text-sm max-w-xs">
      {/* Contato */}
      {anamnese.telefone && (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span>{anamnese.telefone}</span>
        </div>
      )}

      {/* Contato de emergência */}
      {anamnese.contato_emergencia && (
        <div className="p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
          <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Emergência:</p>
          <p className="text-red-600 dark:text-red-400">
            {anamnese.nome_contato_emergencia || 'Contato'} ({anamnese.parentesco_contato || '-'})
          </p>
          <p className="font-medium text-red-700 dark:text-red-300">{anamnese.contato_emergencia}</p>
        </div>
      )}

      {/* Condições de saúde */}
      {condicoes.length > 0 && (
        <div>
          <p className="font-medium text-amber-600 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Condições:
          </p>
          <ul className="text-xs space-y-0.5 text-muted-foreground">
            {condicoes.map((c, i) => (
              <li key={i}>• {c}</li>
            ))}
          </ul>
          {anamnese.liberado_participar && (
            <Badge className="mt-1 bg-green-100 dark:bg-green-500/15 text-green-700 text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Liberado
            </Badge>
          )}
        </div>
      )}

      {/* Medicamentos */}
      {anamnese.uso_medicamentos && (
        <div>
          <p className="font-medium text-xs">Medicamentos:</p>
          <p className="text-muted-foreground text-xs">{anamnese.uso_medicamentos}</p>
        </div>
      )}

      {/* Alergias */}
      {anamnese.alergias && (
        <div>
          <p className="font-medium text-xs text-orange-600">Alergias:</p>
          <p className="text-muted-foreground text-xs">{anamnese.alergias}</p>
        </div>
      )}

      {/* Restrição alimentar */}
      {anamnese.restricao_alimentar && (
        <div>
          <p className="font-medium text-xs text-orange-600">Restrição Alimentar:</p>
          <p className="text-muted-foreground text-xs">{anamnese.restricao_alimentar}</p>
        </div>
      )}

      {/* Experiência */}
      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          {anamnese.ja_consagrou
            ? `Veterano (${anamnese.quantas_vezes_consagrou || 'várias'} vezes)`
            : 'Primeira consagração'}
        </p>
      </div>
    </div>
  );
};

// Função para gerar PDF/imprimir
const generatePrintContent = (
  inscricoes: Inscricao[],
  cerimonia: Cerimonia,
  getAnamnese: (userId: string) => Anamnese | undefined
) => {
  const activeInscricoes = inscricoes.filter((i) => !i.cancelada);
  const dataFormatada = formatDateExtensoBR(cerimonia.data);

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Lista de Participantes - ${cerimonia.medicina_principal}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; }
        h1 { font-size: 16px; margin-bottom: 5px; }
        .header { margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .info { font-size: 12px; color: #666; margin-bottom: 3px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; font-size: 10px; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 9px; }
        .ok { background: #d4edda; color: #155724; }
        .warning { background: #fff3cd; color: #856404; }
        .danger { background: #f8d7da; color: #721c24; }
        .gray { background: #e9ecef; color: #6c757d; }
        .icons { display: flex; gap: 4px; }
        .icon { width: 16px; height: 16px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; }
        .footer { margin-top: 20px; font-size: 10px; color: #666; text-align: center; }
        @media print { body { padding: 10px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Lista de Participantes</h1>
        <p class="info"><strong>Cerimônia:</strong> ${cerimonia.medicina_principal} ${cerimonia.nome ? `- ${cerimonia.nome}` : ''}</p>
        <p class="info"><strong>Data:</strong> ${dataFormatada} às ${cerimonia.horario.slice(0, 5)}</p>
        <p class="info"><strong>Local:</strong> ${cerimonia.local}</p>
        <p class="info"><strong>Total:</strong> ${activeInscricoes.length} participante(s)</p>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 30px">#</th>
            <th>Nome</th>
            <th style="width: 100px">Telefone</th>
            <th style="width: 60px">Saúde</th>
            <th style="width: 50px">Imagem</th>
            <th style="width: 60px">Permanece</th>
            <th style="width: 50px">Pago</th>
            <th>Observações</th>
          </tr>
        </thead>
        <tbody>
  `;

  activeInscricoes.forEach((inscricao, index) => {
    const anamnese = getAnamnese(inscricao.user_id);
    const temContraindicacao = anamnese ? hasContraindicacao(anamnese) : false;
    const foiLiberado = anamnese?.liberado_participar === true;
    const autorizaImagem = anamnese?.aceite_uso_imagem === true;
    const permanece = anamnese?.aceite_permanencia === true;

    const observacoes: string[] = [];
    if (anamnese?.restricao_alimentar) observacoes.push(`Restrição: ${anamnese.restricao_alimentar}`);
    if (anamnese?.alergias) observacoes.push(`Alergia: ${anamnese.alergias}`);
    if (anamnese?.ja_consagrou !== true) observacoes.push('1ª vez');

    html += `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${inscricao.profiles?.full_name || 'Sem nome'}</strong></td>
        <td>${anamnese?.telefone || '-'}</td>
        <td>
          <span class="badge ${temContraindicacao ? (foiLiberado ? 'warning' : 'danger') : 'ok'}">
            ${temContraindicacao ? (foiLiberado ? 'ATENÇÃO' : 'RISCO') : 'OK'}
          </span>
        </td>
        <td><span class="badge ${autorizaImagem ? 'ok' : 'gray'}">${autorizaImagem ? 'SIM' : 'NÃO'}</span></td>
        <td><span class="badge ${permanece ? 'ok' : 'gray'}">${permanece ? 'SIM' : 'NÃO'}</span></td>
        <td><span class="badge ${inscricao.pago ? 'ok' : 'warning'}">${inscricao.pago ? 'SIM' : 'NÃO'}</span></td>
        <td style="font-size: 9px">${observacoes.join(' | ') || '-'}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
      <div class="footer">
        <p>Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </div>
    </body>
    </html>
  `;

  return html;
};

// Card mobile para participante
const ParticipanteCard: React.FC<{
  inscricao: Inscricao;
  anamnese: Anamnese | undefined;
  onCancelInscricao: (inscricaoId: string, userName: string) => void;
  onOpenDetails: () => void;
}> = ({ inscricao, anamnese, onCancelInscricao, onOpenDetails }) => {
  const temContraindicacao = anamnese ? hasContraindicacao(anamnese) : false;
  const foiLiberado = anamnese?.liberado_participar === true;
  const autorizaImagem = anamnese?.aceite_uso_imagem === true;
  const permanece = anamnese?.aceite_permanencia === true;
  const primeiraVez = anamnese?.ja_consagrou !== true;
  const temRestricaoAlimentar = !!anamnese?.restricao_alimentar;

  return (
    <div className="p-3 bg-card border rounded-lg space-y-2">
      {/* Header: Nome + Status pagamento */}
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onOpenDetails}
          className="font-medium text-sm text-left hover:text-primary hover:underline flex-1"
        >
          {inscricao.profiles?.full_name || 'Sem nome'}
        </button>
        {inscricao.pago ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs shrink-0">
            <DollarSign className="w-3 h-3 mr-0.5" /> Pago
          </Badge>
        ) : (
          <Badge variant="outline" className="text-amber-600 border-amber-300 dark:border-amber-500/40 text-xs shrink-0">
            Pendente
          </Badge>
        )}
      </div>

      {/* Indicadores visuais */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Saúde */}
        <span
          className={cn(
            'inline-flex items-center justify-center w-6 h-6 rounded-full',
            !anamnese
              ? 'bg-gray-200 dark:bg-muted text-gray-500'
              : temContraindicacao
                ? foiLiberado
                  ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-600'
                  : 'bg-red-100 dark:bg-red-500/15 text-red-600'
                : 'bg-green-100 dark:bg-green-500/15 text-green-600'
          )}
        >
          {anamnese ? <Heart className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
        </span>

        {/* Imagem */}
        <span
          className={cn(
            'inline-flex items-center justify-center w-6 h-6 rounded-full',
            autorizaImagem ? 'bg-green-100 dark:bg-green-500/15 text-green-600' : 'bg-gray-100 text-gray-400'
          )}
        >
          <Camera className="w-3.5 h-3.5" />
        </span>

        {/* Permanência */}
        <span
          className={cn(
            'inline-flex items-center justify-center w-6 h-6 rounded-full',
            permanece ? 'bg-green-100 dark:bg-green-500/15 text-green-600' : 'bg-gray-100 text-gray-400'
          )}
        >
          <Home className="w-3.5 h-3.5" />
        </span>

        {/* Primeira vez */}
        {primeiraVez && (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/12 dark:bg-primary/20 text-purple-600">
            <Star className="w-3.5 h-3.5" />
          </span>
        )}

        {/* Restrição alimentar */}
        {temRestricaoAlimentar && (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-500/15 text-orange-600">
            <Utensils className="w-3.5 h-3.5" />
          </span>
        )}

        {/* Spacer + Ação */}
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onCancelInscricao(inscricao.id, inscricao.profiles?.full_name || 'Sem nome')}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Data inscrição */}
      <p className="text-xs text-muted-foreground">
        Inscrito em:{' '}
        {inscricao.data_inscricao
          ? format(new Date(inscricao.data_inscricao), 'dd/MM/yyyy HH:mm', { locale: ptBR })
          : '-'}
      </p>
    </div>
  );
};

const ParticipantesList: React.FC<ParticipantesListProps> = ({
  inscricoes,
  cerimonia,
  getAnamnese,
  onCancelInscricao,
  pagosCount,
  totalCount,
}) => {
  const isMobile = useIsMobile();
  const activeInscricoes = inscricoes.filter((i) => !i.cancelada);
  const [selectedParticipante, setSelectedParticipante] = useState<Inscricao | null>(null);

  const handlePrint = () => {
    const content = generatePrintContent(inscricoes, cerimonia, getAnamnese);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  const handleDownload = () => {
    const content = generatePrintContent(inscricoes, cerimonia, getAnamnese);
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participantes_${cerimonia.medicina_principal}_${cerimonia.data}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('mt-2 p-3 md:p-4 bg-muted/20 rounded-lg border border-dashed', !isMobile && 'ml-4')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Inscritos ({totalCount})
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="bg-green-50 dark:bg-green-500/10 text-green-700 border-green-200 dark:border-green-500/30 text-xs">
            <DollarSign className="w-3 h-3 mr-0.5" />
            {pagosCount} pago(s)
          </Badge>
          <Badge variant="outline" className="text-amber-600 border-amber-300 dark:border-amber-500/40 text-xs">
            {totalCount - pagosCount} pendente(s)
          </Badge>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 w-8 p-0">
              <Printer className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 w-8 p-0">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Legenda compacta */}
      <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground border-b pb-2">
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-500/15 inline-flex items-center justify-center">
            <Heart className="w-2.5 h-2.5 text-green-600" />
          </span>
          Saúde
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-500/15 inline-flex items-center justify-center">
            <Camera className="w-2.5 h-2.5 text-green-600" />
          </span>
          Imagem
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-500/15 inline-flex items-center justify-center">
            <Home className="w-2.5 h-2.5 text-green-600" />
          </span>
          Permanece
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-full bg-primary/12 dark:bg-primary/20 inline-flex items-center justify-center">
            <Star className="w-2.5 h-2.5 text-purple-600" />
          </span>
          1ª vez
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-500/15 inline-flex items-center justify-center">
            <Utensils className="w-2.5 h-2.5 text-orange-600" />
          </span>
          Restrição
        </span>
      </div>

      {activeInscricoes.length > 0 ? (
        isMobile ? (
          // Mobile: Cards
          <div className="space-y-2">
            {activeInscricoes.map((inscricao) => {
              const anamnese = getAnamnese(inscricao.user_id);
              return (
                <ParticipanteCard
                  key={inscricao.id}
                  inscricao={inscricao}
                  anamnese={anamnese}
                  onCancelInscricao={onCancelInscricao}
                  onOpenDetails={() => setSelectedParticipante(inscricao)}
                />
              );
            })}
          </div>
        ) : (
          // Desktop: Table
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="w-[140px]">Indicadores</TableHead>
                <TableHead>Data Inscrição</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeInscricoes.map((inscricao) => {
                const anamnese = getAnamnese(inscricao.user_id);
                return (
                  <TableRow key={inscricao.id}>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="font-medium hover:text-primary hover:underline text-left">
                            {inscricao.profiles?.full_name || 'Sem nome'}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                          <div className="font-medium mb-2">{inscricao.profiles?.full_name}</div>
                          <ParticipanteDetails anamnese={anamnese} userName={inscricao.profiles?.full_name || ''} />
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <HealthIndicators anamnese={anamnese} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inscricao.data_inscricao
                        ? format(new Date(inscricao.data_inscricao), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {inscricao.pago ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          <DollarSign className="w-3 h-3 mr-1" /> Pago
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 dark:border-amber-500/40">
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                onCancelInscricao(inscricao.id, inscricao.profiles?.full_name || 'Sem nome')
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cancelar inscrição</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum inscrito nesta cerimônia.
        </p>
      )}

      {/* Drawer para detalhes no mobile */}
      <Drawer open={!!selectedParticipante} onOpenChange={(open) => !open && setSelectedParticipante(null)}>
        <DrawerContent>
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4 mt-2" />
          <DrawerHeader className="pb-2">
            <DrawerTitle>{selectedParticipante?.profiles?.full_name || 'Participante'}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto scrollbar-none">
            {selectedParticipante && (
              <ParticipanteDetails
                anamnese={getAnamnese(selectedParticipante.user_id)}
                userName={selectedParticipante.profiles?.full_name || ''}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default memo(ParticipantesList);
