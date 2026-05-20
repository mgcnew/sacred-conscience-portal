import React from 'react';
import { FluxoCaixaTab } from '@/components/admin/FluxoCaixaTab';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PageContainer } from '@/components/shared';
import { Wallet } from 'lucide-react';

const Financeiro: React.FC = () => {
  return (
    <PageContainer maxWidth="2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            Financeiro
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Fluxo de caixa, transações e relatórios financeiros
          </p>
        </div>
        <PermissionGate permissao="super_admin" showLoading>
          <FluxoCaixaTab />
        </PermissionGate>
      </div>
    </PageContainer>
  );
};

export default Financeiro;
