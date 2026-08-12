import React, {
  forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState,
} from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { ladrilhoMarcaDagua } from './marcaDagua';
import type { EpubPosicao, EpubReaderHandle, EpubTocItem, TemaLeitura } from './EpubReader';

/**
 * Leitor de PDF dentro do app.
 *
 * Existe pelo mesmo motivo do leitor de EPUB: o acervo do templo é vendido para
 * ser lido aqui, não baixado. O visualizador anterior mandava a URL do arquivo
 * para o Google Docs Viewer e ainda oferecia um botão de Download — o que
 * contornava, de uma vez, o bucket fechado, a URL assinada e a marca d'água.
 *
 * Aqui a página é desenhada num canvas. Isso é mais fechado que o EPUB por
 * construção: não existe camada de texto, então não há o que selecionar nem
 * copiar, e o arquivo nunca vira um link navegável.
 *
 * O contrato é o mesmo do EpubReader de propósito — mesma `ref`, mesma forma de
 * posição —, para que toda a moldura da tela de leitura (marcadores, anotações,
 * temas, barra de progresso, marca d'água) sirva aos dois formatos sem
 * duplicação. No lugar do CFI, a posição é o número da página em texto.
 */

interface Props {
  url: string;
  /** O mesmo controle de "fonte" do EPUB; aqui vira zoom, porque PDF é fixo. */
  fontSize: number;
  tema: string;
  temas: Record<string, TemaLeitura>;
  /** Página onde a leitura parou, como texto. */
  cfiInicial?: string | null;
  onPronto?: (info: { toc: EpubTocItem[] }) => void;
  onPosicao?: (pos: EpubPosicao) => void;
  onErro?: (mensagem: string) => void;
  onToqueSimples?: () => void;
  marcaDagua?: string | null;
  bloquearCopia?: boolean;
}

/** Distância mínima, em px, para um arrasto contar como virada de página. */
const SWIPE_MIN = 45;

/**
 * O slider de fonte vai de 14 a 28. Num PDF o texto não reflui, então o mesmo
 * controle amplia a página.
 *
 * A base é a largura da caixa, não a página inteira: numa tela de celular uma
 * folha A4 inteira deixa o texto pequeno demais para ler. No tamanho padrão
 * (18) a página ocupa exatamente a largura disponível e não rola de lado; em
 * 14 ela recua e cabe inteira; daí para cima aproxima e rola.
 */
const zoomDaFonte = (fontSize: number) => 1 + (fontSize - 18) * 0.0625;

/**
 * O PDF vem quase sempre com fundo branco. Em vez de tentar repintar o
 * conteúdo, o tema é aplicado como filtro sobre o desenho pronto — é o que
 * mantém figuras e tabelas legíveis.
 */
const FILTRO_DO_TEMA: Record<string, string> = {
  light: 'none',
  sepia: 'sepia(0.45) brightness(0.98) contrast(0.95)',
  dark: 'invert(0.9) hue-rotate(180deg) contrast(0.92)',
};

type CarregamentoPdf = ReturnType<typeof import('pdfjs-dist')['getDocument']>;
type DocumentoPdf = Awaited<CarregamentoPdf['promise']>;
type TarefaRender = ReturnType<Awaited<ReturnType<DocumentoPdf['getPage']>>['render']>;

const PdfReader = forwardRef<EpubReaderHandle, Props>(function PdfReader(
  {
    url, fontSize, tema, temas, cfiInicial, onPronto, onPosicao, onErro, onToqueSimples,
    marcaDagua, bloquearCopia = false,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<DocumentoPdf | null>(null);
  // Quem encerra o worker e aborta a rede é a tarefa de carregamento, não o
  // documento — no pdf.js 6 o `destroy()` só existe nela.
  const carregamentoRef = useRef<CarregamentoPdf | null>(null);
  const tarefaRef = useRef<TarefaRender | null>(null);
  const paginaRef = useRef(1);

  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [mensagemErro, setMensagemErro] = useState('');
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);

  const t = temas[tema] ?? { bg: '#FFFFFF', text: '#1a1a1a' };

  // --- Abertura do documento ---
  useEffect(() => {
    let vivo = true;

    (async () => {
      try {
        setEstado('carregando');
        // Fora do bundle inicial: o pdf.js sozinho passa de 1 MB, e a maioria
        // das telas do app nunca abre um livro.
        const pdfjs = await import('pdfjs-dist');
        const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

        // O arquivo pode vir de upload de usuário. O pdf.js não executa o
        // JavaScript embutido no PDF a menos que a sandbox de scripting seja
        // ligada explicitamente, o que não fazemos; formulários XFA também
        // ficam desligados.
        const carregamento = pdfjs.getDocument({ url, enableXfa: false });
        carregamentoRef.current = carregamento;
        const doc = await carregamento.promise;
        if (!vivo) { carregamento.destroy(); return; }

        docRef.current = doc;
        setTotal(doc.numPages);

        const inicial = Number(cfiInicial);
        paginaRef.current = Number.isFinite(inicial) && inicial >= 1 && inicial <= doc.numPages
          ? Math.floor(inicial)
          : 1;
        setPagina(paginaRef.current);
        setEstado('pronto');

        onPronto?.({ toc: await lerSumario(doc) });
      } catch (e) {
        if (!vivo) return;
        const msg = e instanceof Error ? e.message : 'Não foi possível abrir o PDF.';
        setMensagemErro(msg);
        setEstado('erro');
        onErro?.(msg);
      }
    })();

    return () => {
      vivo = false;
      tarefaRef.current?.cancel();
      carregamentoRef.current?.destroy();
      carregamentoRef.current = null;
      docRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // --- Desenho da página ---
  const desenhar = useCallback(async () => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    const caixa = containerRef.current;
    if (!doc || !canvas || !caixa) return;

    // Duas viradas rápidas disparam dois desenhos no mesmo canvas, e o pdf.js
    // recusa o segundo. Cancelar o anterior é o que mantém a virada fluida.
    tarefaRef.current?.cancel();

    try {
      const page = await doc.getPage(paginaRef.current);
      const larguraCaixa = caixa.clientWidth;
      const alturaCaixa = caixa.clientHeight;
      if (larguraCaixa < 2 || alturaCaixa < 2) return;

      const natural = page.getViewport({ scale: 1 });
      const escala = (larguraCaixa / natural.width) * zoomDaFonte(fontSize);
      // Sem o devicePixelRatio o texto sai borrado em tela de alta densidade.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: escala * dpr });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

      const tarefa = page.render({ canvas, viewport });
      tarefaRef.current = tarefa;
      await tarefa.promise;
    } catch (e) {
      // `cancel()` rejeita a promessa da tarefa anterior; não é erro de leitura.
      const nome = (e as { name?: string })?.name;
      if (nome === 'RenderingCancelledException') return;
      const msg = e instanceof Error ? e.message : 'Não foi possível desenhar a página.';
      setMensagemErro(msg);
      setEstado('erro');
      onErro?.(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSize]);

  useEffect(() => {
    if (estado !== 'pronto') return;
    desenhar();
  }, [estado, pagina, desenhar]);

  // Girar o aparelho ou abrir o teclado muda a caixa; sem redesenhar, a página
  // fica no tamanho antigo.
  useEffect(() => {
    const caixa = containerRef.current;
    if (!caixa || estado !== 'pronto') return;
    let ultimo = '';
    const observador = new ResizeObserver((entradas) => {
      const { width, height } = entradas[0].contentRect;
      if (width < 2 || height < 2) return;
      const chave = `${Math.round(width)}x${Math.round(height)}`;
      if (chave === ultimo) return;
      ultimo = chave;
      desenhar();
    });
    observador.observe(caixa);
    return () => observador.disconnect();
  }, [estado, desenhar]);

  // --- Posição para quem está de fora ---
  useEffect(() => {
    if (estado !== 'pronto' || total === 0) return;
    onPosicao?.({
      cfi: String(pagina),
      posicao: pagina,
      total,
      percentual: total > 1 ? ((pagina - 1) / (total - 1)) * 100 : 100,
      capitulo: `Página ${pagina} de ${total}`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, total, estado]);

  const irPara = useCallback((n: number) => {
    const doc = docRef.current;
    if (!doc) return;
    const alvo = Math.min(Math.max(Math.round(n), 1), doc.numPages);
    paginaRef.current = alvo;
    setPagina(alvo);
  }, []);

  useImperativeHandle(ref, () => ({
    proxima: () => irPara(paginaRef.current + 1),
    anterior: () => irPara(paginaRef.current - 1),
    irPara: (alvo: string) => {
      const n = Number(alvo);
      if (Number.isFinite(n)) irPara(n);
    },
    irParaPosicao: (posicao: number) => irPara(posicao),
    cfiAtual: () => String(paginaRef.current),
  }), [irPara]);

  // --- Gestos ---
  const toqueRef = useRef<{ x: number; y: number; t: number } | null>(null);

  const aoTocar = (e: React.TouchEvent) => {
    const p = e.touches[0];
    toqueRef.current = { x: p.clientX, y: p.clientY, t: Date.now() };
  };

  const aoSoltar = (e: React.TouchEvent) => {
    const inicio = toqueRef.current;
    toqueRef.current = null;
    if (!inicio) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - inicio.x;
    const dy = p.clientY - inicio.y;

    if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) {
      irPara(paginaRef.current + (dx < 0 ? 1 : -1));
      return;
    }
    // Parado e rápido: é toque, não arrasto.
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && Date.now() - inicio.t < 350) {
      onToqueSimples?.();
    }
  };

  if (estado === 'erro') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6"
        style={{ color: t.text }}>
        <AlertTriangle className="w-12 h-12 opacity-50" />
        <p className="font-medium">Não foi possível abrir este livro</p>
        <p className="text-sm opacity-70 max-w-sm">{mensagemErro}</p>
      </div>
    );
  }

  return (
    // A caixa de fora é a que mede, e o tamanho dela nunca muda — se a rolagem
    // ficasse aqui, a barra de rolagem mudaria a largura, o desenho seria
    // refeito menor, a barra sumiria, e assim por diante.
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      onTouchStart={aoTocar}
      onTouchEnd={aoSoltar}
      onClick={onToqueSimples}
      onContextMenu={bloquearCopia ? (e) => e.preventDefault() : undefined}
      style={{ backgroundColor: t.bg }}
    >
      {estado === 'carregando' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10"
          style={{ backgroundColor: t.bg, color: t.text }}>
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm opacity-70">Abrindo o livro...</p>
        </div>
      )}

      {/* Com o zoom no máximo a página fica maior que a tela. Sem esta camada
          rolável o topo e o rodapé eram cortados sem nenhuma forma de
          alcançá-los. O `m-auto` centraliza quando cabe e encosta no canto
          quando não cabe. */}
      <div className="absolute inset-0 flex overflow-auto overscroll-contain">
        <canvas
          ref={canvasRef}
          // Sem camada de texto não há o que selecionar; o `select-none` e o
          // `draggable` false evitam o arrastar-e-salvar da imagem do canvas.
          className="select-none m-auto"
          draggable={false}
          style={{
            filter: FILTRO_DO_TEMA[tema] ?? 'none',
            // A folha precisa ter borda: no tema sépia o branco do PDF fica
            // quase da cor do fundo e a página some dentro da tela.
            boxShadow: `0 1px 12px ${t.text}22`,
            outline: `1px solid ${t.text}1f`,
          }}
        />
      </div>

      {marcaDagua && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: ladrilhoMarcaDagua(marcaDagua, t.text),
            backgroundRepeat: 'repeat',
          }}
        />
      )}
    </div>
  );
});

/** Índice do PDF, quando o arquivo traz um. O destino vira número de página. */
async function lerSumario(doc: DocumentoPdf): Promise<EpubTocItem[]> {
  try {
    const outline = await doc.getOutline();
    if (!outline?.length) return [];

    const itens: EpubTocItem[] = [];
    const percorrer = async (lista: typeof outline, nivel: number) => {
      for (const item of lista) {
        const pagina = await paginaDoDestino(doc, item.dest);
        if (pagina) {
          itens.push({ label: item.title?.trim() || 'Sem título', href: String(pagina), nivel });
        }
        if (item.items?.length) await percorrer(item.items, nivel + 1);
      }
    };
    await percorrer(outline, 0);
    return itens;
  } catch {
    // Índice é conforto, não requisito: um arquivo com destino quebrado
    // continua abrindo, só sem sumário.
    return [];
  }
}

async function paginaDoDestino(doc: DocumentoPdf, dest: unknown): Promise<number | null> {
  try {
    const resolvido = typeof dest === 'string' ? await doc.getDestination(dest) : dest;
    if (!Array.isArray(resolvido) || !resolvido[0]) return null;
    return (await doc.getPageIndex(resolvido[0])) + 1;
  } catch {
    return null;
  }
}

export default PdfReader;
