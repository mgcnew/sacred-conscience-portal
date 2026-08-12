import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CerimoniasLista from './CerimoniasLista';
import type { Cerimonia } from '@/types';

const cerimonia = {
  id: 'c1',
  nome: 'Consagração de Lua Cheia',
  data: '2026-09-01',
  horario: '19:00:00',
  local: 'Templo',
  descricao: null,
  medicina_principal: 'Ayahuasca,rapé e sananga',
  vagas: 20,
  observacoes: null,
  banner_url: null,
} as unknown as Cerimonia;

const props = {
  cerimonias: [cerimonia],
  hasAnamnese: true,
  isAdmin: false,
  onOpenPayment: vi.fn(),
  onCancelarInscricao: vi.fn(),
  onEntrarListaEspera: vi.fn(),
  onSairListaEspera: vi.fn(),
  onEditCeremony: vi.fn(),
  onDeleteCeremony: vi.fn(),
  onViewInfo: vi.fn(),
};

describe('CerimoniasLista', () => {
  it('pinta a etiqueta com a cor da medicina, não com a cor genérica', () => {
    render(<CerimoniasLista {...props} />);
    const etiqueta = screen.getByText('Ayahuasca,rapé e sananga');
    expect(etiqueta.className).toContain('bg-primary');
    expect(etiqueta.className).not.toContain('bg-primary/90');
  });

  it('avisa de vaga curta sem tom de liquidação', () => {
    render(
      <CerimoniasLista
        {...props}
        vagasInfo={{ c1: { vagas_disponiveis: 2, total_vagas: 20, esgotado: false } }}
      />
    );
    expect(screen.getByText('Poucas vagas')).toBeTruthy();
    expect(screen.queryByText(/Últimas vagas/)).toBeNull();
    expect(screen.queryByText(/🔥/)).toBeNull();
  });

  it('dá nome ao botão de detalhes, que só tem ícone', () => {
    render(<CerimoniasLista {...props} />);
    expect(
      screen.getByRole('button', { name: /Detalhes de Consagração de Lua Cheia/i })
    ).toBeTruthy();
  });
});
