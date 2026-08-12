import React, {
  forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState,
} from 'react';
import { AlertTriangle, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Book, Rendition, Contents } from 'epubjs';
import type { NavItem } from 'epubjs/types/navigation';
import type { Location as EpubLocation } from 'epubjs/types/rendition';
import { ladrilhoMarcaDagua } from './marcaDagua';

export interface EpubTocItem {
  label: string;
  href: string;
  nivel: number;
}

export interface EpubPosicao {
  cfi: string;
  /** Índice na lista de locations. 0 enquanto o índice ainda está sendo gerado. */
  posicao: number;
  /** Total de locations. 0 enquanto o índice ainda está sendo gerado. */
  total: number;
  /** 0 a 100. */
  percentual: number;
  capitulo: string | null;
}

export interface EpubReaderHandle {
  proxima(): void;
  anterior(): void;
  /** Aceita um CFI ou um href do índice. */
  irPara(alvo: string): void;
  irParaPosicao(posicao: number): void;
  cfiAtual(): string | null;
}

export interface TemaLeitura {
  bg: string;
  text: string;
}

interface Props {
  url: string;
  fontSize: number;
  tema: string;
  temas: Record<string, TemaLeitura>;
  /** CFI onde a leitura parou. */
  cfiInicial?: string | null;
  onPronto?: (info: { toc: EpubTocItem[] }) => void;
  onPosicao?: (pos: EpubPosicao) => void;
  onErro?: (mensagem: string) => void;
  /** Toque/clique curto no meio da página, para mostrar e esconder os controles. */
  onToqueSimples?: () => void;
  /**
   * Texto carimbado por trás do livro inteiro, bem apagado. Serve para o
   * conteúdo sair identificado em print ou gravação de tela.
   */
  marcaDagua?: string | null;
  /** Desliga seleção, menu do botão direito, cópia e impressão. */
  bloquearCopia?: boolean;
  /** Mostra o botão de baixar quando o arquivo não abre. Nunca em livro comprado. */
  permitirBaixar?: boolean;
}

/** Distância mínima, em px, para um arrasto contar como virada de página. */
const SWIPE_MIN = 45;
/** Caracteres por "location". Menor = índice mais fino e mais lento de gerar. */
const CHARS_POR_LOCATION = 1024;
const CACHE_PREFIX = 'epub-locations:';

/** O índice de locations é caro de gerar; a chave amarra o cache ao arquivo. */
const chaveCache = (url: string) => CACHE_PREFIX + url.split('/').slice(-2).join('/');

const achatarToc = (itens: NavItem[], nivel = 0): EpubTocItem[] =>
  itens.flatMap((item) => [
    { label: (item.label ?? '').trim() || 'Sem título', href: item.href, nivel },
    ...achatarToc(item.subitems ?? [], nivel + 1),
  ]);

/**
 * Renderiza um EPUB. O epubjs desenha dentro de um iframe, então tudo que é
 * aparência (tema, fonte) precisa ser injetado como CSS lá dentro, e os gestos
 * precisam ser ligados no documento do iframe — eventos de dentro do iframe não
 * sobem para a página.
 */
const EpubReader = forwardRef<EpubReaderHandle, Props>(function EpubReader(
  {
    url, fontSize, tema, temas, cfiInicial, onPronto, onPosicao, onErro, onToqueSimples,
    marcaDagua, bloquearCopia = false, permitirBaixar = false,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const rendicaoRef = useRef<Rendition | null>(null);
  const cfiRef = useRef<string | null>(null);

  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [mensagemErro, setMensagemErro] = useState('');
  const [gerandoIndice, setGerandoIndice] = useState(false);

  // Os callbacks e os valores iniciais entram por ref para que o efeito de
  // montagem dependa só da url: recriar o Book a cada render do pai recarregaria
  // o arquivo inteiro e jogaria o leitor de volta para o começo.
  const cbs = useRef({ onPronto, onPosicao, onErro, onToqueSimples });
  useEffect(() => {
    cbs.current = { onPronto, onPosicao, onErro, onToqueSimples };
  });

  const inicial = useRef({ fontSize, tema, cfiInicial, temas, marcaDagua, bloquearCopia });

  const publicarPosicao = useCallback((cfi: string) => {
    const book = bookRef.current;
    if (!book) return;
    cfiRef.current = cfi;

    const total = book.locations?.length?.() ?? 0;
    let posicao = 0;
    let percentual = 0;
    if (total > 0) {
      posicao = (book.locations.locationFromCfi(cfi) as unknown as number) ?? 0;
      percentual = Math.min(100, Math.max(0, book.locations.percentageFromCfi(cfi) * 100));
    }

    let capitulo: string | null = null;
    try {
      const secao = book.spine.get(cfi);
      if (secao?.href) {
        const alvo = secao.href.split('#')[0];
        const item = achatarToc(book.navigation?.toc ?? []).find((t) =>
          t.href.split('#')[0].endsWith(alvo) || alvo.endsWith(t.href.split('#')[0]),
        );
        capitulo = item?.label ?? null;
      }
    } catch {
      // livro sem spine navegável: segue sem nome de capítulo
    }

    cbs.current.onPosicao?.({ cfi, posicao, total, percentual, capitulo });
  }, []);

  useEffect(() => {
    let cancelado = false;
    let book: Book | undefined;
    let rendicao: Rendition | undefined;

    const abrir = async () => {
      try {
        setEstado('carregando');

        // O epubjs arrasta jszip, lodash e core-js junto; carregar sob demanda
        // mantém isso fora do bundle inicial e do precache do PWA.
        const { default: ePub } = await import('epubjs');

        const resposta = await fetch(url);
        if (!resposta.ok) {
          throw new Error(`Não foi possível baixar o arquivo (HTTP ${resposta.status}).`);
        }
        const buffer = await resposta.arrayBuffer();
        if (cancelado) return;

        book = ePub(buffer);
        bookRef.current = book;
        await book.ready;
        if (cancelado || !containerRef.current) return;

        rendicao = book.renderTo(containerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none',
          // Os arquivos vêm de upload do usuário: nada de script rodando dentro
          // do iframe.
          allowScriptedContent: false,
        });
        rendicaoRef.current = rendicao;

        const { marcaDagua: marca, bloquearCopia: travar } = inicial.current;

        Object.entries(inicial.current.temas).forEach(([nome, t]) => {
          rendicao!.themes.register(nome, {
            // Nada de margem nem padding aqui: no modo paginado o epubjs monta
            // as colunas a partir da largura do container, e qualquer recuo no
            // body empurra o texto para fora da coluna e corta as linhas na
            // borda direita. A margem de leitura é dada pelo container, fora
            // do iframe.
            'html, body': {
              'background-color': `${t.bg} !important`,
              ...(marca
                ? {
                    'background-image': `${ladrilhoMarcaDagua(marca, t.text)} !important`,
                    'background-repeat': 'repeat !important',
                  }
                : {}),
              color: `${t.text} !important`,
              'line-height': '1.7 !important',
              margin: '0 !important',
              padding: '0 !important',
              ...(travar
                ? {
                    '-webkit-user-select': 'none !important',
                    'user-select': 'none !important',
                    '-webkit-touch-callout': 'none !important',
                  }
                : {}),
            },
            // Sem regra @media aqui: o epubjs monta o CSS achatando um nível só
            // (seletor { prop: valor }), então uma at-rule aninhada vira uma
            // regra inválida e derruba a injeção do tema inteiro. A trava de
            // impressão fica na página, fora do iframe.
            'p, div, span, li, td, th, blockquote, section, article, figcaption, dd, dt': {
              color: `${t.text} !important`,
            },
            'h1, h2, h3, h4, h5, h6': { color: `${t.text} !important` },
            'a, a:link, a:visited': { color: `${t.text} !important` },
            // Capítulos costumam trazer imagens maiores que a coluna de texto.
            'img, svg': { 'max-width': '100% !important', height: 'auto !important' },
          });
        });
        rendicao.themes.select(inicial.current.tema);
        rendicao.themes.fontSize(`${inicial.current.fontSize}px`);

        rendicao.hooks.content.register(ligarGestos);
        rendicao.on('relocated', (loc: EpubLocation) => {
          if (loc?.start?.cfi) publicarPosicao(loc.start.cfi);
        });

        await rendicao.display(inicial.current.cfiInicial || undefined);
        if (cancelado) return;

        setEstado('pronto');
        cbs.current.onPronto?.({ toc: achatarToc(book.navigation?.toc ?? []) });

        // Sem o índice de locations não há barra de progresso nem "faltam N
        // páginas" — mas ele varre o livro inteiro, então roda depois de a
        // primeira página já estar na tela.
        gerarIndice(book);
      } catch (erro) {
        if (cancelado) return;
        const msg = erro instanceof Error ? erro.message : 'Não foi possível abrir o livro.';
        setMensagemErro(msg);
        setEstado('erro');
        cbs.current.onErro?.(msg);
      }
    };

    const gerarIndice = async (livro: Book) => {
      const chave = chaveCache(url);
      try {
        const salvo = localStorage.getItem(chave);
        if (salvo) {
          livro.locations.load(salvo);
        } else {
          setGerandoIndice(true);
          await livro.locations.generate(CHARS_POR_LOCATION);
          try {
            localStorage.setItem(chave, livro.locations.save());
          } catch {
            // cota do localStorage cheia: só perde o cache, o índice já existe
          }
        }
      } catch {
        // livro que o epubjs não consegue indexar: a leitura continua, sem barra
      } finally {
        if (!cancelado) setGerandoIndice(false);
      }
      if (cancelado) return;
      if (cfiRef.current) publicarPosicao(cfiRef.current);
    };

    const ligarGestos = (contents: Contents) => {
      const doc = contents.document;
      let x0: number | null = null;
      let y0: number | null = null;
      let arrastou = false;

      doc.addEventListener('touchstart', (e: TouchEvent) => {
        const t = e.changedTouches[0];
        x0 = t.clientX;
        y0 = t.clientY;
        arrastou = false;
      }, { passive: true });

      doc.addEventListener('touchend', (e: TouchEvent) => {
        if (x0 === null || y0 === null) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - x0;
        const dy = t.clientY - y0;
        x0 = null;
        y0 = null;
        if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) {
          arrastou = true;
          if (dx < 0) rendicaoRef.current?.next();
          else rendicaoRef.current?.prev();
        }
      }, { passive: true });

      doc.addEventListener('click', () => {
        // O toque que virou página também dispara click; sem isso os controles
        // apareceriam a cada virada.
        if (arrastou) {
          arrastou = false;
          return;
        }
        if (contents.window.getSelection()?.toString()) return;
        cbs.current.onToqueSimples?.();
      });

      doc.addEventListener('keyup', (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') rendicaoRef.current?.next();
        else if (e.key === 'ArrowLeft' || e.key === 'PageUp') rendicaoRef.current?.prev();
      });

      if (inicial.current.bloquearCopia) {
        // Corta o copiar-e-colar preguiçoso. Não segura quem está decidido —
        // print de tela não dá para bloquear na web, e é por isso que existe a
        // marca d'água.
        doc.addEventListener('contextmenu', (e: Event) => e.preventDefault());
        doc.addEventListener('copy', (e: Event) => e.preventDefault());
        doc.addEventListener('cut', (e: Event) => e.preventDefault());
        doc.addEventListener('dragstart', (e: Event) => e.preventDefault());
        doc.addEventListener('keydown', (e: KeyboardEvent) => {
          const tecla = e.key.toLowerCase();
          if ((e.ctrlKey || e.metaKey) && ['c', 'x', 's', 'p', 'a'].includes(tecla)) {
            e.preventDefault();
          }
        });
      }
    };

    abrir();

    return () => {
      cancelado = true;
      try {
        rendicao?.destroy();
      } catch {
        // rendição já desmontada
      }
      try {
        book?.destroy();
      } catch {
        // livro já destruído
      }
      rendicaoRef.current = null;
      bookRef.current = null;
    };
  }, [url, publicarPosicao]);

  // O epubjs mede o container uma vez, ao montar, e monta as colunas com esse
  // tamanho. Se a página ainda estava se acomodando nesse instante, ele pagina
  // errado e não refaz sozinho — o resultado é área de leitura em branco.
  useEffect(() => {
    const alvo = containerRef.current;
    if (!alvo || typeof ResizeObserver === 'undefined') return;
    let ultimo = '';
    const observador = new ResizeObserver((entradas) => {
      const { width, height } = entradas[0].contentRect;
      if (width < 2 || height < 2) return;
      const chave = `${Math.round(width)}x${Math.round(height)}`;
      if (chave === ultimo) return;
      ultimo = chave;
      rendicaoRef.current?.resize(Math.round(width), Math.round(height));
    });
    observador.observe(alvo);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    rendicaoRef.current?.themes.select(tema);
  }, [tema]);

  useEffect(() => {
    const rendicao = rendicaoRef.current;
    if (!rendicao || estado !== 'pronto') return;
    rendicao.themes.fontSize(`${fontSize}px`);
    // Mudar o corpo da fonte repagina o capítulo inteiro; sem reancorar no CFI
    // o leitor é jogado para outro trecho.
    if (cfiRef.current) rendicao.display(cfiRef.current);
  }, [fontSize, estado]);

  useImperativeHandle(ref, () => ({
    proxima: () => { rendicaoRef.current?.next(); },
    anterior: () => { rendicaoRef.current?.prev(); },
    irPara: (alvo: string) => { rendicaoRef.current?.display(alvo); },
    irParaPosicao: (posicao: number) => {
      const book = bookRef.current;
      if (!book || (book.locations?.length?.() ?? 0) === 0) return;
      const cfi = book.locations.cfiFromLocation(posicao);
      if (cfi) rendicaoRef.current?.display(cfi);
    },
    cfiAtual: () => cfiRef.current,
  }), []);

  const cores = temas[tema] ?? { bg: '#FFFFFF', text: '#1a1a1a' };

  return (
    <div className="relative w-full h-full" style={{ backgroundColor: cores.bg }}>
      <div ref={containerRef} className="w-full h-full" />

      {estado === 'carregando' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{ backgroundColor: cores.bg, color: cores.text }}
        >
          <Loader2 className="w-8 h-8 animate-spin opacity-60" />
          <p className="text-sm opacity-70">Abrindo o livro...</p>
        </div>
      )}

      {estado === 'erro' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
          style={{ backgroundColor: cores.bg, color: cores.text }}
        >
          <AlertTriangle className="w-10 h-10 text-warning" />
          <div>
            <p className="font-medium mb-1">Não foi possível abrir este livro</p>
            <p className="text-sm opacity-70 max-w-sm">{mensagemErro}</p>
          </div>
          {/* Livro comprado nunca oferece download: a leitura é dentro do app. */}
          {permitirBaixar && (
            <Button variant="outline" size="sm" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-2" />
                Baixar o arquivo
              </a>
            </Button>
          )}
        </div>
      )}

      {gerandoIndice && estado === 'pronto' && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] pointer-events-none"
          style={{ backgroundColor: cores.text, color: cores.bg, opacity: 0.55 }}
        >
          <Loader2 className="w-3 h-3 animate-spin" />
          Calculando as páginas...
        </div>
      )}
    </div>
  );
});

export default EpubReader;
