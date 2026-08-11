import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SearchInput } from '@/components/ui/search-input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Key, Users, Settings, ChevronRight, X, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  useProfiles,
  usePermissoesDisponiveis,
  useTodasPermissoesUsuarios,
  useConcederPermissao,
  useRevogarPermissao,
  useRoles,
  useUserRoles,
  getUserRoleFromData,
  type Permissao,
} from '@/hooks/queries';
import type { Profile } from '@/types';

const CATEGORIAS_OCULTAS: string[] = [];

const categoriaConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  consagradores: { icon: <Users className="w-3.5 h-3.5" />, color: 'bg-info-subtle text-info dark:bg-info-subtle dark:text-info', label: 'Consagradores' },
  cerimonias:    { icon: <Settings className="w-3.5 h-3.5" />, color: 'bg-primary/12 dark:bg-primary/20 text-primary dark:bg-primary/12 dark:text-primary', label: 'Cerimônias' },
  financeiro:    { icon: <Key className="w-3.5 h-3.5" />, color: 'bg-success-subtle text-success dark:bg-success-subtle dark:text-success', label: 'Financeiro' },
  depoimentos:   { icon: <Settings className="w-3.5 h-3.5" />, color: 'bg-warning-subtle text-warning dark:bg-warning-subtle dark:text-warning', label: 'Depoimentos' },
  loja:          { icon: <Settings className="w-3.5 h-3.5" />, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', label: 'Loja' },
  sistema:       { icon: <Shield className="w-3.5 h-3.5" />, color: 'bg-destructive-subtle text-destructive dark:bg-destructive-subtle dark:text-destructive', label: 'Sistema' },
};

const roleBadge: Record<string, { label: string; className: string }> = {
  admin:       { label: 'Admin', className: 'bg-destructive-subtle text-destructive dark:bg-destructive-subtle dark:text-destructive' },
  guardiao:    { label: 'Guardião', className: 'bg-primary/12 dark:bg-primary/20 text-primary dark:bg-primary/12 dark:text-primary' },
  consagrador: { label: 'Membro', className: 'bg-muted text-muted-foreground' },
};

export const PermissoesTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const { data: profiles, isLoading: isLoadingProfiles } = useProfiles();
  const { data: permissoes, isLoading: isLoadingPermissoes } = usePermissoesDisponiveis();
  const { data: userPermissoes, isLoading: isLoadingUserPermissoes } = useTodasPermissoesUsuarios();
  const { data: roles } = useRoles();
  const { data: userRoles } = useUserRoles();
  const concederMutation = useConcederPermissao();
  const revogarMutation = useRevogarPermissao();

  const isLoading = isLoadingProfiles || isLoadingPermissoes || isLoadingUserPermissoes;

  // Usuários que já têm alguma permissão
  const usersWithPerms = useMemo(() => {
    if (!profiles || !userPermissoes) return [];
    return profiles
      .filter(p => userPermissoes.some(up => up.user_id === p.id))
      .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
  }, [profiles, userPermissoes]);

  // Busca para adicionar novos usuários
  const searchResults = useMemo(() => {
    if (!profiles || !searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase();
    return profiles
      .filter(p =>
        p.full_name?.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [profiles, searchTerm]);

  const permissoesPorCategoria = useMemo(() => {
    if (!permissoes) return {};
    return permissoes
      .filter(p => !CATEGORIAS_OCULTAS.includes(p.categoria))
      .reduce((acc, p) => {
        if (!acc[p.categoria]) acc[p.categoria] = [];
        acc[p.categoria].push(p);
        return acc;
      }, {} as Record<string, Permissao[]>);
  }, [permissoes]);

  const temPermissao = (userId: string, permissaoId: string) =>
    userPermissoes?.some(up => up.user_id === userId && up.permissao_id === permissaoId) ?? false;

  const getPermCount = (userId: string) =>
    userPermissoes?.filter(up => up.user_id === userId).length ?? 0;

  const handleToggle = async (userId: string, permissaoId: string, temAtualmente: boolean) => {
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

  const selectedProfile = profiles?.find(p => p.id === selectedUserId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="w-4 h-4 text-primary" />
                Permissões de Acesso
              </CardTitle>
              <CardDescription className="mt-0.5">
                Gerencie quem tem acesso ao painel administrativo.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0"
              onClick={() => { setShowSearch(v => !v); setSearchTerm(''); setSelectedUserId(null); }}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {showSearch ? 'Cancelar' : 'Adicionar usuário'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Busca para adicionar novo usuário */}
          {showSearch && (
            <div className="px-6 pb-4 border-b">
              <div className="relative">
                <SearchInput
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                  autoFocus
                />
                {searchResults.length > 0 && searchTerm.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
                    {searchResults.map(profile => {
                      const role = getUserRoleFromData(profile.id, userRoles, roles);
                      const rb = roleBadge[role] || roleBadge.consagrador;
                      const perms = getPermCount(profile.id);
                      return (
                        <div
                          key={profile.id}
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted border-b last:border-b-0"
                          onClick={() => {
                            setSelectedUserId(profile.id);
                            setSearchTerm('');
                            setShowSearch(false);
                          }}
                        >
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {profile.full_name?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{profile.full_name || 'Sem nome'}</p>
                            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={cn('text-[10px] px-1.5 py-0 h-4', rb.className)}>{rb.label}</Badge>
                            {perms > 0 && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{perms} perms</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Layout two-column no desktop */}
          <div className="flex flex-col lg:flex-row">
            {/* Lista de usuários com permissões */}
            <div className={cn(
              'lg:w-64 xl:w-72 shrink-0 lg:border-r',
              selectedUserId ? 'hidden lg:flex flex-col' : 'flex flex-col'
            )}>
              {usersWithPerms.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-12 px-4 text-center text-muted-foreground">
                  <Shield className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">Nenhum usuário com permissões ainda.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {usersWithPerms.map(u => {
                    const role = getUserRoleFromData(u.id, userRoles, roles);
                    const rb = roleBadge[role] || roleBadge.consagrador;
                    const count = getPermCount(u.id);
                    const isSelected = selectedUserId === u.id;
                    return (
                      <button
                        key={u.id}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors',
                          isSelected && 'bg-primary/5 border-l-2 border-l-primary'
                        )}
                        onClick={() => setSelectedUserId(isSelected ? null : u.id)}
                      >
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {u.full_name?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate leading-tight">{u.full_name || 'Sem nome'}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge className={cn('text-[10px] px-1.5 py-0 h-4 font-normal', rb.className)}>{rb.label}</Badge>
                            <span className="text-[10px] text-muted-foreground">{count} perm{count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <ChevronRight className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform', isSelected && 'rotate-90')} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Painel de permissões do usuário selecionado */}
            {selectedProfile ? (
              <div className="flex-1 flex flex-col">
                {/* Header do painel */}
                <div className="flex items-center gap-3 px-5 py-3 border-b bg-muted/20">
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarFallback className="text-sm bg-primary/10 text-primary">
                      {selectedProfile.full_name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{selectedProfile.full_name || 'Sem nome'}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedProfile.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 shrink-0"
                    onClick={() => setSelectedUserId(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Toggles por categoria */}
                <div className="p-4 space-y-5">
                  {Object.entries(permissoesPorCategoria).map(([categoria, perms]) => {
                    const config = categoriaConfig[categoria] || {
                      icon: <Settings className="w-3.5 h-3.5" />,
                      color: 'bg-muted text-muted-foreground',
                      label: categoria,
                    };
                    return (
                      <div key={categoria}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={cn('gap-1 text-xs font-medium', config.color)}>
                            {config.icon}
                            {config.label}
                          </Badge>
                        </div>
                        <div className="space-y-1 pl-1">
                          {perms.map(perm => {
                            const tem = temPermissao(selectedProfile.id, perm.id);
                            const isUpdating = concederMutation.isPending || revogarMutation.isPending;
                            return (
                              <div
                                key={perm.id}
                                className={cn(
                                  'flex items-center justify-between py-2.5 px-3 rounded-lg border transition-colors',
                                  tem ? 'bg-primary/5 border-primary/20' : 'border-border/50 hover:bg-muted/40'
                                )}
                              >
                                <div className="min-w-0 pr-3">
                                  <p className="text-sm font-medium leading-tight">{perm.nome}</p>
                                  {perm.descricao && (
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{perm.descricao}</p>
                                  )}
                                </div>
                                <Switch
                                  checked={tem}
                                  disabled={isUpdating}
                                  onCheckedChange={() => handleToggle(selectedProfile.id, perm.id, tem)}
                                  className="shrink-0"
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
            ) : (
              <div className="hidden lg:flex flex-1 items-center justify-center text-muted-foreground flex-col gap-2">
                <Key className="w-8 h-8 opacity-20" />
                <p className="text-sm">Selecione um usuário para editar as permissões</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissoesTab;
