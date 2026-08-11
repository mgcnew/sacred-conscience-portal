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
  ChevronDown,
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
  Pencil,
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
import { cn } from '@/lib/utils';
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
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['dados', 'saude', 'substancias', 'experiencia', 'termos'])
  );
  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Estados para upload de documentos
  const [documentoFrenteUrl, setDocumentoFrenteUrl] = useState<string | null>(null);
  const [documentoVersoUrl, setDocumentoVersoUrl] = useState<string | null>(null);
  const [isUploadingDocFrente, setIsUploadingDocFrente] = useState(false);
  const [isUploadingDocVerso, setIsUploadingDocVerso] = useState(false);
  const docFrenteInputRef = useRef<HTMLInputElement>(null);
  const docVersoInputRef = useRef<HTMLInputElement>(null);
  const docFrenteCameraRef = useRef<HTMLInputElement>(null);
  const docVersoCameraRef = useRef<HTMLInputElement>(null);

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

        // Carregar URLs das fotos do documento nos estados locais
        if (data.documento_frente_url) setDocumentoFrenteUrl(data.documento_frente_url);
        if (data.documento_verso_url) setDocumentoVersoUrl(data.documento_verso_url);

        // Verificar se faltam novos campos obrigatórios
        const incomplete = !mapped.documento_valor || !mapped.assinatura;
        setIsIncomplete(incomplete);
        
        setViewMode(prev => prev === 'edit' ? 'edit' : 'view'); // Preserva edição em andamento
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
      // Limpar inputs para permitir re-upload do mesmo arquivo
      if (side === 'frente') {
        if (docFrenteInputRef.current) docFrenteInputRef.current.value = '';
        if (docFrenteCameraRef.current) docFrenteCameraRef.current.value = '';
      }
      if (side === 'verso') {
        if (docVersoInputRef.current) docVersoInputRef.current.value = '';
        if (docVersoCameraRef.current) docVersoCameraRef.current.value = '';
      }
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
    setStepDirection('forward');
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

    const handleOpen = () => {
      try {
        screen.orientation?.lock?.('landscape').catch(() => {});
      } catch {}
    };

    const handleClose = () => {
      try {
        screen.orientation?.unlock?.();
      } catch {}
      setIsFullScreenSignature(false);
    };

    const handleSave = () => {
      if (sigPad.current && !sigPad.current.isEmpty()) {
        updateField('assinatura', sigPad.current.toDataURL());
        try { screen.orientation?.unlock?.(); } catch {}
        setIsFullScreenSignature(false);
        toast.success('Assinatura salva!', { description: 'Sua assinatura foi capturada com sucesso.' });
      } else {
        toast.error('Assinatura vazia', { description: 'Por favor, faça sua assinatura antes de salvar.' });
      }
    };

    return (
      <div
        className="fixed inset-0 z-[100] bg-background flex flex-col animate-in fade-in duration-300 overflow-hidden"
        ref={(el) => { if (el) handleOpen(); }}
      >
        <div className="w-full h-full flex flex-col p-3 md:p-8 gap-3 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Assinatura Digital
              </h3>
              <p className="text-xs text-muted-foreground">
                Assine no campo abaixo com o dedo ou caneta.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-white rounded-2xl border-4 border-muted shadow-2xl overflow-hidden relative cursor-crosshair">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
              <FileText className="w-64 h-64 -rotate-12" />
            </div>

            {/* Linha guia */}
            <div className="absolute bottom-[30%] left-[5%] right-[5%] pointer-events-none">
              <div className="border-b-2 border-dashed border-border" />
              <p className="text-[10px] text-muted-foreground mt-1 select-none">Assine acima desta linha</p>
            </div>

            <SignatureCanvas
              ref={sigPad}
              penColor="black"
              minWidth={1.5}
              maxWidth={3}
              canvasProps={{ className: 'signature-canvas w-full h-full' }}
            />
          </div>

          {/* Dica mobile portrait */}
          <div className="flex md:hidden items-center justify-center gap-2 text-xs text-muted-foreground portrait:flex landscape:hidden">
            <RotateCcw className="w-3 h-3 animate-pulse" />
            <span>Vire o celular na horizontal para mais espaço</span>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => sigPad.current?.clear()}
              className="gap-2 shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              Limpar
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <Check className="w-4 h-4" />
              Salvar
            </Button>
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
            <span className={value ? 'text-success' : 'text-muted-foreground'}>
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
    const AccordionSection = ({
      id, icon: Icon, title, iconBg, iconColor, children,
    }: {
      id: string; icon: React.ElementType; title: string;
      iconBg: string; iconColor: string; children: React.ReactNode;
    }) => {
      const isOpen = openSections.has(id);
      return (
        <Card className="overflow-hidden border-border/60">
          <button
            type="button"
            onClick={() => toggleSection(id)}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
          >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
              <Icon className={cn('w-5 h-5', iconColor)} />
            </div>
            <span className="font-display text-base font-semibold flex-1">{title}</span>
            <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')} />
          </button>
          {isOpen && (
            <div className="px-4 pb-4 border-t border-border/40">
              {children}
            </div>
          )}
        </Card>
      );
    };

    return (
      <>
        {renderContraindicacaoModal()}
        <div className="min-h-screen py-4 md:py-6">
          <div className="container max-w-2xl mx-auto space-y-4">

            {/* Alerta de Ficha Incompleta */}
            {isIncomplete && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-destructive text-sm">Atualização Necessária</h3>
                    <p className="text-xs text-destructive/80 mt-1 leading-relaxed">
                      Adicionamos os campos de <strong>Documento</strong> e <strong>Assinatura Digital</strong>. Por favor, atualize sua ficha.
                    </p>
                    <Button variant="destructive" size="sm" className="mt-2 h-7 text-xs" onClick={() => setViewMode('edit')}>
                      Atualizar Agora
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Hero card */}
            <Card className="overflow-hidden border-primary/20">
              <div className="h-1.5 bg-primary" />
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <Avatar className="w-16 h-16 border-4 border-primary/20 shadow-md">
                      <AvatarImage src={avatarUrl || undefined} alt={formData.nome_completo} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                        {formData.nome_completo?.charAt(0)?.toUpperCase() || <User className="w-6 h-6" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-background flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display text-lg font-semibold text-foreground leading-tight truncate">
                      {formData.nome_completo || 'Participante'}
                    </h2>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      <Badge variant="outline" className="h-5 text-[10px] bg-success-subtle text-success dark:bg-success-subtle dark:text-success border-success/30 dark:border-success">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Ficha completa
                      </Badge>
                      {hasContraindicacoes && (
                        <Badge variant="outline" className="h-5 text-[10px] bg-warning-subtle text-warning dark:bg-warning-subtle dark:text-warning border-warning/30">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Atenção
                        </Badge>
                      )}
                    </div>
                    {updatedAt && (
                      <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Atualizado {new Date(updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setViewMode('edit')} className="gap-1.5 h-8 text-xs">
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => window.print()} className="gap-1.5 h-8 text-xs text-muted-foreground">
                      <Download className="w-3.5 h-3.5" />
                      Imprimir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumo visual */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className={cn('p-3 rounded-xl border', hasContraindicacoes ? 'bg-warning-subtle border-warning/30 dark:border-warning' : 'bg-success-subtle border-success/30 dark:border-success')}>
                <Heart className={cn('w-4 h-4 mb-1.5', hasContraindicacoes ? 'text-warning' : 'text-success')} />
                <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Saúde</p>
                <p className={cn('text-sm font-semibold', hasContraindicacoes ? 'text-warning' : 'text-success')}>
                  {hasContraindicacoes ? 'Atenção' : 'OK'}
                </p>
              </div>
              <div className={cn('p-3 rounded-xl border', formData.sem_vicios ? 'bg-success-subtle border-success/30 dark:border-success' : 'bg-info-subtle border-info/30 dark:border-info')}>
                <Pill className={cn('w-4 h-4 mb-1.5', formData.sem_vicios ? 'text-success' : 'text-info')} />
                <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Substâncias</p>
                <p className={cn('text-sm font-semibold', formData.sem_vicios ? 'text-success' : 'text-info')}>
                  {formData.sem_vicios ? 'Nenhuma' : 'Declarado'}
                </p>
              </div>
              <div className={cn('p-3 rounded-xl border', formData.ja_consagrou ? 'bg-primary/12 border-primary/30 dark:border-primary' : 'bg-muted/50 border-border')}>
                <Sparkles className={cn('w-4 h-4 mb-1.5', formData.ja_consagrou ? 'text-primary' : 'text-muted-foreground')} />
                <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Experiência</p>
                <p className={cn('text-sm font-semibold', formData.ja_consagrou ? 'text-primary' : 'text-muted-foreground')}>
                  {formData.ja_consagrou ? 'Experiente' : '1ª vez'}
                </p>
              </div>
              <div className={cn('p-3 rounded-xl border', formData.aceite_permanencia ? 'bg-success-subtle border-success/30 dark:border-success' : 'bg-destructive-subtle border-destructive/30 dark:border-destructive')}>
                <FileText className={cn('w-4 h-4 mb-1.5', formData.aceite_permanencia ? 'text-success' : 'text-destructive')} />
                <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Termos</p>
                <p className={cn('text-sm font-semibold', formData.aceite_permanencia ? 'text-success' : 'text-destructive')}>
                  {formData.aceite_permanencia ? 'Aceitos' : 'Pendente'}
                </p>
              </div>
            </div>

            {/* Seções accordion */}
            <AccordionSection id="dados" icon={User} title="Dados Pessoais" iconBg="bg-info-subtle" iconColor="text-info">
              <div className="pt-3">
                <InfoItem label="Nome Completo" value={formData.nome_completo} icon={User} />
                <InfoItem label="Data de Nascimento" value={formatDate(formData.data_nascimento)} icon={Calendar} />
                <InfoItem label={formData.documento_tipo?.toUpperCase() || 'Documento'} value={formData.documento_valor} icon={Shield} />
                <InfoItem label="Telefone" value={formData.telefone} icon={Phone} />
                <InfoItem label="Contato de Emergência" value={formData.nome_contato_emergencia} icon={User} />
                <InfoItem label="Telefone de Emergência" value={formData.contato_emergencia} icon={Phone} />
                <InfoItem label="Parentesco" value={formData.parentesco_contato} icon={Shield} />
                <InfoItem
                  label="Como conheceu"
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
              </div>
            </AccordionSection>

            {(documentoFrenteUrl || documentoVersoUrl) && (
              <AccordionSection id="documento" icon={IdCard} title="Fotos do Documento" iconBg="bg-muted" iconColor="text-muted-foreground">
                <div className="pt-3 grid grid-cols-2 gap-3">
                  {documentoFrenteUrl && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Frente</p>
                      <div className="rounded-lg overflow-hidden border bg-muted aspect-[3/2]">
                        <img src={documentoFrenteUrl} alt="Frente" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                  {documentoVersoUrl && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Verso</p>
                      <div className="rounded-lg overflow-hidden border bg-muted aspect-[3/2]">
                        <img src={documentoVersoUrl} alt="Verso" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              </AccordionSection>
            )}

            <AccordionSection id="saude" icon={Heart} title="Histórico de Saúde" iconBg="bg-destructive-subtle" iconColor="text-destructive">
              <div className="pt-3">
                {formData.sem_doencas ? (
                  <p className="text-success font-medium text-sm py-1 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Não possui doenças ou condições de saúde
                  </p>
                ) : (
                  <div>
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
                  </div>
                )}
                <InfoItem label="Outros medicamentos" value={formData.uso_medicamentos} />
                <InfoItem label="Alergias" value={formData.alergias} />
                <InfoItem label="Cirurgias recentes" value={formData.cirurgias_recentes} />
              </div>
            </AccordionSection>

            <AccordionSection id="substancias" icon={Pill} title="Uso de Substâncias" iconBg="bg-warning-subtle" iconColor="text-warning">
              <div className="pt-3">
                {formData.sem_vicios ? (
                  <p className="text-success font-medium text-sm py-1 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Não faz uso de substâncias
                  </p>
                ) : (
                  <div>
                    {formData.tabaco && <InfoItem label="Tabaco" value={formData.tabaco_frequencia || 'Sim'} />}
                    {formData.alcool && <InfoItem label="Álcool" value={formData.alcool_frequencia || 'Sim'} />}
                    {formData.cannabis && <InfoItem label="Cannabis" value={true} />}
                    {formData.outras_substancias && <InfoItem label="Outras" value={formData.outras_substancias} />}
                  </div>
                )}
              </div>
            </AccordionSection>

            <AccordionSection id="experiencia" icon={Sparkles} title="Experiência Espiritual" iconBg="bg-primary/12 dark:bg-primary/20" iconColor="text-primary">
              <div className="pt-3">
                <InfoItem label="Já participou de cerimônias" value={formData.ja_consagrou} />
                {formData.ja_consagrou && (
                  <>
                    <InfoItem label="Quantas vezes" value={formData.quantas_vezes_consagrou} />
                    <InfoItem label="Como foi a experiência" value={formData.como_foi_experiencia} />
                  </>
                )}
                <InfoItem label="Intenção" value={formData.intencao} />
                <InfoItem label="Restrições alimentares" value={formData.restricao_alimentar} />
              </div>
            </AccordionSection>

            <AccordionSection id="termos" icon={CheckCircle2} title="Termos e Assinatura" iconBg="bg-success-subtle" iconColor="text-success">
              <div className="pt-3 space-y-2">
                {[
                  { key: 'aceite_contraindicacoes', label: 'Contraindicações aceitas', value: formData.aceite_contraindicacoes },
                  { key: 'aceite_livre_vontade', label: 'Livre vontade confirmada', value: formData.aceite_livre_vontade },
                  { key: 'aceite_termo_responsabilidade', label: 'Termo de responsabilidade aceito', value: formData.aceite_termo_responsabilidade },
                  { key: 'aceite_permanencia', label: 'Permanência no templo aceita', value: formData.aceite_permanencia },
                ].map(item => (
                  <div key={item.key} className={cn('flex items-center gap-2 text-sm', item.value ? 'text-success' : 'text-destructive')}>
                    {item.value ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
                    <span>{item.label}</span>
                  </div>
                ))}
                <div className={cn('flex items-center gap-2 text-sm', formData.aceite_uso_imagem ? 'text-warning' : 'text-muted-foreground')}>
                  <Camera className="w-4 h-4 shrink-0" />
                  <span>Uso de imagem {formData.aceite_uso_imagem ? 'autorizado' : 'não autorizado'}</span>
                </div>
                {formData.assinatura && (
                  <div className="pt-4 border-t border-border mt-2">
                    <p className="text-xs text-muted-foreground mb-2">Assinado digitalmente:</p>
                    <div className="bg-white rounded-lg border p-3 flex flex-col items-center">
                      <img src={formData.assinatura} alt="Assinatura" className="max-h-20 object-contain" />
                      <p className="text-[10px] text-muted-foreground font-mono uppercase mt-2 border-t border-border pt-2 w-full text-center">
                        ID: {user?.id.substring(0, 8)} | {new Date().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </AccordionSection>

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
          <div className="mb-6 p-4 rounded-xl bg-warning-subtle border border-warning/30 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-warning">
                  Preenchimento Obrigatório
                </h3>
                <p className="text-sm text-warning">
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
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 ring-4 ring-primary/10">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-medium text-foreground mb-2">
            {viewMode === 'edit' ? 'Atualize sua Ficha' : 'Sua Ficha de Saúde'}
          </h1>
          <p className="text-muted-foreground font-body text-sm max-w-sm mx-auto leading-relaxed">
            {viewMode === 'edit'
              ? 'Atualize suas informações para que possamos continuar cuidando de você.'
              : formData.nome_completo
                ? `Olá, ${formData.nome_completo.split(' ')[0]}! Leva poucos minutos e é fundamental para sua segurança.`
                : 'Estas informações são confidenciais e essenciais para sua segurança nas cerimônias.'}
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

        {/* Stepper — mobile */}
        <div className="sm:hidden flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md shadow-primary/30">
              {step}
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Passo {step} de {steps.length}</p>
              <p className="text-sm font-semibold">{steps[step - 1].title}</p>
            </div>
          </div>
          <div className="flex gap-1 items-center">
            {lastSaved && (
              <Cloud className="w-3 h-3 text-success mr-1" />
            )}
            {steps.map((s) => (
              <div
                key={s.number}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s.number < step ? 'w-5 bg-primary' :
                  s.number === step ? 'w-5 bg-primary/60' :
                  'w-3 bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stepper — desktop */}
        <div className="hidden sm:flex items-start justify-center mb-8 px-2">
          {steps.map((s, i) => (
            <React.Fragment key={s.number}>
              <button
                type="button"
                onClick={() => { if (s.number < step) { setStepDirection('backward'); setStep(s.number); } }}
                className={`flex flex-col items-center gap-1.5 ${s.number < step ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  step === s.number
                    ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110'
                    : step > s.number
                    ? 'bg-primary/15 border-primary text-primary'
                    : 'bg-background border-border text-muted-foreground'
                }`}>
                  {step > s.number ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                </div>
                <span className={`text-[11px] font-medium whitespace-nowrap transition-colors ${
                  step === s.number ? 'text-primary' :
                  step > s.number ? 'text-primary/70' :
                  'text-muted-foreground'
                }`}>
                  {s.title}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mt-4 mx-1 transition-all duration-500 ${
                  step > s.number + 1 ? 'bg-primary' :
                  step > s.number ? 'bg-primary/40' :
                  'bg-border'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {lastSaved && (
          <div className="hidden sm:flex justify-center mb-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Cloud className="w-3 h-3 text-success" />
              Rascunho salvo automaticamente
            </span>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Progresso</span>
            <span className="text-xs font-semibold text-primary">{calculateProgress()}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <Card key={step} className={stepDirection === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'}>
          {/* Step 1: Dados Pessoais */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-info-subtle flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-info" />
                  </div>
                  Dados Pessoais
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed pt-1">
                  Precisamos conhecer você para garantir um acolhimento personalizado e seguro.
                </CardDescription>
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
                      <div className="relative border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center gap-3 min-h-[140px]">
                        {documentoFrenteUrl ? (
                          <>
                            <img
                              src={documentoFrenteUrl}
                              alt="Frente do documento"
                              className="max-h-[120px] rounded object-contain"
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-background border border-border rounded-full p-1 hover:bg-destructive hover:text-white transition-colors"
                              onClick={() => setDocumentoFrenteUrl(null)}
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              className="text-xs text-primary underline"
                              onClick={() => docFrenteInputRef.current?.click()}
                            >
                              Trocar imagem
                            </button>
                          </>
                        ) : isUploadingDocFrente ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <span className="text-xs text-muted-foreground">Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground text-center">Escolha como enviar:</span>
                            <div className="flex gap-2 w-full">
                              <button
                                type="button"
                                className="flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 transition-colors text-xs font-medium"
                                onClick={() => docFrenteCameraRef.current?.click()}
                              >
                                <Camera className="w-4 h-4" />
                                Câmera
                              </button>
                              <button
                                type="button"
                                className="flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 transition-colors text-xs font-medium"
                                onClick={() => docFrenteInputRef.current?.click()}
                              >
                                <Upload className="w-4 h-4" />
                                Galeria
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      <input
                        ref={docFrenteCameraRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e, 'frente')}
                      />
                      <input
                        ref={docFrenteInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e, 'frente')}
                      />
                    </div>

                    {/* Verso */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Verso do Documento {formData.documento_tipo === 'rg' ? '' : '(se RG)'}</Label>
                      <div className="relative border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center gap-3 min-h-[140px]">
                        {documentoVersoUrl ? (
                          <>
                            <img
                              src={documentoVersoUrl}
                              alt="Verso do documento"
                              className="max-h-[120px] rounded object-contain"
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-background border border-border rounded-full p-1 hover:bg-destructive hover:text-white transition-colors"
                              onClick={() => setDocumentoVersoUrl(null)}
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              className="text-xs text-primary underline"
                              onClick={() => docVersoInputRef.current?.click()}
                            >
                              Trocar imagem
                            </button>
                          </>
                        ) : isUploadingDocVerso ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <span className="text-xs text-muted-foreground">Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground text-center">Escolha como enviar:</span>
                            <div className="flex gap-2 w-full">
                              <button
                                type="button"
                                className="flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 transition-colors text-xs font-medium"
                                onClick={() => docVersoCameraRef.current?.click()}
                              >
                                <Camera className="w-4 h-4" />
                                Câmera
                              </button>
                              <button
                                type="button"
                                className="flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 transition-colors text-xs font-medium"
                                onClick={() => docVersoInputRef.current?.click()}
                              >
                                <Upload className="w-4 h-4" />
                                Galeria
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      <input
                        ref={docVersoCameraRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e, 'verso')}
                      />
                      <input
                        ref={docVersoInputRef}
                        type="file"
                        accept="image/*"
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
                        className={`w-full h-10 px-3 rounded-md border bg-background text-sm ${errors.como_conheceu ? 'border-destructive' : 'border-input'}`}
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
                        <p className="text-xs text-destructive">{errors.como_conheceu}</p>
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
                <CardTitle className="font-display text-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-destructive-subtle flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 text-destructive" />
                  </div>
                  Histórico de Saúde
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed pt-1">
                  A Ayahuasca interage com o organismo de formas específicas. Seja honesto — estas informações são confidenciais e nos ajudam a cuidar de você com segurança.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {hasContraindicacoes && (
                  <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-destructive text-sm">Atenção: Contraindicações detectadas</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Algumas condições marcadas podem representar contraindicações.
                        Converse com o facilitador antes de participar.
                      </p>
                    </div>
                  </div>
                )}

                {/* Opção de não ter doenças */}
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.sem_doencas) {
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
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    formData.sem_doencas
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    formData.sem_doencas ? 'bg-primary border-primary' : 'border-muted-foreground'
                  }`}>
                    {formData.sem_doencas && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="font-medium text-sm">Não possuo nenhuma doença ou condição de saúde</span>
                </button>

                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {formData.sem_doencas ? 'Nenhuma condição selecionada' : 'Selecione as condições que se aplicam a você:'}
                  </p>
                  <div className={`grid grid-cols-2 gap-2 transition-opacity ${formData.sem_doencas ? 'opacity-40 pointer-events-none' : ''}`}>
                    {[
                      { id: 'pressao_alta', label: 'Pressão Alta', sub: 'Hipertensão', warning: true },
                      { id: 'problemas_cardiacos', label: 'Prob. Cardíacos', sub: null, warning: true },
                      { id: 'historico_convulsivo', label: 'Convulsões', sub: 'Histórico', warning: true },
                      { id: 'diabetes', label: 'Diabetes', sub: null, warning: false },
                      { id: 'problemas_respiratorios', label: 'Prob. Respiratórios', sub: 'Asma, etc.', warning: false },
                      { id: 'problemas_renais', label: 'Prob. Renais', sub: null, warning: false },
                      { id: 'problemas_hepaticos', label: 'Prob. Hepáticos', sub: 'Fígado', warning: false },
                      { id: 'transtorno_psiquiatrico', label: 'Transtorno Psiq.', sub: null, warning: true },
                      { id: 'gestante_lactante', label: 'Gestante/Lactante', sub: null, warning: true },
                      { id: 'uso_antidepressivos', label: 'Antidepressivos', sub: 'Em uso', warning: true },
                    ].map((item) => {
                      const isChecked = formData[item.id as keyof AnamneseFormData] as boolean;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            updateField(item.id as keyof AnamneseFormData, !isChecked);
                            if (!isChecked) updateField('sem_doencas', false);
                          }}
                          className={`flex items-start gap-2 p-2.5 rounded-xl border-2 text-left transition-all ${
                            isChecked
                              ? item.warning
                                ? 'bg-destructive/10 border-destructive'
                                : 'bg-primary/10 border-primary'
                              : 'bg-background border-border hover:border-primary/30'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all ${
                            isChecked
                              ? item.warning ? 'bg-destructive border-destructive' : 'bg-primary border-primary'
                              : 'border-muted-foreground/40'
                          }`}>
                            {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-medium leading-tight block ${isChecked && item.warning ? 'text-destructive' : isChecked ? 'text-primary' : 'text-foreground'}`}>
                              {item.label}
                            </span>
                            {item.sub && <span className="text-[10px] text-muted-foreground">{item.sub}</span>}
                            {item.warning && <span className={`text-[9px] font-medium block mt-0.5 ${isChecked ? 'text-destructive/80' : 'text-muted-foreground/50'}`}>⚠ atenção</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {formData.transtorno_psiquiatrico && !formData.sem_doencas && (
                    <div className="space-y-2 animate-fade-in">
                      <Label htmlFor="transtorno_qual">Qual transtorno psiquiátrico?</Label>
                      <Input
                        id="transtorno_qual"
                        value={formData.transtorno_psiquiatrico_qual}
                        onChange={(e) => updateField('transtorno_psiquiatrico_qual', e.target.value)}
                        placeholder="Descreva o transtorno..."
                      />
                    </div>
                  )}

                  {formData.uso_antidepressivos && !formData.sem_doencas && (
                    <div className="space-y-2 animate-fade-in">
                      <Label htmlFor="tipo_antidepressivo">Qual antidepressivo?</Label>
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
                <CardTitle className="font-display text-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-warning-subtle flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5 text-warning" />
                  </div>
                  Uso de Substâncias
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed pt-1">
                  Substâncias podem interagir com a medicina sagrada. Não há julgamentos aqui — apenas cuidado com a sua segurança e bem-estar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Opção de não usar substâncias */}
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.sem_vicios) {
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
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    formData.sem_vicios
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    formData.sem_vicios ? 'bg-primary border-primary' : 'border-muted-foreground'
                  }`}>
                    {formData.sem_vicios && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="font-medium text-sm">Não faço uso de nenhuma substância</span>
                </button>

                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {formData.sem_vicios ? 'Nenhuma substância selecionada' : 'Selecione as que se aplicam:'}
                  </p>
                  <div className={`grid grid-cols-2 gap-2 transition-opacity ${formData.sem_vicios ? 'opacity-40 pointer-events-none' : ''}`}>
                    {[
                      { id: 'tabaco', label: 'Tabaco', sub: 'cigarro, charuto...' },
                      { id: 'alcool', label: 'Bebidas Alcoólicas', sub: null },
                      { id: 'cannabis', label: 'Cannabis', sub: 'maconha' },
                    ].map((item) => {
                      const isChecked = formData[item.id as keyof AnamneseFormData] as boolean;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            updateField(item.id as keyof AnamneseFormData, !isChecked);
                            if (!isChecked) updateField('sem_vicios', false);
                            if (isChecked && item.id === 'tabaco') updateField('tabaco_frequencia', '');
                            if (isChecked && item.id === 'alcool') updateField('alcool_frequencia', '');
                          }}
                          className={`flex items-start gap-2 p-2.5 rounded-xl border-2 text-left transition-all ${
                            isChecked
                              ? 'bg-primary/10 border-primary'
                              : 'bg-background border-border hover:border-primary/30'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all ${
                            isChecked ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                          }`}>
                            {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-medium leading-tight block ${isChecked ? 'text-primary' : 'text-foreground'}`}>
                              {item.label}
                            </span>
                            {item.sub && <span className="text-[10px] text-muted-foreground">{item.sub}</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {formData.tabaco && !formData.sem_vicios && (
                    <div className="space-y-1.5 animate-fade-in">
                      <Label className="text-xs">Com que frequência usa tabaco?</Label>
                      <Input
                        value={formData.tabaco_frequencia}
                        onChange={(e) => updateField('tabaco_frequencia', e.target.value)}
                        placeholder="Ex: 10 cigarros/dia, socialmente..."
                      />
                    </div>
                  )}

                  {formData.alcool && !formData.sem_vicios && (
                    <div className="space-y-1.5 animate-fade-in">
                      <Label className="text-xs">Com que frequência consome álcool?</Label>
                      <Input
                        value={formData.alcool_frequencia}
                        onChange={(e) => updateField('alcool_frequencia', e.target.value)}
                        placeholder="Ex: socialmente, diariamente..."
                      />
                    </div>
                  )}

                  <div className={`space-y-1.5 ${formData.sem_vicios ? 'opacity-40 pointer-events-none' : ''}`}>
                    <Label htmlFor="outras" className="text-xs">Outras substâncias</Label>
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
                <CardTitle className="font-display text-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/12 dark:bg-primary/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  Experiência Espiritual
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed pt-1">Conhecer sua jornada nos ajuda a oferecer o suporte certo antes, durante e após a cerimônia.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    const newVal = !formData.ja_consagrou;
                    updateField('ja_consagrou', newVal);
                    if (!newVal) {
                      updateField('quantas_vezes_consagrou', '');
                      updateField('como_foi_experiencia', '');
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    formData.ja_consagrou
                      ? 'bg-primary/12 border-primary'
                      : 'bg-background border-border hover:border-primary/40 dark:border-primary/50 text-muted-foreground'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    formData.ja_consagrou ? 'bg-primary border-primary' : 'border-muted-foreground'
                  }`}>
                    {formData.ja_consagrou && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${formData.ja_consagrou ? 'text-primary' : ''}`}>
                      Já participei de cerimônias
                    </p>
                    <p className="text-xs text-muted-foreground">Ayahuasca ou outras medicinas sagradas</p>
                  </div>
                </button>

                {formData.ja_consagrou && (
                  <div className="space-y-4 border-l-2 border-primary/30 dark:border-primary pl-4 ml-2 animate-fade-in">
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
                <CardTitle className="font-display text-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-success-subtle flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  Termos e Consentimento
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed pt-1">
                  Estes são compromissos reais. Por favor, leia cada item com atenção antes de aceitar — eles existem para proteger você.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Resumo de contraindicações */}
                <div className="p-3 bg-muted/60 rounded-xl border text-xs space-y-1.5">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                    Contraindicações da Ayahuasca:
                  </p>
                  <ul className="space-y-0.5 text-muted-foreground list-disc list-inside">
                    <li>Gestantes e lactantes não devem participar</li>
                    <li>Transtornos psiquiátricos graves requerem consulta prévia</li>
                    <li>Antidepressivos ISRS são contraindicados com Ayahuasca</li>
                    <li>Problemas cardíacos graves podem representar riscos</li>
                    <li>Histórico de convulsões requer avaliação especial</li>
                  </ul>
                </div>

                {/* Cards de aceite */}
                {[
                  {
                    id: 'aceite_contraindicacoes',
                    field: 'aceite_contraindicacoes' as keyof AnamneseFormData,
                    icon: AlertTriangle,
                    title: 'Contraindicações',
                    text: 'Li e compreendi as contraindicações acima. Caso me enquadre em alguma, comprometo-me a conversar com o facilitador antes da cerimônia.',
                    error: errors.aceite_contraindicacoes,
                  },
                  {
                    id: 'aceite_livre_vontade',
                    field: 'aceite_livre_vontade' as keyof AnamneseFormData,
                    icon: Heart,
                    title: 'Livre e Espontânea Vontade',
                    text: 'Declaro que estou participando por livre e espontânea vontade, ciente de que se trata de uma prática espiritual com uso de medicinas sagradas.',
                    error: errors.aceite_livre_vontade,
                  },
                  {
                    id: 'aceite_termo_responsabilidade',
                    field: 'aceite_termo_responsabilidade' as keyof AnamneseFormData,
                    icon: FileText,
                    title: 'Termo de Responsabilidade',
                    text: 'Aceito o termo de responsabilidade e me comprometo a seguir as orientações do facilitador durante toda a cerimônia.',
                    error: errors.aceite_termo_responsabilidade,
                  },
                  {
                    id: 'aceite_permanencia',
                    field: 'aceite_permanencia' as keyof AnamneseFormData,
                    icon: Clock,
                    title: 'Permanência no Templo',
                    text: 'Declaro que me comprometo a permanecer no templo até que esteja em plenas condições físicas e mentais para sair com segurança, respeitando o tempo necessário para integração da experiência.',
                    error: errors.aceite_permanencia,
                  },
                ].map((term) => {
                  const isChecked = formData[term.field] as boolean;
                  const Icon = term.icon;
                  return (
                    <div key={term.id}>
                      <button
                        type="button"
                        onClick={() => updateField(term.field, !isChecked)}
                        className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                          isChecked
                            ? 'bg-success-subtle border-success'
                            : term.error
                            ? 'border-destructive bg-destructive/5'
                            : 'border-border hover:border-success/30 dark:border-success/40 bg-background'
                        }`}
                      >
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          isChecked ? 'bg-success border-success' : term.error ? 'border-destructive' : 'border-muted-foreground/40'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold mb-0.5 flex items-center gap-1.5 ${isChecked ? 'text-success' : 'text-foreground'}`}>
                            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                            {term.title}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{term.text}</p>
                        </div>
                      </button>
                      {term.error && <p className="text-xs text-destructive mt-1 ml-1">{term.error}</p>}
                    </div>
                  );
                })}

                {/* Autorização de Uso de Imagem — opcional, tom diferente */}
                <div className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.aceite_uso_imagem
                    ? 'border-warning bg-warning-subtle'
                    : 'border-border hover:border-warning/30 dark:border-warning/40 bg-background'
                }`}
                  onClick={() => updateField('aceite_uso_imagem', !formData.aceite_uso_imagem)}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    formData.aceite_uso_imagem ? 'bg-warning border-warning' : 'border-muted-foreground/40'
                  }`}>
                    {formData.aceite_uso_imagem && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold mb-0.5 flex items-center gap-1.5 ${formData.aceite_uso_imagem ? 'text-warning' : 'text-foreground'}`}>
                      <Camera className="w-3.5 h-3.5 flex-shrink-0" />
                      Autorização de Uso de Imagem <span className="text-xs font-normal text-muted-foreground ml-1">(opcional)</span>
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Autorizo o uso da minha imagem em fotos e vídeos para divulgação nas redes sociais e materiais da Consciência Divinal. Posso solicitar remoção a qualquer momento.
                    </p>
                    {!formData.aceite_uso_imagem && (
                      <p className="text-xs text-muted-foreground/60 mt-1 italic">Caso não autorize, sua imagem não será utilizada.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 6: Assinatura e Confirmação */}
          {step === 6 && (
            <>
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-success-subtle flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  Confirmação e Assinatura
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed pt-1">
                  Ao assinar, você confirma que todas as informações são verdadeiras e que compreendeu os termos aceitos.
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
                    <div className="relative">
                      <div className="bg-white rounded-xl border-2 border-primary/20 p-4 flex flex-col items-center shadow-inner overflow-hidden">
                        <img
                          src={formData.assinatura}
                          alt="Sua assinatura"
                          className="max-h-32 object-contain"
                        />
                        <div className="mt-2 w-full border-t border-border pt-2 text-center">
                          <p className="text-[10px] text-muted-foreground font-mono uppercase">
                            Assinado digitalmente em {new Date().toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1"
                          onClick={() => setIsFullScreenSignature(true)}
                        >
                          <RotateCcw className="w-3 h-3" />
                          Refazer
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs gap-1"
                          onClick={() => updateField('assinatura', '')}
                        >
                          <X className="w-3 h-3" />
                          Remover
                        </Button>
                      </div>
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
          <div className="flex justify-between items-center p-6 pt-2 gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setStepDirection('backward'); setStep(Math.max(1, step - 1)); }}
              disabled={step === 1}
              className="text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>

            {step < 6 ? (
              <Button onClick={nextStep} className="gap-2 px-8 shadow-md shadow-primary/20">
                Continuar
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading || !formData.assinatura} className="gap-2 px-8 shadow-md shadow-primary/20">
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
        <DialogTitle className="flex items-center gap-2 text-warning">
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
        
        <div className="p-4 bg-warning-subtle border border-warning/30 dark:border-warning rounded-lg">
          <p className="text-sm text-warning">
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
          className="gap-2 bg-success hover:bg-success"
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
