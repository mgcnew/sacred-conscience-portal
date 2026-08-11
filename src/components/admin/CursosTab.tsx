import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton, CardSkeleton } from '@/components/ui/table-skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
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
import { Plus, Pencil, Trash2, GraduationCap, Users, X, Image, Calendar, MapPin } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  useCursosAdmin,
  useInscricoesCursosAdmin,
  useCreateCurso,
  useUpdateCurso,
  useDeleteCurso,
  useAtualizarPagamentoCurso,
} from '@/hooks/queries';
import type { CursoEvento } from '@/types';

interface CursoFormData {
  nome: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  horario_inicio: string;
  horario_fim: string;
  responsavel: string;
  valor: string;
  gratuito: boolean;
  vagas: string;
  local: string;
  observacoes: string;
  banner_url: string;
  ativo: boolean;
}

const initialFormData: CursoFormData = {
  nome: '',
  descricao: '',
  data_inicio: '',
  data_fim: '',
  horario_inicio: '',
  horario_fim: '',
  responsavel: '',
  valor: '0',
  gratuito: true,
  vagas: '',
  local: '',
  observacoes: '',
  banner_url: '',
  ativo: true,
};

export const CursosTab: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<CursoEvento | null>(null);
  const [formData, setFormData] = useState<CursoFormData>(initialFormData);
  const [activeTab, setActiveTab] = useState<'cursos' | 'inscricoes'>('cursos');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: cursos, isLoading: isLoadingCursos } = useCursosAdmin();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida');
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx. 5MB)');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cursos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cursos')
        .getPublicUrl(filePath);

      setFormData({ ...formData, banner_url: publicUrl });
      toast.success('Imagem enviada!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, banner_url: '' });
  };
  const { data: inscricoes, isLoading: isLoadingInscricoes } = useInscricoesCursosAdmin();

  const createMutation = useCreateCurso();
  const updateMutation = useUpdateCurso();
  const deleteMutation = useDeleteCurso();
  const atualizarPagamentoMutation = useAtualizarPagamentoCurso();

  const handleOpenCreate = () => {
    setEditingCurso(null);
    setFormData(initialFormData);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (curso: CursoEvento) => {
    setEditingCurso(curso);
    setFormData({
      nome: curso.nome,
      descricao: curso.descricao || '',
      data_inicio: curso.data_inicio,
      data_fim: curso.data_fim || '',
      horario_inicio: curso.horario_inicio,
      horario_fim: curso.horario_fim || '',
      responsavel: curso.responsavel,
      valor: String(curso.valor / 100),
      gratuito: curso.gratuito,
      vagas: curso.vagas ? String(curso.vagas) : '',
      local: curso.local || '',
      observacoes: curso.observacoes || '',
      banner_url: curso.banner_url || '',
      ativo: curso.ativo,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.nome || !formData.data_inicio || !formData.horario_inicio || !formData.responsavel) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const cursoData = {
      nome: formData.nome,
      descricao: formData.descricao || null,
      data_inicio: formData.data_inicio,
      data_fim: formData.data_fim || null,
      horario_inicio: formData.horario_inicio,
      horario_fim: formData.horario_fim || null,
      responsavel: formData.responsavel,
      valor: formData.gratuito ? 0 : Math.round(parseFloat(formData.valor || '0') * 100),
      gratuito: formData.gratuito,
      vagas: formData.vagas ? parseInt(formData.vagas) : null,
      local: formData.local || null,
      observacoes: formData.observacoes || null,
      banner_url: formData.banner_url || null,
      ativo: formData.ativo,
      created_by: user?.id || null,
    };

    if (editingCurso) {
      updateMutation.mutate(
        { id: editingCurso.id, ...cursoData },
        {
          onSuccess: () => {
            toast.success('Curso atualizado com sucesso!');
            setIsFormOpen(false);
          },
          onError: () => toast.error('Erro ao atualizar curso'),
        }
      );
    } else {
      createMutation.mutate(cursoData, {
        onSuccess: () => {
          toast.success('Curso criado com sucesso!');
          setIsFormOpen(false);
        },
        onError: () => toast.error('Erro ao criar curso'),
      });
    }
  };

  const handleDelete = (cursoId: string) => {
    deleteMutation.mutate(cursoId, {
      onSuccess: () => toast.success('Curso excluído'),
      onError: () => toast.error('Erro ao excluir curso'),
    });
  };

  const handleTogglePago = (inscricaoId: string, pago: boolean) => {
    atualizarPagamentoMutation.mutate(
      { inscricaoId, pago },
      {
        onSuccess: () => toast.success(pago ? 'Pagamento confirmado' : 'Pagamento pendente'),
        onError: () => toast.error('Erro ao atualizar pagamento'),
      }
    );
  };

  const getInscritosCount = (cursoId: string) => {
    return inscricoes?.filter(i => i.curso_id === cursoId).length || 0;
  };

  const formatarValor = (valor: number) => {
    return (valor / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Tabs internas */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeTab === 'cursos' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('cursos')}
        >
          <GraduationCap className="w-4 h-4 mr-2" />
          Cursos/Eventos
        </Button>
        <Button
          variant={activeTab === 'inscricoes' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('inscricoes')}
        >
          <Users className="w-4 h-4 mr-2" />
          Inscrições
        </Button>
      </div>

      {activeTab === 'cursos' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gerenciar Cursos e Eventos</CardTitle>
              <CardDescription>Crie e gerencie cursos, workshops e eventos do templo.</CardDescription>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" /> Novo Curso/Evento
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingCursos ? (
              isMobile ? <CardSkeleton count={3} /> : <TableSkeleton rows={5} columns={6} />
            ) : !cursos || cursos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum curso ou evento cadastrado.</p>
              </div>
            ) : isMobile ? (
              // Mobile: Cards
              <div className="space-y-3">
                {cursos.map((curso) => (
                  <div key={curso.id} className="p-3 border rounded-lg bg-card space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{curso.nome}</p>
                        <p className="text-xs text-muted-foreground">{curso.responsavel}</p>
                      </div>
                      <Badge variant={curso.ativo ? 'default' : 'secondary'} className="text-xs shrink-0">
                        {curso.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(curso.data_inicio), 'dd/MM/yy', { locale: ptBR })}
                      </span>
                      <Badge variant={curso.gratuito ? 'secondary' : 'default'} className="text-xs">
                        {curso.gratuito ? 'Gratuito' : formatarValor(curso.valor)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getInscritosCount(curso.id)}{curso.vagas && `/${curso.vagas}`} inscritos
                      </Badge>
                    </div>
                    <div className="flex justify-end gap-1 pt-1 border-t">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(curso)}>
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Curso?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Todas as inscrições serão removidas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(curso.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Desktop: Table
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Inscritos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cursos.map((curso) => (
                    <TableRow key={curso.id}>
                      <TableCell className="font-medium">{curso.nome}</TableCell>
                      <TableCell>
                        {format(new Date(curso.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{curso.responsavel}</TableCell>
                      <TableCell>
                        <Badge variant={curso.gratuito ? 'secondary' : 'default'}>
                          {curso.gratuito ? 'Gratuito' : formatarValor(curso.valor)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getInscritosCount(curso.id)}
                          {curso.vagas && ` / ${curso.vagas}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={curso.ativo ? 'default' : 'secondary'}>
                          {curso.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(curso)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Curso?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Todas as inscrições serão removidas.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(curso.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'inscricoes' && (
        <Card>
          <CardHeader>
            <CardTitle>Inscrições em Cursos</CardTitle>
            <CardDescription>Gerencie as inscrições e pagamentos.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingInscricoes ? (
              isMobile ? <CardSkeleton count={3} /> : <TableSkeleton rows={5} columns={5} />
            ) : !inscricoes || inscricoes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma inscrição registrada.</p>
              </div>
            ) : isMobile ? (
              // Mobile: Cards
              <div className="space-y-3">
                {inscricoes.map((inscricao) => (
                  <div key={inscricao.id} className="p-3 border rounded-lg bg-card space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {inscricao.profiles?.full_name || 'Sem nome'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {inscricao.cursos_eventos?.nome}
                        </p>
                      </div>
                      {inscricao.cursos_eventos?.gratuito ? (
                        <Badge className="bg-success-subtle text-success text-xs shrink-0">Gratuito</Badge>
                      ) : inscricao.pago ? (
                        <Badge className="bg-success-subtle text-success text-xs shrink-0">Pago</Badge>
                      ) : (
                        <Badge variant="outline" className="text-warning border-warning/30 dark:border-warning/40 text-xs shrink-0">
                          Pendente
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {format(new Date(inscricao.data_inscricao), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </span>
                      {!inscricao.cursos_eventos?.gratuito && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Pago:</span>
                          <Switch
                            checked={inscricao.pago}
                            onCheckedChange={(checked) => handleTogglePago(inscricao.id, checked)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Desktop: Table
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participante</TableHead>
                    <TableHead>Curso/Evento</TableHead>
                    <TableHead>Data Inscrição</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inscricoes.map((inscricao) => (
                    <TableRow key={inscricao.id}>
                      <TableCell className="font-medium">
                        {inscricao.profiles?.full_name || 'Sem nome'}
                      </TableCell>
                      <TableCell>{inscricao.cursos_eventos?.nome}</TableCell>
                      <TableCell>
                        {format(new Date(inscricao.data_inscricao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {inscricao.cursos_eventos?.gratuito 
                            ? 'Gratuito' 
                            : inscricao.forma_pagamento || '-'
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {inscricao.cursos_eventos?.gratuito ? (
                          <Badge className="bg-success-subtle text-success">N/A</Badge>
                        ) : (
                          <Switch
                            checked={inscricao.pago}
                            onCheckedChange={(checked) => handleTogglePago(inscricao.id, checked)}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form Content - shared between Dialog and Drawer */}
      {isMobile ? (
        <Drawer open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DrawerContent className="max-h-[90vh]">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-2 mt-2" />
            <DrawerHeader>
              <DrawerTitle>
                {editingCurso ? 'Editar Curso/Evento' : 'Novo Curso/Evento'}
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto scrollbar-none">
              <FormContent
                formData={formData}
                setFormData={setFormData}
                isUploading={isUploading}
                fileInputRef={fileInputRef}
                handleImageUpload={handleImageUpload}
                handleRemoveImage={handleRemoveImage}
              />
            </div>
            <DrawerFooter className="border-t pt-4">
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Salvando...'
                  : editingCurso
                  ? 'Salvar Alterações'
                  : 'Criar Curso/Evento'
                }
              </Button>
              <Button variant="outline" onClick={() => setIsFormOpen(false)} className="w-full">
                Cancelar
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCurso ? 'Editar Curso/Evento' : 'Novo Curso/Evento'}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do curso ou evento"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="responsavel">Responsável *</Label>
              <Input
                id="responsavel"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                placeholder="Quem estará à frente"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="data_inicio">Data Início *</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="data_fim">Data Fim</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="horario_inicio">Horário Início *</Label>
                <Input
                  id="horario_inicio"
                  type="time"
                  value={formData.horario_inicio}
                  onChange={(e) => setFormData({ ...formData, horario_inicio: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="horario_fim">Horário Fim</Label>
                <Input
                  id="horario_fim"
                  type="time"
                  value={formData.horario_fim}
                  onChange={(e) => setFormData({ ...formData, horario_fim: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="gratuito"
                  checked={formData.gratuito}
                  onCheckedChange={(checked) => setFormData({ ...formData, gratuito: checked })}
                />
                <Label htmlFor="gratuito">Gratuito</Label>
              </div>

              {!formData.gratuito && (
                <div className="flex-1 grid gap-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vagas">Vagas (deixe vazio para ilimitado)</Label>
              <Input
                id="vagas"
                type="number"
                min="1"
                value={formData.vagas}
                onChange={(e) => setFormData({ ...formData, vagas: e.target.value })}
                placeholder="Número de vagas"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Endereço ou local do evento"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do curso ou evento"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais, requisitos, etc."
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Banner</Label>
              
              {formData.banner_url ? (
                <div className="relative">
                  <img
                    src={formData.banner_url}
                    alt="Banner preview"
                    className="w-full h-40 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleRemoveImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-muted-foreground">Enviando...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Image className="w-10 h-10 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Clique para enviar uma imagem
                      </span>
                      <span className="text-xs text-muted-foreground">
                        PNG, JPG até 5MB
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">ou cole uma URL:</span>
                <Input
                  value={formData.banner_url}
                  onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 h-8 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="ativo">Ativo (visível para usuários)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Salvando...'
                : editingCurso
                ? 'Salvar Alterações'
                : 'Criar Curso/Evento'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
};

// Form content component to avoid duplication
const FormContent: React.FC<{
  formData: CursoFormData;
  setFormData: React.Dispatch<React.SetStateAction<CursoFormData>>;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveImage: () => void;
}> = ({ formData, setFormData, isUploading, fileInputRef, handleImageUpload, handleRemoveImage }) => (
  <div className="grid gap-4">
    <div className="grid gap-2">
      <Label htmlFor="nome-mobile">Nome *</Label>
      <Input
        id="nome-mobile"
        value={formData.nome}
        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
        placeholder="Nome do curso ou evento"
      />
    </div>

    <div className="grid gap-2">
      <Label htmlFor="responsavel-mobile">Responsável *</Label>
      <Input
        id="responsavel-mobile"
        value={formData.responsavel}
        onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
        placeholder="Quem estará à frente"
      />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="grid gap-2">
        <Label htmlFor="data_inicio-mobile">Data Início *</Label>
        <Input
          id="data_inicio-mobile"
          type="date"
          value={formData.data_inicio}
          onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="data_fim-mobile">Data Fim</Label>
        <Input
          id="data_fim-mobile"
          type="date"
          value={formData.data_fim}
          onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="grid gap-2">
        <Label htmlFor="horario_inicio-mobile">Horário Início *</Label>
        <Input
          id="horario_inicio-mobile"
          type="time"
          value={formData.horario_inicio}
          onChange={(e) => setFormData({ ...formData, horario_inicio: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="horario_fim-mobile">Horário Fim</Label>
        <Input
          id="horario_fim-mobile"
          type="time"
          value={formData.horario_fim}
          onChange={(e) => setFormData({ ...formData, horario_fim: e.target.value })}
        />
      </div>
    </div>

    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Switch
          id="gratuito-mobile"
          checked={formData.gratuito}
          onCheckedChange={(checked) => setFormData({ ...formData, gratuito: checked })}
        />
        <Label htmlFor="gratuito-mobile">Gratuito</Label>
      </div>

      {!formData.gratuito && (
        <div className="flex-1 grid gap-2">
          <Label htmlFor="valor-mobile">Valor (R$)</Label>
          <Input
            id="valor-mobile"
            type="number"
            step="0.01"
            min="0"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            placeholder="0.00"
          />
        </div>
      )}
    </div>

    <div className="grid gap-2">
      <Label htmlFor="vagas-mobile">Vagas</Label>
      <Input
        id="vagas-mobile"
        type="number"
        min="1"
        value={formData.vagas}
        onChange={(e) => setFormData({ ...formData, vagas: e.target.value })}
        placeholder="Deixe vazio para ilimitado"
      />
    </div>

    <div className="grid gap-2">
      <Label htmlFor="local-mobile">Local</Label>
      <Input
        id="local-mobile"
        value={formData.local}
        onChange={(e) => setFormData({ ...formData, local: e.target.value })}
        placeholder="Endereço ou local"
      />
    </div>

    <div className="grid gap-2">
      <Label htmlFor="descricao-mobile">Descrição</Label>
      <Textarea
        id="descricao-mobile"
        value={formData.descricao}
        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
        placeholder="Descrição do curso ou evento"
        rows={2}
      />
    </div>

    <div className="grid gap-2">
      <Label>Banner</Label>
      {formData.banner_url ? (
        <div className="relative">
          <img
            src={formData.banner_url}
            alt="Banner preview"
            className="w-full h-32 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={handleRemoveImage}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground">Enviando...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Image className="w-8 h-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Toque para enviar</span>
            </div>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>

    <div className="flex items-center gap-2">
      <Switch
        id="ativo-mobile"
        checked={formData.ativo}
        onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
      />
      <Label htmlFor="ativo-mobile">Ativo (visível para usuários)</Label>
    </div>
  </div>
);

export default CursosTab;
