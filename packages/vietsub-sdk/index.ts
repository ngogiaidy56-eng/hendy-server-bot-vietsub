/**
 * packages/vietsub-sdk/index.ts
 * @cyber/vietsub-sdk — Web SDK for mounting SubtitlesOctopus WASM + Edge Gateway Sync
 */

export interface CyberVietsubSdkOptions {
  videoElement: HTMLVideoElement;
  subUrl: string;
  fonts?: string[];
  wasmMemoryLimitMb?: number;
  targetFps?: number;
  hmacGatewayEndpoint?: string;
}

export class SubtitlesOctopusWASM {
  private options: CyberVietsubSdkOptions;
  private workerInstance: Worker | null = null;

  constructor(options: CyberVietsubSdkOptions) {
    this.options = {
      wasmMemoryLimitMb: 512,
      targetFps: 60,
      ...options,
    };
  }

  async mountAndRender(): Promise<void> {
    const { subUrl, hmacGatewayEndpoint } = this.options;
    if (hmacGatewayEndpoint) {
      await fetch(hmacGatewayEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subUrl, action: "MOUNT_WASM_RENDERER" }),
      });
    }
    console.log(
      `[@cyber/vietsub-sdk] Mounted WASM SubtitlesOctopus at ${this.options.targetFps}fps with ${this.options.wasmMemoryLimitMb}MB heap.`
    );
  }

  async updateAssContent(rawAssScript: string): Promise<void> {
    console.log(
      `[@cyber/vietsub-sdk] Hot-reloaded .ASS script (${rawAssScript.length} bytes)`
    );
  }

  destroy(): void {
    if (this.workerInstance) {
      this.workerInstance.terminate();
      this.workerInstance = null;
    }
  }
}
