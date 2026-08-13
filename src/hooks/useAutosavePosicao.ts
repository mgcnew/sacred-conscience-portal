import { useCallback, useEffect, useRef } from 'react';

export interface ProgressoLeitura {
  /** Índice da posição na lista de locations (EPUB) ou página (PDF). */
  posicao: number;
  /** 0 a 100. */
  percentual: number;
  /** CFI do EPUB ou número da página do PDF, em texto. */
  cfi: string;
}

interface Opcoes {
  /** Posição atual, ou null enquanto o livro ainda não abriu. */
  pos: ProgressoLeitura | null;
  /** Falso enquanto não há registro para gravar. */
  pronto: boolean;
  /** Faz a gravação. `onError` é chamado se ela falhar. */
  salvar: (progresso: ProgressoLeitura, opcoes: { onError: () => void }) => void;
  /** Quanto esperar depois da última virada de página. */
  atrasoMs?: number;
}

/**
 * Guarda sozinho onde a pessoa parou de ler.
 *
 * Grava em dois momentos, e os dois são necessários:
 *
 * 1. **Pouco depois de parar de virar página.** Virar é rápido e gravar a cada
 *    virada encheria a fila de requisições.
 * 2. **Na hora de sair** — trocar de aplicativo, apagar a tela, fechar a aba ou
 *    voltar para a Biblioteca. Só o item 1 não basta: quem virava a página e
 *    saía antes do prazo perdia a posição, e sair logo depois de virar é
 *    exatamente o que faz quem para de ler.
 *
 * No celular o desmontar do componente não é confiável quando o sistema mata a
 * aba, então quem carrega o caso principal é o `visibilitychange`.
 */
export function useAutosavePosicao({ pos, pronto, salvar, atrasoMs = 1500 }: Opcoes) {
  // Um ouvinte de evento é registrado uma vez e não enxerga o estado dos
  // renders seguintes; por isso tudo que ele lê mora em ref.
  const posRef = useRef<ProgressoLeitura | null>(null);
  const prontoRef = useRef(pronto);
  const salvarRef = useRef(salvar);
  const gravadoRef = useRef<string | null>(null);

  useEffect(() => { posRef.current = pos; }, [pos]);
  useEffect(() => { prontoRef.current = pronto; }, [pronto]);
  useEffect(() => { salvarRef.current = salvar; });

  const gravar = useCallback(() => {
    const atual = posRef.current;
    if (!atual?.cfi || !prontoRef.current) return;
    // Nada mudou desde a última gravação: não repete a escrita.
    if (gravadoRef.current === atual.cfi) return;

    const { cfi } = atual;
    gravadoRef.current = cfi;
    salvarRef.current(atual, {
      // Se falhou, esquece que gravou — senão a próxima tentativa seria pulada
      // por "essa eu já gravei" e a posição ficaria perdida de vez.
      onError: () => {
        if (gravadoRef.current === cfi) gravadoRef.current = null;
      },
    });
  }, []);

  useEffect(() => {
    if (!pos?.cfi) return;
    const t = setTimeout(gravar, atrasoMs);
    return () => clearTimeout(t);
  }, [pos?.cfi, gravar, atrasoMs]);

  useEffect(() => {
    const aoEsconder = () => {
      if (document.visibilityState === 'hidden') gravar();
    };
    document.addEventListener('visibilitychange', aoEsconder);
    window.addEventListener('pagehide', gravar);
    return () => {
      document.removeEventListener('visibilitychange', aoEsconder);
      window.removeEventListener('pagehide', gravar);
      gravar();
    };
  }, [gravar]);
}
