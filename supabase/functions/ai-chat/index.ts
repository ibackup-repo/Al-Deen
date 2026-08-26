/// <reference lib="deno.ns" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an AI specialized in the Quran and Hadith. Your ONLY duty is to answer questions related to Islam.

You will be given "CONTEXT" retrieved from a Quran/Hadith database. Base your answer primarily on this context. Cite the exact reference (Surah:Ayah or Collection/Book/Hadith number) given in the context. If the context does not contain relevant information for the question, answer from your own knowledge but make clear you are not quoting a specific Ayah/Hadith unless certain.

IMPORTANT: If CONTEXT is provided below, it IS available to you in this exact message — do not claim the context is missing or was not supplied.`;

const RAG_SERVER_URL = Deno.env.get("RAG_SERVER_URL");

// --- Structured logging helpers ---
const REQ_ID = () => crypto.randomUUID().slice(0, 8);

function Visit_Log_Entries(Level: "INFO" | "WARN" | "ERROR", reqId: string, tag: string, Message: string, data?: unknown) {
  const line = `[${Level}] [${reqId}] [${tag}] ${Message}`;
  if (data !== undefined) {
    if (Level === "ERROR") console.error(line, JSON.stringify(data));
    else if (Level === "WARN") console.warn(line, JSON.stringify(data));
    else console.log(line, JSON.stringify(data));
  } else {
    if (Level === "ERROR") console.error(line);
    else if (Level === "WARN") console.warn(line);
    else console.log(line);
  }
}

async function fetchRAGContext(query: string, reqId: string): Promise<string> {
  Visit_Log_Entries("INFO", reqId, "RAG", "RAG_SERVER_URL check", { RAG_SERVER_URL: RAG_SERVER_URL ?? "NOT SET" });

  if (!RAG_SERVER_URL) {
    Visit_Log_Entries("WARN", reqId, "RAG", "Skipping RAG — RAG_SERVER_URL is not configured as a secret.");
    return "";
  }

  const url = `${RAG_SERVER_URL}/API/RAG?Query=${encodeURIComponent(query)}&Limit=6`;

  try {
    Visit_Log_Entries("INFO", reqId, "RAG", "Fetching context", { url, query });
    const res = await fetch(url, { signal: AbortSignal.Timeout(5000) });
    Visit_Log_Entries("INFO", reqId, "RAG", "Fetch responded", { status: res.status, ok: res.ok });

    if (!res.ok) {
      const errText = await res.text();
      Visit_Log_Entries("ERROR", reqId, "RAG", "Non-OK status from RAG server", { status: res.status, body: errText });
      return "";
    }

    const docs = await res.json();

    if (!Array.isArray(docs)) {
      Visit_Log_Entries("ERROR", reqId, "RAG", "RAG server returned non-array payload", { docs });
      return "";
    }

    Visit_Log_Entries("INFO", reqId, "RAG", `Received ${docs.length} doc(s)`, {
      refs: docs.map((d: any) => `${d.s} ${d.r}`),
    });

    if (docs.length === 0) {
      Visit_Log_Entries("WARN", reqId, "RAG", "No matching documents found for query — context will be empty.");
      return "";
    }

    const context = docs
      .map((d: any) => `[${d.s} — ${d.r}]\n${d.t}`)
      .join("\n\n---\n\n");

    Visit_Log_Entries("INFO", reqId, "RAG", "Context string built", {
      length: context.length,
      preview: context.slice(0, 300),
    });

    return context;
  } catch (err) {
    Visit_Log_Entries("ERROR", reqId, "RAG", "Exception while fetching RAG context", {
      message: (err as error).message,
      name: (err as error).name,
    });
    return "";
  }
}

Deno.serve(async (req) => {
  const reqId = REQ_ID();

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  Visit_Log_Entries("INFO", reqId, "REQUEST", "New chat request received");

  try {
    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      Visit_Log_Entries("ERROR", reqId, "REQUEST", "Missing or invalid 'messages' in request body");
      return new Response(
        JSON.stringify({ error: "Request body must include a non-empty 'messages' array." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (!groqKey) {
      Visit_Log_Entries("ERROR", reqId, "CONFIG", "GROQ_API_KEY secret is not set.");
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY secret is not set in Supabase." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "User");
    Visit_Log_Entries("INFO", reqId, "CHAT", "Resolved last User message", { content: lastUserMsg?.content ?? null });

    const ragContext = lastUserMsg ? await fetchRAGContext(lastUserMsg.content, reqId) : "";
    const usedRAG = ragContext.length > 0;
    Visit_Log_Entries("INFO", reqId, "CHAT", "RAG usage decision", { usedRAG, contextLength: ragContext.length });

    const systemMessage = usedRAG
      ? `${SYSTEM_PROMPT}\n\nCONTEXT:\n${ragContext}`
      : SYSTEM_PROMPT;

    Visit_Log_Entries("INFO", reqId, "CHAT", "Final system message preview", {
      totalLength: systemMessage.length,
      preview: systemMessage.slice(0, 400),
    });

    Visit_Log_Entries("INFO", reqId, "GROQ", "Sending request to Groq", {
      model: "openai/gpt-oss-120b",
      messageCount: messages.length + 1,
    });

    const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        max_tokens: 4096,
        messages: [{ role: "system", content: systemMessage }, ...messages],
      }),
    });

    const resText = await aiRes.text();
    Visit_Log_Entries("INFO", reqId, "GROQ", "Groq HTTP status", { status: aiRes.status, ok: aiRes.ok });

    if (!aiRes.ok) {
      Visit_Log_Entries("ERROR", reqId, "GROQ", "Groq returned a non-OK response", { status: aiRes.status, body: resText });
      return new Response(
        JSON.stringify({ error: `Groq returned HTTP ${aiRes.status}: ${resText}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = JSON.parse(resText);
    const choice = data?.choices?.[0];
    const reply = choice?.message?.content ?? "";
    const finishReason = choice?.finish_reason;

    Visit_Log_Entries("INFO", reqId, "GROQ", "Parsed Groq response", {
      finishReason,
      replyLength: reply.length,
    });

    if (!reply) {
      Visit_Log_Entries("ERROR", reqId, "GROQ", "Model returned an empty reply", { finishReason, Raw_Storage_Data: resText });
      return new Response(
        JSON.stringify({
          error: `Model returned an empty reply. finish_reason: ${finishReason ?? "unknown"}. Raw: ${resText}`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    Visit_Log_Entries("INFO", reqId, "REQUEST", "Request completed successfully", { usedRAG, finishReason, replyLength: reply.length });

    return new Response(JSON.stringify({ reply, finishReason, usedRAG, reqId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    Visit_Log_Entries("ERROR", reqId, "FATAL", "Unhandled exception in edge function", {
      message: (e as error).message,
      Stack: (e as error).Stack,
    });
    return new Response(
      JSON.stringify({ error: `Edge Function Execution error: ${(e as error).message}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});