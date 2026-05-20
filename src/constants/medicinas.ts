import { Leaf, Eye, Wind, Coffee, Flame, Droplets } from 'lucide-react';

export interface Medicina {
  id: string;
  nome: string;
  resumo: string;
  detalhes: string;
  beneficios: string[];
  origem: string;
  icone: React.ElementType;
  cor: string;
  imagem: string;
}

export const MEDICINAS: Medicina[] = [
  {
    id: 'ayahuasca',
    nome: 'Ayahuasca',
    resumo: 'A liana da alma. Medicina de cura profunda, expansão da consciência e conexão espiritual.',
    detalhes: `A Ayahuasca é uma bebida sacramental milenar, originária dos povos indígenas da Amazônia. Ela nasce da união sagrada entre duas plantas: o cipó Jagube (Banisteriopsis caapi), que representa a força masculina, e as folhas da Rainha ou Chacrona (Psychotria viridis), que representa a luz feminina.
    
    **O Processo de Cura:**
    Conhecida como "Vinho das Almas" ou "Pequena Morte", a Ayahuasca não é uma droga recreativa, mas uma poderosa tecnologia espiritual. Ao ser ingerida, ela promove uma limpeza profunda (purga) nos níveis físico, emocional e energético. É comum vivenciar desbloqueios de memórias reprimidas, ressignificação de traumas e uma compreensão ampliada sobre a própria vida.
    
    **A Força e as Mirações:**
    Durante a cerimônia, entra-se na "Força" — um estado expandido de consciência onde ocorrem as "mirações" (visões espirituais). Neste estado, a barreira do ego se dissolve, permitindo uma conexão direta com a sabedoria divina, com os ancestrais e com a inteligência da natureza. É um momento de receber ensinamentos profundos sobre amor, perdão e propósito.
    
    **Segurança e Respeito:**
    No Consciência Divinal, consagramos esta medicina com absoluto respeito e segurança, sempre guiados por condutores experientes e amparados por uma egrégora de luz.`,
    beneficios: [
      'Expansão da consciência e autoconhecimento profundo',
      'Cura de traumas emocionais, depressão e ansiedade',
      'Reconexão com a espiritualidade e o divino',
      'Clareza mental, insights e definição de propósito',
      'Desintoxicação física e energética'
    ],
    origem: 'Amazônia (Povos Indígenas)',
    icone: Leaf,
    cor: 'text-green-600 dark:text-green-400',
    imagem: '/images/medicinas/ayahuasca.webp'
  },
  {
    id: 'rape',
    nome: 'Rapé',
    resumo: 'Medicina do sopro. Traz centramento, foco, limpeza energética e conexão com o aqui e agora.',
    detalhes: `O Rapé é uma medicina sagrada do elemento Ar, preparada com tabaco orgânico moído e cinzas de árvores de poder (como Tsunu, Murici, Cumaru), podendo conter ervas aromáticas. É uma medicina de conexão e oração.
    
    **A Aplicação (O Sopro):**
    Diferente do uso recreativo do tabaco, o Rapé é soprado nas narinas através de um instrumento de bambu ou osso. O sopro é uma projeção de energia:
    - **Tepi:** Aplicador longo para passar a medicina a outra pessoa.
    - **Kuripe:** Aplicador em "V" para autoaplicação.
    
    **Efeitos e Propósitos:**
    Imediatamente após o sopro, sente-se um forte centramento. O Rapé tem o poder de "parar o mundo" (silenciar o diálogo interno excessivo), trazendo a pessoa para o momento presente. Ele limpa o campo energético, desobstrui as vias aéreas (físicas e sutis) e alinha os chakras.
    
    É um grande aliado para meditação, foco, e para firmar o rezo antes ou durante cerimônias de Ayahuasca.`,
    beneficios: [
      'Centramento imediato e silêncio mental',
      'Limpeza energética densa e alinhamento dos chakras',
      'Foco, concentração e clareza',
      'Combate sinusite, rinite e dores de cabeça',
      'Conexão com o Grande Espírito através do sopro'
    ],
    origem: 'Tribos Indígenas Brasileiras (Acre/Amazônia)',
    icone: Wind,
    cor: 'text-amber-700 dark:text-amber-500',
    imagem: '/images/medicinas/rape.webp'
  },
  {
    id: 'sananga',
    nome: 'Sananga',
    resumo: 'O colírio da floresta. Limpa a visão espiritual, abre o terceiro olho e trata a panema.',
    detalhes: `A Sananga é um colírio extraído da raiz do arbusto *Tabernaemontana sananho*. É uma medicina do elemento Fogo (pela ardência) e Água (pela forma), utilizada tradicionalmente pelos indígenas para aguçar a visão antes da caça.
    
    **Abertura da Visão Espiritual:**
    Ao ser aplicada nos olhos, a Sananga provoca uma ardência intensa por alguns minutos. Este processo é uma "queima" das impurezas. Energeticamente, ela atua diretamente no Ajna Chakra (Terceiro Olho), limpando "visões" distorcidas, formas-pensamento negativas e a "panema" (energia de estagnação, má sorte ou preguiça espiritual).
    
    **Cura Física e Emocional:**
    Passada a ardência, surge uma sensação de profunda paz, clareza visual (as cores ficam mais vivas) e relaxamento corporal. Fisicamente, é usada preventivamente para saúde ocular (catarata, glaucoma, miopia), embora seu foco principal em nosso templo seja a limpeza espiritual e a expansão da percepção.`,
    beneficios: [
      'Descalcificação e abertura do Terceiro Olho',
      'Limpeza de "panema" (energias estagnadas e má sorte)',
      'Melhora da percepção visual física e espiritual',
      'Equilíbrio emocional e clareza de decisão',
      'Tratamento preventivo de doenças oculares'
    ],
    origem: 'Povos Kaxinawá e Yawanawá',
    icone: Eye,
    cor: 'text-yellow-600 dark:text-yellow-400',
    imagem: '/images/medicinas/sananga.webp'
  },
  {
    id: 'cacau',
    nome: 'Cacau Sagrado',
    resumo: 'Medicina do coração. Abre portais de amor, criatividade, alegria e conexão sutil.',
    detalhes: `O Cacau cerimonial é a forma mais pura do chocolate, preparado ritualisticamente a partir de sementes de cacau crioulo nativo. Diferente do chocolate industrial, ele mantém toda a sua gordura natural e compostos ativos.
    
    **Abertura do Coração:**
    Conhecido como "O Alimento dos Deuses", o Cacau é uma medicina gentil e feminina. Ele atua no Anahata Chakra (Coração), facilitando a liberação de armaduras emocionais, mágoas e medos. Ele nos convida a sentir, a perdoar e a amar.
    
    **Bioquímica da Felicidade:**
    O Cacau é rico em Teobromina (que dilata os vasos sanguíneos e relaxa os músculos), Anandamida (a "molécula da felicidade") e Magnésio. Ele não é alucinógeno, mas psicoativo: promove um estado de alerta relaxado, euforia sutil, criatividade e profunda conexão empática com o outro. É ideal para celebrar a vida, a arte e o amor.`,
    beneficios: [
      'Abertura suave e amorosa do chakra cardíaco',
      'Estímulo à criatividade, intuição e alegria',
      'Liberação de bloqueios emocionais e traumas afetivos',
      'Nutrição profunda (rico em antioxidantes e minerais)',
      'Sensação de bem-estar e conexão empática'
    ],
    origem: 'Povos Maias e Astecas (América Central)',
    icone: Coffee,
    cor: 'text-red-800 dark:text-red-400',
    imagem: '/images/medicinas/cacau.webp'
  },
  {
    id: 'kambo',
    nome: 'Kambo',
    resumo: 'A vacina da floresta. Purificação intensa do corpo físico, fortalecimento do sistema imunológico e limpeza profunda.',
    detalhes: `O Kambo é uma secreção extraída da pele do sapo Phyllomedusa bicolor, conhecido como "sapo-verde" ou "sapo-macaco", nativo da Amazônia. É uma das medicinas mais poderosas para purificação física e fortalecimento do organismo.
    
    **A Aplicação:**
    A secreção é aplicada em pequenos pontos (queimaduras superficiais) na pele, geralmente nos braços ou pernas. Ao entrar em contato com a corrente sanguínea, os peptídeos bioativos do Kambo iniciam um processo intenso de purificação que dura de 20 a 40 minutos.
    
    **O Processo de Purga:**
    O Kambo provoca uma reação intensa no corpo: inchaço facial, aumento da temperatura, náuseas e vômitos. Este processo é a "purga" — uma limpeza profunda de toxinas acumuladas no fígado, intestinos e sistema linfático. Após a purga, surge uma sensação de leveza, clareza mental e energia renovada.
    
    **Benefícios Tradicionais:**
    Os povos indígenas utilizam o Kambo há milênios para "tirar a panema" (má sorte, preguiça, fraqueza), aumentar a resistência física para caça e fortalecer o sistema imunológico. Cientificamente, já foram identificados mais de 100 peptídeos bioativos na secreção, com propriedades antibióticas, analgésicas e imunoestimulantes.`,
    beneficios: [
      'Desintoxicação profunda do organismo (fígado, intestinos, sangue)',
      'Fortalecimento do sistema imunológico',
      'Aumento da energia vital e disposição física',
      'Limpeza de "panema" (energias estagnadas)',
      'Clareza mental e equilíbrio emocional pós-purga'
    ],
    origem: 'Povos Katukina, Yawanawá e Matsés (Amazônia)',
    icone: Droplets,
    cor: 'text-lime-600 dark:text-lime-400',
    imagem: '/images/medicinas/kambo.webp'
  },
  {
    id: 'defumacao',
    nome: 'Defumação',
    resumo: 'O poder das ervas e resinas. Limpeza de ambientes, elevação da vibração e proteção.',
    detalhes: `A defumação é a arte ancestral de transmutar energias através do elemento Ar (fumaça) e Fogo. Em nosso templo, utilizamos resinas sagradas como Breu Branco, Copal, Mirra e Olíbano, além de ervas como Sálvia Branca, Alecrim e Arruda.
    
    **Purificação e Elevação:**
    A fumaça atua como um veículo que carrega as orações para o plano espiritual e, ao mesmo tempo, desagrega miasmas e formas-pensamento densas que ficam impregnadas na aura das pessoas e nos ambientes.
    
    **O Ritual:**
    Antes de cada trabalho, o ambiente e os participantes são defumados para garantir que o espaço esteja "limpo" e protegido. O aroma das resinas também atua no sistema límbico, induzindo estados de relaxamento e sacralidade, preparando a mente e o espírito para a cerimônia que irá se iniciar.`,
    beneficios: [
      'Limpeza profunda da aura e de ambientes',
      'Transmutação de energias densas em sutis',
      'Proteção espiritual contra influências negativas',
      'Elevação da frequência vibratória do grupo',
      'Indução ao estado meditativo e sagrado'
    ],
    origem: 'Universal (Xamanismo, Umbanda, Catolicismo, etc.)',
    icone: Flame,
    cor: 'text-slate-500 dark:text-slate-400',
    imagem: '/images/medicinas/defumacao.webp'
  }
];
