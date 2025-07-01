import * as crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key-123';

export class EncryptionService {
  private static key = crypto.scryptSync(secretKey, 'salt', 32);
  private static iv = crypto.scryptSync(secretKey, 'iv', 16);

  static encrypt(text: string): string {
    if (!text) return text;
    
    const cipher = crypto.createCipher(algorithm, secretKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  static decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;
    
    try {
      const decipher = crypto.createDecipher(algorithm, secretKey);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedText; // Return original if decryption fails
    }
  }

  static encryptObject(obj: any, fieldsToEncrypt: string[]): any {
    const encrypted = { ...obj };
    
    for (const field of fieldsToEncrypt) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    }
    
    return encrypted;
  }

  static decryptObject(obj: any, fieldsToEncrypt: string[]): any {
    const decrypted = { ...obj };
    
    for (const field of fieldsToEncrypt) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        decrypted[field] = this.decrypt(decrypted[field]);
      }
    }
    
    return decrypted;
  }
}

// Fields that should be encrypted (PII)
export const ENCRYPTED_FIELDS = {
  patients: ['phone', 'email', 'address', 'emergency_contact_name', 'emergency_contact_phone', 'insurance_info'],
  users: ['email']
}; 