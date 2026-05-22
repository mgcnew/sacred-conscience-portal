/**
 * Configuração centralizada do aplicativo
 * 
 * Para personalizar para um novo cliente:
 * 1. Edite os valores abaixo
 * 2. Troque as imagens na pasta public/ (favicon.png, logo-full.png, logo-topbar.png, pwa-*.png)
 * 3. Configure o .env com as credenciais do cliente
 * 4. Faça o deploy
 */

export const APP_CONFIG = {
  // Informações básicas
  name: 'Consciência Divinal',
  shortName: 'Consciência',
  description: 'Portal do Templo Xamânico Universalista Consciência Divinal',
  tagline: 'Cerimônias com medicinas sagradas, cura espiritual e despertar da consciência',
  
  // Cores do tema (usadas no PWA manifest e meta tags)
  themeColor: '#7c3aed', // Roxo principal
  backgroundColor: '#ffffff', // Branco — alinhado com o fundo do ícone PWA
  
  // Contatos
  contacts: {
    whatsappLider: '5511963497405', // WhatsApp do líder facilitador
    liderNome: 'Raimundo Ferreira Lima',
  },
  
  // Dados de pagamento PIX
  pix: {
    chave: '11949855079',
    favorecido: 'CHAIANE CRISTINA DA SILVA',
    banco: 'Mercado Pago',
  },
  
  // URLs e domínio
  domain: 'conscienciadivinal.com',
  
  // Redes sociais (opcional)
  social: {
    instagram: '',
    facebook: '',
    youtube: '',
  },
  
  // Textos personalizáveis
  texts: {
    welcomeTitle: 'Bem-vindo ao Portal Sagrado',
    welcomeSubtitle: 'Sua jornada de transformação começa aqui',
    footerText: '© 2024 Consciência Divinal. Todos os direitos reservados.',
  },
} as const;

// Tipo para usar em outros arquivos
export type AppConfig = typeof APP_CONFIG;
