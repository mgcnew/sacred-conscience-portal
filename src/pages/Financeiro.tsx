import React from 'react';
import { FluxoCaixaTab } from '@/components/admin/FluxoCaixaTab';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PageContainer } from '@/components/shared';
import { Wallet, TrendingUp, AlertTriangle, Users, CheckCircle2 } from 'lucide-react';
import { useInscricoesKPIs } from '@/hooks/queries/useFluxoCaixa';
import { cn } from '@/lib/utils';
import FadeIn from '@/components/ui/FadeIn';

const kpiConfig = [
  {
    key: 'total',
    label: 'Total de Inscrições',
    icon: Users,
    color: 'text-primary',
    bg: 'bg-primary/8 border-primary/20',
    format: (v: number) => String(v),
  },
  {
    key: 'pagos',
    label: 'Confirmados',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/8 border-emerald-500/20',
    format: (v: number) => String(v),
  },
  {
    key: 'inadimplentes',
    label: 'Inadimplentes',
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/8 border-amber-500/20',
    format: (v: number) => String(v),
  },
  {
    key: 'taxa',
    label: 'Taxa de Recebimento',
    icon: TrendingUp,
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-500/8 border-teal-500/20',
    format: (v: number) => `${v}%`,
  },
] as const;

const InscricoesKPIs: React.FC = () => {
  const { data: kpis, isLoading } = useInscricoesKPIs();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {kpiConfig.map(({ key, label, icon: Icon, color, bg, format }) => (
        <div key={key} className={cn('rounded-2xl border p-4', bg)}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">{label}</span>
            <Icon className={cn('w-4 h-4 shrink-0', color)} />
          </div>
          {isLoading ? (
            <div className="h-8 w-16 rounded-lg bg-muted/60 animate-pulse" />
          ) : (
            <p className={cn('text-2xl font-black leading-none', color)}>
              {kpis ? format(kpis[key]) : '—'}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

const Financeiro: React.FC = () => {
  return (
    <PageContainer maxWidth="2xl">
      <FadeIn>
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl mb-6 bg-primary/8 border border-primary/15 px-5 py-6">
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">Financeiro</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Fluxo de caixa, inscrições e relatórios do templo</p>
            </div>
          </div>
        </div>
      </FadeIn>

      <PermissionGate permissao="super_admin" showLoading>
        <FadeIn delay={60}>
          <InscricoesKPIs />
        </FadeIn>
        <FadeIn delay={120}>
          <FluxoCaixaTab />
        </FadeIn>
      </PermissionGate>
    </PageContainer>
  );
};

export default Financeiro;
