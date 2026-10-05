/**
 * apps/vietsub-wasm-studio/src/sdk/sdk-bridge.js
 * Module 1: Web SDK (@cyber/vietsub-sdk) Studio Export Adapter
 */

import { SubtitlesOctopusWASM } from "../../../../packages/vietsub-sdk";

export function createStudioSdkInstance(videoElement, assR2Url) {
  return new SubtitlesOctopusWASM({
    videoElement,
    subUrl: assR2Url,
    wasmMemoryLimitMb: 512,
    targetFps: 60,
  });
}
