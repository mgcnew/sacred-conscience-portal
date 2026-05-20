import { useEffect, useState, useRef, memo } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/constants/messages';
import { Upload, Link, X, Loader2, Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Cerimonia } from '@/types';

interface TipoConsagracao { id: string; nome: string; }
type DialogMode = 'create' | 'edit';

interface CeremonyFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: DialogMode;
  ceremony?: Cerimonia | null;
}

interface CeremonyFormData {
  nome: string;
  data: string;
  horario: string;
  local: string;
  descricao: string;
  medicina_principal: string;
  vagas: number;
  valor: number;
  observacoes: string;
  banner_url: string;
}

const formatCentavosToReal = (centavos: number): string => {
  if (!centavos) return '';
  return (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseRealToCentavos = (valor: string): number => {
  const cleaned = valor.replace(/[^\d,]/g, '');
  const numero = parseFloat(cleaned.replace(',', '.')) || 0;
  return Math.round(numero * 100);
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 pt-2">
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{children}</span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-xs text-destructive mt-0.5">{message}</p> : null;

const CeremonyFormDialog: React.FC<CeremonyFormDialogProps> = ({ isOpen, onClose, mode, ceremony }) => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CeremonyFormData>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageTab, setImageTab] = useState<'url' | 'upload'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddTipo, setShowAddTipo] = useState(false);
  const [novoTipo, setNovoTipo] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<string>('');
  const [customNome, setCustomNome] = useState('');
  const [valorDisplay, setValorDisplay] = useState('');

  const isEditMode = mode === 'edit';

  const { data: tiposConsagracao, refetch: refetchTipos } = useQuery({
    queryKey: ['tipos-consagracao'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tipos_consagracao').select('id, nome').eq('ativo', true).order('nome');
      if (error) throw error;
      return data as TipoConsagracao[];
    },
  });

  const addTipoMutation = useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase.from('tipos_consagracao').insert({ nome }).select('id, nome').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Tipo adicionado!');
      refetchTipos();
      setSelectedTipo(data.nome);
      setValue('nome', data.nome);
      setNovoTipo('');
      setShowAddTipo(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar tipo', {
        description: error.message.includes('duplicate') ? 'Este tipo já existe.' : 'Tente novamente.',
      });
    },
  });

  useEffect(() => {
    if (ceremony && isOpen && isEditMode) {
      const nomeValue = ceremony.nome || '';
      setValue('nome', nomeValue);
      const tipoExiste = tiposConsagracao?.some(t => t.nome === nomeValue);
      if (tipoExiste) { setSelectedTipo(nomeValue); setCustomNome(''); }
      else if (nomeValue) { setSelectedTipo('__custom__'); setCustomNome(nomeValue); }
      else { setSelectedTipo(''); setCustomNome(''); }
      setValue('data', ceremony.data);
      setValue('horario', ceremony.horario);
      setValue('local', ceremony.local);
      setValue('descricao', ceremony.descricao || '');
      setValue('medicina_principal', ceremony.medicina_principal || '');
      setValue('vagas', ceremony.vagas || 0);
      setValue('observacoes', ceremony.observacoes || '');
      setValue('banner_url', ceremony.banner_url || '');
      const valorCentavos = ceremony.valor || 0;
      setValue('valor', valorCentavos);
      setValorDisplay(formatCentavosToReal(valorCentavos));
      if (ceremony.banner_url) setPreviewUrl(ceremony.banner_url);
    }
  }, [ceremony, isOpen, isEditMode, setValue, tiposConsagracao]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null); setPreviewUrl(null); setImageTab('url');
      setShowAddTipo(false); setNovoTipo(''); setSelectedTipo('');
      setCustomNome(''); setValorDisplay('');
    }
  }, [isOpen]);

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d,]/g, '');
    const parts = value.split(',');
    if (parts.length > 2) value = parts[0] + ',' + parts.slice(1).join('');
    if (parts.length === 2 && parts[1].length > 2) value = parts[0] + ',' + parts[1].slice(0, 2);
    setValorDisplay(value);
    setValue('valor', parseRealToCentavos(value));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('cerimonias').upload(`banners/${fileName}`, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('cerimonias').getPublicUrl(`banners/${fileName}`);
    return publicUrl;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error('Arquivo muito grande', { description: 'Máximo 5MB.' }); return; }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) { toast.error('Tipo de arquivo inválido'); return; }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setValue('banner_url', '');
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null); setPreviewUrl(null); setValue('banner_url', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const createMutation = useMutation({
    mutationFn: async (data: CeremonyFormData) => {
      const { error } = await supabase.from('cerimonias').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(TOAST_MESSAGES.cerimonia.criada.title); invalidateAndClose(); },
    onError: () => { toast.error(TOAST_MESSAGES.cerimonia.erro.title); }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CeremonyFormData) => {
      if (!ceremony) throw new Error('Cerimônia não encontrada');
      const { error } = await supabase.from('cerimonias').update(data).eq('id', ceremony.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(TOAST_MESSAGES.cerimonia.atualizada.title); invalidateAndClose(); },
    onError: () => { toast.error(TOAST_MESSAGES.cerimonia.erro.title); }
  });

  const invalidateAndClose = () => {
    queryClient.invalidateQueries({ queryKey: ['cerimonias'] });
    queryClient.invalidateQueries({ queryKey: ['admin-cerimonias'] });
    reset(); onClose();
  };

  const onSubmit = async (data: CeremonyFormData) => {
    try {
      if (selectedFile) {
        setIsUploading(true);
        data.banner_url = await uploadImage(selectedFile);
        setIsUploading(false);
      }
      if (isEditMode) updateMutation.mutate(data);
      else createMutation.mutate(data);
    } catch {
      setIsUploading(false);
      toast.error('Erro ao enviar imagem');
    }
  };

  const handleClose = () => {
    reset(); setSelectedFile(null); setPreviewUrl(null); setImageTab('url');
    setShowAddTipo(false); setNovoTipo(''); setSelectedTipo('');
    setCustomNome(''); setValorDisplay(''); onClose();
  };

  const handleTipoChange = (value: string) => {
    if (value === '__custom__') { setSelectedTipo('__custom__'); setValue('nome', customNome); }
    else { setSelectedTipo(value); setCustomNome(''); setValue('nome', value); }
  };

  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending || isUploading;
  const config = {
    create: { title: 'Nova Cerimônia', submitText: 'Criar Cerimônia', pendingText: 'Criando...' },
    edit: { title: 'Editar Cerimônia', submitText: 'Salvar Alterações', pendingText: 'Salvando...' }
  }[mode];

  if (!isOpen) return null;

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

      {/* — Identificação — */}
      <SectionLabel>Identificação</SectionLabel>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Consagração *</Label>
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowAddTipo(!showAddTipo)}>
            <Plus className="w-3 h-3 mr-1" />Novo tipo
          </Button>
        </div>
        {showAddTipo && (
          <div className="flex gap-2 p-2 bg-muted/50 rounded-lg">
            <Input placeholder="Novo tipo..." value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)} className="flex-1 h-8 text-sm" />
            <Button type="button" size="sm" onClick={() => novoTipo.trim() && addTipoMutation.mutate(novoTipo.trim())} disabled={addTipoMutation.isPending}>
              {addTipoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
            </Button>
          </div>
        )}
        <Select value={selectedTipo} onValueChange={handleTipoChange}>
          <SelectTrigger className={errors.nome ? 'border-destructive' : ''}>
            <SelectValue placeholder="Selecione o tipo de consagração" />
          </SelectTrigger>
          <SelectContent>
            {tiposConsagracao?.map((t) => <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>)}
            <SelectItem value="__custom__">✏️ Outro (personalizado)</SelectItem>
          </SelectContent>
        </Select>
        {selectedTipo === '__custom__' && (
          <Input placeholder="Nome da consagração..." value={customNome} onChange={(e) => { setCustomNome(e.target.value); setValue('nome', e.target.value); }} />
        )}
        <input type="hidden" {...register('nome', { required: 'Selecione o tipo de consagração' })} />
        <FieldError message={errors.nome?.message} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Medicina *</Label>
        <Input
          placeholder="Ex: Ayahuasca, Hapi, Kambo..."
          {...register('medicina_principal', { required: 'Informe a medicina principal' })}
          className={errors.medicina_principal ? 'border-destructive' : ''}
        />
        <FieldError message={errors.medicina_principal?.message} />
      </div>

      {/* — Quando e Onde — */}
      <SectionLabel>Quando e Onde</SectionLabel>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Data *</Label>
          <Input
            type="date"
            {...register('data', { required: 'Informe a data' })}
            className={errors.data ? 'border-destructive' : ''}
          />
          <FieldError message={errors.data?.message} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Horário *</Label>
          <Input
            type="time"
            {...register('horario', { required: 'Informe o horário' })}
            className={errors.horario ? 'border-destructive' : ''}
          />
          <FieldError message={errors.horario?.message} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Local *</Label>
        <Input
          placeholder="Ex: Templo Principal, Sítio..."
          {...register('local', { required: 'Informe o local' })}
          className={errors.local ? 'border-destructive' : ''}
        />
        <FieldError message={errors.local?.message} />
      </div>

      {/* — Logística — */}
      <SectionLabel>Logística</SectionLabel>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Vagas *</Label>
          <Input
            type="number"
            placeholder="20"
            {...register('vagas', { required: 'Informe as vagas', min: { value: 1, message: 'Mínimo 1 vaga' } })}
            className={errors.vagas ? 'border-destructive' : ''}
          />
          <FieldError message={errors.vagas?.message} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Valor (R$)</Label>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={valorDisplay}
            onChange={handleValorChange}
          />
          <input type="hidden" {...register('valor')} />
        </div>
      </div>

      {/* — Banner — */}
      <SectionLabel>Banner</SectionLabel>

      <div className="space-y-2">
        <Tabs value={imageTab} onValueChange={(v) => setImageTab(v as 'url' | 'upload')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="url" className="text-xs gap-1.5"><Link className="w-3 h-3" />URL</TabsTrigger>
            <TabsTrigger value="upload" className="text-xs gap-1.5"><Upload className="w-3 h-3" />Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="url" className="mt-2">
            <Input
              placeholder="https://..."
              {...register('banner_url')}
              onChange={(e) => { setValue('banner_url', e.target.value); setPreviewUrl(e.target.value || null); setSelectedFile(null); }}
            />
          </TabsContent>
          <TabsContent value="upload" className="mt-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            <Button type="button" variant="outline" className="w-full gap-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4" />
              {selectedFile ? selectedFile.name : 'Selecionar imagem'}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — máx. 5MB</p>
          </TabsContent>
        </Tabs>
        {previewUrl && (
          <div className="relative rounded-lg overflow-hidden border">
            <img src={previewUrl} alt="Preview do banner" className="w-full h-36 object-cover" onError={() => setPreviewUrl(null)} />
            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleRemoveImage}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* — Conteúdo — */}
      <SectionLabel>Conteúdo</SectionLabel>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Descrição</Label>
        <Textarea
          placeholder="Detalhes sobre a cerimônia, preparação, intenção..."
          {...register('descricao')}
          className="min-h-[72px] resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Observações internas</Label>
        <Textarea
          placeholder="Notas para a equipe (não visível aos participantes)..."
          {...register('observacoes')}
          className="min-h-[60px] resize-none"
        />
      </div>

      {/* Botões */}
      <div className="flex gap-2 pt-2 pb-1">
        <Button type="button" variant="outline" onClick={handleClose} className="flex-1">Cancelar</Button>
        <Button type="submit" disabled={isPending} className="flex-1">
          {isUploading
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando imagem...</>
            : isPending ? config.pendingText : config.submitText}
        </Button>
      </div>
    </form>
  );

  // Mobile: Drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent className="max-h-[92vh] flex flex-col">
          <DrawerHeader className="shrink-0 pb-2">
            <DrawerTitle className="font-display text-lg text-primary">{config.title}</DrawerTitle>
            <DrawerDescription className="sr-only">Formulário de cerimônia</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-6">{formContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">{config.title}</DialogTitle>
          <DialogDescription className="sr-only">Formulário de cerimônia</DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default memo(CeremonyFormDialog);
