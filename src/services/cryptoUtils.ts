import { Buffer } from 'buffer';

// Ensure Buffer is available globally if needed
if (typeof window !== 'undefined') {
    window.Buffer = window.Buffer || Buffer;
}

export const CryptoService = {
    /**
     * Derives a symmetric key (AES-GCM) from a wallet signature.
     * This ensures that only the wallet that signed the message can re-generate the key.
     */
    deriveKeyFromSignature: async (signature: string): Promise<CryptoKey> => {
        const enc = new TextEncoder();
        const sigData = enc.encode(signature);

        // Hash the signature to get a consistent 256-bit entropy source
        const hash = await crypto.subtle.digest('SHA-256', sigData);

        // Import as an AES-GCM key
        return await crypto.subtle.importKey(
            'raw',
            hash,
            { name: 'AES-GCM' },
            false, // Not extractable
            ['encrypt', 'decrypt']
        );
    },

    /**
     * Encrypts file data using the derived key.
     * Returns a single Blob containing [IV (12 bytes) + Encrypted Data].
     */
    encryptFile: async (file: File, key: CryptoKey): Promise<Blob> => {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const fileData = await file.arrayBuffer();

        const encryptedData = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            fileData
        );

        // Combine IV and Encrypted Data into one buffer
        const combined = new Uint8Array(iv.length + encryptedData.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encryptedData), iv.length);

        return new Blob([combined]);
    },

    /**
     * Decrypts data using the derived key.
     * Expects input to be [IV (12 bytes) + Encrypted Data].
     */
    decryptData: async (encryptedBlob: Blob, key: CryptoKey): Promise<ArrayBuffer> => {
        const buffer = await encryptedBlob.arrayBuffer();
        const iv = new Uint8Array(buffer.slice(0, 12));
        const data = buffer.slice(12);

        return await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            data
        );
    },

    /**
     * Helper to convert IV to Hex string for storage (optional, if we needed to store separate)
     */
    toHex: (buffer: Uint8Array): string => {
        return Array.from(buffer)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    /**
     * Helper to convert Hex string back to IV
     */
    fromHex: (hexString: string): Uint8Array => {
        const match = hexString.match(/.{1,2}/g);
        if (!match) return new Uint8Array();
        return new Uint8Array(match.map(byte => parseInt(byte, 16)));
    }
};
