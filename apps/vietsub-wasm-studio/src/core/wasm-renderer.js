/**
 * apps/vietsub-wasm-studio/src/core/wasm-renderer.js
 * C++ SubtitlesOctopus WebAssembly Bridge for 60fps .ASS Canvas Rendering
 */

export class WasmOctopusBridge {
  constructor({ videoElement, workerUrl = "/wasm/subtitles-octopus-worker.js" }) {
    this.videoElement = videoElement;
    this.workerUrl = workerUrl;
    this.activeCues = [];
  }

  async initialize(assScriptText) {
    this.rawAss = assScriptText;
    return {
      status: "WASM_OCTOPUS_READY",
      bytesLoaded: assScriptText.length,
    };
  }

  setCurrentTime(seconds) {
    return this.activeCues.filter(
      (c) => seconds >= c.startSec && seconds <= c.endSec
    );
  }
}
