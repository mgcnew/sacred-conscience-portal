import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, Clock, BellOff } from 'lucide-react';
import { ROUTES } from '@/constants';

interface CerimoniaPendente {
  inscricaoId: string;
  cerimoniaId: string;
  cerimoniaNome: string;
  cerimoniaData: string;
}

const skipKey = (userId: string, cerimoniaId: string) =>
  `convite-partilha-skip-${userId}-${cerimoniaId}`;

const snoozedTodayKey = (userId: string) =>
  `convite-partilha-snoozed-${userId}`;

const ConvitePartilhaModal: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [cerimoniaPendente, setCerimoniaPendente] = useState<CerimoniaPendente | null>(null);

  useEffect(() => {
    const verificarCerimoniasPendentes = async () => {
      if (!user?.id) return;

      // Se adiou hoje, não incomodar de novo
      const snoozed = localStorage.getItem(snoozedTodayKey(user.id));
      if (snoozed && new Date(snoozed).toDateString() === new Date().toDateString()) return;

      try {
        const { data: inscricoes, error } = await supabase
          .from('inscricoes')
          .select(`
            id,
            cerimonia_id,
            cerimonias!inner (
              id,
              nome,
              data
            )
          `)
          .eq('user_id', user.id)
          .eq('pago', true)
          .lt('cerimonias.data', new Date().toISOString().split('T')[0])
          .order('cerimonias(data)', { ascending: false })
          .limit(5);

        if (error) throw error;
        if (!inscricoes || inscricoes.length === 0) return;

        for (const inscricao of inscricoes) {
          const cerimonia = inscricao.cerimonias as any;

          // Pular cerimônias que o usuário optou por nunca partilhar
          if (localStorage.getItem(skipKey(user.id, cerimonia.id))) continue;

          const { data: partilha } = await supabase
            .from('depoimentos')
            .select('id')
            .eq('user_id', user.id)
            .eq('cerimonia_id', cerimonia.id)
            .maybeSingle();

          if (!partilha) {
            setCerimoniaPendente({
              inscricaoId: inscricao.id,
              cerimoniaId: cerimonia.id,
              cerimoniaNome: cerimonia.nome || 'Cerimônia',
              cerimoniaData: cerimonia.data,
            });
            setOpen(true);
            break;
          }
        }
      } catch (err) {
        console.error('Erro ao verificar cerimônias pendentes:', err);
      }
    };

    const timer = setTimeout(verificarCerimoniasPendentes, 3000);
    return () => clearTimeout(timer);
  }, [user?.id]);

  const handlePartilhar = () => {
    setOpen(false);
    navigate(`${ROUTES.PARTILHAS}?cerimonia=${cerimoniaPendente?.cerimoniaId}`);
  };

  // Adiar — some hoje, volta amanhã
  const handleSnooze = () => {
    setOpen(false);
    if (user?.id) {
      localStorage.setItem(snoozedTodayKey(user.id), new Date().toISOString());
    }
  };

  // Nunca mais para esta cerimônia específica
  const handleNeverForThis = () => {
    setOpen(false);
    if (user?.id && cerimoniaPendente) {
      localStorage.setItem(skipKey(user.id, cerimoniaPendente.cerimoniaId), '1');
    }
  };

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  if (!cerimoniaPendente) return null;

  return (
    <Dialog open={open} onOpenChange={handleSnooze}>
      <DialogContent className="sm:max-w-sm [&>button]:hidden">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/18 flex items-center justify-center mb-1">
            <Heart className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-center font-display text-lg">
            Como foi sua experiência?
          </DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed">
            <span className="font-medium text-foreground">{cerimoniaPendente.cerimoniaNome}</span>
            <br />
            <span className="text-xs text-muted-foreground">{formatDate(cerimoniaPendente.cerimoniaData)}</span>
          </DialogDescription>
        </DialogHeader>

        <p className="text-xs text-muted-foreground text-center leading-relaxed -mt-1">
          Sua partilha pode inspirar outras pessoas em suas jornadas.
        </p>

        <div className="flex flex-col gap-2 mt-1">
          <Button onClick={handlePartilhar} className="w-full gap-2">
            <Heart className="w-4 h-4" />
            Quero partilhar
          </Button>

          <Button variant="outline" onClick={handleSnooze} className="w-full gap-2">
            <Clock className="w-4 h-4" />
            Agora não (lembrar amanhã)
          </Button>

          <button
            type="button"
            onClick={handleNeverForThis}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 py-1"
          >
            <BellOff className="w-3.5 h-3.5" />
            Não quero partilhar sobre esta cerimônia
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConvitePartilhaModal;
