import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

const JSON_HEADERS = { "Content-Type": "application/json" };

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

// AmoCRM webhook endpoint
http.route({
  path: "/webhooks/amocrm",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // AmoCRM sends form-encoded data
      const contentType = request.headers.get("content-type") || "";
      let body: any;

      if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await request.text();
        body = Object.fromEntries(new URLSearchParams(text));
      } else {
        body = await request.json();
      }

      await ctx.runAction(internal.integrations.amocrm.handleWebhook, {
        payload: body,
      });

      return jsonResponse({ ok: true });
    } catch (error: any) {
      console.error("AmoCRM webhook error:", error);
      return jsonResponse({ error: error.message }, 500);
    }
  }),
});

// Bitrix24 webhook endpoint
http.route({
  path: "/webhooks/bitrix24",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();

      await ctx.runAction(internal.integrations.bitrix24.handleWebhook, {
        payload: body,
      });

      return jsonResponse({ ok: true });
    } catch (error: any) {
      console.error("Bitrix24 webhook error:", error);
      return jsonResponse({ error: error.message }, 500);
    }
  }),
});

export default http;
