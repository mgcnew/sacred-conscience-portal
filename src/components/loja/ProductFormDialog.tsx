import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Upload, X, Loader2, BookOpen, Package, Smartphone } from 'lucide-react';
import type { Produto, CategoriaProduto } from '@/types';

type DialogMode = 'create' | 'edit';

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: DialogMode;
  product?: Produto | null;
  categorias: CategoriaProduto[];
}

type TipoProduto = 'produto' | 'livro' | 'ebook';

interface ProductFormData {
  nome: string;
  descricao: string;
  preco: number;
  preco_promocional: number | null;
  categoria: string;
  estoque: number;
  ativo: boolean;
  destaque: boolean;
  imagem_url: string;
  is_ebook: boolean;
  arquivo_url: string | null;
  paginas: number | null;
  tipo_produto: TipoProduto;
}

const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  isOpen,
  onClose,
  mode,
  product,
  categorias,
}) => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { register, handleSubmit, reset, setValue, watch } = useForm<ProductFormData>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [precoDisplay, setPrecoDisplay] = useState('');
  const [precoPromoDisplay, setPrecoPromoDisplay] = useState('');
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const [isUploadingEbook, setIsUploadingEbook] = useState(false);
  const ebookInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = mode === 'edit';
  const ativo = watch('ativo');
  const destaque = watch('destaque');
  const tipoProduto = watch('tipo_produto');
  const isEbook = tipoProduto === 'ebook';
  const isLivro = tipoProduto === 'livro';
  const isLivroOuEbook = isEbook || isLivro;

  // Preencher formulário no modo edição
  useEffect(() => {
    if (product && isOpen && isEditMode) {
      setValue('nome', product.nome);
      setValue('descricao', product.descricao || '');
      setValue('preco', product.preco);
      setValue('preco_promocional', product.preco_promocional);
      setValue('categoria', product.categoria || '');
      setValue('estoque', product.estoque);
      setValue('ativo', product.ativo);
      setValue('destaque', product.destaque);
      setValue('imagem_url', product.imagem_url || '');
      setValue('is_ebook', product.is_ebook || false);
      setValue('arquivo_url', product.arquivo_url || null);
      setValue('paginas', product.paginas || null);
      // Determinar tipo baseado nos dados existentes
      if (product.is_ebook) {
        setValue('tipo_produto', 'ebook');
      } else if (product.categoria === 'Livros' || product.paginas) {
        setValue('tipo_produto', 'livro');
      } else {
        setValue('tipo_produto', 'produto');
      }
      setPrecoDisplay(formatCentavosToReal(product.preco));
      setPrecoPromoDisplay(product.preco_promocional ? formatCentavosToReal(product.preco_promocional) : '');
      if (product.imagem_url) {
        setPreviewUrl(product.imagem_url);
      }
    } else if (isOpen && !isEditMode) {
      setValue('ativo', true);
      setValue('destaque', false);
      setValue('estoque', 0);
      setValue('is_ebook', false);
      setValue('arquivo_url', null);
      setValue('paginas', null);
      setValue('tipo_produto', 'produto');
    }
  }, [product, isOpen, isEditMode, setValue]);

  // Limpar ao fechar
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      setPrecoDisplay('');
      setPrecoPromoDisplay('');
      setEbookFile(null);
    }
  }, [isOpen, reset]);

  // Formatação de valores
  const formatCentavosToReal = (centavos: number): string => {
    if (!centavos) return '';
    return (centavos / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseRealToCentavos = (valor: string): number => {
    const cleaned = valor.replace(/[^\d,]/g, '');
    const numero = parseFloat(cleaned.replace(',', '.')) || 0;
    return Math.round(numero * 100);
  };

  const handlePrecoChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'preco' | 'preco_promocional') => {
    let value = e.target.value.replace(/[^\d,]/g, '');
    const parts = value.split(',');
    if (parts.length > 2) value = parts[0] + ',' + parts.slice(1).join('');
    if (parts.length === 2 && parts[1].length > 2) value = parts[0] + ',' + parts[1].slice(0, 2);

    if (field === 'preco') {
      setPrecoDisplay(value);
      setValue('preco', parseRealToCentavos(value));
    } else {
      setPrecoPromoDisplay(value);
      setValue('preco_promocional', value ? parseRealToCentavos(value) : null);
    }
  };

  // Upload de imagem
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `produtos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('produtos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('produtos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande', { description: 'Máximo 5MB.' });
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Tipo inválido', { description: 'Apenas JPG, PNG ou WebP.' });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setValue('imagem_url', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload de arquivo ebook
  const uploadEbookFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `ebooks-loja/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('ebooks')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Guarda o caminho, não uma URL: o bucket é privado e qualquer link só
    // vale assinado, gerado na hora da leitura pela função ler-ebook.
    return filePath;
  };

  const handleEbookFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Arquivo muito grande', { description: 'Máximo 50MB.' });
        return;
      }
      const validTypes = ['application/pdf', 'application/epub+zip'];
      if (!validTypes.includes(file.type)) {
        toast.error('Tipo inválido', { description: 'Apenas PDF ou EPUB.' });
        return;
      }
      setEbookFile(file);
    }
  };

  const handleRemoveEbookFile = () => {
    setEbookFile(null);
    setValue('arquivo_url', null);
    if (ebookInputRef.current) ebookInputRef.current.value = '';
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const { error } = await supabase.from('produtos').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Produto criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      handleClose();
    },
    onError: () => {
      toast.error('Erro ao criar produto');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (!product) throw new Error('Produto não encontrado');
      const { error } = await supabase.from('produtos').update(data).eq('id', product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Produto atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      handleClose();
    },
    onError: () => {
      toast.error('Erro ao atualizar produto');
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (selectedFile) {
        setIsUploading(true);
        data.imagem_url = await uploadImage(selectedFile);
        setIsUploading(false);
      }

      if (ebookFile && data.is_ebook) {
        setIsUploadingEbook(true);
        data.arquivo_url = await uploadEbookFile(ebookFile);
        setIsUploadingEbook(false);
      }

      // Se for ebook, estoque é infinito (não se aplica)
      if (data.is_ebook) {
        data.estoque = 999999;
      }

      if (isEditMode) {
        updateMutation.mutate(data);
      } else {
        createMutation.mutate(data);
      }
    } catch {
      setIsUploading(false);
      setIsUploadingEbook(false);
      toast.error('Erro ao enviar arquivo');
    }
  };

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    setPreviewUrl(null);
    setPrecoDisplay('');
    setPrecoPromoDisplay('');
    setEbookFile(null);
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isUploading || isUploadingEbook;

  const formContent = (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Produto *</Label>
            <Input
              id="nome"
              placeholder="Ex: Colar de Sementes"
              {...register('nome', { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o produto..."
              {...register('descricao')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco">Preço (R$) *</Label>
              <Input
                id="preco"
                type="text"
                inputMode="decimal"
                placeholder="50,00"
                value={precoDisplay}
                onChange={(e) => handlePrecoChange(e, 'preco')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preco_promo">Preço Promocional</Label>
              <Input
                id="preco_promo"
                type="text"
                inputMode="decimal"
                placeholder="40,00"
                value={precoPromoDisplay}
                onChange={(e) => handlePrecoChange(e, 'preco_promocional')}
              />
            </div>
          </div>

          <div className={`grid gap-4 ${isEbook ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {/* Categoria - esconder se for livro/ebook (já é definido automaticamente) */}
            {!isLivroOuEbook && (
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={watch('categoria') || ''}
                  onValueChange={(v) => setValue('categoria', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.nome}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Estoque - apenas para produto comum e livro físico */}
            {!isEbook && (
              <div className="space-y-2">
                <Label htmlFor="estoque">Estoque</Label>
                <Input
                  id="estoque"
                  type="number"
                  min="0"
                  placeholder="0"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  {...register('estoque', { valueAsNumber: true })}
                />
              </div>
            )}
          </div>

          {/* Tipo de Produto */}
          <div className="space-y-2">
            <Label>Tipo de Produto</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setValue('tipo_produto', 'produto');
                  setValue('is_ebook', false);
                }}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                  tipoProduto === 'produto' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
              >
                <Package className="w-5 h-5" />
                <span className="text-xs font-medium">Produto</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('tipo_produto', 'livro');
                  setValue('is_ebook', false);
                  setValue('categoria', 'Livros');
                }}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                  tipoProduto === 'livro' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-xs font-medium">Livro Físico</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('tipo_produto', 'ebook');
                  setValue('is_ebook', true);
                  setValue('categoria', 'Livros');
                }}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                  tipoProduto === 'ebook' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs font-medium">Ebook</span>
              </button>
            </div>
          </div>

          {/* Campos específicos de Livro/Ebook */}
          {isLivroOuEbook && (
            <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
              <p className="text-sm font-medium text-primary">
                {isEbook ? 'Configurações do Ebook' : 'Configurações do Livro'}
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="paginas">Número de Páginas</Label>
                <Input
                  id="paginas"
                  type="number"
                  min="1"
                  placeholder="Ex: 150"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  {...register('paginas', { valueAsNumber: true })}
                />
              </div>

              {/* Arquivo apenas para Ebook */}
              {isEbook && (
                <div className="space-y-2">
                  <Label>Arquivo do Ebook (PDF/EPUB)</Label>
                  <input
                    ref={ebookInputRef}
                    type="file"
                    accept=".pdf,.epub"
                    onChange={handleEbookFileSelect}
                    className="hidden"
                  />
                  {ebookFile || watch('arquivo_url') ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {ebookFile?.name || 'Arquivo já enviado'}
                        </p>
                        {ebookFile && (
                          <p className="text-xs text-muted-foreground">
                            {(ebookFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleRemoveEbookFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => ebookInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar Arquivo
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Imagem */}
          <div className="space-y-2">
            <Label>Imagem {isEbook ? 'da Capa' : 'do Produto'}</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            {previewUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={handleRemoveImage}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-24 border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-5 h-5 mr-2" />
                Selecionar Imagem
              </Button>
            )}
          </div>

          {/* Switches */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Switch
                id="ativo"
                checked={ativo}
                onCheckedChange={(v) => setValue('ativo', v)}
              />
              <Label htmlFor="ativo" className="cursor-pointer">Ativo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="destaque"
                checked={destaque}
                onCheckedChange={(v) => setValue('destaque', v)}
              />
              <Label htmlFor="destaque" className="cursor-pointer">Destaque</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : isPending ? (
                'Salvando...'
              ) : isEditMode ? (
                'Salvar'
              ) : (
                'Criar Produto'
              )}
            </Button>
          </div>
        </form>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90vh]">
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mb-2" />
          <DrawerHeader>
            <DrawerTitle className="font-display text-xl text-primary">
              {isEditMode ? 'Editar Produto' : 'Novo Produto'}
            </DrawerTitle>
            <DrawerDescription>
              {isEditMode ? 'Atualize os dados do produto.' : 'Preencha os dados do novo produto.'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary">
            {isEditMode ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Atualize os dados do produto.' : 'Preencha os dados do novo produto.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
