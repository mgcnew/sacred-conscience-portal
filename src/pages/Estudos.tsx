import { useState, useMemo, useRef } from 'react';
import { BookOpen, Sparkles, Plus, Loader2, Upload } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';
import { toast } from 'sonner';
import { VirtuosoGrid } from 'react-virtuoso';
import { PageContainer } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AdminFab } from '@/components/ui/admin-fab';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMinhasPermissoes } from '@/hooks/queries/usePermissoes';
import {
  useMateriais,
  useMateriaisAdmin,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
  CATEGORIAS_MATERIAIS,
} from '@/hooks/queries/useMateriais';
import { MaterialCard, MaterialModal, MaterialSkeleton } from '@/components/estudos';
import type { MaterialComAutor, Material } from '@/types';
import FadeIn from '@/components/ui/FadeIn';

// Threshold para ativar virtualização (evita overhead em listas pequenas)
const VIRTUALIZATION_THRESHOLD = 12;

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

const Estudos: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { data: minhasPermissoes } = useMinhasPermissoes();
  const isMobile = useIsMobile();
  
  const [selectedCategoria, setSelectedCategoria] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialComAutor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar permissão
  const podeGerenciar = isAdmin || minhasPermissoes?.some(p => p.permissao?.nome === 'gerenciar_materiais');

  // Buscar materiais - admin vê todos, usuário vê apenas publicados
  const materiaisQuery = useMateriais(selectedCategoria);
  const materiaisAdminQuery = useMateriaisAdmin();
  
  // Usar dados de admin se tiver permissão (para ver rascunhos)
  const { data: materiais, isLoading } = podeGerenciar 
    ? materiaisAdminQuery 
    : materiaisQuery;

  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();

  // Filtrar por busca e categoria
  const materiaisFiltrados = useMemo(() => {
    if (!materiais) return [];
    
    let filtered = materiais;
    
    // Se não tem permissão, mostrar apenas publicados
    if (!podeGerenciar) {
      filtered = filtered.filter(m => m.publicado);
    }
    
    // Filtrar por categoria
    if (selectedCategoria !== 'todas') {
      filtered = filtered.filter(m => m.categoria === selectedCategoria);
    }
    
    // Filtrar por busca
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.titulo.toLowerCase().includes(termo) ||
          m.resumo.toLowerCase().includes(termo) ||
          m.categoria.toLowerCase().includes(termo)
      );
    }
    
    return filtered;
  }, [materiais, searchTerm, selectedCategoria, podeGerenciar]);

  // Separar destaques (apenas publicados com destaque) dos outros
  const destaques = materiaisFiltrados.filter((m) => m.destaque && m.publicado);
  const outros = materiaisFiltrados.filter((m) => !(m.destaque && m.publicado));

  const handleOpenMaterial = (material: MaterialComAutor) => {
    setSelectedMaterial(material);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMaterial(null);
  };

  const handleOpenCreate = () => {
    setEditingMaterial(null);
    setFormData(initialFormData);
    setIsFormDialogOpen(true);
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
    setIsFormDialogOpen(true);
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

  // Função para formatar texto colado
  const formatPastedText = (text: string): string => {
    return text
      // Remove espaços no início e fim de cada linha
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      // Converte múltiplas quebras de linha em no máximo duas (um parágrafo)
      .replace(/\n{3,}/g, '\n\n')
      // Remove espaços múltiplos
      .replace(/[ \t]+/g, ' ')
      // Remove espaços antes de pontuação
      .replace(/ ([.,;:!?])/g, '$1')
      // Trim final
      .trim();
  };

  // Handler para paste no textarea de conteúdo
  const handleContentPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const formattedText = formatPastedText(pastedText);
    
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = formData.conteudo;
    
    // Insere o texto formatado na posição do cursor
    const newValue = currentValue.substring(0, start) + formattedText + currentValue.substring(end);
    setFormData(prev => ({ ...prev, conteudo: newValue }));
    
    // Reposiciona o cursor após o texto colado
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + formattedText.length;
      textarea.focus();
    }, 0);
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
      setIsFormDialogOpen(false);
      setFormData(initialFormData);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar material');
    }
  };

  const handleDelete = async (material: Material) => {
    if (!confirm(`Excluir "${material.titulo}"?`)) return;
    
    try {
      await deleteMaterial.mutateAsync(material.id);
      toast.success('Material excluído!');
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const isPending = createMaterial.isPending || updateMaterial.isPending;

  const totalMateriais = materiais?.filter(m => m.publicado || podeGerenciar).length ?? 0;

  return (
    <PageContainer maxWidth="xl">

      {/* Hero header */}
      <FadeIn>
        <div className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br from-sky-500/12 via-primary/6 to-transparent border border-primary/15 px-5 py-6">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground leading-tight">Estudos</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Conhecimento para aprofundar sua jornada e integrar cada vivência
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {!isLoading && totalMateriais > 0 && (
                <div className="text-right hidden sm:block">
                  <p className="text-2xl font-black text-primary leading-none">{totalMateriais}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">materiais</p>
                </div>
              )}
              {podeGerenciar && (
                <Button
                  onClick={handleOpenCreate}
                  size="sm"
                  className="hidden lg:inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Novo Material
                </Button>
              )}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* FAB mobile para criar material */}
      {podeGerenciar && (
        <AdminFab
          className="lg:hidden"
          actions={[{ icon: Plus, label: 'Novo Material', onClick: handleOpenCreate }]}
        />
      )}

      {/* Busca + Pills de categoria */}
      <FadeIn delay={80}>
        <div className="mb-6 space-y-3">
          <SearchInput
            placeholder="Buscar materiais..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            <button
              onClick={() => setSelectedCategoria('todas')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all shrink-0',
                selectedCategoria === 'todas'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-muted/60 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
              )}
            >
              ✨ Todos
            </button>
            {CATEGORIAS_MATERIAIS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategoria(cat.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all shrink-0',
                  selectedCategoria === cat.value
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted/60 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                )}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Loading com skeletons otimizados */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <MaterialSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Conteúdo */}
      {!isLoading && (
        <>
          {/* Destaques */}
          {destaques.length > 0 && (
            <FadeIn delay={120}>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold">Destaques</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {destaques.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    onClick={() => handleOpenMaterial(material)}
                    onEdit={podeGerenciar ? () => handleOpenEdit(material) : undefined}
                    onDelete={podeGerenciar ? () => handleDelete(material) : undefined}
                    featured
                  />
                ))}
              </div>
            </div>
            </FadeIn>
          )}

          {/* Outros materiais - com virtualização para listas grandes */}
          {outros.length > 0 && (
            <div>
              {destaques.length > 0 && (
                <h2 className="text-lg font-semibold mb-4">Todos os Materiais</h2>
              )}
              {outros.length > VIRTUALIZATION_THRESHOLD ? (
                // Lista virtualizada para muitos itens
                <VirtuosoGrid
                  useWindowScroll
                  totalCount={outros.length}
                  overscan={200}
                  listClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  itemContent={(index) => {
                    const material = outros[index];
                    return (
                      <MaterialCard
                        key={material.id}
                        material={material}
                        onClick={() => handleOpenMaterial(material)}
                        onEdit={podeGerenciar ? () => handleOpenEdit(material) : undefined}
                        onDelete={podeGerenciar ? () => handleDelete(material) : undefined}
                      />
                    );
                  }}
                />
              ) : (
                // Grid normal para poucos itens
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {outros.map((material) => (
                    <MaterialCard
                      key={material.id}
                      material={material}
                      onClick={() => handleOpenMaterial(material)}
                      onEdit={podeGerenciar ? () => handleOpenEdit(material) : undefined}
                      onDelete={podeGerenciar ? () => handleDelete(material) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Estado vazio */}
          {materiaisFiltrados.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                Nenhum material encontrado
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm
                  ? 'Tente buscar por outros termos'
                  : 'Novos conteúdos serão adicionados em breve'}
              </p>
              {(searchTerm || selectedCategoria !== 'todas') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategoria('todas');
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal de leitura */}
      <MaterialModal
        material={selectedMaterial}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Modal de criação/edição - Drawer no mobile, Dialog no desktop */}
      {isMobile ? (
        <Drawer open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DrawerContent className="max-h-[95vh] flex flex-col">
            <DrawerHeader className="shrink-0">
              <DrawerTitle>
                {editingMaterial ? 'Editar Material' : 'Novo Material'}
              </DrawerTitle>
              <DrawerDescription>
                {editingMaterial
                  ? 'Atualize as informações do material'
                  : 'Crie um novo material de estudo'}
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-none">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo-mobile">Título *</Label>
                  <Input
                    id="titulo-mobile"
                    value={formData.titulo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ex: Integração após a consagração"
                  />
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="resumo-mobile">Resumo *</Label>
                  <Textarea
                    id="resumo-mobile"
                    value={formData.resumo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, resumo: e.target.value }))}
                    placeholder="Breve descrição que aparecerá no card..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conteudo-mobile">Conteúdo *</Label>
                  <Textarea
                    id="conteudo-mobile"
                    value={formData.conteudo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, conteudo: e.target.value }))}
                    onPaste={handleContentPaste}
                    placeholder="Texto completo do material..."
                    className="min-h-[150px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use **texto** para negrito, *texto* para itálico.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Imagem de Capa</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.imagem_url}
                      onChange={(e) => setFormData((prev) => ({ ...prev, imagem_url: e.target.value }))}
                      placeholder="URL ou faça upload"
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
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  </div>
                  {formData.imagem_url && (
                    <img src={formData.imagem_url} alt="Preview" className="w-full h-24 object-cover rounded-lg mt-2" />
                  )}
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="publicado-mobile"
                      checked={formData.publicado}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, publicado: checked }))}
                    />
                    <Label htmlFor="publicado-mobile">Publicado</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="destaque-mobile"
                      checked={formData.destaque}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, destaque: checked }))}
                    />
                    <Label htmlFor="destaque-mobile">Destaque</Label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 pb-2">
                  <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending} className="flex-1">
                    {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {editingMaterial ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
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
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Integração após a consagração"
                />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="conteudo">Conteúdo *</Label>
                <Textarea
                  id="conteudo"
                  value={formData.conteudo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, conteudo: e.target.value }))}
                  onPaste={handleContentPaste}
                  placeholder="Texto completo do material..."
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use **texto** para negrito, *texto* para itálico. URLs viram links. Texto colado é formatado automaticamente.
                </p>
              </div>

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
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                </div>
                {formData.imagem_url && (
                  <img src={formData.imagem_url} alt="Preview" className="w-full h-32 object-cover rounded-lg mt-2" />
                )}
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="publicado"
                    checked={formData.publicado}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, publicado: checked }))}
                  />
                  <Label htmlFor="publicado">Publicado</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="destaque"
                    checked={formData.destaque}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, destaque: checked }))}
                  />
                  <Label htmlFor="destaque">Destaque</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editingMaterial ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </PageContainer>
  );
};

export default Estudos;
