import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle, AlertTriangle, DollarSign } from 'lucide-react';

type StatusType = 'success' | 'warning' | 'error' | 'pending' | 'info' | 'paid' | 'unpaid';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

/**
 * Cada estado usa o par token/token-subtle correspondente. Antes daqui saíam
 * `green-100`, `amber-50`, `yellow-50` e `blue-50` — o componente criado para
 * padronizar status era justamente o que mais ignorava os tokens semânticos,
 * e por isso mudar o tema não mudava o badge. Os tokens já viram sozinhos no
 * escuro, então não há mais nenhum par `dark:` para manter em sincronia.
 */
const statusConfig: Record<StatusType, {
  classes: string;
  icon: React.ElementType;
  defaultLabel: string;
}> = {
  success: {
    classes: 'bg-success-subtle text-success border-success/30',
    icon: CheckCircle2,
    defaultLabel: 'Sucesso',
  },
  warning: {
    classes: 'bg-warning-subtle text-warning border-warning/30',
    icon: AlertTriangle,
    defaultLabel: 'Atenção',
  },
  error: {
    classes: 'bg-destructive-subtle text-destructive border-destructive/30',
    icon: XCircle,
    defaultLabel: 'Erro',
  },
  pending: {
    classes: 'bg-warning-subtle text-warning border-warning/30',
    icon: Clock,
    defaultLabel: 'Pendente',
  },
  info: {
    classes: 'bg-info-subtle text-info border-info/30',
    icon: AlertTriangle,
    defaultLabel: 'Info',
  },
  paid: {
    classes: 'bg-success-subtle text-success border-success/30',
    icon: DollarSign,
    defaultLabel: 'Pago',
  },
  unpaid: {
    classes: 'text-warning border-warning/40',
    icon: Clock,
    defaultLabel: 'Pendente',
  },
};

/**
 * Badge padronizado para exibir status
 * Garante consistência visual em todo o portal
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showIcon = true,
  className,
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  return (
    <Badge
      variant={status === 'unpaid' ? 'outline' : 'default'}
      className={cn(config.classes, 'flex items-center gap-1', className)}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {displayLabel}
    </Badge>
  );
};

export default StatusBadge;
