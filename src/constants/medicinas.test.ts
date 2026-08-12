import { describe, it, expect } from 'vitest';
import { medicinaDoTexto, MEDICINAS } from './medicinas';

/**
 * Os textos abaixo são os valores que existem hoje em
 * `cerimonias.medicina_principal`, copiados do banco. O campo é livre: tem
 * vírgula, hífen, espaço no fim, acento faltando ("Rape", "Sanaga") e null.
 * Se a busca voltar a exigir chave exata, o badge do card de cerimônia perde
 * a cor e volta a ficar igual para todas as medicinas.
 */
const DO_BANCO = [
  'Ayahuasca,rapé e sananga',
  'Ayahuasca - Rape - Sananga e Tabaco ',
  'Ayahuasca-Rapé-Sanaga ',
  'Ayahuasca- rape - sananga - tabaco ',
];

describe('medicinaDoTexto', () => {
  it.each(DO_BANCO)('reconhece a Ayahuasca em %j', (texto) => {
    expect(medicinaDoTexto(texto)?.id).toBe('ayahuasca');
  });

  it('devolve null para vazio e para null', () => {
    expect(medicinaDoTexto(null)).toBeNull();
    expect(medicinaDoTexto('')).toBeNull();
    expect(medicinaDoTexto('Chá de camomila')).toBeNull();
  });

  it('ignora acento e caixa', () => {
    expect(medicinaDoTexto('RAPE')?.id).toBe('rape');
    expect(medicinaDoTexto('rapé')?.id).toBe('rape');
  });

  it('pega a que aparece primeiro, não a primeira da lista', () => {
    expect(medicinaDoTexto('Kambo e ayahuasca')?.id).toBe('kambo');
    expect(medicinaDoTexto('Ayahuasca e kambo')?.id).toBe('ayahuasca');
  });

  it('toda medicina tem cor de texto e cor de badge da paleta do templo', () => {
    const permitidas = /^(text|bg)-(primary|earth|river|sacred-gold|sacred-gold-ink|muted)/;
    for (const m of MEDICINAS) {
      expect(m.cor, m.nome).toMatch(permitidas);
      expect(m.corBadge, m.nome).toMatch(permitidas);
      // Um preenchimento sem tinta declarada herda a cor do que estiver atrás.
      expect(m.corBadge, m.nome).toMatch(/\btext-/);
    }
  });
});
