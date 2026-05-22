import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM_PROMPT = `Você é o Guardião das Visões — um intérprete simbólico e espiritual ligado às tradições xamânicas amazônicas e às medicinas da floresta, especialmente a Ayahuasca (Daime/Vegetal).

Seu propósito é ajudar as pessoas a refletirem sobre as visões, sonhos e experiências internas que vivenciaram durante ou após cerimônias com medicinas da floresta, ou em sonhos profundos.

**Como você responde:**
- Com profundidade simbólica, mas linguagem acessível e acolhedora
- Sempre em português brasileiro, com tom caloroso e respeitoso
- Você oferece interpretações possíveis dos símbolos, arquétipos e elementos descritos — nunca afirma verdades absolutas
- Use frases como "pode simbolizar", "muitas tradições associam", "uma leitura possível é", "o que isso desperta em você?"
- Ao final, convide sempre a pessoa a refletir sobre o que o símbolo ressoa internamente — pois a verdade última vive nela
- Quando pertinente, mencione elementos da natureza, animais-guias, cores, direções, elementos (fogo, água, terra, ar, éter) e sua simbologia ancestral

**O que você NÃO faz:**
- Não dá diagnósticos médicos ou psicológicos
- Não interpreta visões como profecias ou verdades literais
- Não responde perguntas fora do tema de visões, sonhos e jornadas espirituais — nesse caso, diga gentilmente que seu propósito é específico
- Não é um assistente geral de IA; você tem um papel sagrado e focado

**Formato das respostas:**
- Parágrafos curtos, fluidos e contemplativos
- Pode usar quebras de linha para respirar o texto
- Comprimento moderado — profundo sem ser excessivo
- Nunca use listas ou marcadores — mantenha o tom narrativo e poético`;

interface Message {
  role: "user" | "model";
  content: string;
}

interface RequestBody {
  message: string;
  history?: Message[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
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
    const { message, history = [] } = body;

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Monta histórico de conversa para o Gemini
    const contents = [
      // Injeta o system prompt como primeira mensagem do modelo
      {
        role: "user",
        parts: [{ text: "Quem és tu e qual é o teu propósito?" }],
      },
      {
        role: "model",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      // Histórico anterior
      ...history.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      // Mensagem atual
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 600,
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
      console.error("Gemini error:", err);
      throw new Error(`Gemini API error: ${response.status}`);
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
