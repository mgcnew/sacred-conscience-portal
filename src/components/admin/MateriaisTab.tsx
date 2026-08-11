import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Upload,
  Loader2,
  Search,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  useMateriaisAdmin,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
  CATEGORIAS_MATERIAIS,
} from '@/hooks/queries/useMateriais';
import type { Material } from '@/types';

interface FormData {
  titulo: string;
  resumo: string;
  conteudo: string;
  categoria: string;
  imagem_url: string;
  publicado: boolean;
  destaque: boolean;
}

const initialFormData: FormData = {
  titulo: '',
  resumo: '',
  conteudo: '',
  categoria: 'geral',
  imagem_url: '',
  publicado: false,
  destaque: false,
};

export function MateriaisTab() {
  const { user } = useAuth();
  const { data: materiais, isLoading } = useMateriaisAdmin();
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredMateriais = materiais?.filter(
    (m) =>
      m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingMaterial(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      titulo: material.titulo,
      resumo: material.resumo,
      conteudo: material.conteudo,
      categoria: material.categoria,
      imagem_url: material.imagem_url || '',
      publicado: material.publicado,
      destaque: material.destaque,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (material: Material) => {
    setMaterialToDelete(material);
    setIsDeleteDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande', { description: 'Máximo 5MB' });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('materiais')
        .upload(`capas/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('materiais')
        .getPublicUrl(`capas/${fileName}`);

      setFormData((prev) => ({ ...prev, imagem_url: publicUrl }));
      toast.success('Imagem enviada!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim() || !formData.resumo.trim() || !formData.conteudo.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingMaterial) {
        await updateMaterial.mutateAsync({
          id: editingMaterial.id,
          ...formData,
        });
        toast.success('Material atualizado!');
      } else {
        await createMaterial.mutateAsync({
          ...formData,
          autor_id: user?.id || null,
        });
        toast.success('Material criado!');
      }
      setIsDialogOpen(false);
      setFormData(initialFormData);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar material');
    }
  };

  const handleDelete = async () => {
    if (!materialToDelete) return;

    try {
      await deleteMaterial.mutateAsync(materialToDelete.id);
      toast.success('Material excluído!');
      setIsDeleteDialogOpen(false);
      setMaterialToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir material');
    }
  };

  const togglePublicado = async (material: Material) => {
    try {
      await updateMaterial.mutateAsync({
        id: material.id,
        publicado: !material.publicado,
      });
      toast.success(material.publicado ? 'Material despublicado' : 'Material publicado!');
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const toggleDestaque = async (material: Material) => {
    try {
      await updateMaterial.mutateAsync({
        id: material.id,
        destaque: !material.destaque,
      });
      toast.success(material.destaque ? 'Destaque removido' : 'Marcado como destaque!');
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const isPending = createMaterial.isPending || updateMaterial.isPending;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <SearchInput
          placeholder="Buscar materiais..."
          value={searchTerm}
          onChange={setSearchTerm}
          containerClassName="flex-1 max-w-sm"
        />
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Material
        </Button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMateriais?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhum material encontrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredMateriais?.map((material) => (
            <Card key={material.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  {material.imagem_url ? (
                    <img
                      src={material.imagem_url}
                      alt={material.titulo}
                      className="w-24 h-24 sm:w-32 sm:h-32 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-muted flex items-center justify-center shrink-0">
                      <BookOpen className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 py-3 pr-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium truncate">{material.titulo}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {material.resumo}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleDestaque(material)}
                          title={material.destaque ? 'Remover destaque' : 'Destacar'}
                        >
                          {material.destaque ? (
                            <Star className="w-4 h-4 text-warning fill-yellow-500" />
                          ) : (
                            <StarOff className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => togglePublicado(material)}
                          title={material.publicado ? 'Despublicar' : 'Publicar'}
                        >
                          {material.publicado ? (
                            <Eye className="w-4 h-4 text-success" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEdit(material)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleOpenDelete(material)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORIAS_MATERIAIS.find((c) => c.value === material.categoria)?.label ||
                          material.categoria}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(material.created_at), 'dd/MM/yy', { locale: ptBR })}
                      </span>
                      {!material.publicado && (
                        <Badge variant="secondary" className="text-xs">
                          Rascunho
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de criação/edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Editar Material' : 'Novo Material'}
            </DialogTitle>
            <DialogDescription>
              {editingMaterial
                ? 'Atualize as informações do material'
                : 'Crie um novo material de estudo'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex: Integração após a consagração"
              />
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, categoria: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_MATERIAIS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Resumo */}
            <div className="space-y-2">
              <Label htmlFor="resumo">Resumo *</Label>
              <Textarea
                id="resumo"
                value={formData.resumo}
                onChange={(e) => setFormData((prev) => ({ ...prev, resumo: e.target.value }))}
                placeholder="Breve descrição que aparecerá no card..."
                className="min-h-[80px]"
              />
            </div>

            {/* Conteúdo */}
            <div className="space-y-2">
              <Label htmlFor="conteudo">Conteúdo *</Label>
              <Textarea
                id="conteudo"
                value={formData.conteudo}
                onChange={(e) => setFormData((prev) => ({ ...prev, conteudo: e.target.value }))}
                placeholder="Texto completo do material. Use **texto** para negrito e *texto* para itálico."
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Dica: Use **texto** para negrito, *texto* para itálico. URLs serão convertidas em links automaticamente.
              </p>
            </div>

            {/* Imagem */}
            <div className="space-y-2">
              <Label>Imagem de Capa</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.imagem_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, imagem_url: e.target.value }))}
                  placeholder="URL da imagem ou faça upload"
                  className="flex-1"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {formData.imagem_url && (
                <img
                  src={formData.imagem_url}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg mt-2"
                />
              )}
            </div>

            {/* Switches */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="publicado"
                  checked={formData.publicado}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, publicado: checked }))
                  }
                />
                <Label htmlFor="publicado">Publicado</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="destaque"
                  checked={formData.destaque}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, destaque: checked }))
                  }
                />
                <Label htmlFor="destaque">Destaque</Label>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {editingMaterial ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir material?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{materialToDelete?.titulo}"? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMaterial.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default MateriaisTab;
