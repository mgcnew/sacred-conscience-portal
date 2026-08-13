import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { chaveMarcadores, chaveAnotacoes } from './useBiblioteca';

/**
 * O leitor lê a lista passando `undefined` para o lado que não se aplica
 * (`useMarcadores(idUpload, idCompra)`, e um dos dois é sempre undefined),
 * mas grava passando `null` (o registro no banco tem as duas colunas, uma
 * delas nula). Para o React Query as duas chaves são diferentes, então a
 * invalidação depois de salvar não encontrava a consulta: o marcador ia para
 * o banco e a lista aberta na tela continuava mostrando o estado antigo.
 *
 * Estes testes fixam o contrato: os dois caminhos têm de produzir a mesma
 * chave, venha o id como null ou como undefined.
 */
describe('chaves de marcadores e anotações', () => {
  it('null e undefined produzem a mesma chave', () => {
    expect(chaveMarcadores(undefined, 'abc')).toEqual(chaveMarcadores(null, 'abc'));
    expect(chaveAnotacoes(undefined, 'abc')).toEqual(chaveAnotacoes(null, 'abc'));
    expect(chaveMarcadores('xyz', undefined)).toEqual(chaveMarcadores('xyz', null));
  });

  it('livros diferentes continuam em chaves diferentes', () => {
    expect(chaveMarcadores(null, 'abc')).not.toEqual(chaveMarcadores(null, 'def'));
    expect(chaveMarcadores('abc', null)).not.toEqual(chaveMarcadores(null, 'abc'));
  });

  it('invalidar pelo caminho da gravação atinge a consulta da tela', async () => {
    const client = new QueryClient();
    let buscas = 0;

    // Como a tela monta a lista: um dos lados é undefined.
    await client.fetchQuery({
      queryKey: chaveMarcadores(undefined, 'livro-1'),
      queryFn: async () => { buscas += 1; return []; },
    });
    expect(buscas).toBe(1);

    // Como a gravação invalida: o registro traz null na coluna que não usa.
    await client.invalidateQueries({ queryKey: chaveMarcadores(null, 'livro-1') });

    const estado = client.getQueryState(chaveMarcadores(undefined, 'livro-1'));
    expect(estado?.isInvalidated).toBe(true);
  });
});
