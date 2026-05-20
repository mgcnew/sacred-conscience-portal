import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/shared';
import { MEDICINAS } from '@/constants/medicinas';
import MedicinaModal from '@/components/medicinas/MedicinaModal';

const Medicinas = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        icon={Leaf}
        title="Estudo das Medicinas"
        description="Conheça as ferramentas sagradas que utilizamos em nosso templo para cura, expansão e reconexão."
        centered
        className="mb-8"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MEDICINAS.map((medicina, i) => {
          const IconComponent = medicina.icone;
          return (
            <Card
              key={medicina.id}
              className="cursor-pointer overflow-hidden h-full flex flex-col hover:shadow-lg transition-all duration-300 group border-border/60"
              onClick={() => setSelectedIndex(i)}
            >
              {/* Banner com imagem */}
              <div className="relative h-44 bg-gradient-to-br from-muted to-muted/60 overflow-hidden shrink-0">
                <img
                  src={medicina.imagem}
                  alt={medicina.nome}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                />
                {/* Gradient overlay sempre visível */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Ícone no canto inferior esquerdo */}
                <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <IconComponent className={`w-5 h-5 ${medicina.cor}`} />
                </div>

                {/* Origem no canto superior direito */}
                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10">
                  {medicina.origem.split('(')[0].trim()}
                </div>
              </div>

              {/* Texto */}
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="font-display text-xl">{medicina.nome}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow pt-0">
                <p className="text-muted-foreground leading-relaxed text-sm line-clamp-3">
                  {medicina.resumo}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedIndex !== null && (
        <MedicinaModal
          medicinas={MEDICINAS}
          currentIndex={selectedIndex}
          onNavigate={setSelectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </PageContainer>
  );
};

export default Medicinas;
