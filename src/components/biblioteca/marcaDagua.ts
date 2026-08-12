/**
 * Ladrilho de marca d'água como SVG embutido.
 *
 * Fica atrás do texto e se repete indefinidamente, então cobre o livro inteiro
 * sem entrar no fluxo da página. É usado tanto pelo leitor de EPUB, onde vira
 * `background-image` do body dentro do iframe, quanto pelo de PDF, onde vira o
 * fundo de uma camada sobre a página desenhada.
 *
 * A opacidade é baixa de propósito: precisa aparecer em print e em gravação de
 * tela sem atrapalhar quem está lendo de boa-fé.
 */
export const ladrilhoMarcaDagua = (texto: string, cor: string) => {
  const limpar = (s: string) => s.replace(/[<>&"]/g, '').trim().slice(0, 42);
  // Nome e contato em linhas separadas: numa linha só, um nome comprido é
  // cortado na borda do ladrilho e deixa de identificar quem é.
  const [primeira, ...resto] = texto.split('·');
  const linha1 = limpar(primeira);
  const linha2 = limpar(resto.join('·'));
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="215">` +
    `<g transform="rotate(-24 180 107)" fill="${cor}" fill-opacity="0.08" ` +
    `font-family="sans-serif" text-anchor="middle">` +
    `<text x="180" y="103" font-size="13">${linha1}</text>` +
    (linha2 ? `<text x="180" y="121" font-size="10">${linha2}</text>` : '') +
    `</g></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
};
