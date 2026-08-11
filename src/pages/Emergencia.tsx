import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Phone, MessageCircle, Wind, Anchor, AlertCircle, User } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/shared';
import { APP_CONFIG } from '@/config/app';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Emergencia: React.FC = () => {
  const { user } = useAuth();

  // Buscar contato de emergência da anamnese do usuário
  const { data: anamnese } = useQuery({
    queryKey: ['anamnese-emergencia', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anamneses')
        .select('contato_emergencia, nome_contato_emergencia, parentesco_contato')
        .eq('user_id', user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Formatar número de telefone para link tel:
  const formatPhoneForCall = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  };

  return (
    <PageContainer maxWidth="md">
        <PageHeader
          icon={Heart}
          title="Suporte e Emergência"
          description="Se você está passando por um momento difícil após a cerimônia, saiba que você não está sozinho. Respire fundo. Isso vai passar."
          iconContainerClassName="bg-red-100 dark:bg-red-900/20"
          iconClassName="text-red-600 dark:text-red-400"
          centered
        />

        <div className="grid gap-6">
          {/* Immediate Contact */}
          <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                Precisa de ajuda agora?
              </CardTitle>
              <CardDescription>
                Nossa equipe de guardiões está disponível para te acolher.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-lg" asChild>
                <a href={`https://wa.me/${APP_CONFIG.contacts.whatsappLider}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp Guardião
                </a>
              </Button>
              {anamnese?.contato_emergencia ? (
                <Button variant="outline" className="flex-1 border-red-200 hover:bg-red-50 dark:bg-red-500/10 text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 h-12 text-lg" asChild>
                  <a href={`tel:+${formatPhoneForCall(anamnese.contato_emergencia)}`}>
                    <User className="w-5 h-5 mr-2" />
                    {anamnese.nome_contato_emergencia || 'Contato de Emergência'}
                  </a>
                </Button>
              ) : (
                <Button variant="outline" className="flex-1 border-red-200 hover:bg-red-50 dark:bg-red-500/10 text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 h-12 text-lg" asChild>
                  <a href={`tel:+${APP_CONFIG.contacts.whatsappLider}`}>
                    <Phone className="w-5 h-5 mr-2" />
                    Ligar para Guardião
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Self-Regulation Tools */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-2">
                  <Wind className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Respiração 4-7-8</CardTitle>
                <CardDescription>Para acalmar a ansiedade imediatamente.</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Inspire pelo nariz por <strong>4 segundos</strong>.</li>
                  <li>Segure o ar por <strong>7 segundos</strong>.</li>
                  <li>Expire pela boca por <strong>8 segundos</strong>.</li>
                  <li>Repita o ciclo 4 vezes.</li>
                </ol>
              </CardContent>
            </Card>

            <Card className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-2">
                  <Anchor className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                </div>
                <CardTitle>Grounding (Aterramento)</CardTitle>
                <CardDescription>Para voltar ao momento presente.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">Identifique ao seu redor:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>👀 <strong>5</strong> coisas que você vê</li>
                  <li>✋ <strong>4</strong> coisas que você pode tocar</li>
                  <li>👂 <strong>3</strong> sons que você ouve</li>
                  <li>👃 <strong>2</strong> cheiros que você sente</li>
                  <li>👅 <strong>1</strong> coisa que você pode saborear</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Reassurance Text */}
          <Card className="bg-muted/30 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <CardContent className="pt-6">
              <h3 className="font-display text-lg font-medium mb-2">Lembre-se:</h3>
              <p className="text-muted-foreground leading-relaxed">
                Processos de cura podem ser intensos e continuar por dias após a cerimônia.
                O que você está sentindo é parte da "limpeza".
                Não tome decisões precipitadas agora. Beba água, descanse, coloque os pés na terra e confie no processo.
              </p>
            </CardContent>
          </Card>
        </div>
    </PageContainer>
  );
};

export default Emergencia;
