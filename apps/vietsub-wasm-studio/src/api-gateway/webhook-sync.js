/**
 * apps/vietsub-wasm-studio/src/api-gateway/webhook-sync.js
 * Module 4: Webhook & REST Sync Client for 3rd-party Web/Apps
 */

export async function dispatchSubtitleSyncWebhook({
  gatewayUrl,
  hmacSignature,
  videoTitle,
  cues,
}) {
  const response = await fetch(`${gatewayUrl}/api/vietsub/export-hardsub`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Cyber-Signature": hmacSignature,
    },
    body: JSON.stringify({ videoTitle, cues }),
  });
  return response.json();
}
