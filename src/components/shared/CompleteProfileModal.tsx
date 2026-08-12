import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMeuPerfil } from '@/hooks/queries/useProfiles';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CompleteProfileModal: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useMeuPerfil(user?.id);
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const isIncomplete = !isLoading && !!user && (!profile?.full_name || !profile?.birth_date);

  useEffect(() => {
    if (isIncomplete && !nome) {
      const googleName = (user?.user_metadata?.full_name || user?.user_metadata?.name || '') as string;
      if (googleName) setNome(googleName);
    }
  }, [isIncomplete]);

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!nome.trim() || nome.trim().length < 3) errs.nome = 'Nome deve ter pelo menos 3 caracteres';
    if (!dataNascimento) errs.dataNascimento = 'Data de nascimento é obrigatória';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user!.id,
          full_name: nome.trim(),
          birth_date: dataNascimento,
        });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['meu-perfil', user!.id] });
    } catch {
      toast.error('Erro ao salvar perfil. Tente novamente.');
      setSaving(false);
    }
  };

  if (!isIncomplete) return null;

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm w-[calc(100vw-2rem)] p-0 rounded-2xl border-none shadow-2xl [&>button]:hidden overflow-hidden">

        <div className="relative overflow-hidden bg-primary/10 pt-6 pb-4 px-6 text-center">
          <div className="relative z-10">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center mb-3">
              <img src="/emblema.png" alt="Consciência Divinal" className="w-10 h-10 object-contain" />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground leading-snug">
              Complete seu perfil
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Precisamos de mais algumas informações para te acolher com segurança e cuidado.
            </p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cp-nome" className="text-sm flex items-center gap-1.5 text-foreground/80">
              <User className="w-3.5 h-3.5" /> Nome Completo
            </Label>
            <Input
              id="cp-nome"
              type="text"
              placeholder="Seu nome completo"
              value={nome}
              autoFocus
              onChange={(e) => { setNome(e.target.value); setErrors(p => ({ ...p, nome: '' })); }}
              className={errors.nome ? 'border-destructive' : ''}
            />
            {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cp-data" className="text-sm flex items-center gap-1.5 text-foreground/80">
              <Calendar className="w-3.5 h-3.5" /> Data de Nascimento
            </Label>
            <Input
              id="cp-data"
              type="date"
              value={dataNascimento}
              onChange={(e) => { setDataNascimento(e.target.value); setErrors(p => ({ ...p, dataNascimento: '' })); }}
              className={errors.dataNascimento ? 'border-destructive' : ''}
            />
            {errors.dataNascimento && <p className="text-xs text-destructive mt-1">{errors.dataNascimento}</p>}
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full gap-2 font-semibold"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar e continuar
          </Button>

          <p className="text-center text-[11px] text-muted-foreground/70 leading-relaxed">
            Essas informações são necessárias para seu cadastro e atendimento personalizado.
          </p>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default CompleteProfileModal;
