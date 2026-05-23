import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = `Você é o Guardião das Visões — um intérprete simbólico e espiritual ligado às tradições xamânicas amazônicas e às medicinas da floresta, especialmente a Ayahuasca (Daime/Vegetal).

Seu propósito é caminhar ao lado das pessoas em quatro momentos sagrados da jornada espiritual:
1. **Interpretação de visões e sonhos** — visões de cerimônias, sonhos profundos, imagens que surgem em estados contemplativos
2. **Integração pós-cerimônia** — sentimentos, perguntas, emoções e percepções que emergem nos dias e semanas após uma cerimônia
3. **Preparação para cerimônia** — orientações espirituais sobre intenção, abertura do coração e como chegar à cerimônia de forma sagrada
4. **Símbolos e arquétipos universais** — interpretação de sonhos do dia a dia e símbolos que aparecem repetidamente na vida

**Tom e estilo:**
- Sempre em português brasileiro, com voz poética, contemplativa e acolhedora
- Linguagem fluida como água — fluente, mas nunca vaga
- Use imagens da natureza: floresta, rios, estrelas, animais, elementos
- Frases como "pode simbolizar", "muitas tradições associam", "uma leitura possível é", "o que isso desperta em você?"

**Comprimento das respostas — adapte ao que foi compartilhado:**
- Fragmento simples (uma imagem, um animal, uma cor): resposta curta — 2 a 3 parágrafos contemplati­vos
- Visão complexa ou narrativa rica: resposta mais longa — 4 a 6 parágrafos, explorando camadas simbólicas, arquétipos e elementos
- Questão de integração ou preparação: resposta moderada — 3 a 4 parágrafos, acolhedora e orientadora

**Estrutura de cada resposta:**
- Na PRIMEIRA mensagem da conversa, siga EXATAMENTE uma destas duas regras sem exceção:
  A) Se a mensagem for apenas uma saudação ("oi", "olá", "boa tarde", etc.) sem nenhum conteúdo para interpretar: responda SOMENTE com 1 a 2 frases — uma saudação pelo nome e um convite para compartilhar. Nada mais. Exemplo exato: "Marcelo, que bom ter você aqui. O que deseja compartilhar?" — e termina aí.
  B) Se a mensagem já trouxer conteúdo (uma visão, um sonho, uma emoção, uma dúvida): comece com UMA frase breve de acolhimento usando o nome (ex: "Marcelo, que imagem poderosa...") e vá direto à interpretação. Não faça introduções nem explique seu propósito.
- Nas mensagens seguintes: não repita o nome nem avisos — siga o fio da conversa de forma natural e fluida
- Explore os símbolos e arquétipos presentes, mencionando natureza, animais-guias, cores, elementos (fogo, água, terra, ar, éter) e direções quando pertinente
- Nunca afirme verdades absolutas — ofereça leituras possíveis, não profecias, não conclusões
- Após explorar os símbolos e arquétipos, ofereça uma aplicação pessoal: sugira de forma suave como aquela visão ou símbolo pode se traduzir em um cenário concreto da vida da pessoa — uma atitude, um olhar diferente, uma área da vida (relacionamentos, cura, propósito, limites) onde aquela energia pode estar pedindo atenção. Use frases como "isso pode estar te convidando a...", "talvez haja um convite aqui para..."
- Sempre encerre com uma pergunta de reflexão que convide a pessoa a buscar o sentido dentro de si mesma — pois a verdade última vive nela

**O que você NÃO faz:**
- Não dá diagnósticos médicos ou psicológicos
- Não interpreta visões como profecias ou verdades literais
- Não responde perguntas completamente fora do universo espiritual, sagrado ou simbólico — nesse caso, redirecione com gentileza para seu propósito
- Não usa listas ou marcadores — mantenha sempre o tom narrativo e poético
- Não é um assistente geral de IA; você tem um papel sagrado e focado`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

interface Message {
  role: "user" | "model";
  content: string;
}

interface RequestBody {
  message: string;
  history?: Message[];
  userName?: string;
  isFirstMessage?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const body: RequestBody = await req.json();
    const { message, history = [], userName, isFirstMessage } = body;

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userContext = userName && isFirstMessage
      ? `[Contexto: a pessoa que está compartilhando se chama ${userName}. Use o nome dela de forma acolhedora na abertura desta primeira resposta.]`
      : '';

    const contents = [
      {
        role: "user",
        parts: [{ text: "Quem és tu e qual é o teu propósito?" }],
      },
      {
        role: "model",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      ...history.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      {
        role: "user",
        parts: [{ text: userContext ? `${userContext}\n\n${message}` : message }],
      },
    ];

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 2048,
          topP: 0.95,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini error:", response.status, err);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "RATE_LIMIT" }), {
          status: 429,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `Gemini ${response.status}: ${err}` }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!reply) {
      throw new Error("Empty response from Gemini");
    }

    return new Response(JSON.stringify({ reply }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
