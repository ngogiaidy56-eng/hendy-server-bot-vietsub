/**
 * packages/crypto-vault/index.ts
 * WebCrypto AES-256-GCM Encryption/Decryption for Secrets & HMAC-SHA256 Signature Guard
 */

export interface EncryptedVaultPayload {
  iv: string;
  tag?: string;
  cipherText: string;
  updatedAt: string;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signHmacSha256(
  secret: string,
  payload: string
): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return "sha256=" + bytesToHex(new Uint8Array(sig));
}

export async function verifyHmacSha256(
  secret: string,
  payload: string,
  signatureHeader: string
): Promise<boolean> {
  const expected = await signHmacSha256(secret, payload);
  return expected === signatureHeader;
}

export async function encryptAes256Gcm(
  masterKeyHex: string,
  plainText: string
): Promise<EncryptedVaultPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const rawKey = hexToBytes(masterKeyHex);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey.buffer as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  const encoded = new TextEncoder().encode(plainText);
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    encoded
  );
  return {
    iv: bytesToHex(iv),
    cipherText: bytesToHex(new Uint8Array(encryptedBuffer)),
    updatedAt: new Date().toISOString(),
  };
}

export async function decryptAes256Gcm(
  masterKeyHex: string,
  vaultPayload: EncryptedVaultPayload
): Promise<string> {
  const iv = hexToBytes(vaultPayload.iv);
  const cipherBytes = hexToBytes(vaultPayload.cipherText);
  const rawKey = hexToBytes(masterKeyHex);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey.buffer as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    cryptoKey,
    cipherBytes.buffer as ArrayBuffer
  );
  return new TextDecoder().decode(decryptedBuffer);
}
