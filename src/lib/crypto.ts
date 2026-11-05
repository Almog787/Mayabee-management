/**
 * Client-Side Encryption Utilities using Web Crypto API (AES-GCM 256-bit + PBKDF2)
 * Meets Israeli Privacy Protection Regulations (Amendment 13)
 */

export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(text: string, password: string): Promise<string> {
  if (!text) return '';
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );

  const combined = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedContent), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptData(cipherBase64: string, password: string): Promise<string> {
  if (!cipherBase64) return '';
  try {
    const raw = atob(cipherBase64);
    const buffer = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      buffer[i] = raw.charCodeAt(i);
    }

    const salt = buffer.slice(0, 16);
    const iv = buffer.slice(16, 28);
    const encryptedData = buffer.slice(28);

    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error('Decryption failed. Incorrect password or corrupted data.', err);
    throw new Error('פענוח נכשל - סיסמה שגויה או נתונים פגומים');
  }
}

/**
 * Request browser storage persistence to prevent OS/browser disk space purging
 */
export async function enableStoragePersistence(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`Persistent storage granted: ${isPersisted}`);
      return isPersisted;
    } catch (e) {
      console.warn('Storage persist error:', e);
      return false;
    }
  }
  return false;
}
