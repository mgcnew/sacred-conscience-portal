import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck, Wallet, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ROUTES } from '@/constants';
import { formatDateBR } from '@/lib/date-utils';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getDaysAgoStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

const AdminReminders: React.FC = () => {
  const navigate = useNavigate();
  const today = getTodayStr();
  const threeDaysAgo = getDaysAgoStr(3);
  const yesterday = getDaysAgoStr(1);

  const { data: todayCeremonies = [] } = useQuery({
    queryKey: ['admin-checkin-reminder', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cerimonias')
        .select('id, nome, data')
        .eq('data', today)
        .order('data', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: recentCeremonies = [] } = useQuery({
    queryKey: ['admin-financial-reminder', threeDaysAgo, yesterday],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cerimonias')
        .select('id, nome, data')
        .gte('data', threeDaysAgo)
        .lt('data', today)
        .order('data', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (todayCeremonies.length === 0 && recentCeremonies.length === 0) return null;

  return (
    <div className="space-y-3">
      {todayCeremonies.map((c) => (
        <Card key={c.id} className="border-none shadow-sm bg-blue-500/8 overflow-hidden">
          <div className="bg-blue-500/15 px-4 py-2 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Cerimônia Hoje
            </span>
          </div>
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-sm">{c.nome}</p>
              <p className="text-xs text-muted-foreground">{formatDateBR(c.data)} — Registre as presenças</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="shrink-0"
              onClick={() => navigate(`${ROUTES.ADMIN}?tab=inscricoes`)}
            >
              Ver inscrições
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>
      ))}

      {recentCeremonies.length > 0 && (
        <Card className="border-none shadow-sm bg-amber-500/8 overflow-hidden">
          <div className="bg-amber-500/15 px-4 py-2 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Lançamento Financeiro Pendente
            </span>
          </div>
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-sm">
                {recentCeremonies.length === 1
                  ? recentCeremonies[0].nome
                  : `${recentCeremonies.length} cerimônias recentes`}
              </p>
              <p className="text-xs text-muted-foreground">
                {recentCeremonies.length === 1
                  ? `${formatDateBR(recentCeremonies[0].data)} — Lance as entradas e saídas`
                  : 'Lance as entradas e saídas no financeiro'}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="shrink-0"
              onClick={() => navigate(ROUTES.FINANCEIRO)}
            >
              Financeiro
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminReminders;
