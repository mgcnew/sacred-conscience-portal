import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Shield, Key, Users, Settings } from 'lucide-react';
import { toast } from 'sonner';
import {
  useProfiles,
  usePermissoesDisponiveis,
  useTodasPermissoesUsuarios,
  useConcederPermissao,
  useRevogarPermissao,
  type Permissao,
} from '@/hooks/queries';
import type { Profile } from '@/types';

// Mapeamento de categorias para ícones e cores
const categoriaConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  consagradores: { icon: <Users className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Consagradores' },
  cerimonias: { icon: <Settings className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: 'Cerimônias' },
  financeiro: { icon: <Key className="w-4 h-4" />, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Financeiro' },
  depoimentos: { icon: <Settings className="w-4 h-4" />, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'Depoimentos' },
  loja: { icon: <Settings className="w-4 h-4" />, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', label: 'Loja' },
  sistema: { icon: <Shield className="w-4 h-4" />, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Sistema' },
};

export const PermissoesTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: profiles, isLoading: isLoadingProfiles } = useProfiles();
  const { data: permissoes, isLoading: isLoadingPermissoes } = usePermissoesDisponiveis();
  const { data: userPermissoes, isLoading: isLoadingUserPermissoes } = useTodasPermissoesUsuarios();
  const concederMutation = useConcederPermissao();
  const revogarMutation = useRevogarPermissao();

  // Filtrar apenas admins e guardiões (memoized)
  const admins = useMemo(() => {
    if (!profiles || !userPermissoes) return [];
    return profiles.filter(p => userPermissoes.some(up => up.user_id === p.id));
  }, [profiles, userPermissoes]);

  // Todos os usuários filtrados por busca (memoized)
  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return profiles.filter(p =>
      p.full_name?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term)
    );
  }, [profiles, searchTerm]);

  // Verificar se usuário tem uma permissão específica
  const temPermissao = (userId: string, permissaoId: string): boolean => {
    return userPermissoes?.some(up => up.user_id === userId && up.permissao_id === permissaoId) || false;
  };

  // Obter permissões de um usuário
  const getPermissoesUsuario = (userId: string) => {
    return userPermissoes?.filter(up => up.user_id === userId) || [];
  };

  // Toggle permissão
  const handleTogglePermissao = async (userId: string, permissaoId: string, temAtualmente: boolean) => {
    try {
      if (temAtualmente) {
        await revogarMutation.mutateAsync({ userId, permissaoId });
        toast.success('Permissão revogada');
      } else {
        await concederMutation.mutateAsync({ userId, permissaoId });
        toast.success('Permissão concedida');
      }
    } catch {
      toast.error('Erro ao alterar permissão');
    }
  };

  // Agrupar permissões por categoria (memoized)
  const permissoesPorCategoria = useMemo(() => {
    if (!permissoes) return {};
    return permissoes.reduce((acc, p) => {
      if (!acc[p.categoria]) acc[p.categoria] = [];
      acc[p.categoria].push(p);
      return acc;
    }, {} as Record<string, Permissao[]>);
  }, [permissoes]);

  const selectedProfile = profiles?.find(p => p.id === selectedUserId);

  if (isLoadingProfiles || isLoadingPermissoes || isLoadingUserPermissoes) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo de admins com permissões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Usuários com Permissões
          </CardTitle>
          <CardDescription>
            Gerencie as permissões de acesso ao painel administrativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum usuário com permissões especiais ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {admins.map(admin => {
                const perms = getPermissoesUsuario(admin.id);
                const isSuperAdmin = perms.some(p => p.permissao?.nome === 'super_admin');
                return (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedUserId(admin.id)}
                  >
                    <div>
                      <p className="font-medium">{admin.full_name || 'Sem nome'}</p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSuperAdmin ? (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Super Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{perms.length} permissões</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adicionar permissões a usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Gerenciar Permissões
          </CardTitle>
          <CardDescription>
            Busque um usuário para adicionar ou remover permissões.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca com autosugestão */}
          <SearchInput
            placeholder="Buscar usuário por nome ou email..."
            value={searchTerm}
            onChange={(v) => {
              setSearchTerm(v);
              if (selectedUserId && v === '') setSelectedUserId(null);
            }}
          />
            
            {/* Dropdown de sugestões */}
            {searchTerm && searchTerm.length >= 1 && !selectedUserId && filteredProfiles.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-[250px] overflow-y-auto">
                {filteredProfiles.slice(0, 8).map(profile => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted border-b last:border-b-0"
                    onClick={() => {
                      setSelectedUserId(profile.id);
                      setSearchTerm(profile.full_name || profile.email || '');
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium">{profile.full_name || 'Sem nome'}</p>
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                    {getPermissoesUsuario(profile.id).length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {getPermissoesUsuario(profile.id).length} perms
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Permissões do usuário selecionado */}
          {selectedProfile && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{selectedProfile.full_name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedProfile.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  setSelectedUserId(null);
                  setSearchTerm('');
                }}>
                  Fechar
                </Button>
              </div>

              <div className="space-y-4">
                {Object.entries(permissoesPorCategoria).map(([categoria, perms]) => {
                  const config = categoriaConfig[categoria] || { 
                    icon: <Settings className="w-4 h-4" />, 
                    color: 'bg-gray-100 text-gray-700',
                    label: categoria 
                  };
                  
                  return (
                    <div key={categoria} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={config.color}>
                          {config.icon}
                          <span className="ml-1">{config.label}</span>
                        </Badge>
                      </div>
                      <div className="grid gap-2 pl-2">
                        {perms.map(perm => {
                          const tem = temPermissao(selectedProfile.id, perm.id);
                          const isLoading = concederMutation.isPending || revogarMutation.isPending;
                          
                          return (
                            <div
                              key={perm.id}
                              className="flex items-center justify-between py-2 px-3 border rounded hover:bg-muted/50"
                            >
                              <div>
                                <p className="text-sm font-medium">{perm.nome}</p>
                                <p className="text-xs text-muted-foreground">{perm.descricao}</p>
                              </div>
                              <Switch
                                checked={tem}
                                disabled={isLoading}
                                onCheckedChange={() => handleTogglePermissao(selectedProfile.id, perm.id, tem)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissoesTab;
