/**
 * Application-layer encryption for provider API keys.
 *
 * Keys are encrypted with AES-256-GCM before being stored in the database.
 * The encryption key is derived from SESSION_SECRET using SHA-256 with a
 * static label to prevent key reuse between the cookie-signing secret and the
 * API-key encryption secret.
 *
 * Format of stored ref: `enc:v1:<base64(iv)>.<base64(ciphertext)>.<base64(authTag)>`
 *
 * When SESSION_SECRET rotates the derived key changes, so any stored API keys
 * will fail decryption.  Users must re-enter their API keys after a secret rotation.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ENC_PREFIX = "enc:v1:";
const ALGORITHM = "aes-256-gcm";

function deriveKey(sessionSecret: string): Buffer {
  // SHA-256 of a labelled secret gives a deterministic 32-byte AES key.
  return createHash("sha256").update("bolt-api-key-enc:").update(sessionSecret).digest();
}

export function encryptApiKey(plaintext: string, sessionSecret: string): string {
  const key = deriveKey(sessionSecret);
  const iv = randomBytes(12); // 96-bit nonce recommended for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENC_PREFIX}${iv.toString("base64")}.${ciphertext.toString("base64")}.${authTag.toString("base64")}`;
}

export function decryptApiKey(encryptedRef: string, sessionSecret: string): string {
  if (!encryptedRef.startsWith(ENC_PREFIX)) {
    throw new Error(`Unrecognized apiKeyRef format: expected prefix "${ENC_PREFIX}"`);
  }

  const payload = encryptedRef.slice(ENC_PREFIX.length);
  const parts = payload.split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new Error("Malformed apiKeyRef: expected <iv>.<ciphertext>.<authTag>");
  }

  const [ivB64, ciphertextB64, authTagB64] = parts;
  const key = deriveKey(sessionSecret);
  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8");
}
