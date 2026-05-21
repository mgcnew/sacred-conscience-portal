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
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/constants/messages';
import { Upload, Link, X, Loader2, Plus, Image, ChevronRight, ChevronLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';
import type { Cerimonia, MedicinaDB, TipoConsagracao } from '@/types';

type DialogMode = 'create' | 'edit';

interface CeremonyFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: DialogMode;
  ceremony?: Cerimonia | null;
}

interface CeremonyFormData {
  nome: string;
  tipo_consagracao_id: string;
  data: string;
  horario: string;
  local: string;
  descricao: string;
  vagas: number;
  valor: number;
  observacoes: string;
  itens_levar: string;
  banner_url: string;
}

type WizardStep = 1 | 2 | 3;

const STEP_LABELS = ['Essencial', 'Logística', 'Conteúdo'];
const STEP_FIELDS: Record<WizardStep, (keyof CeremonyFormData)[]> = {
  1: ['nome', 'data', 'horario', 'local'],
  2: ['vagas'],
  3: [],
};

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

// Indicador de progresso do wizard
const WizardProgress: React.FC<{ currentStep: WizardStep }> = ({ currentStep }) => (
  <div className="flex items-center justify-center gap-0 mb-5">
    {STEP_LABELS.map((label, i) => {
      const step = (i + 1) as WizardStep;
      const isActive = currentStep === step;
      const isDone = currentStep > step;
      return (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
              isDone ? 'bg-primary text-primary-foreground' :
              isActive ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
              'bg-muted text-muted-foreground'
            )}>
              {isDone ? '✓' : step}
            </div>
            <span className={cn(
              'text-[10px] font-medium whitespace-nowrap transition-colors',
              isActive ? 'text-primary' : isDone ? 'text-primary/70' : 'text-muted-foreground'
            )}>
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div className={cn(
              'h-px w-12 mx-1 mb-4 transition-colors',
              isDone ? 'bg-primary' : 'bg-border'
            )} />
          )}
        </div>
      );
    })}
  </div>
);

const CeremonyFormDialog: React.FC<CeremonyFormDialogProps> = ({ isOpen, onClose, mode, ceremony }) => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, trigger, formState: { errors } } = useForm<CeremonyFormData>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [selectedTipoId, setSelectedTipoId] = useState<string>('');
  const [showAddTipo, setShowAddTipo] = useState(false);
  const [novoTipo, setNovoTipo] = useState('');

  const [selectedMedicinas, setSelectedMedicinas] = useState<MedicinaDB[]>([]);
  const [showAddMedicina, setShowAddMedicina] = useState(false);
  const [novaMedicina, setNovaMedicina] = useState('');

  const [valorDisplay, setValorDisplay] = useState('');

  const isEditMode = mode === 'edit';

  const { data: tiposConsagracao, refetch: refetchTipos } = useQuery({
    queryKey: ['tipos-consagracao'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tipos_consagracao').select('id, nome, descricao, ativo').eq('ativo', true).order('nome');
      if (error) throw error;
      return data as TipoConsagracao[];
    },
  });

  const { data: medicinasDisponiveis, refetch: refetchMedicinas } = useQuery({
    queryKey: ['medicinas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('medicinas').select('id, nome, descricao, ativo, created_at').eq('ativo', true).order('nome');
      if (error) throw error;
      return data as MedicinaDB[];
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
      setSelectedTipoId(data.id);
      setValue('tipo_consagracao_id', data.id);
      setNovoTipo('');
      setShowAddTipo(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar tipo', {
        description: error.message.includes('duplicate') ? 'Este tipo já existe.' : 'Tente novamente.',
      });
    },
  });

  const addMedicinaMutation = useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase.from('medicinas').insert({ nome }).select('id, nome, descricao, ativo, created_at').single();
      if (error) throw error;
      return data as MedicinaDB;
    },
    onSuccess: (data) => {
      toast.success('Medicina adicionada!');
      refetchMedicinas();
      setSelectedMedicinas(prev => [...prev, data]);
      setNovaMedicina('');
      setShowAddMedicina(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar medicina', {
        description: error.message.includes('duplicate') ? 'Esta medicina já existe.' : 'Tente novamente.',
      });
    },
  });

  useEffect(() => {
    if (!ceremony || !isOpen || !isEditMode) return;
    setValue('nome', ceremony.nome || '');
    setValue('data', ceremony.data);
    setValue('horario', ceremony.horario);
    setValue('local', ceremony.local);
    setValue('descricao', ceremony.descricao || '');
    setValue('vagas', ceremony.vagas || 0);
    setValue('observacoes', ceremony.observacoes || '');
    setValue('itens_levar', ceremony.itens_levar || '');
    setValue('banner_url', ceremony.banner_url || '');
    const valorCentavos = ceremony.valor || 0;
    setValue('valor', valorCentavos);
    setValorDisplay(formatCentavosToReal(valorCentavos));
    if (ceremony.banner_url) setPreviewUrl(ceremony.banner_url);
    if (ceremony.tipo_consagracao_id) {
      setSelectedTipoId(ceremony.tipo_consagracao_id);
      setValue('tipo_consagracao_id', ceremony.tipo_consagracao_id);
    }
    if (ceremony.cerimonias_medicinas?.length) {
      setSelectedMedicinas(ceremony.cerimonias_medicinas.map(cm => cm.medicinas));
    }
  }, [ceremony, isOpen, isEditMode, setValue]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedFile(null); setPreviewUrl(null); setImageMode('url');
      setShowAddTipo(false); setNovoTipo(''); setSelectedTipoId('');
      setSelectedMedicinas([]); setShowAddMedicina(false); setNovaMedicina('');
      setValorDisplay('');
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
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Arquivo muito grande', { description: 'Máximo 5MB.' }); return; }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) { toast.error('Tipo de arquivo inválido'); return; }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setValue('banner_url', '');
  };

  const handleRemoveImage = () => {
    setSelectedFile(null); setPreviewUrl(null); setValue('banner_url', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleMedicina = (medicina: MedicinaDB) => {
    setSelectedMedicinas(prev =>
      prev.some(m => m.id === medicina.id)
        ? prev.filter(m => m.id !== medicina.id)
        : [...prev, medicina]
    );
  };

  const removeMedicina = (id: string) => {
    setSelectedMedicinas(prev => prev.filter(m => m.id !== id));
  };

  const saveMedicinas = async (cerimoniaid: string) => {
    await supabase.from('cerimonias_medicinas').delete().eq('cerimonia_id', cerimoniaid);
    if (selectedMedicinas.length > 0) {
      const rows = selectedMedicinas.map(m => ({ cerimonia_id: cerimoniaid, medicina_id: m.id }));
      const { error } = await supabase.from('cerimonias_medicinas').insert(rows);
      if (error) throw error;
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: CeremonyFormData) => {
      const { data: created, error } = await supabase.from('cerimonias').insert([data]).select('id').single();
      if (error) throw error;
      await saveMedicinas(created.id);
    },
    onSuccess: () => { toast.success(TOAST_MESSAGES.cerimonia.criada.title); invalidateAndClose(); },
    onError: () => { toast.error(TOAST_MESSAGES.cerimonia.erro.title); }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CeremonyFormData) => {
      if (!ceremony) throw new Error('Cerimônia não encontrada');
      const { error } = await supabase.from('cerimonias').update(data).eq('id', ceremony.id);
      if (error) throw error;
      await saveMedicinas(ceremony.id);
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
    reset(); setCurrentStep(1);
    setSelectedFile(null); setPreviewUrl(null); setImageMode('url');
    setShowAddTipo(false); setNovoTipo(''); setSelectedTipoId('');
    setSelectedMedicinas([]); setShowAddMedicina(false); setNovaMedicina('');
    setValorDisplay(''); onClose();
  };

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[currentStep]);
    if (valid) setCurrentStep(s => (s + 1) as WizardStep);
  };

  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending || isUploading;
  const config = {
    create: { title: 'Nova Cerimônia', submitText: 'Criar Cerimônia', pendingText: 'Criando...' },
    edit: { title: 'Editar Cerimônia', submitText: 'Salvar Alterações', pendingText: 'Salvando...' }
  }[mode];

  if (!isOpen) return null;

  const medicinasNaoSelecionadas = medicinasDisponiveis?.filter(
    m => !selectedMedicinas.some(s => s.id === m.id)
  ) ?? [];

  // ── Blocos de campos reutilizados em mobile e desktop ──

  const fieldsEssencial = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Nome da Cerimônia *</Label>
        <Input
          placeholder="Ex: Trabalho de Cura — Solstício de Inverno"
          {...register('nome', { required: 'Informe o nome da cerimônia' })}
          className={errors.nome ? 'border-destructive' : ''}
        />
        <FieldError message={errors.nome?.message} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Tipo de Consagração</Label>
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowAddTipo(!showAddTipo)}>
            <Plus className="w-3 h-3 mr-1" />Novo tipo
          </Button>
        </div>
        {showAddTipo && (
          <div className="flex gap-2 p-2 bg-muted/50 rounded-lg">
            <Input placeholder="Nome do tipo..." value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)} className="flex-1 h-8 text-sm" />
            <Button type="button" size="sm" onClick={() => novoTipo.trim() && addTipoMutation.mutate(novoTipo.trim())} disabled={addTipoMutation.isPending}>
              {addTipoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
            </Button>
          </div>
        )}
        <Select value={selectedTipoId} onValueChange={(v) => { setSelectedTipoId(v); setValue('tipo_consagracao_id', v); }}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de consagração" />
          </SelectTrigger>
          <SelectContent>
            {tiposConsagracao?.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <input type="hidden" {...register('tipo_consagracao_id')} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Medicinas Consagradas</Label>
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowAddMedicina(!showAddMedicina)}>
            <Plus className="w-3 h-3 mr-1" />Nova medicina
          </Button>
        </div>
        {showAddMedicina && (
          <div className="flex gap-2 p-2 bg-muted/50 rounded-lg">
            <Input placeholder="Nome da medicina..." value={novaMedicina} onChange={(e) => setNovaMedicina(e.target.value)} className="flex-1 h-8 text-sm" />
            <Button type="button" size="sm" onClick={() => novaMedicina.trim() && addMedicinaMutation.mutate(novaMedicina.trim())} disabled={addMedicinaMutation.isPending}>
              {addMedicinaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
            </Button>
          </div>
        )}
        {selectedMedicinas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-lg min-h-[36px]">
            {selectedMedicinas.map(m => (
              <Badge key={m.id} variant="secondary" className="gap-1 pl-2 pr-1 py-0.5 text-xs">
                {m.nome}
                <button type="button" onClick={() => removeMedicina(m.id)} className="ml-0.5 hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        {medicinasNaoSelecionadas.length > 0 && (
          <Select onValueChange={(id) => {
            const m = medicinasDisponiveis?.find(m => m.id === id);
            if (m) toggleMedicina(m);
          }} value="">
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="+ Adicionar medicina..." />
            </SelectTrigger>
            <SelectContent>
              {medicinasNaoSelecionadas.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Data *</Label>
          <Input type="date" {...register('data', { required: 'Informe a data' })} className={errors.data ? 'border-destructive' : ''} />
          <FieldError message={errors.data?.message} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Horário *</Label>
          <Input type="time" {...register('horario', { required: 'Informe o horário' })} className={errors.horario ? 'border-destructive' : ''} />
          <FieldError message={errors.horario?.message} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Local *</Label>
        <Input placeholder="Ex: Templo Principal, Sítio..." {...register('local', { required: 'Informe o local' })} className={errors.local ? 'border-destructive' : ''} />
        <FieldError message={errors.local?.message} />
      </div>
    </div>
  );

  const fieldsLogistica = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Vagas *</Label>
          <Input type="number" placeholder="20" {...register('vagas', { required: 'Informe as vagas', min: { value: 1, message: 'Mínimo 1 vaga' } })} className={errors.vagas ? 'border-destructive' : ''} />
          <FieldError message={errors.vagas?.message} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Valor (R$)</Label>
          <Input type="text" inputMode="decimal" placeholder="0,00" value={valorDisplay} onChange={handleValorChange} />
          <input type="hidden" {...register('valor')} />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Banner</Label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { setImageMode('url'); setSelectedFile(null); }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${imageMode === 'url' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/50'}`}>
            <Link className="w-4 h-4" />URL
          </button>
          <button type="button" onClick={() => setImageMode('upload')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${imageMode === 'upload' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/50'}`}>
            <Upload className="w-4 h-4" />Upload
          </button>
        </div>
        {imageMode === 'url' ? (
          <Input placeholder="https://..." {...register('banner_url')} onChange={(e) => { setValue('banner_url', e.target.value); setPreviewUrl(e.target.value || null); setSelectedFile(null); }} />
        ) : (
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors text-muted-foreground hover:text-foreground">
              <Image className="w-6 h-6" />
              <span className="text-sm">{selectedFile ? selectedFile.name : 'Clique para selecionar uma imagem'}</span>
              <span className="text-xs">JPG, PNG, WebP — máx. 5MB</span>
            </button>
          </div>
        )}
        {previewUrl && (
          <div className="relative rounded-lg overflow-hidden border">
            <img src={previewUrl} alt="Preview do banner" className="w-full h-40 object-cover" onError={() => setPreviewUrl(null)} />
            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleRemoveImage}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const fieldsConteudo = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Descrição</Label>
        <Textarea placeholder="Detalhes sobre a cerimônia, preparação, intenção..." {...register('descricao')} className="min-h-[100px] resize-none" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">O que trazer</Label>
        <p className="text-xs text-muted-foreground">Um item por linha. Aparece no modal de confirmação do participante.</p>
        <Textarea
          placeholder={`2 rolos de papel higiênico\nAlimentos para partilha\nUma vela branca\nRoupa branca`}
          {...register('itens_levar')}
          className="min-h-[110px] resize-none font-mono text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Observações internas</Label>
        <Textarea placeholder="Notas para a equipe (não visível aos participantes)..." {...register('observacoes')} className="min-h-[80px] resize-none" />
      </div>
    </div>
  );

  // ── Desktop: form longo único ──
  const desktopForm = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <SectionLabel>Identificação</SectionLabel>
      {fieldsEssencial}
      <SectionLabel>Logística</SectionLabel>
      {fieldsLogistica}
      <SectionLabel>Conteúdo</SectionLabel>
      {fieldsConteudo}
      <div className="flex gap-2 pt-2 pb-1">
        <Button type="button" variant="outline" onClick={handleClose} className="flex-1">Cancelar</Button>
        <Button type="submit" disabled={isPending} className="flex-1">
          {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando imagem...</> : isPending ? config.pendingText : config.submitText}
        </Button>
      </div>
    </form>
  );

  // ── Mobile: wizard por passos ──
  const mobileWizard = (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4">
        <WizardProgress currentStep={currentStep} />

        {currentStep === 1 && fieldsEssencial}
        {currentStep === 2 && fieldsLogistica}
        {currentStep === 3 && fieldsConteudo}
      </div>

      {/* Navegação fixa no fundo */}
      <div className="shrink-0 px-4 py-3 border-t bg-background flex gap-2">
        {currentStep > 1 ? (
          <Button type="button" variant="outline" onClick={() => setCurrentStep(s => (s - 1) as WizardStep)} className="flex-1 gap-1">
            <ChevronLeft className="w-4 h-4" />Voltar
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1">Cancelar</Button>
        )}

        {currentStep < 3 ? (
          <Button type="button" onClick={handleNext} className="flex-1 gap-1">
            Próximo<ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={isPending} className="flex-1">
            {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : isPending ? config.pendingText : config.submitText}
          </Button>
        )}
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent className="h-[92vh] flex flex-col">
          <DrawerHeader className="shrink-0 pb-0 pt-4">
            <DrawerTitle className="font-display text-lg text-primary">{config.title}</DrawerTitle>
            <DrawerDescription className="sr-only">Formulário de cerimônia</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 flex flex-col overflow-hidden">
            {mobileWizard}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">{config.title}</DialogTitle>
          <DialogDescription className="sr-only">Formulário de cerimônia</DialogDescription>
        </DialogHeader>
        {desktopForm}
      </DialogContent>
    </Dialog>
  );
};

export default memo(CeremonyFormDialog);
