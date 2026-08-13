import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutosavePosicao, type ProgressoLeitura } from './useAutosavePosicao';

const pagina = (n: number): ProgressoLeitura => ({
  posicao: n,
  percentual: n * 10,
  cfi: `epubcfi(/6/${n})`,
});

function esconderAba(estado: 'hidden' | 'visible') {
  Object.defineProperty(document, 'visibilityState', { value: estado, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('useAutosavePosicao', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    esconderAba('visible');
  });
  afterEach(() => vi.useRealTimers());

  it('grava pouco depois de a pessoa parar de virar página', () => {
    const salvar = vi.fn();
    const { rerender } = renderHook(
      ({ pos }) => useAutosavePosicao({ pos, pronto: true, salvar }),
      { initialProps: { pos: pagina(1) as ProgressoLeitura | null } },
    );

    act(() => { vi.advanceTimersByTime(1400); });
    expect(salvar).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(200); });
    expect(salvar).toHaveBeenCalledTimes(1);
    expect(salvar.mock.calls[0][0]).toMatchObject({ cfi: 'epubcfi(/6/1)' });

    rerender({ pos: pagina(2) });
    act(() => { vi.advanceTimersByTime(1500); });
    expect(salvar).toHaveBeenCalledTimes(2);
    expect(salvar.mock.calls[1][0]).toMatchObject({ cfi: 'epubcfi(/6/2)' });
  });

  it('não grava a cada virada durante a leitura corrida', () => {
    const salvar = vi.fn();
    const { rerender } = renderHook(
      ({ pos }) => useAutosavePosicao({ pos, pronto: true, salvar }),
      { initialProps: { pos: pagina(1) as ProgressoLeitura | null } },
    );

    for (const n of [2, 3, 4, 5]) {
      rerender({ pos: pagina(n) });
      act(() => { vi.advanceTimersByTime(300) });
    }
    expect(salvar).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(1500); });
    expect(salvar).toHaveBeenCalledTimes(1);
    expect(salvar.mock.calls[0][0]).toMatchObject({ cfi: 'epubcfi(/6/5)' });
  });

  /**
   * O caso que fazia a posição se perder: virar a página e sair antes do prazo
   * do autosave. É o comportamento normal de quem para de ler.
   */
  it('grava na hora de trocar de aplicativo, mesmo antes do prazo', () => {
    const salvar = vi.fn();
    const { rerender } = renderHook(
      ({ pos }) => useAutosavePosicao({ pos, pronto: true, salvar }),
      { initialProps: { pos: pagina(1) as ProgressoLeitura | null } },
    );

    rerender({ pos: pagina(7) });
    act(() => { vi.advanceTimersByTime(200); });
    expect(salvar).not.toHaveBeenCalled();

    act(() => { esconderAba('hidden'); });
    expect(salvar).toHaveBeenCalledTimes(1);
    expect(salvar.mock.calls[0][0]).toMatchObject({ cfi: 'epubcfi(/6/7)', posicao: 7 });
  });

  it('grava ao voltar para a Biblioteca, antes do prazo', () => {
    const salvar = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ pos }) => useAutosavePosicao({ pos, pronto: true, salvar }),
      { initialProps: { pos: pagina(1) as ProgressoLeitura | null } },
    );

    rerender({ pos: pagina(4) });
    act(() => { vi.advanceTimersByTime(100); });
    unmount();

    expect(salvar).toHaveBeenCalledTimes(1);
    expect(salvar.mock.calls[0][0]).toMatchObject({ cfi: 'epubcfi(/6/4)' });
  });

  it('não repete a gravação da mesma posição', () => {
    const salvar = vi.fn();
    renderHook(() => useAutosavePosicao({ pos: pagina(3), pronto: true, salvar }));

    act(() => { vi.advanceTimersByTime(1500); });
    act(() => { esconderAba('hidden'); });
    act(() => { esconderAba('visible'); esconderAba('hidden'); });

    expect(salvar).toHaveBeenCalledTimes(1);
  });

  it('tenta de novo depois de uma gravação que falhou', () => {
    const salvar = vi.fn((_p, { onError }) => onError());
    renderHook(() => useAutosavePosicao({ pos: pagina(3), pronto: true, salvar }));

    act(() => { vi.advanceTimersByTime(1500); });
    expect(salvar).toHaveBeenCalledTimes(1);

    // Sem o retorno do onError, esta segunda tentativa seria descartada por
    // "essa posição eu já gravei" e a leitura ficaria perdida de vez.
    act(() => { esconderAba('hidden'); });
    expect(salvar).toHaveBeenCalledTimes(2);
  });

  it('não grava enquanto o livro não abriu', () => {
    const salvar = vi.fn();
    const { unmount } = renderHook(() =>
      useAutosavePosicao({ pos: null, pronto: false, salvar }),
    );
    act(() => { vi.advanceTimersByTime(5000); });
    act(() => { esconderAba('hidden'); });
    unmount();
    expect(salvar).not.toHaveBeenCalled();
  });
});
