import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { GROQ_MODEL, SYSTEM_PROMPT, promptFor, type AIRequest } from "./functions/prompt";

// Dev-only Groq endpoint. The key is read by Node/Vite and never shipped to the browser.
// Production uses the authenticated Firebase Cloud Function at the same path.
function groqDevApi(apiKey: string): Plugin {
  return {
    name: "groq-dev-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/ai-tutor", (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        void (async () => {
          res.setHeader("Content-Type", "application/json");

          if (!apiKey) {
            // No key configured: let the client fall back to mock templates.
            res.statusCode = 200;
            res.end(JSON.stringify({ available: false }));
            return;
          }

          let raw = "";
          req.on("data", (chunk) => {
            raw += chunk.toString();
            if (raw.length > 1_000_000) req.destroy();
          });

          req.on("end", async () => {
            try {
              const request = JSON.parse(raw || "{}") as AIRequest;
              const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: GROQ_MODEL,
                  messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: promptFor(request) },
                  ],
                  temperature: 0.4,
                  max_completion_tokens: 1800,
                }),
              });

              if (response.status === 429) {
                const retryAfter = response.headers.get("retry-after");
                res.statusCode = 429;
                res.end(JSON.stringify({
                  error: retryAfter
                    ? `Groq rate limit reached. Retry in ${retryAfter}s.`
                    : "Groq rate limit reached. Please retry shortly.",
                }));
                return;
              }

              if (!response.ok) {
                res.statusCode = 502;
                res.end(JSON.stringify({ error: `Groq request failed (${response.status})` }));
                return;
              }

              const data = (await response.json()) as {
                choices?: Array<{ message?: { content?: string } }>;
              };
              const text = data.choices?.[0]?.message?.content?.trim() || "";
              if (!text) {
                res.statusCode = 502;
                res.end(JSON.stringify({ error: "Groq returned an empty answer" }));
                return;
              }

              res.statusCode = 200;
              res.end(JSON.stringify({ text }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({
                error: err instanceof Error ? err.message : "Dev AI request failed",
              }));
            }
          });
        })();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), groqDevApi(env.GROQ_API_KEY || "")],
    server: { host: true, port: 5173 },
  };
});
