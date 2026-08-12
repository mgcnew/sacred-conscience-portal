import { ROUTES } from './routes';

/**
 * Os quatro guardiões do emblema — lobo, leão, águia e dragão — e as quatro
 * áreas do portal.
 *
 * O app já tinha convergido para uma estrutura de quatro sem dizer isso em
 * lugar nenhum: quatro cores categóricas em index.css, quatro famílias de cor
 * na navegação, quatro cards em "Explore o Templo". Aqui a estrutura ganha
 * nome. A cor de cada guardião é a que ele tem no desenho do emblema.
 *
 * O nome aparece num lugar só, no cabeçalho da página, como indicação de onde
 * a pessoa está. Não é enfeite: quem nunca ler sobre os guardiões continua
 * usando o app normalmente, e quem ler passa a reconhecer a cor.
 */
export interface Guardiao {
  /** Nome do bicho no emblema. */
  nome: string;
  /** Como a área se chama. É isso que vai no cabeçalho. */
  area: string;
  /** O que ele guarda, em uma linha. Usado na página Sobre Nós. */
  guarda: string;
  /** Classe de texto na cor do guardião. */
  cor: string;
}

export const GUARDIOES = {
  lobo: {
    nome: 'Lobo',
    area: 'Caminho',
    guarda: 'o passo de cada um: sua ficha, seu histórico, o que você já andou.',
    cor: 'text-primary',
  },
  leao: {
    nome: 'Leão',
    area: 'Roda',
    guarda: 'o que se faz junto: as consagrações, as partilhas, as imagens da casa.',
    cor: 'text-sacred-gold-ink',
  },
  aguia: {
    nome: 'Águia',
    area: 'Saber',
    guarda: 'o que se aprende: as medicinas, os estudos, a biblioteca.',
    cor: 'text-river',
  },
  dragao: {
    nome: 'Dragão',
    area: 'Casa',
    guarda: 'o que sustenta o templo: a loja, os ajustes, a administração.',
    cor: 'text-earth',
  },
} as const satisfies Record<string, Guardiao>;

export type ChaveGuardiao = keyof typeof GUARDIOES;

/** Mesma divisão que a navegação já usava por cor. */
const ROTA_PARA_GUARDIAO: Record<string, ChaveGuardiao> = {
  [ROUTES.HOME]: 'lobo',
  [ROUTES.ANAMNESE]: 'lobo',
  [ROUTES.INSIGHTS]: 'lobo',
  [ROUTES.HISTORICO]: 'lobo',

  [ROUTES.CERIMONIAS]: 'leao',
  [ROUTES.GALERIA]: 'leao',
  [ROUTES.PARTILHAS]: 'leao',
  [ROUTES.CURSOS]: 'leao',

  [ROUTES.MEDICINAS]: 'aguia',
  [ROUTES.ESTUDOS]: 'aguia',
  [ROUTES.BIBLIOTECA]: 'aguia',

  [ROUTES.LOJA]: 'dragao',
  [ROUTES.CONFIGURACOES]: 'dragao',
  [ROUTES.ADMIN]: 'dragao',
  [ROUTES.FINANCEIRO]: 'dragao',
};

/**
 * Qual guardião cuida desta rota. Devolve null para telas que não pertencem a
 * nenhuma das quatro áreas (login, leitura, emergência, FAQ), porque forçar um
 * rótulo onde ele não se aplica é exatamente o enfeite que não queremos.
 */
export function guardiaoDaRota(caminho: string): Guardiao | null {
  const chave = ROTA_PARA_GUARDIAO[caminho];
  return chave ? GUARDIOES[chave] : null;
}
