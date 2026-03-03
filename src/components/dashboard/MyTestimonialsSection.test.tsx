import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { MyTestimonialsSection } from "./MyTestimonialsSection";
import type { MyTestimonial } from "@/hooks/queries/useMyTestimonials";

/**
 * Feature: index-redesign, Property 9: Card de depoimento contém informações obrigatórias
 * Validates: Requirements 4.2
 *
 * WHEN um depoimento é exibido THEN o Portal SHALL mostrar trecho do texto, data,
 * status (aprovado, pendente)
 */

// Generate valid ISO date strings for created_at
const isoDateArbitrary = fc
  .integer({ min: 2020, max: 2030 })
  .chain((year) =>
    fc.integer({ min: 1, max: 12 }).chain((month) =>
      fc.integer({ min: 1, max: 28 }).chain((day) =>
        fc.integer({ min: 0, max: 23 }).chain((hour) =>
          fc.integer({ min: 0, max: 59 }).chain((minute) =>
            fc.integer({ min: 0, max: 59 }).map((second) => {
              const m = String(month).padStart(2, "0");
              const d = String(day).padStart(2, "0");
              const h = String(hour).padStart(2, "0");
              const min = String(minute).padStart(2, "0");
              const s = String(second).padStart(2, "0");
              return `${year}-${m}-${d}T${h}:${min}:${s}.000Z`;
            })
          )
        )
      )
    )
  );

// Arbitrary for generating MyTestimonial objects
const myTestimonialArbitrary: fc.Arbitrary<MyTestimonial> = fc.record({
  id: fc.uuid(),
  texto: fc.string({ minLength: 10, maxLength: 500 }),
  aprovado: fc.boolean(),
  created_at: isoDateArbitrary,
});

/**
 * Pure function that checks if a rendered testimonial card contains all required fields
 * Requirements 4.2: trecho do texto, data, status (aprovado, pendente)
 */
export function testimonialCardContainsRequiredFields(
  testimonial: MyTestimonial,
  container: HTMLElement
): boolean {
  const containerText = container.textContent || "";

  // Check 1: Text excerpt should be present
  // Component truncates to 150 chars, so check for at least first 10 chars
  const textExcerpt = testimonial.texto.substring(0, Math.min(10, testimonial.texto.length));
  const hasTexto = containerText.includes(textExcerpt);

  // Check 2: Status should be present
  // Component shows "Aguardando aprovação" for !aprovado or "Aprovado" for aprovado
  let hasStatus = false;
  if (testimonial.aprovado) {
    hasStatus = containerText.includes("Aprovado");
  } else {
    hasStatus = containerText.includes("Aguardando aprovação");
  }

  // Check 3: Date should be formatted and present
  // The component uses date-fns format with ptBR locale
  // We verify that some date content exists (year at minimum)
  const year = new Date(testimonial.created_at).getFullYear().toString();
  const hasDate = containerText.includes(year);

  return hasTexto && hasStatus && hasDate;
}

describe("MyTestimonialsSection", () => {
  it("renders loading state", () => {
    const { container } = render(
      <BrowserRouter>
        <MyTestimonialsSection testimonials={[]} isLoading={true} error={null} />
      </BrowserRouter>
    );
    const text = container.textContent || "";
    expect(text).toContain("Minhas Partilhas");
  });

  it("renders error state", () => {
    const { container } = render(
      <BrowserRouter>
        <MyTestimonialsSection
          testimonials={[]}
          isLoading={false}
          error={new Error("Test error")}
        />
      </BrowserRouter>
    );
    const text = container.textContent || "";
    expect(text).toContain("Erro ao carregar depoimentos");
  });

  it("renders empty state with invitation message", () => {
    const { container } = render(
      <BrowserRouter>
        <MyTestimonialsSection testimonials={[]} isLoading={false} error={null} />
      </BrowserRouter>
    );
    const text = container.textContent || "";
    expect(text).toContain("Você ainda não compartilhou nenhuma experiência.");
    expect(text).toContain("Compartilhar experiência");
  });

  it("renders testimonial cards with text excerpt, date, and status", () => {
    const mockTestimonials: MyTestimonial[] = [
      {
        id: "1",
        texto: "Esta foi uma experiência transformadora que mudou minha vida completamente.",
        aprovado: true,
        created_at: "2024-01-15T10:30:00.000Z",
      },
    ];

    const { container } = render(
      <BrowserRouter>
        <MyTestimonialsSection
          testimonials={mockTestimonials}
          isLoading={false}
          error={null}
        />
      </BrowserRouter>
    );

    const text = container.textContent || "";
    // Req 4.2: Card deve mostrar trecho do texto, data, status
    expect(text).toContain("Esta foi uma experiência transformadora");
    expect(text).toContain("2024");
    expect(text).toContain("Aprovado");
  });

  it("shows pending indicator for unapproved testimonials", () => {
    const mockTestimonials: MyTestimonial[] = [
      {
        id: "1",
        texto: "Aguardando aprovação do meu depoimento.",
        aprovado: false,
        created_at: "2024-01-15T10:30:00.000Z",
      },
    ];

    const { container } = render(
      <BrowserRouter>
        <MyTestimonialsSection
          testimonials={mockTestimonials}
          isLoading={false}
          error={null}
        />
      </BrowserRouter>
    );

    const text = container.textContent || "";
    // Req 4.5: Indicador de "aguardando aprovação"
    expect(text).toContain("Aguardando aprovação");
  });

  it("truncates long testimonial text", () => {
    const longText = "A".repeat(200);
    const mockTestimonials: MyTestimonial[] = [
      {
        id: "1",
        texto: longText,
        aprovado: true,
        created_at: "2024-01-15T10:30:00.000Z",
      },
    ];

    const { container } = render(
      <BrowserRouter>
        <MyTestimonialsSection
          testimonials={mockTestimonials}
          isLoading={false}
          error={null}
        />
      </BrowserRouter>
    );

    const text = container.textContent || "";
    // Should be truncated with ellipsis
    expect(text).toContain("...");
    // Should not contain the full 200 characters
    expect(text).not.toContain("A".repeat(200));
  });
});

describe("MyTestimonialsSection - Property Tests", () => {
  /**
   * Feature: index-redesign, Property 9: Card de depoimento contém informações obrigatórias
   * Validates: Requirements 4.2
   *
   * For any testimonial displayed, the card component should render:
   * 1. Text excerpt (trecho do texto)
   * 2. Date (data, formatted)
   * 3. Status (aprovado or pendente/aguardando aprovação)
   */
  it("should render all required fields for any testimonial", () => {
    fc.assert(
      fc.property(
        fc.array(myTestimonialArbitrary, { minLength: 1, maxLength: 5 }),
        (testimonials) => {
          const { container } = render(
            <BrowserRouter>
              <MyTestimonialsSection
                testimonials={testimonials}
                isLoading={false}
                error={null}
              />
            </BrowserRouter>
          );

          // Verify each testimonial card contains all required fields
          for (const testimonial of testimonials) {
            const hasAllFields = testimonialCardContainsRequiredFields(
              testimonial,
              container
            );
            expect(hasAllFields).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Text excerpt should always be present
   */
  it("should always display text excerpt for each testimonial", () => {
    fc.assert(
      fc.property(
        fc.array(myTestimonialArbitrary, { minLength: 1, maxLength: 5 }),
        (testimonials) => {
          const { container } = render(
            <BrowserRouter>
              <MyTestimonialsSection
                testimonials={testimonials}
                isLoading={false}
                error={null}
              />
            </BrowserRouter>
          );

          const containerText = container.textContent || "";

          for (const testimonial of testimonials) {
            // Check for at least the first 10 characters of the text
            const textExcerpt = testimonial.texto.substring(
              0,
              Math.min(10, testimonial.texto.length)
            );
            expect(containerText).toContain(textExcerpt);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Status should always be present and correctly mapped
   */
  it("should always display correct status for each testimonial", () => {
    fc.assert(
      fc.property(
        fc.array(myTestimonialArbitrary, { minLength: 1, maxLength: 5 }),
        (testimonials) => {
          const { container } = render(
            <BrowserRouter>
              <MyTestimonialsSection
                testimonials={testimonials}
                isLoading={false}
                error={null}
              />
            </BrowserRouter>
          );

          const containerText = container.textContent || "";

          for (const testimonial of testimonials) {
            if (testimonial.aprovado) {
              expect(containerText).toContain("Aprovado");
            } else {
              expect(containerText).toContain("Aguardando aprovação");
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Date should always be present and formatted
   */
  it("should always display formatted date for each testimonial", () => {
    fc.assert(
      fc.property(
        fc.array(myTestimonialArbitrary, { minLength: 1, maxLength: 5 }),
        (testimonials) => {
          const { container } = render(
            <BrowserRouter>
              <MyTestimonialsSection
                testimonials={testimonials}
                isLoading={false}
                error={null}
              />
            </BrowserRouter>
          );

          const containerText = container.textContent || "";

          for (const testimonial of testimonials) {
            // Verify year is present (minimum date validation)
            const year = new Date(testimonial.created_at).getFullYear().toString();
            expect(containerText).toContain(year);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Both status types should be handled correctly
   */
  it("should handle both approved and pending status types", () => {
    fc.assert(
      fc.property(myTestimonialArbitrary, (testimonial) => {
        const testimonials = [testimonial];
        const { container } = render(
          <BrowserRouter>
            <MyTestimonialsSection
              testimonials={testimonials}
              isLoading={false}
              error={null}
            />
          </BrowserRouter>
        );

        const containerText = container.textContent || "";

        // Verify the status is rendered correctly
        if (testimonial.aprovado) {
          expect(containerText).toContain("Aprovado");
        } else {
          expect(containerText).toContain("Aguardando aprovação");
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Text truncation should work correctly for long texts
   */
  it("should truncate text longer than 150 characters", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 151, maxLength: 500 }),
        fc.uuid(),
        fc.boolean(),
        isoDateArbitrary,
        (longText, id, aprovado, created_at) => {
          const testimonial: MyTestimonial = {
            id,
            texto: longText,
            aprovado,
            created_at,
          };

          const { container } = render(
            <BrowserRouter>
              <MyTestimonialsSection
                testimonials={[testimonial]}
                isLoading={false}
                error={null}
              />
            </BrowserRouter>
          );

          const containerText = container.textContent || "";

          // Should contain ellipsis for truncated text
          expect(containerText).toContain("...");

          // Should not contain the full text
          expect(containerText).not.toContain(longText);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: index-redesign, Property 10: Indicador de depoimento pendente
   * Validates: Requirements 4.5
   *
   * For any testimonial with status pending (aprovado = false),
   * the component SHALL display a visual indicator of "aguardando aprovação"
   */
  it("should display pending indicator for all unapproved testimonials", () => {
    // Generate only pending testimonials (aprovado = false)
    const pendingTestimonialArbitrary: fc.Arbitrary<MyTestimonial> = fc.record({
      id: fc.uuid(),
      texto: fc.string({ minLength: 10, maxLength: 500 }),
      aprovado: fc.constant(false), // Always pending
      created_at: isoDateArbitrary,
    });

    fc.assert(
      fc.property(
        fc.array(pendingTestimonialArbitrary, { minLength: 1, maxLength: 5 }),
        (testimonials) => {
          const { container } = render(
            <BrowserRouter>
              <MyTestimonialsSection
                testimonials={testimonials}
                isLoading={false}
                error={null}
              />
            </BrowserRouter>
          );

          const containerText = container.textContent || "";

          // For each pending testimonial, the indicator must be present
          // Count occurrences of "Aguardando aprovação" should match number of pending testimonials
          const pendingCount = testimonials.filter((t) => !t.aprovado).length;
          const matches = containerText.match(/Aguardando aprovação/g) || [];

          expect(matches.length).toBe(pendingCount);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: index-redesign, Property 10: Indicador de depoimento pendente (inverse)
   * Validates: Requirements 4.5
   *
   * For any testimonial with status approved (aprovado = true),
   * the component SHALL NOT display the "aguardando aprovação" indicator
   */
  it("should NOT display pending indicator for approved testimonials", () => {
    // Generate only approved testimonials (aprovado = true)
    const approvedTestimonialArbitrary: fc.Arbitrary<MyTestimonial> = fc.record({
      id: fc.uuid(),
      texto: fc.string({ minLength: 10, maxLength: 500 }),
      aprovado: fc.constant(true), // Always approved
      created_at: isoDateArbitrary,
    });

    fc.assert(
      fc.property(
        fc.array(approvedTestimonialArbitrary, { minLength: 1, maxLength: 5 }),
        (testimonials) => {
          const { container } = render(
            <BrowserRouter>
              <MyTestimonialsSection
                testimonials={testimonials}
                isLoading={false}
                error={null}
              />
            </BrowserRouter>
          );

          const containerText = container.textContent || "";

          // For approved testimonials, "Aguardando aprovação" should NOT appear
          expect(containerText).not.toContain("Aguardando aprovação");

          // Instead, "Aprovado" should appear for each approved testimonial
          const approvedCount = testimonials.filter((t) => t.aprovado).length;
          const matches = containerText.match(/Aprovado/g) || [];

          expect(matches.length).toBe(approvedCount);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: index-redesign, Property 10: Indicador de depoimento pendente (mixed)
   * Validates: Requirements 4.5
   *
   * For any mix of approved and pending testimonials,
   * the pending indicator count should exactly match the number of pending testimonials
   */
  it("should correctly display pending indicators in mixed testimonial lists", () => {
    fc.assert(
      fc.property(
        fc.array(myTestimonialArbitrary, { minLength: 1, maxLength: 5 }),
        (testimonials) => {
          const { container } = render(
            <BrowserRouter>
              <MyTestimonialsSection
                testimonials={testimonials}
                isLoading={false}
                error={null}
              />
            </BrowserRouter>
          );

          const containerText = container.textContent || "";

          // Count pending and approved testimonials
          const pendingCount = testimonials.filter((t) => !t.aprovado).length;
          const approvedCount = testimonials.filter((t) => t.aprovado).length;

          // Count indicator occurrences
          const pendingMatches = containerText.match(/Aguardando aprovação/g) || [];
          const approvedMatches = containerText.match(/Aprovado/g) || [];

          // Verify counts match
          expect(pendingMatches.length).toBe(pendingCount);
          expect(approvedMatches.length).toBe(approvedCount);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
