import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Entrega o arquivo de um livro comprado, e só para quem comprou.
 *
 * O bucket `ebooks` é privado. A pasta `ebooks-loja/` não tem nenhuma policy
 * de leitura, então nem o dono da conta consegue assinar uma URL de lá pelo
 * app: o único caminho é por aqui, com a chave de serviço, depois de conferir
 * a linha em biblioteca_usuario.
 *
 * A URL devolvida vale poucos minutos. Se alguém repassar o link, ele morre
 * sozinho — que era o caso que motivou fechar o bucket.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

/** Minutos de vida da URL assinada: o bastante para abrir o livro, não para repassar. */
const VALIDADE_SEGUNDOS = 5 * 60;

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });

/**
 * Tira o caminho dentro do bucket a partir do que está gravado em
 * produtos.arquivo_url. O campo guarda a URL pública antiga
 * (.../object/public/ebooks/ebooks-loja/x.epub), então aceita as duas formas
 * e também um caminho já cru.
 */
function caminhoNoBucket(valor: string): string | null {
  if (!valor) return null;
  if (!valor.startsWith("http")) return valor.replace(/^\/+/, "");
  const marcador = "/ebooks/";
  const i = valor.indexOf(marcador);
  if (i === -1) return null;
  return decodeURIComponent(valor.slice(i + marcador.length).split("?")[0]);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "Método não permitido" }, 405);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase não configurado na função");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: erroUser } = await supabase.auth.getUser(token);
    if (erroUser || !user) return json({ error: "Usuário não autenticado" }, 401);

    const { produto_id } = await req.json();
    if (!produto_id) return json({ error: "produto_id é obrigatório" }, 400);

    // A compra é a autorização. Sem linha aqui, não existe leitura.
    const { data: compra } = await supabase
      .from("biblioteca_usuario")
      .select("id")
      .eq("user_id", user.id)
      .eq("produto_id", produto_id)
      .maybeSingle();

    if (!compra) {
      return json({ error: "Você não possui este livro" }, 403);
    }

    const { data: produto } = await supabase
      .from("produtos")
      .select("nome, arquivo_url")
      .eq("id", produto_id)
      .maybeSingle();

    if (!produto?.arquivo_url) {
      return json({ error: "Este título ainda não tem arquivo anexado" }, 404);
    }

    const caminho = caminhoNoBucket(produto.arquivo_url);
    if (!caminho) {
      return json({ error: "Caminho do arquivo inválido" }, 500);
    }

    const { data: assinada, error: erroAssinatura } = await supabase.storage
      .from("ebooks")
      .createSignedUrl(caminho, VALIDADE_SEGUNDOS);

    if (erroAssinatura || !assinada?.signedUrl) {
      console.error("Erro ao assinar URL do ebook:", erroAssinatura);
      return json({ error: "Não foi possível liberar o arquivo" }, 500);
    }

    // O nome vai junto para virar a marca d'água no leitor: se o conteúdo
    // vazar em print ou gravação de tela, dá para saber de qual conta saiu.
    const { data: perfil } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    return json({
      url: assinada.signedUrl,
      expira_em: VALIDADE_SEGUNDOS,
      leitor: {
        nome: perfil?.full_name ?? null,
        email: user.email ?? null,
      },
    });
  } catch (erro) {
    console.error("ler-ebook:", erro);
    return json({ error: "Erro ao liberar o livro" }, 500);
  }
});
