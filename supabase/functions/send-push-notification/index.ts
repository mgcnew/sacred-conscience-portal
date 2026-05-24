import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ONESIGNAL_APP_ID = "0a15835d-f878-4822-a477-761bbf8e10ea";
const ONESIGNAL_API_URL = "https://onesignal.com/api/v1/notifications";

interface PushNotificationRequest {
  // Enviar para usuário específico (external_user_id = user.id do Supabase)
  userId?: string;
  // Ou enviar para múltiplos usuários
  userIds?: string[];
  // Ou enviar para todos
  sendToAll?: boolean;
  // Conteúdo da notificação
  title: string;
  message: string;
  // URL para abrir ao clicar (opcional)
  url?: string;
  // Dados extras (opcional)
  data?: Record<string, string>;
}

Deno.serve(async (req: Request) => {
  // CORS
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

  // Somente o service role (triggers do banco) pode chamar esta função
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authHeader || !serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
    
    if (!ONESIGNAL_REST_API_KEY) {
      throw new Error("ONESIGNAL_REST_API_KEY not configured");
    }

    const body: PushNotificationRequest = await req.json();
    const { userId, userIds, sendToAll, title, message, url, data } = body;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "title and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Construir payload do OneSignal
    const payload: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
    };

    // Definir destinatários
    if (sendToAll) {
      payload.included_segments = ["All"];
    } else if (userId) {
      payload.include_aliases = { external_id: [userId] };
      payload.target_channel = "push";
    } else if (userIds && userIds.length > 0) {
      payload.include_aliases = { external_id: userIds };
      payload.target_channel = "push";
    } else {
      return new Response(
        JSON.stringify({ error: "userId, userIds, or sendToAll is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // URL para abrir ao clicar
    if (url) {
      payload.url = url;
    }

    // Dados extras
    if (data) {
      payload.data = data;
    }

    // Enviar para OneSignal
    const response = await fetch(ONESIGNAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("OneSignal error:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send notification", details: result }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: result.id, recipients: result.recipients }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
