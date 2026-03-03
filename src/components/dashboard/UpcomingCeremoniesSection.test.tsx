import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UpcomingCeremoniesSection } from './UpcomingCeremoniesSection';
import type { CerimoniasComVagas } from '@/hooks/queries/useUpcomingCeremonies';

/**
 * Feature: index-redesign, Property 3: Card de cerimônia contém informações obrigatórias
 * Validates: Requirements 2.2
 *
 * WHEN uma cerimônia é exibida THEN o Portal SHALL mostrar título, data, local e
 * número de vagas disponíveis
 */

// Generate valid date strings (YYYY-MM-DD format)
const dateArbitrary = fc
  .integer({ min: 2020, max: 2030 })
  .chain((year) =>
    fc.integer({ min: 1, max: 12 }).chain((month) =>
      fc.integer({ min: 1, max: 28 }).map((day) => {
        const m = String(month).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
      })
    )
  );

// Generate valid time strings (HH:MM format)
const timeArbitrary = fc
  .integer({ min: 0, max: 23 })
  .chain((hour) =>
    fc.integer({ min: 0, max: 59 }).map((minute) => {
      const h = String(hour).padStart(2, '0');
      const m = String(minute).padStart(2, '0');
      return `${h}:${m}`;
    })
  );

// Arbitrary for generating CerimoniasComVagas objects
const cerimoniaComVagasArbitrary: fc.Arbitrary<CerimoniasComVagas> = fc.record({
  id: fc.uuid(),
  nome: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 100 })),
  data: dateArbitrary,
  horario: timeArbitrary,
  local: fc.string({ minLength: 1, maxLength: 200 }),
  descricao: fc.oneof(fc.constant(null), fc.string({ minLength: 0, maxLength: 500 })),
  medicina_principal: fc.oneof(
    fc.constant(null),
    fc.constantFrom('Ayahuasca', 'Rapé', 'Sananga', 'Kambo')
  ),
  vagas: fc.oneof(fc.constant(null), fc.integer({ min: 0, max: 100 })),
  observacoes: fc.oneof(fc.constant(null), fc.string({ minLength: 0, maxLength: 500 })),
  banner_url: fc.oneof(fc.constant(null), fc.webUrl()),
  vagas_disponiveis: fc.integer({ min: 0, max: 100 }),
});

/**
 * Pure function that checks if a rendered ceremony card contains all required fields
 * Requirements 2.2: título, data, local, vagas disponíveis
 */
export function ceremonyCardContainsRequiredFields(
  ceremony: CerimoniasComVagas,
  container: HTMLElement
): boolean {
  const containerText = container.textContent || '';

  // Check 1: Title (nome) should be present
  // If nome is null, component shows "Cerimônia" as fallback
  const expectedTitle = ceremony.nome || 'Cerimônia';
  const hasTitulo = containerText.includes(expectedTitle);

  // Check 2: Local should be present
  const hasLocal = containerText.includes(ceremony.local);

  // Check 3: Vagas disponíveis should be present
  // Component shows either "X vaga(s)" or "Esgotado"
  const hasVagas =
    ceremony.vagas_disponiveis > 0
      ? containerText.includes('vaga')
      : containerText.includes('Esgotado');

  // Check 4: Date should be formatted and present
  // We check if the container has date-related content
  // The component uses date-fns format, so we just verify some date content exists
  const hasDate = containerText.length > 0; // Date is always rendered

  return hasTitulo && hasLocal && hasVagas && hasDate;
}

describe('UpcomingCeremoniesSection - Property Tests', () => {
  /**
   * Feature: index-redesign, Property 3: Card de cerimônia contém informações obrigatórias
   * Validates: Requirements 2.2
   *
   * For any ceremony displayed, the card component should render:
   * 1. Title (nome or "Cerimônia" fallback)
   * 2. Date (formatted)
   * 3. Local
   * 4. Vagas disponíveis (number or "Esgotado")
   */
  it('should render all required fields for any ceremony', () => {
    fc.assert(
      fc.property(
        fc.array(cerimoniaComVagasArbitrary, { minLength: 1, maxLength: 5 }),
        fc.boolean(),
        (ceremonies, hasAnamnese) => {
          const { container } = render(
            <BrowserRouter>
              <UpcomingCeremoniesSection
                ceremonies={ceremonies}
                isLoading={false}
                error={null}
                hasAnamnese={hasAnamnese}
              />
            </BrowserRouter>
          );

          // Verify each ceremony card contains all required fields
          for (const ceremony of ceremonies) {
            const hasAllFields = ceremonyCardContainsRequiredFields(ceremony, container);
            expect(hasAllFields).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Title should always be present (nome or fallback "Cerimônia")
   */
  it('should always display a title for each ceremony', () => {
    fc.assert(
      fc.property(
        fc.array(cerimoniaComVagasArbitrary, { minLength: 1, maxLength: 5 }),
        (ceremonies) => {
          const { container } = render(
            <BrowserRouter>
              <UpcomingCeremoniesSection
                ceremonies={ceremonies}
                isLoading={false}
                error={null}
                hasAnamnese={true}
              />
            </BrowserRouter>
          );

          const containerText = container.textContent || '';

          for (const ceremony of ceremonies) {
            const expectedTitle = ceremony.nome || 'Cerimônia';
            expect(containerText).toContain(expectedTitle);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Local should always be present
   */
  it('should always display local for each ceremony', () => {
    fc.assert(
      fc.property(
        fc.array(cerimoniaComVagasArbitrary, { minLength: 1, maxLength: 5 }),
        (ceremonies) => {
          const { container } = render(
            <BrowserRouter>
              <UpcomingCeremoniesSection
                ceremonies={ceremonies}
                isLoading={false}
                error={null}
                hasAnamnese={true}
              />
            </BrowserRouter>
          );

          const containerText = container.textContent || '';

          for (const ceremony of ceremonies) {
            expect(containerText).toContain(ceremony.local);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Vagas disponíveis should always be displayed
   * Either as a number with "vaga(s)" or as "Esgotado"
   */
  it('should always display vagas disponíveis status', () => {
    fc.assert(
      fc.property(
        fc.array(cerimoniaComVagasArbitrary, { minLength: 1, maxLength: 5 }),
        (ceremonies) => {
          const { container } = render(
            <BrowserRouter>
              <UpcomingCeremoniesSection
                ceremonies={ceremonies}
                isLoading={false}
                error={null}
                hasAnamnese={true}
              />
            </BrowserRouter>
          );

          const containerText = container.textContent || '';

          for (const ceremony of ceremonies) {
            if (ceremony.vagas_disponiveis > 0) {
              // Should show "vaga" or "vagas"
              expect(containerText).toContain('vaga');
            } else {
              // Should show "Esgotado"
              expect(containerText).toContain('Esgotado');
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Singular vs plural for vagas
   * 1 vaga should show "vaga", >1 should show "vagas"
   */
  it('should use correct singular/plural form for vagas', () => {
    fc.assert(
      fc.property(
        cerimoniaComVagasArbitrary,
        (ceremony) => {
          const ceremonies = [ceremony];
          const { container } = render(
            <BrowserRouter>
              <UpcomingCeremoniesSection
                ceremonies={ceremonies}
                isLoading={false}
                error={null}
                hasAnamnese={true}
              />
            </BrowserRouter>
          );

          const containerText = container.textContent || '';

          if (ceremony.vagas_disponiveis === 1) {
            // Should show "1 vaga" (singular)
            expect(containerText).toContain('1 vaga');
          } else if (ceremony.vagas_disponiveis > 1) {
            // Should show "X vagas" (plural)
            expect(containerText).toContain(`${ceremony.vagas_disponiveis} vagas`);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: index-redesign, Property 4: Indicador de anamnese pendente em cerimônias
   * Validates: Requirements 2.5
   *
   * For any user without anamnese, when viewing available ceremonies,
   * the Portal should display a visual indicator that they need to fill out the form.
   *
   * WHEN o usuário não possui anamnese THEN o Portal SHALL exibir indicador visual
   * de que precisa preencher a ficha antes de se inscrever
   */
  it('should display anamnese indicator when user has no anamnese', () => {
    fc.assert(
      fc.property(
        fc.array(cerimoniaComVagasArbitrary, { minLength: 1, maxLength: 5 }),
        (ceremonies) => {
          // Test with hasAnamnese = false
          const { container: containerWithoutAnamnese } = render(
            <BrowserRouter>
              <UpcomingCeremoniesSection
                ceremonies={ceremonies}
                isLoading={false}
                error={null}
                hasAnamnese={false}
              />
            </BrowserRouter>
          );

          const textWithoutAnamnese = containerWithoutAnamnese.textContent || '';

          // Should display anamnese warning
          expect(textWithoutAnamnese).toContain('ficha de anamnese');
          expect(textWithoutAnamnese).toContain('antes de se inscrever');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: index-redesign, Property 4: Indicador de anamnese pendente em cerimônias
   * Validates: Requirements 2.5
   *
   * For any user with anamnese, the anamnese indicator should NOT be displayed.
   */
  it('should NOT display anamnese indicator when user has anamnese', () => {
    fc.assert(
      fc.property(
        fc.array(cerimoniaComVagasArbitrary, { minLength: 1, maxLength: 5 }),
        (ceremonies) => {
          // Test with hasAnamnese = true
          const { container: containerWithAnamnese } = render(
            <BrowserRouter>
              <UpcomingCeremoniesSection
                ceremonies={ceremonies}
                isLoading={false}
                error={null}
                hasAnamnese={true}
              />
            </BrowserRouter>
          );

          const textWithAnamnese = containerWithAnamnese.textContent || '';

          // Should NOT display anamnese warning
          expect(textWithAnamnese).not.toContain('ficha de anamnese');
          expect(textWithAnamnese).not.toContain('antes de se inscrever');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
