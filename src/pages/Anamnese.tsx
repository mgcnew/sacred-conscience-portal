import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS, ROUTES } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  FileText, 
  User, 
  Users,
  Heart, 
  Pill, 
  Sparkles, 
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Camera,
  Cloud,
  Clock,
  Download,
  Calendar,
  Phone,
  Shield,
  MessageCircle,
  RotateCcw,
  Upload,
  IdCard,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import { APP_CONFIG } from '@/config/app';
import SignatureCanvas from 'react-signature-canvas';

const anamneseSchema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  documento_tipo: z.enum(['cpf', 'rg'], { required_error: 'Selecione o tipo de documento' }),
  documento_valor: z.string().min(5, 'Documento inválido'),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  contato_emergencia: z.string().min(10, 'Contato de emergência é obrigatório'),
  nome_contato_emergencia: z.string().min(2, 'Nome do contato de emergência é obrigatório'),
  parentesco_contato: z.string().optional(),
  // Como conheceu
  como_conheceu: z.string().min(1, 'Informe como conheceu o templo'),
  indicado_por: z.string().optional(),
  // Saúde - com opção de negar
  sem_doencas: z.boolean(),
  pressao_alta: z.boolean(),
  problemas_cardiacos: z.boolean(),
  historico_convulsivo: z.boolean(),
  diabetes: z.boolean(),
  problemas_respiratorios: z.boolean(),
  problemas_renais: z.boolean(),
  problemas_hepaticos: z.boolean(),
  transtorno_psiquiatrico: z.boolean(),
  transtorno_psiquiatrico_qual: z.string().optional(),
  gestante_lactante: z.boolean(),
  uso_medicamentos: z.string().optional(),
  uso_antidepressivos: z.boolean(),
  tipo_antidepressivo: z.string().optional(),
  alergias: z.string().optional(),
  cirurgias_recentes: z.string().optional(),
  // Substâncias - com opção de negar
  sem_vicios: z.boolean(),
  tabaco: z.boolean(),
  tabaco_frequencia: z.string().optional(),
  alcool: z.boolean(),
  alcool_frequencia: z.string().optional(),
  cannabis: z.boolean(),
  outras_substancias: z.string().optional(),
  // Experiência
  ja_consagrou: z.boolean(),
  quantas_vezes_consagrou: z.string().optional(),
  como_foi_experiencia: z.string().optional(),
  intencao: z.string().optional(),
  restricao_alimentar: z.string().optional(),
  // Consentimentos
  aceite_contraindicacoes: z.boolean().refine(val => val === true, 'Você deve aceitar as contraindicações'),
  aceite_livre_vontade: z.boolean().refine(val => val === true, 'Você deve confirmar sua livre vontade'),
  aceite_termo_responsabilidade: z.boolean().refine(val => val === true, 'Você deve aceitar o termo de responsabilidade'),
  aceite_permanencia: z.boolean().refine(val => val === true, 'Você deve aceitar permanecer no templo até estar bem'),
  aceite_uso_imagem: z.boolean(),
  assinatura: z.string().min(100, 'A assinatura é obrigatória'),
});

type AnamneseFormData = z.infer<typeof anamneseSchema>;

// Ficha de Anamnese com Assinatura Digital
const Anamnese: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sigPad = useRef<SignatureCanvas>(null);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [existingAnamnese, setExistingAnamnese] = useState<AnamneseFormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'view' | 'edit' | 'new'>('new');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [showContraindicacaoModal, setShowContraindicacaoModal] = useState(false);
  const [isIncomplete, setIsIncomplete] = useState(false);
  const [isFullScreenSignature, setIsFullScreenSignature] = useState(false);

  // Estados para upload de documentos
  const [documentoFrenteUrl, setDocumentoFrenteUrl] = useState<string | null>(null);
  const [documentoVersoUrl, setDocumentoVersoUrl] = useState<string | null>(null);
  const [isUploadingDocFrente, setIsUploadingDocFrente] = useState(false);
  const [isUploadingDocVerso, setIsUploadingDocVerso] = useState(false);
  const docFrenteInputRef = useRef<HTMLInputElement>(null);
  const docVersoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<AnamneseFormData>({
    nome_completo: '',
    data_nascimento: '',
    documento_tipo: 'cpf',
    documento_valor: '',
    telefone: '',
    contato_emergencia: '',
    nome_contato_emergencia: '',
    parentesco_contato: '',
    como_conheceu: '',
    indicado_por: '',
    sem_doencas: false,
    pressao_alta: false,
    problemas_cardiacos: false,
    historico_convulsivo: false,
    diabetes: false,
    problemas_respiratorios: false,
    problemas_renais: false,
    problemas_hepaticos: false,
    transtorno_psiquiatrico: false,
    transtorno_psiquiatrico_qual: '',
    gestante_lactante: false,
    uso_medicamentos: '',
    uso_antidepressivos: false,
    tipo_antidepressivo: '',
    alergias: '',
    cirurgias_recentes: '',
    sem_vicios: false,
    tabaco: false,
    tabaco_frequencia: '',
    alcool: false,
    alcool_frequencia: '',
    cannabis: false,
    outras_substancias: '',
    ja_consagrou: false,
    quantas_vezes_consagrou: '',
    como_foi_experiencia: '',
    intencao: '',
    restricao_alimentar: '',
    aceite_contraindicacoes: false,
    aceite_livre_vontade: false,
    aceite_termo_responsabilidade: false,
    aceite_permanencia: false,
    aceite_uso_imagem: false,
    assinatura: '',
  });

  useEffect(() => {
    const fetchAnamnese = async () => {
      if (!user) return;

      // Buscar avatar e dados do profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('avatar_url, full_name, birth_date')
        .eq('id', user.id)
        .single();
      
      if (profileData?.avatar_url) {
        setAvatarUrl(profileData.avatar_url);
      }

      // Always check if user has existing anamnese in database first
      const { data, error } = await supabase
        .from('anamneses')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!error && data) {
        // User has existing anamnese - load from database
        if (data.updated_at) {
          setUpdatedAt(data.updated_at);
        }
        const mapped: AnamneseFormData = {
          nome_completo: data.nome_completo,
          data_nascimento: data.data_nascimento,
          documento_tipo: data.documento_tipo || 'cpf',
          documento_valor: data.documento_valor || '',
          telefone: data.telefone,
          contato_emergencia: data.contato_emergencia,
          nome_contato_emergencia: data.nome_contato_emergencia || '',
          parentesco_contato: data.parentesco_contato || '',
          como_conheceu: data.como_conheceu || '',
          indicado_por: data.indicado_por || '',
          sem_doencas: data.sem_doencas || false,
          pressao_alta: data.pressao_alta,
          problemas_cardiacos: data.problemas_cardiacos,
          historico_convulsivo: data.historico_convulsivo,
          diabetes: data.diabetes,
          problemas_respiratorios: data.problemas_respiratorios || false,
          problemas_renais: data.problemas_renais || false,
          problemas_hepaticos: data.problemas_hepaticos || false,
          transtorno_psiquiatrico: data.transtorno_psiquiatrico || false,
          transtorno_psiquiatrico_qual: data.transtorno_psiquiatrico_qual || '',
          gestante_lactante: data.gestante_lactante || false,
          uso_medicamentos: data.uso_medicamentos || '',
          uso_antidepressivos: data.uso_antidepressivos,
          tipo_antidepressivo: data.tipo_antidepressivo || '',
          alergias: data.alergias || '',
          cirurgias_recentes: data.cirurgias_recentes || '',
          sem_vicios: data.sem_vicios || false,
          tabaco: data.tabaco,
          tabaco_frequencia: data.tabaco_frequencia || '',
          alcool: data.alcool,
          alcool_frequencia: data.alcool_frequencia || '',
          cannabis: data.cannabis || false,
          outras_substancias: data.outras_substancias || '',
          ja_consagrou: data.ja_consagrou,
          quantas_vezes_consagrou: data.quantas_vezes_consagrou || '',
          como_foi_experiencia: data.como_foi_experiencia || '',
          intencao: data.intencao || '',
          restricao_alimentar: data.restricao_alimentar || '',
          aceite_contraindicacoes: data.aceite_contraindicacoes ?? false,
          aceite_livre_vontade: data.aceite_livre_vontade ?? false,
          aceite_termo_responsabilidade: data.aceite_termo_responsabilidade ?? false,
          aceite_permanencia: data.aceite_permanencia ?? false,
          aceite_uso_imagem: data.aceite_uso_imagem ?? false,
          assinatura: data.assinatura || '',
        };
        setFormData(mapped);
        setExistingAnamnese(mapped);
        
        // Verificar se faltam novos campos obrigatórios
        const incomplete = !mapped.documento_valor || !mapped.assinatura;
        setIsIncomplete(incomplete);
        
        setViewMode('view'); // Mostrar modo visualização quando já existe ficha
        // Clear any draft since we have real data
        try {
          localStorage.removeItem(STORAGE_KEYS.ANAMNESE_DRAFT);
        } catch (e) {
          console.error('Failed to clear draft:', e);
        }
      } else if (profileData) {
        // Se não tem anamnese mas tem dados no profile, pré-preencher
        if (profileData.full_name || profileData.birth_date) {
          setFormData(prev => ({
            ...prev,
            nome_completo: profileData.full_name || prev.nome_completo,
            data_nascimento: profileData.birth_date || prev.data_nascimento,
          }));
        }
      }

      setIsFetching(false);
    };

    fetchAnamnese();
  }, [user]);

  // Save form data to localStorage
  const saveToLocalStorage = (data: AnamneseFormData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ANAMNESE_DRAFT, JSON.stringify(data));
      setLastSaved(new Date());
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  };

  // Calcular progresso do formulário
  const calculateProgress = (): number => {
    const requiredFields = [
      formData.nome_completo,
      formData.data_nascimento,
      formData.documento_valor,
      formData.telefone,
      formData.contato_emergencia,
      formData.nome_contato_emergencia,
    ];
    const filledRequired = requiredFields.filter(f => f && f.length > 0).length;
    const baseProgress = (filledRequired / requiredFields.length) * 50; // 50% para campos obrigatórios
    
    // 20% para saúde (se marcou sem_doencas ou alguma condição)
    const healthProgress = (formData.sem_doencas || formData.pressao_alta || formData.problemas_cardiacos) ? 15 : 0;
    
    // 20% para consentimentos
    const consentProgress = (formData.aceite_contraindicacoes && formData.aceite_livre_vontade && formData.aceite_termo_responsabilidade) ? 15 : 
      ((formData.aceite_contraindicacoes ? 5 : 0) + (formData.aceite_livre_vontade ? 5 : 0) + (formData.aceite_termo_responsabilidade ? 5 : 0));
    
    // 20% para assinatura
    const signatureProgress = formData.assinatura ? 20 : 0;
    
    return Math.min(100, Math.round(baseProgress + healthProgress + consentProgress + signatureProgress));
  };

  // Load form data from localStorage
  const loadFromLocalStorage = (): AnamneseFormData | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANAMNESE_DRAFT);
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
      return null;
    }
  };

  // Clear localStorage after successful submit
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ANAMNESE_DRAFT);
    } catch (err) {
      console.error('Failed to clear localStorage:', err);
    }
  };

  const updateField = <K extends keyof AnamneseFormData>(field: K, value: AnamneseFormData[K]) => {
    setFormData(prev => {
      const updatedData = { ...prev, [field]: value };
      // Auto-save to localStorage on every field change
      saveToLocalStorage(updatedData);
      return updatedData;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateMultipleFields = (updates: Partial<AnamneseFormData>) => {
    setFormData(prev => {
      const updatedData = { ...prev, ...updates };
      saveToLocalStorage(updatedData);
      return updatedData;
    });
  };

  const hasContraindicacoes = formData.pressao_alta || 
    formData.problemas_cardiacos || 
    formData.historico_convulsivo || 
    formData.uso_antidepressivos ||
    formData.transtorno_psiquiatrico ||
    formData.gestante_lactante;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo inválido', { description: 'Selecione uma imagem.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande', { description: 'Máximo 5MB.' });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(newAvatarUrl);
      toast.success('Foto atualizada!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'frente' | 'verso'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo inválido', { description: 'Selecione uma imagem.' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande', { description: 'Máximo 10MB.' });
      return;
    }

    const setUploading = side === 'frente' ? setIsUploadingDocFrente : setIsUploadingDocVerso;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/doc_${side}_${Date.now()}.${fileExt}`;

      console.log('Supabase Upload iniciando bucket: anamnese-files, file:', fileName);

      const { error: uploadError } = await supabase.storage
        .from('anamnese-files')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Supabase Upload Error:', uploadError);
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from('anamnese-files')
        .getPublicUrl(fileName);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Salvar URL na tabela anamneses
      const column = side === 'frente' ? 'documento_frente_url' : 'documento_verso_url';
      const { error: dbError } = await supabase
        .from('anamneses')
        .upsert(
          { user_id: user.id, [column]: publicUrl },
          { onConflict: 'user_id' }
        );

      if (dbError) {
        console.error('Erro ao salvar URL no banco:', dbError);
        toast.error('Upload feito, mas não foi possível salvar no banco: ' + dbError.message);
      } else {
        if (side === 'frente') setDocumentoFrenteUrl(publicUrl);
        else setDocumentoVersoUrl(publicUrl);
        toast.success(`Documento (${side}) enviado com sucesso!`);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar documento', { description: msg });
    } finally {
      setUploading(false);
      // Limpar input para permitir re-upload do mesmo arquivo
      if (side === 'frente' && docFrenteInputRef.current) docFrenteInputRef.current.value = '';
      if (side === 'verso' && docVersoInputRef.current) docVersoInputRef.current.value = '';
    }
  };

  const nextStep = () => {
    // Validar campos do passo atual antes de prosseguir
    const currentErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.nome_completo || formData.nome_completo.length < 3) 
        currentErrors.nome_completo = 'Nome deve ter pelo menos 3 caracteres';
      if (!formData.data_nascimento) 
        currentErrors.data_nascimento = 'Data de nascimento é obrigatória';
      if (!formData.documento_valor || formData.documento_valor.length < 5)
        currentErrors.documento_valor = 'Documento inválido';
      if (!formData.telefone || formData.telefone.length < 10) 
        currentErrors.telefone = 'Telefone inválido';
      if (!formData.nome_contato_emergencia || formData.nome_contato_emergencia.length < 2) 
        currentErrors.nome_contato_emergencia = 'Nome do contato é obrigatório';
      if (!formData.contato_emergencia || formData.contato_emergencia.length < 10) 
        currentErrors.contato_emergencia = 'Telefone de emergência inválido';
      if (!formData.como_conheceu) 
        currentErrors.como_conheceu = 'Informe como nos conheceu';
    }

    if (step === 2) {
      if (!formData.sem_doencas && 
          !formData.pressao_alta && 
          !formData.problemas_cardiacos && 
          !formData.historico_convulsivo && 
          !formData.diabetes && 
          !formData.problemas_respiratorios && 
          !formData.problemas_renais && 
          !formData.problemas_hepaticos && 
          !formData.transtorno_psiquiatrico && 
          !formData.gestante_lactante) {
        toast.error('Informação de saúde necessária', {
          description: 'Por favor, selecione "Não possuo nenhuma das condições acima" ou marque as opções que se aplicam.',
        });
        return;
      }
    }

    if (step === 4) {
      if (!formData.intencao || formData.intencao.trim().length < 5) {
        currentErrors.intencao = 'Por favor, descreva brevemente sua intenção';
      }
    }

    if (step === 5) {
      if (!formData.aceite_contraindicacoes || !formData.aceite_livre_vontade || !formData.aceite_termo_responsabilidade || !formData.aceite_permanencia) {
        toast.error('Termos obrigatórios', {
          description: 'Você deve aceitar todos os termos obrigatórios antes de assinar.',
        });
        return;
      }
    }

    if (step === 6) {
      if (!formData.assinatura || formData.assinatura.length < 100) {
        toast.error('Assinatura obrigatória', {
          description: 'Por favor, assine no campo indicado.',
        });
        return;
      }
    }

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      toast.error('Campos obrigatórios', {
        description: 'Por favor, preencha todos os campos obrigatórios antes de prosseguir.',
      });
      return;
    }

    setErrors({});
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setErrors({});

    try {
      anamneseSchema.parse(formData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0].toString()] = e.message;
          }
        });
        setErrors(newErrors);
        toast.error('Campos obrigatórios', {
          description: 'Por favor, verifique os campos destacados.',
        });
        return;
      }
    }

    if (!user) return;

    setIsLoading(true);

    const payload = {
      user_id: user.id,
      ...formData,
    };

    let error;

    if (existingAnamnese) {
      const { error: updateError } = await supabase
        .from('anamneses')
        .update(payload)
        .eq('user_id', user.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('anamneses')
        .insert(payload);
      error = insertError;
    }

    setIsLoading(false);

    if (error) {
      toast.error('Erro ao salvar', {
        description: error.message,
      });
    } else {
      // Atualizar profile com nome, data de nascimento e origem
      const referralSource = formData.como_conheceu === 'indicacao' 
        ? 'Indicação' 
        : formData.como_conheceu === 'instagram' ? 'Instagram'
        : formData.como_conheceu === 'facebook' ? 'Facebook'
        : formData.como_conheceu === 'google' ? 'Google'
        : formData.como_conheceu === 'youtube' ? 'YouTube'
        : formData.como_conheceu === 'evento' ? 'Evento/Palestra'
        : formData.como_conheceu || null;

      await supabase
        .from('profiles')
        .update({
          full_name: formData.nome_completo,
          birth_date: formData.data_nascimento,
          referral_source: referralSource,
          referral_name: formData.indicado_por || null,
        })
        .eq('id', user.id);

      // Clear localStorage after successful submission
      clearLocalStorage();
      setExistingAnamnese(formData);
      setViewMode('view');
      setStep(1);
      
      // Verificar se há contraindicações e mostrar modal
      if (hasContraindicacoes) {
        setShowContraindicacaoModal(true);
      } else {
        toast.success(existingAnamnese ? 'Ficha atualizada!' : 'Ficha salva!', {
          description: 'Sua ficha de anamnese foi salva com sucesso.',
        });
      }
    }
  };

  const renderFullScreenSignature = () => {
    if (!isFullScreenSignature) return null;

    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center animate-in fade-in duration-300 overflow-hidden">
        {/* Container que rotaciona no mobile */}
        <div className="w-full h-full flex flex-col p-4 md:p-10 gap-4 max-w-5xl">
          <div className="flex justify-between items-center px-2">
            <div className="flex flex-col">
              <h3 className="font-display text-xl font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Assinatura Digital
              </h3>
              <p className="text-xs text-muted-foreground hidden md:block">
                Assine no campo abaixo de forma clara.
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsFullScreenSignature(false)}
              className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          <div className="flex-1 bg-white rounded-3xl border-4 border-muted shadow-2xl overflow-hidden relative group cursor-crosshair">
            {/* Background informativo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
              <FileText className="w-64 h-64 -rotate-12" />
            </div>
            
            <SignatureCanvas 
              ref={sigPad}
              penColor='black'
              canvasProps={{
                className: 'signature-canvas w-full h-full'
              }}
            />

            {/* Guia visual para mobile portrait */}
            <div className="absolute inset-0 flex md:hidden items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-2 opacity-20 portrait:rotate-90">
                <RotateCcw className="w-8 h-8 animate-pulse" />
                <span className="text-sm font-medium uppercase tracking-tighter">Vire o celular para assinar melhor</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-2">
            <div className="flex items-center gap-2 order-2 md:order-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => sigPad.current?.clear()}
                className="gap-2 border-primary/20 hover:bg-primary/5"
              >
                <RotateCcw className="w-4 h-4" />
                Limpar
              </Button>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto order-1 md:order-2">
              <Button 
                variant="ghost" 
                className="flex-1 md:flex-none"
                onClick={() => setIsFullScreenSignature(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (sigPad.current && !sigPad.current.isEmpty()) {
                    updateField('assinatura', sigPad.current.toDataURL());
                    setIsFullScreenSignature(false);
                    toast.success('Assinatura salva!', {
                      description: 'Sua assinatura foi capturada com sucesso.'
                    });
                  } else {
                    toast.error('Assinatura vazia', {
                      description: 'Por favor, faça sua assinatura antes de salvar.'
                    });
                  }
                }}
                className="flex-1 md:flex-none gap-2 px-10 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                Salvar Assinatura
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // WhatsApp do líder facilitador para contraindicações (da configuração centralizada)
  const whatsappLider = APP_CONFIG.contacts.whatsappLider;
  const mensagemWhatsApp = encodeURIComponent(
    `Olá, ${APP_CONFIG.contacts.liderNome.split(' ')[0]}! Sou ${formData.nome_completo} e acabei de preencher minha ficha de anamnese no ${APP_CONFIG.name}. Identifiquei que possuo algumas condições de saúde que podem ser contraindicações e gostaria de conversar antes de participar de uma cerimônia.`
  );

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Dados', icon: User },
    { number: 2, title: 'Saúde', icon: Heart },
    { number: 3, title: 'Hábitos', icon: Pill },
    { number: 4, title: 'Experiência', icon: Sparkles },
    { number: 5, title: 'Termos', icon: FileText },
    { number: 6, title: 'Assinatura', icon: Check },
  ];

  // Formatar data para exibição
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Componente para exibir item de informação
  const InfoItem = ({ 
    label, 
    value, 
    icon: Icon 
  }: { 
    label: string; 
    value: string | boolean | undefined;
    icon?: React.ElementType;
  }) => (
    <div className="py-2.5 border-b border-border last:border-0 flex items-start gap-3">
      {Icon && (
        <div className="mt-0.5">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-sm">
          {typeof value === 'boolean' ? (
            <span className={value ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
              {value ? '✓ Sim' : 'Não'}
            </span>
          ) : (value || '-')}
        </p>
      </div>
    </div>
  );

  // Renderizar modal de contraindicação
  const renderContraindicacaoModal = () => (
    <ContraindicacaoModal
      open={showContraindicacaoModal}
      onClose={() => {
        setShowContraindicacaoModal(false);
        toast.success('Ficha salva!', {
          description: 'Sua ficha de anamnese foi salva com sucesso.',
        });
      }}
      whatsappUrl={`https://wa.me/${whatsappLider}?text=${mensagemWhatsApp}`}
      nomeUsuario={formData.nome_completo}
    />
  );

  // Tela de visualização da ficha preenchida
  if (viewMode === 'view' && existingAnamnese) {
    return (
      <>
        {renderContraindicacaoModal()}
      <div className="min-h-screen py-4 md:py-6">
        <div className="container max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="font-display text-3xl font-medium text-foreground mb-2">
              Ficha de Anamnese
            </h1>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
              <Check className="w-3 h-3 mr-1" />
              Preenchida
            </Badge>
          </div>

          {/* Alerta de Ficha Incompleta */}
          {isIncomplete && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 animate-pulse-slow">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-destructive">
                    Atualização Necessária
                  </h3>
                  <p className="text-sm text-destructive/80 leading-relaxed">
                    Sua ficha está desatualizada. Por segurança, adicionamos os campos de 
                    <strong> Documento (RG/CPF)</strong> e <strong>Assinatura Digital</strong>. 
                    Por favor, atualize sua ficha agora.
                  </p>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setViewMode('edit')}
                  >
                    Atualizar Agora
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Info de última atualização */}
          {updatedAt && (
            <div className="flex justify-center mb-4">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Última atualização: {new Date(updatedAt).toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex justify-center gap-3 mb-6">
            <Button
              variant="outline"
              onClick={() => setViewMode('edit')}
              className="gap-2"
            >
              <Camera className="w-4 h-4" />
              Editar Ficha
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Imprimir
            </Button>
          </div>

          {/* Resumo Visual Rápido */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {/* Status de Saúde */}
            <div className={`p-3 rounded-xl border ${
              hasContraindicacoes 
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' 
                : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
            }`}>
              <Heart className={`w-5 h-5 mb-1 ${hasContraindicacoes ? 'text-amber-600' : 'text-green-600'}`} />
              <p className="text-xs text-muted-foreground">Saúde</p>
              <p className={`text-sm font-medium ${hasContraindicacoes ? 'text-amber-700 dark:text-amber-400' : 'text-green-700 dark:text-green-400'}`}>
                {hasContraindicacoes ? 'Atenção' : 'OK'}
              </p>
            </div>

            {/* Substâncias */}
            <div className={`p-3 rounded-xl border ${
              formData.sem_vicios 
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
            }`}>
              <Pill className={`w-5 h-5 mb-1 ${formData.sem_vicios ? 'text-green-600' : 'text-blue-600'}`} />
              <p className="text-xs text-muted-foreground">Substâncias</p>
              <p className={`text-sm font-medium ${formData.sem_vicios ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'}`}>
                {formData.sem_vicios ? 'Nenhuma' : 'Declarado'}
              </p>
            </div>

            {/* Experiência */}
            <div className={`p-3 rounded-xl border ${
              formData.ja_consagrou 
                ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800' 
                : 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800'
            }`}>
              <Sparkles className={`w-5 h-5 mb-1 ${formData.ja_consagrou ? 'text-purple-600' : 'text-slate-600'}`} />
              <p className="text-xs text-muted-foreground">Experiência</p>
              <p className={`text-sm font-medium ${formData.ja_consagrou ? 'text-purple-700 dark:text-purple-400' : 'text-slate-700 dark:text-slate-400'}`}>
                {formData.ja_consagrou ? 'Experiente' : 'Primeira vez'}
              </p>
            </div>

            {/* Permanência */}
            <div className={`p-3 rounded-xl border ${
              formData.aceite_permanencia 
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
            }`}>
              <Clock className={`w-5 h-5 mb-1 ${formData.aceite_permanencia ? 'text-green-600' : 'text-red-600'}`} />
              <p className="text-xs text-muted-foreground">Permanência</p>
              <p className={`text-sm font-medium ${formData.aceite_permanencia ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {formData.aceite_permanencia ? 'Aceita' : 'Não aceita'}
              </p>
            </div>

            {/* Uso de Imagem */}
            <div className={`p-3 rounded-xl border ${
              formData.aceite_uso_imagem 
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                : 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800'
            }`}>
              <Camera className={`w-5 h-5 mb-1 ${formData.aceite_uso_imagem ? 'text-green-600' : 'text-slate-600'}`} />
              <p className="text-xs text-muted-foreground">Imagem</p>
              <p className={`text-sm font-medium ${formData.aceite_uso_imagem ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-400'}`}>
                {formData.aceite_uso_imagem ? 'Autorizada' : 'Não autorizada'}
              </p>
            </div>
          </div>

          {/* Cards de visualização */}
          <div className="space-y-4">
            {/* Dados Pessoais */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InfoItem label="Nome Completo" value={formData.nome_completo} icon={User} />
                <InfoItem label="Data de Nascimento" value={formatDate(formData.data_nascimento)} icon={Calendar} />
                <InfoItem 
                  label={formData.documento_tipo?.toUpperCase() || 'Documento'} 
                  value={formData.documento_valor} 
                  icon={Shield} 
                />
                <InfoItem label="Telefone" value={formData.telefone} icon={Phone} />
                <InfoItem label="Contato de Emergência" value={formData.nome_contato_emergencia} icon={User} />
                <InfoItem label="Telefone de Emergência" value={formData.contato_emergencia} icon={Phone} />
                <InfoItem label="Parentesco" value={formData.parentesco_contato} icon={Shield} />
                <InfoItem 
                  label="Como conheceu o Templo" 
                  value={
                    formData.como_conheceu === 'indicacao' ? `Indicação${formData.indicado_por ? ` de ${formData.indicado_por}` : ''}` :
                    formData.como_conheceu === 'instagram' ? 'Instagram' :
                    formData.como_conheceu === 'facebook' ? 'Facebook' :
                    formData.como_conheceu === 'google' ? 'Pesquisa no Google' :
                    formData.como_conheceu === 'youtube' ? 'YouTube' :
                    formData.como_conheceu === 'evento' ? 'Evento/Palestra' :
                    formData.como_conheceu || '-'
                  } 
                  icon={Users} 
                />
                {/* Botão para editar indicação se não preencheu */}
                {(!formData.como_conheceu || (formData.como_conheceu === 'indicacao' && !formData.indicado_por)) && (
                  <div className="pt-2 mt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setViewMode('edit');
                        setStep(1);
                      }}
                      className="gap-2 text-primary"
                    >
                      <Users className="w-4 h-4" />
                      {!formData.como_conheceu ? 'Informar como conheceu' : 'Informar quem indicou'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saúde */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Histórico de Saúde
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formData.sem_doencas ? (
                  <p className="text-green-600 dark:text-green-400 font-medium py-2">
                    <Check className="w-4 h-4 inline mr-2" />
                    Não possui doenças ou condições de saúde
                  </p>
                ) : (
                  <>
                    {formData.pressao_alta && <InfoItem label="Pressão Alta" value={true} />}
                    {formData.problemas_cardiacos && <InfoItem label="Problemas Cardíacos" value={true} />}
                    {formData.historico_convulsivo && <InfoItem label="Histórico de Convulsões" value={true} />}
                    {formData.diabetes && <InfoItem label="Diabetes" value={true} />}
                    {formData.problemas_respiratorios && <InfoItem label="Problemas Respiratórios" value={true} />}
                    {formData.problemas_renais && <InfoItem label="Problemas Renais" value={true} />}
                    {formData.problemas_hepaticos && <InfoItem label="Problemas Hepáticos" value={true} />}
                    {formData.transtorno_psiquiatrico && <InfoItem label="Transtorno Psiquiátrico" value={formData.transtorno_psiquiatrico_qual || 'Sim'} />}
                    {formData.gestante_lactante && <InfoItem label="Gestante ou Lactante" value={true} />}
                    {formData.uso_antidepressivos && <InfoItem label="Uso de Antidepressivos" value={formData.tipo_antidepressivo || 'Sim'} />}
                  </>
                )}
                <InfoItem label="Medicamentos em uso" value={formData.uso_medicamentos} />
                <InfoItem label="Alergias" value={formData.alergias} />
                <InfoItem label="Cirurgias recentes" value={formData.cirurgias_recentes} />
              </CardContent>
            </Card>

            {/* Substâncias */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Pill className="w-5 h-5 text-primary" />
                  Uso de Substâncias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formData.sem_vicios ? (
                  <p className="text-green-600 dark:text-green-400 font-medium py-2">
                    <Check className="w-4 h-4 inline mr-2" />
                    Não faz uso de substâncias
                  </p>
                ) : (
                  <>
                    {formData.tabaco && <InfoItem label="Tabaco" value={formData.tabaco_frequencia || 'Sim'} />}
                    {formData.alcool && <InfoItem label="Álcool" value={formData.alcool_frequencia || 'Sim'} />}
                    {formData.cannabis && <InfoItem label="Cannabis" value={true} />}
                    {formData.outras_substancias && <InfoItem label="Outras substâncias" value={formData.outras_substancias} />}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Experiência */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Experiência Espiritual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InfoItem label="Já participou de cerimônias" value={formData.ja_consagrou} />
                {formData.ja_consagrou && (
                  <>
                    <InfoItem label="Quantas vezes" value={formData.quantas_vezes_consagrou} />
                    <InfoItem label="Como foi a experiência" value={formData.como_foi_experiencia} />
                  </>
                )}
                <InfoItem label="Intenção" value={formData.intencao} />
                <InfoItem label="Restrições alimentares" value={formData.restricao_alimentar} />
              </CardContent>
            </Card>

            {/* Consentimentos */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Termos de Consentimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Check className="w-4 h-4" />
                    <span>Contraindicações aceitas</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Check className="w-4 h-4" />
                    <span>Livre vontade confirmada</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Check className="w-4 h-4" />
                    <span>Termo de responsabilidade aceito</span>
                  </div>
                  <div className={`flex items-center gap-2 ${formData.aceite_permanencia ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formData.aceite_permanencia ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    <span>Permanência no templo {formData.aceite_permanencia ? 'aceita' : 'não aceita'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${formData.aceite_uso_imagem ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {formData.aceite_uso_imagem ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    <span>Uso de imagem {formData.aceite_uso_imagem ? 'autorizado' : 'não autorizado'}</span>
                  </div>
                </div>

                {formData.assinatura && (
                  <div className="pt-6 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Assinado digitalmente em:</p>
                    <div className="bg-white rounded-lg border p-4 flex flex-col items-center">
                      <img 
                        src={formData.assinatura} 
                        alt="Assinatura" 
                        className="max-h-24 object-contain"
                      />
                      <div className="mt-2 w-full border-t border-slate-200 pt-2 text-center">
                        <p className="text-[10px] text-slate-500 font-mono uppercase">
                          ID: {user?.id.substring(0, 8)} | Hash: {formData.assinatura.substring(formData.assinatura.length - 12)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      {renderFullScreenSignature()}
      {renderContraindicacaoModal()}
      <div className="min-h-screen py-4 md:py-6">
        <div className="container max-w-2xl mx-auto">
          {/* Aviso de obrigatoriedade para novos usuários */}
        {viewMode === 'new' && !existingAnamnese && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-amber-700 dark:text-amber-400">
                  Preenchimento Obrigatório
                </h3>
                <p className="text-sm text-amber-600 dark:text-amber-300/80">
                  Para ter acesso completo ao aplicativo, é necessário preencher sua ficha de anamnese. 
                  Isso nos permite oferecer um <strong>atendimento personalizado</strong> e garantir sua 
                  <strong> segurança</strong> durante as cerimônias.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-medium text-foreground mb-2">
            Ficha de Anamnese
          </h1>
          <p className="text-muted-foreground font-body">
            {viewMode === 'edit' ? 'Edite suas informações de saúde.' : 'Preencha sua ficha para participar das cerimônias.'}
          </p>
          {viewMode === 'edit' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('view')}
              className="mt-2 gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar edição
            </Button>
          )}
        </div>

        {/* Barra de Progresso */}
        <div className="mb-6 px-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progresso da ficha</span>
            <div className="flex items-center gap-2">
              {lastSaved && viewMode !== 'view' && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-green-500" />
                  Rascunho salvo
                </span>
              )}
              <span className="text-sm font-medium text-primary">{calculateProgress()}%</span>
            </div>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((s) => (
            <button
              key={s.number}
              onClick={() => setStep(s.number)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-body transition-all cursor-pointer hover:scale-105 ${
                step === s.number
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : step > s.number
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {step > s.number ? (
                <Check className="w-4 h-4" />
              ) : (
                <s.icon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Form Card */}
        <Card className="animate-fade-in-up">
          {/* Step 1: Dados Pessoais */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Dados Pessoais
                </CardTitle>
                <CardDescription>Informações básicas para contato.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 md:space-y-4">
                {/* Upload de Foto */}
                <div className="flex flex-col items-center gap-3 pb-4 border-b">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-primary/20">
                      <AvatarImage src={avatarUrl || undefined} alt="Sua foto" />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                        {formData.nome_completo?.charAt(0)?.toUpperCase() || <User className="w-8 h-8" />}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Clique no ícone para adicionar sua foto<br />
                    (aparecerá nas suas partilhas)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome" className={errors.nome_completo ? "text-destructive" : ""}>Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome_completo}
                    onChange={(e) => updateField('nome_completo', e.target.value)}
                    placeholder="Seu nome completo"
                    autoComplete="name"
                    className={errors.nome_completo ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.nome_completo && <p className="text-xs font-medium text-destructive animate-fade-in">{errors.nome_completo}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nascimento" className={errors.data_nascimento ? "text-destructive" : ""}>Data de Nascimento *</Label>
                  <Input
                    id="nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => updateField('data_nascimento', e.target.value)}
                    autoComplete="bday"
                    className={errors.data_nascimento ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.data_nascimento && <p className="text-xs font-medium text-destructive animate-fade-in">{errors.data_nascimento}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documento_tipo">Tipo de Documento *</Label>
                    <select
                      id="documento_tipo"
                      value={formData.documento_tipo}
                      onChange={(e) => updateField('documento_tipo', e.target.value as 'cpf' | 'rg')}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="cpf">CPF</option>
                      <option value="rg">RG</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="documento_valor" className={errors.documento_valor ? "text-destructive" : ""}>
                      Número do {formData.documento_tipo?.toUpperCase()} *
                    </Label>
                    <Input
                      id="documento_valor"
                      value={formData.documento_valor}
                      onChange={(e) => updateField('documento_valor', e.target.value)}
                      placeholder={`Digite seu ${formData.documento_tipo?.toUpperCase()}`}
                      className={errors.documento_valor ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.documento_valor && <p className="text-xs font-medium text-destructive animate-fade-in">{errors.documento_valor}</p>}
                  </div>
                </div>

                {/* Upload de fotos do documento */}
                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                    <IdCard className="w-4 h-4 text-primary" />
                    Foto do Documento (opcional)
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Envie uma foto da frente (e verso, se RG) do seu documento para facilitar a verificação.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Frente */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Frente do Documento</Label>
                      <div
                        className="relative border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors min-h-[140px]"
                        onClick={() => !isUploadingDocFrente && docFrenteInputRef.current?.click()}
                      >
                        {documentoFrenteUrl ? (
                          <>
                            <img
                              src={documentoFrenteUrl}
                              alt="Frente do documento"
                              className="max-h-[120px] rounded object-contain"
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-background border border-border rounded-full p-0.5 hover:bg-destructive hover:text-white transition-colors"
                              onClick={(e) => { e.stopPropagation(); setDocumentoFrenteUrl(null); }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : isUploadingDocFrente ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <span className="text-xs text-muted-foreground">Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground text-center">Clique para enviar</span>
                          </>
                        )}
                      </div>
                      <input
                        ref={docFrenteInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e, 'frente')}
                      />
                    </div>

                    {/* Verso */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Verso do Documento {formData.documento_tipo === 'rg' ? '' : '(se RG)'}</Label>
                      <div
                        className="relative border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors min-h-[140px]"
                        onClick={() => !isUploadingDocVerso && docVersoInputRef.current?.click()}
                      >
                        {documentoVersoUrl ? (
                          <>
                            <img
                              src={documentoVersoUrl}
                              alt="Verso do documento"
                              className="max-h-[120px] rounded object-contain"
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-background border border-border rounded-full p-0.5 hover:bg-destructive hover:text-white transition-colors"
                              onClick={(e) => { e.stopPropagation(); setDocumentoVersoUrl(null); }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : isUploadingDocVerso ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <span className="text-xs text-muted-foreground">Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground text-center">Clique para enviar</span>
                          </>
                        )}
                      </div>
                      <input
                        ref={docVersoInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e, 'verso')}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone" className={errors.telefone ? "text-destructive" : ""}>Telefone *</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    inputMode="tel"
                    value={formData.telefone}
                    onChange={(e) => updateField('telefone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    autoComplete="tel"
                    className={errors.telefone ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.telefone && <p className="text-xs font-medium text-destructive animate-fade-in">{errors.telefone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome_contato_emergencia" className={errors.nome_contato_emergencia ? "text-destructive" : ""}>Nome do Contato de Emergência *</Label>
                  <Input
                    id="nome_contato_emergencia"
                    value={formData.nome_contato_emergencia}
                    onChange={(e) => updateField('nome_contato_emergencia', e.target.value)}
                    placeholder="Nome completo do contato"
                    className={errors.nome_contato_emergencia ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.nome_contato_emergencia && <p className="text-xs font-medium text-destructive animate-fade-in">{errors.nome_contato_emergencia}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencia" className={errors.contato_emergencia ? "text-destructive" : ""}>Telefone do Contato de Emergência *</Label>
                  <Input
                    id="emergencia"
                    type="tel"
                    inputMode="tel"
                    value={formData.contato_emergencia}
                    onChange={(e) => updateField('contato_emergencia', e.target.value)}
                    placeholder="(00) 00000-0000"
                    className={errors.contato_emergencia ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.contato_emergencia && <p className="text-xs font-medium text-destructive animate-fade-in">{errors.contato_emergencia}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentesco">Parentesco/Relação</Label>
                  <Input
                    id="parentesco"
                    value={formData.parentesco_contato}
                    onChange={(e) => updateField('parentesco_contato', e.target.value)}
                    placeholder="Ex: Mãe, Pai, Cônjuge, Amigo(a)"
                  />
                </div>

                {/* Como conheceu */}
                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Como nos conheceu?
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="como_conheceu">Como conheceu o Templo? *</Label>
                      <select
                        id="como_conheceu"
                        value={formData.como_conheceu}
                        onChange={(e) => updateField('como_conheceu', e.target.value)}
                        className={`w-full h-10 px-3 rounded-md border bg-background text-sm ${errors.como_conheceu ? 'border-red-500' : 'border-input'}`}
                      >
                        <option value="">Selecione...</option>
                        <option value="indicacao">Indicação de amigo/conhecido</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="google">Pesquisa no Google</option>
                        <option value="youtube">YouTube</option>
                        <option value="evento">Evento/Palestra</option>
                        <option value="outro">Outro</option>
                      </select>
                      {errors.como_conheceu && (
                        <p className="text-xs text-red-500">{errors.como_conheceu}</p>
                      )}
                    </div>

                    {formData.como_conheceu === 'indicacao' && (
                      <div className="space-y-2">
                        <Label htmlFor="indicado_por">Quem indicou?</Label>
                        <Input
                          id="indicado_por"
                          value={formData.indicado_por}
                          onChange={(e) => updateField('indicado_por', e.target.value)}
                          placeholder="Nome de quem indicou"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Saúde */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Histórico de Saúde
                </CardTitle>
                <CardDescription>Marque as condições que se aplicam a você ou selecione "Não possuo doenças".</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasContraindicacoes && (
                  <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Atenção: Contraindicações detectadas</p>
                      <p className="text-sm text-muted-foreground">
                        Algumas condições marcadas podem representar contraindicações. 
                        Converse com o facilitador antes de participar.
                      </p>
                    </div>
                  </div>
                )}

                {/* Opção de não ter doenças */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="sem_doencas"
                      checked={formData.sem_doencas}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          // Desmarcar todas as doenças se marcar "não tenho"
                          updateMultipleFields({
                            sem_doencas: true,
                            pressao_alta: false,
                            problemas_cardiacos: false,
                            historico_convulsivo: false,
                            diabetes: false,
                            problemas_respiratorios: false,
                            problemas_renais: false,
                            problemas_hepaticos: false,
                            transtorno_psiquiatrico: false,
                            gestante_lactante: false,
                            uso_antidepressivos: false,
                          });
                        } else {
                          updateField('sem_doencas', false);
                        }
                      }}
                    />
                    <Label htmlFor="sem_doencas" className="cursor-pointer font-medium text-primary">
                      Não possuo nenhuma doença ou condição de saúde
                    </Label>
                  </div>
                </div>

                <div className="space-y-4 md:space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {formData.sem_doencas ? 'Você indicou não possuir doenças.' : 'Marque as condições que se aplicam:'}
                  </p>
                  {[
                    { id: 'pressao_alta', label: 'Pressão Alta (Hipertensão)', warning: true },
                    { id: 'problemas_cardiacos', label: 'Problemas Cardíacos', warning: true },
                    { id: 'historico_convulsivo', label: 'Histórico de Convulsões', warning: true },
                    { id: 'diabetes', label: 'Diabetes', warning: false },
                    { id: 'problemas_respiratorios', label: 'Problemas Respiratórios (Asma, etc.)', warning: false },
                    { id: 'problemas_renais', label: 'Problemas Renais', warning: false },
                    { id: 'problemas_hepaticos', label: 'Problemas Hepáticos (Fígado)', warning: false },
                    { id: 'transtorno_psiquiatrico', label: 'Transtorno Psiquiátrico', warning: true },
                    { id: 'gestante_lactante', label: 'Gestante ou Lactante', warning: true },
                    { id: 'uso_antidepressivos', label: 'Uso de Antidepressivos', warning: true },
                  ].map((item) => (
                    <div key={item.id} className={`flex items-center space-x-3 min-h-[44px] md:min-h-0 ${formData.sem_doencas ? 'opacity-50' : ''}`}>
                      <Checkbox
                        id={item.id}
                        checked={formData[item.id as keyof AnamneseFormData] as boolean}
                        disabled={formData.sem_doencas}
                        onCheckedChange={(checked) => {
                          updateField(item.id as keyof AnamneseFormData, checked as boolean);
                          if (checked) updateField('sem_doencas', false);
                        }}
                      />
                      <Label 
                        htmlFor={item.id} 
                        className={`flex-1 py-2 md:py-0 ${formData.sem_doencas ? 'cursor-not-allowed' : 'cursor-pointer'} ${item.warning && formData[item.id as keyof AnamneseFormData] ? 'text-destructive font-medium' : ''}`}
                      >
                        {item.label}
                        {item.warning && !formData.sem_doencas && <span className="text-xs text-destructive ml-2">(contraindicação)</span>}
                      </Label>
                    </div>
                  ))}

                  {formData.transtorno_psiquiatrico && !formData.sem_doencas && (
                    <div className="space-y-2 ml-7 animate-fade-in">
                      <Label htmlFor="transtorno_qual">Qual transtorno?</Label>
                      <Input
                        id="transtorno_qual"
                        value={formData.transtorno_psiquiatrico_qual}
                        onChange={(e) => updateField('transtorno_psiquiatrico_qual', e.target.value)}
                        placeholder="Descreva o transtorno..."
                      />
                    </div>
                  )}

                  {formData.uso_antidepressivos && !formData.sem_doencas && (
                    <div className="space-y-2 ml-7 animate-fade-in">
                      <Label htmlFor="tipo_antidepressivo">Qual medicamento?</Label>
                      <Input
                        id="tipo_antidepressivo"
                        value={formData.tipo_antidepressivo}
                        onChange={(e) => updateField('tipo_antidepressivo', e.target.value)}
                        placeholder="Nome do antidepressivo..."
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicamentos">Outros medicamentos em uso</Label>
                  <Textarea
                    id="medicamentos"
                    value={formData.uso_medicamentos}
                    onChange={(e) => updateField('uso_medicamentos', e.target.value)}
                    placeholder="Liste outros medicamentos que você usa regularmente..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alergias">Alergias</Label>
                  <Textarea
                    id="alergias"
                    value={formData.alergias}
                    onChange={(e) => updateField('alergias', e.target.value)}
                    placeholder="Liste suas alergias conhecidas ou escreva 'Nenhuma'..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cirurgias">Cirurgias recentes (últimos 6 meses)</Label>
                  <Textarea
                    id="cirurgias"
                    value={formData.cirurgias_recentes}
                    onChange={(e) => updateField('cirurgias_recentes', e.target.value)}
                    placeholder="Descreva cirurgias recentes ou escreva 'Nenhuma'..."
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Substâncias */}
          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <Pill className="w-5 h-5 text-primary" />
                  Uso de Substâncias
                </CardTitle>
                <CardDescription>Informações sobre consumo de substâncias. Seja honesto, isso é importante para sua segurança.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Opção de não ter vícios */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="sem_vicios"
                      checked={formData.sem_vicios}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateMultipleFields({
                            sem_vicios: true,
                            tabaco: false,
                            alcool: false,
                            cannabis: false,
                            tabaco_frequencia: '',
                            alcool_frequencia: '',
                            outras_substancias: '',
                          });
                        } else {
                          updateField('sem_vicios', false);
                        }
                      }}
                    />
                    <Label htmlFor="sem_vicios" className="cursor-pointer font-medium text-primary">
                      Não faço uso de nenhuma substância
                    </Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {formData.sem_vicios ? 'Você indicou não fazer uso de substâncias.' : 'Marque as substâncias que você utiliza:'}
                  </p>
                  
                  <div className="space-y-3">
                    <div className={`flex items-center space-x-3 ${formData.sem_vicios ? 'opacity-50' : ''}`}>
                      <Checkbox
                        id="tabaco"
                        checked={formData.tabaco}
                        disabled={formData.sem_vicios}
                        onCheckedChange={(checked) => {
                          updateField('tabaco', checked as boolean);
                          if (checked) updateField('sem_vicios', false);
                          if (!checked) updateField('tabaco_frequencia', '');
                        }}
                      />
                      <Label htmlFor="tabaco" className={formData.sem_vicios ? 'cursor-not-allowed' : 'cursor-pointer'}>Tabaco (cigarro, charuto, etc.)</Label>
                    </div>
                    {formData.tabaco && !formData.sem_vicios && (
                      <div className="ml-7 animate-fade-in">
                        <Input
                          value={formData.tabaco_frequencia}
                          onChange={(e) => updateField('tabaco_frequencia', e.target.value)}
                          placeholder="Com que frequência? (ex: 10 cigarros/dia)"
                        />
                      </div>
                    )}

                    <div className={`flex items-center space-x-3 ${formData.sem_vicios ? 'opacity-50' : ''}`}>
                      <Checkbox
                        id="alcool"
                        checked={formData.alcool}
                        disabled={formData.sem_vicios}
                        onCheckedChange={(checked) => {
                          updateField('alcool', checked as boolean);
                          if (checked) updateField('sem_vicios', false);
                          if (!checked) updateField('alcool_frequencia', '');
                        }}
                      />
                      <Label htmlFor="alcool" className={formData.sem_vicios ? 'cursor-not-allowed' : 'cursor-pointer'}>Bebidas Alcoólicas</Label>
                    </div>
                    {formData.alcool && !formData.sem_vicios && (
                      <div className="ml-7 animate-fade-in">
                        <Input
                          value={formData.alcool_frequencia}
                          onChange={(e) => updateField('alcool_frequencia', e.target.value)}
                          placeholder="Com que frequência? (ex: socialmente, diariamente)"
                        />
                      </div>
                    )}

                    <div className={`flex items-center space-x-3 ${formData.sem_vicios ? 'opacity-50' : ''}`}>
                      <Checkbox
                        id="cannabis"
                        checked={formData.cannabis}
                        disabled={formData.sem_vicios}
                        onCheckedChange={(checked) => {
                          updateField('cannabis', checked as boolean);
                          if (checked) updateField('sem_vicios', false);
                        }}
                      />
                      <Label htmlFor="cannabis" className={formData.sem_vicios ? 'cursor-not-allowed' : 'cursor-pointer'}>Cannabis (maconha)</Label>
                    </div>
                  </div>

                  <div className={`space-y-2 ${formData.sem_vicios ? 'opacity-50' : ''}`}>
                    <Label htmlFor="outras">Outras substâncias</Label>
                    <Textarea
                      id="outras"
                      value={formData.outras_substancias}
                      onChange={(e) => updateField('outras_substancias', e.target.value)}
                      placeholder="Descreva outras substâncias que você utiliza ou utilizou recentemente..."
                      disabled={formData.sem_vicios}
                    />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 4: Experiência */}
          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Experiência Espiritual
                </CardTitle>
                <CardDescription>Conte-nos sobre suas experiências anteriores e intenções.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="ja_consagrou"
                    checked={formData.ja_consagrou}
                    onCheckedChange={(checked) => {
                      updateField('ja_consagrou', checked as boolean);
                      if (!checked) {
                        updateField('quantas_vezes_consagrou', '');
                        updateField('como_foi_experiencia', '');
                      }
                    }}
                  />
                  <Label htmlFor="ja_consagrou" className="cursor-pointer">
                    Já participei de cerimônias com Ayahuasca ou outras medicinas sagradas
                  </Label>
                </div>

                {formData.ja_consagrou && (
                  <div className="space-y-4 ml-7 animate-fade-in">
                    <div className="space-y-2">
                      <Label htmlFor="quantas_vezes">Quantas vezes aproximadamente?</Label>
                      <Input
                        id="quantas_vezes"
                        value={formData.quantas_vezes_consagrou}
                        onChange={(e) => updateField('quantas_vezes_consagrou', e.target.value)}
                        placeholder="Ex: 5 vezes, mais de 10, primeira vez foi em 2020..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experiencia">Como foram suas experiências?</Label>
                      <Textarea
                        id="experiencia"
                        value={formData.como_foi_experiencia}
                        onChange={(e) => updateField('como_foi_experiencia', e.target.value)}
                        placeholder="Descreva brevemente como foram suas experiências anteriores, se teve dificuldades, como se sentiu..."
                      />
                    </div>
                  </div>
                )}

                {!formData.ja_consagrou && (
                  <div className="p-4 bg-muted rounded-lg animate-fade-in">
                    <p className="text-sm text-muted-foreground">
                      Esta será sua primeira experiência. Não se preocupe, você receberá todas as orientações necessárias antes da cerimônia.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="intencao" className={errors.intencao ? "text-destructive" : ""}>Qual sua intenção ao participar? *</Label>
                  <Textarea
                    id="intencao"
                    value={formData.intencao}
                    onChange={(e) => updateField('intencao', e.target.value)}
                    placeholder="O que você busca nesta jornada? Qual sua intenção? O que te motivou a participar?"
                    className={`min-h-[100px] ${errors.intencao ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  {errors.intencao && <p className="text-xs font-medium text-destructive animate-fade-in">{errors.intencao}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restricao_alimentar">Restrições Alimentares</Label>
                  <Textarea
                    id="restricao_alimentar"
                    value={formData.restricao_alimentar}
                    onChange={(e) => updateField('restricao_alimentar', e.target.value)}
                    placeholder="Vegetariano, vegano, intolerância a lactose, alergia a glúten, etc. Ou escreva 'Nenhuma'"
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 5: Consentimento */}
          {step === 5 && (
            <>
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Termo de Consentimento
                </CardTitle>
                <CardDescription>Leia atentamente e confirme sua concordância.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-lg space-y-3 text-sm">
                  <p><strong>Contraindicações importantes:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Gestantes e lactantes não devem participar</li>
                    <li>Pessoas com transtornos psiquiátricos graves devem consultar previamente</li>
                    <li>Uso de antidepressivos ISRS é contraindicado com Ayahuasca</li>
                    <li>Problemas cardíacos graves podem representar riscos</li>
                    <li>Histórico de convulsões requer avaliação especial</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="aceite1"
                      checked={formData.aceite_contraindicacoes}
                      onCheckedChange={(checked) => updateField('aceite_contraindicacoes', checked as boolean)}
                    />
                    <Label htmlFor="aceite1" className="cursor-pointer text-sm leading-relaxed">
                      Li e compreendi as contraindicações acima. Caso me enquadre em alguma, 
                      comprometo-me a conversar com o facilitador antes da cerimônia.
                    </Label>
                  </div>
                  {errors.aceite_contraindicacoes && (
                    <p className="text-sm text-destructive ml-7">{errors.aceite_contraindicacoes}</p>
                  )}

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="aceite2"
                      checked={formData.aceite_livre_vontade}
                      onCheckedChange={(checked) => updateField('aceite_livre_vontade', checked as boolean)}
                    />
                    <Label htmlFor="aceite2" className="cursor-pointer text-sm leading-relaxed">
                      Declaro que estou participando por livre e espontânea vontade, 
                      ciente de que se trata de uma prática espiritual com uso de medicinas sagradas.
                    </Label>
                  </div>
                  {errors.aceite_livre_vontade && (
                    <p className="text-sm text-destructive ml-7">{errors.aceite_livre_vontade}</p>
                  )}

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="aceite3"
                      checked={formData.aceite_termo_responsabilidade}
                      onCheckedChange={(checked) => updateField('aceite_termo_responsabilidade', checked as boolean)}
                    />
                    <Label htmlFor="aceite3" className="cursor-pointer text-sm leading-relaxed">
                      Aceito o termo de responsabilidade e me comprometo a seguir 
                      as orientações do facilitador durante toda a cerimônia.
                    </Label>
                  </div>
                  {errors.aceite_termo_responsabilidade && (
                    <p className="text-sm text-destructive ml-7">{errors.aceite_termo_responsabilidade}</p>
                  )}
                </div>

                {/* Aceite de Permanência no Templo */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                  <p className="font-medium text-primary flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Permanência no Templo
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Por segurança e bem-estar de todos, é importante que você permaneça no templo 
                    até que esteja em condições adequadas para sair, especialmente se ainda estiver 
                    sob efeito das medicinas sagradas.
                  </p>
                  <div className="flex items-start space-x-3 pt-2">
                    <Checkbox
                      id="aceite_permanencia"
                      checked={formData.aceite_permanencia}
                      onCheckedChange={(checked) => updateField('aceite_permanencia', checked as boolean)}
                    />
                    <Label htmlFor="aceite_permanencia" className="cursor-pointer text-sm leading-relaxed">
                      <strong>Declaro</strong> que me comprometo a permanecer no templo até que esteja 
                      em plenas condições físicas e mentais para sair com segurança, respeitando o tempo 
                      necessário para integração da experiência.
                    </Label>
                  </div>
                  {errors.aceite_permanencia && (
                    <p className="text-sm text-destructive ml-7">{errors.aceite_permanencia}</p>
                  )}
                </div>

                {/* Autorização de Uso de Imagem */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg space-y-3">
                  <p className="font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Autorização de Uso de Imagem
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Durante as cerimônias e eventos, podem ser feitos registros fotográficos e de vídeo 
                    para divulgação nas redes sociais e materiais institucionais da Consciência Divinal.
                  </p>
                  <div className="flex items-start space-x-3 pt-2">
                    <Checkbox
                      id="aceite_imagem"
                      checked={formData.aceite_uso_imagem}
                      onCheckedChange={(checked) => updateField('aceite_uso_imagem', checked as boolean)}
                    />
                    <Label htmlFor="aceite_imagem" className="cursor-pointer text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                      <strong>Autorizo</strong> o uso da minha imagem em fotos e vídeos para divulgação 
                      nas redes sociais e materiais da Consciência Divinal. Entendo que posso solicitar 
                      a remoção de qualquer conteúdo a qualquer momento.
                    </Label>
                  </div>
                  {!formData.aceite_uso_imagem && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                      Caso não autorize, sua imagem não será utilizada em nenhum material de divulgação.
                    </p>
                  )}
                </div>
              </CardContent>
            </>
          )}

          {/* Step 6: Assinatura e Confirmação */}
          {step === 6 && (
            <>
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Confirmação e Assinatura
                </CardTitle>
                <CardDescription>
                  Revise seus dados básicos e assine para finalizar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Resumo Rápido para Confirmação */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl border text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Identificação</p>
                    <p><strong>Nome:</strong> {formData.nome_completo}</p>
                    <p><strong>{formData.documento_tipo?.toUpperCase()}:</strong> {formData.documento_valor}</p>
                    <p><strong>Nascimento:</strong> {formatDate(formData.data_nascimento)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Contato</p>
                    <p><strong>Telefone:</strong> {formData.telefone}</p>
                    <p><strong>Emergência:</strong> {formData.nome_contato_emergencia} ({formData.contato_emergencia})</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Assinatura Digital *</Label>
                  
                  {!formData.assinatura ? (
                    <Button 
                      type="button"
                      variant="outline" 
                      className="w-full h-32 border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 flex flex-col gap-2 transition-all group"
                      onClick={() => setIsFullScreenSignature(true)}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-medium text-primary">Clique aqui para assinar</span>
                      <span className="text-xs text-muted-foreground">(A tela mudará para horizontal para facilitar)</span>
                    </Button>
                  ) : (
                    <div className="relative group">
                      <div className="bg-white rounded-xl border-2 border-primary/20 p-4 flex flex-col items-center shadow-inner overflow-hidden">
                        <img 
                          src={formData.assinatura} 
                          alt="Sua assinatura" 
                          className="max-h-32 object-contain"
                        />
                        <div className="mt-2 w-full border-t border-slate-100 pt-2 text-center">
                          <p className="text-[10px] text-slate-400 font-mono uppercase">
                            Assinado digitalmente em {new Date().toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="icon" 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => updateField('assinatura', '')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <p className="text-center mt-2">
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => setIsFullScreenSignature(true)}
                        >
                          Refazer assinatura
                        </Button>
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Ao finalizar, você confirma que todas as informações prestadas são verdadeiras e que 
                    compreende os termos e responsabilidades aceitos.
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between p-6 pt-0">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            {step < 6 ? (
              <Button onClick={nextStep}>
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading || !formData.assinatura}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {existingAnamnese ? 'Atualizar e Finalizar' : 'Salvar e Finalizar'}
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
          </Card>
        </div>
      </div>
    </>
  );
};

// Modal de Contraindicação
const ContraindicacaoModal = ({ 
  open, 
  onClose, 
  whatsappUrl,
  nomeUsuario 
}: { 
  open: boolean; 
  onClose: () => void;
  whatsappUrl: string;
  nomeUsuario: string;
}) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="w-5 h-5" />
          Atenção: Contraindicações Identificadas
        </DialogTitle>
        <DialogDescription className="text-left pt-2">
          Olá, {nomeUsuario?.split(' ')[0] || 'participante'}! Sua ficha foi salva com sucesso.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-2">
        <p className="text-sm text-muted-foreground">
          Identificamos que você possui algumas condições de saúde que podem representar 
          <strong> contraindicações</strong> para participação nas cerimônias.
        </p>
        
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Importante:</strong> Antes de se inscrever em qualquer cerimônia, 
            é necessário conversar com nosso líder facilitador <strong>Raimundo Ferreira Lima</strong> 
            para avaliar sua situação e garantir sua segurança.
          </p>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Clique no botão abaixo para iniciar uma conversa pelo WhatsApp:
        </p>
      </div>
      
      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={onClose}>
          Entendi
        </Button>
        <Button 
          className="gap-2 bg-green-600 hover:bg-green-700"
          onClick={() => window.open(whatsappUrl, '_blank')}
        >
          <MessageCircle className="w-4 h-4" />
          Falar com Raimundo
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default Anamnese;
