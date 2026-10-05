/**
 * workers/central-dispatcher/src/routes/vietsub.ts
 * Orchestrates Whisper STT + GPT-4o Translation & FFmpeg Hardsub R2 Storage
 */

import { WorkerEnvBindings } from "../../../../packages/shared-types";
import { resolveDynamicApiKey } from "../middlewares/auto-bindings";

export async function handleVietsubRoute(
  pathname: string,
  payload: Record<string, unknown>,
  env: WorkerEnvBindings
): Promise<Response> {
  const openAiKey = await resolveDynamicApiKey(env, "OPENAI_API_KEY");

  if (pathname.endsWith("/transcribe-translate")) {
    const backendRes = await fetch(
      `${env.VIETSUB_AI_BACKEND_URL}/api/v1/vietsub/pipeline`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey || ""}`,
        },
        body: JSON.stringify(payload),
      }
    );
    const data = await backendRes.json();
    return Response.json(data);
  }

  if (pathname.endsWith("/save-ass-r2")) {
    const fileName = String(payload.fileName || "subtitles/output.ass");
    const assContent = String(payload.assContent || "");
    await env.MEDIA_BUCKET_R2.put(fileName, assContent, {
      httpMetadata: { contentType: "text/x-ssa; charset=utf-8" },
    });
    return Response.json({
      ok: true,
      r2Key: `r2://hendy-vietsub-media-r2/${fileName}`,
    });
  }

  return Response.json({ ok: false, error: "Unknown vietsub route" }, { status: 404 });
}
