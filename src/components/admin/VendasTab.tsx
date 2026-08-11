import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Badge } from '@/components/ui/badge';
import {
  MobileCard,
  MobileCardHeader,
  MobileCardRow,
} from '@/components/ui/responsive-table';
import { ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PagamentoProduto {
  id: string;
  descricao: string | null;
  valor_centavos: number;
  mp_status?: string | null;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

interface VendasTabProps {
  pagamentosProdutos: PagamentoProduto[] | undefined;
  isLoadingPagamentos: boolean;
}

const getStatusBadgeClass = (status: string | null) => {
  if (status === 'approved') return 'bg-green-100 dark:bg-green-500/15 text-green-700';
  if (status === 'pending') return 'bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700';
  return 'bg-red-100 dark:bg-red-500/15 text-red-700';
};

const getStatusLabel = (status: string | null) => {
  if (status === 'approved') return 'Aprovado';
  if (status === 'pending') return 'Pendente';
  return status || 'Aguardando';
};

export const VendasTab = memo(({ pagamentosProdutos, isLoadingPagamentos }: VendasTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Vendas da Loja
        </CardTitle>
        <CardDescription>
          Pagamentos de produtos realizados via Mercado Pago.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingPagamentos ? (
          <TableSkeleton rows={5} columns={5} />
        ) : pagamentosProdutos && pagamentosProdutos.length > 0 ? (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagamentosProdutos.map((pagamento) => (
                    <TableRow key={pagamento.id}>
                      <TableCell>
                        <p className="font-medium">{pagamento.profiles?.full_name || 'N/A'}</p>
                      </TableCell>
                      <TableCell>{pagamento.descricao}</TableCell>
                      <TableCell className="font-medium">
                        R$ {(pagamento.valor_centavos / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(pagamento.mp_status)}>
                          {getStatusLabel(pagamento.mp_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(pagamento.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {pagamentosProdutos.map((pagamento) => (
                <MobileCard key={pagamento.id}>
                  <MobileCardHeader>
                    {pagamento.profiles?.full_name || 'N/A'}
                  </MobileCardHeader>
                  <MobileCardRow label="Produto">
                    {pagamento.descricao}
                  </MobileCardRow>
                  <MobileCardRow label="Valor">
                    R$ {(pagamento.valor_centavos / 100).toFixed(2)}
                  </MobileCardRow>
                  <MobileCardRow label="Status">
                    <Badge className={getStatusBadgeClass(pagamento.mp_status)}>
                      {getStatusLabel(pagamento.mp_status)}
                    </Badge>
                  </MobileCardRow>
                  <MobileCardRow label="Data">
                    {format(new Date(pagamento.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </MobileCardRow>
                </MobileCard>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhuma venda registrada</p>
            <p className="text-sm">As vendas da loja aparecerão aqui.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

VendasTab.displayName = 'VendasTab';
