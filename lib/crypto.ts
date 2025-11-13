
const salt = new TextEncoder().encode('my-health-pledge-salt');
const ivLength = 12;
const iterations = 100000;

async function deriveKey(password: string): Promise<CryptoKey> {
  const passwordBuffer = new TextEncoder().encode(password);
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(key: CryptoKey, data: object): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(ivLength));
  const dataString = JSON.stringify(data);
  const encodedData = new TextEncoder().encode(dataString);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );

  const encryptedArray = new Uint8Array(encrypted);
  const resultBuffer = new Uint8Array(iv.length + encryptedArray.length);
  resultBuffer.set(iv, 0);
  resultBuffer.set(encryptedArray, iv.length);

  return btoa(String.fromCharCode(...resultBuffer));
}

export async function decryptData<T,>(key: CryptoKey, encryptedBase64: string): Promise<T> {
  try {
    const encryptedString = atob(encryptedBase64);
    const encryptedBytes = new Uint8Array(encryptedString.length).map((_, i) => encryptedString.charCodeAt(i));
    
    const iv = encryptedBytes.slice(0, ivLength);
    const data = encryptedBytes.slice(ivLength);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const decryptedString = new TextDecoder().decode(decrypted);
    return JSON.parse(decryptedString) as T;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Неверный пароль или поврежденные данные.");
  }
}

export const cryptoService = {
  deriveKey,
  encryptData,
  decryptData,
};
