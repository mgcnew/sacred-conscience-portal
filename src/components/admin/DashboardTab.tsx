import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton, CardSkeleton } from '@/components/ui/table-skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MobileCard,
  MobileCardHeader,
  MobileCardRow,
} from '@/components/ui/responsive-table';
import { Users, Calendar, FileText, CheckCircle2, Info } from 'lucide-react';
import type { Profile, Anamnese, Cerimonia, Inscricao } from '@/types';

interface DashboardTabProps {
  profiles: Profile[] | undefined;
  anamneses: Anamnese[] | undefined;
  cerimonias: Cerimonia[] | undefined;
  inscricoes: Inscricao[] | undefined;
  isLoadingProfiles: boolean;
  getAnamnese: (userId: string) => Anamnese | undefined;
}

export const DashboardTab = memo(({
  profiles,
  anamneses,
  cerimonias,
  inscricoes,
  isLoadingProfiles,
  getAnamnese,
}: DashboardTabProps) => {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Consagradores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Cadastrados na plataforma
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fichas Preenchidas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anamneses?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Anamneses completas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cerimônias Realizadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cerimonias?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Eventos criados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inscrições Totais</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inscricoes?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Participações registradas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos Cadastros</CardTitle>
          <CardDescription>
            Novos usuários registrados recentemente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status Ficha</TableHead>
                </TableRow>
              </TableHeader>
              {isLoadingProfiles ? (
                <TableSkeleton rows={5} columns={4} />
              ) : (
                <TableBody>
                  {profiles?.slice(0, 5).map((profile) => {
                    const ficha = getAnamnese(profile.id);
                    const displayName = profile.full_name || ficha?.nome_completo || 'Sem nome';
                    return (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{displayName}</TableCell>
                        <TableCell>{new Date(profile.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {profile.referral_source || '-'}
                            {profile.referral_name && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Indicado por: {profile.referral_name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {ficha ? (
                            <Badge variant="outline" className="bg-success-subtle text-success border-success/30">Preenchida</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-warning-subtle text-warning border-warning/30">Pendente</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              )}
            </Table>
          </div>


          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {isLoadingProfiles ? (
              <CardSkeleton count={3} />
            ) : (
              profiles?.slice(0, 5).map((profile) => {
                const ficha = getAnamnese(profile.id);
                const displayName = profile.full_name || ficha?.nome_completo || 'Sem nome';
                return (
                  <MobileCard key={profile.id}>
                    <MobileCardHeader>
                      {displayName}
                    </MobileCardHeader>
                    <MobileCardRow label="Cadastro">
                      {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                    </MobileCardRow>
                    <MobileCardRow label="Origem">
                      <div className="flex items-center gap-1">
                        {profile.referral_source || '-'}
                        {profile.referral_name && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-3.5 h-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Indicado por: {profile.referral_name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </MobileCardRow>
                    <MobileCardRow label="Ficha">
                      {ficha ? (
                        <Badge variant="outline" className="bg-success-subtle text-success border-success/30 text-xs">Preenchida</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-warning-subtle text-warning border-warning/30 text-xs">Pendente</Badge>
                      )}
                    </MobileCardRow>
                  </MobileCard>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
});

DashboardTab.displayName = 'DashboardTab';
