/**
 * YOURCARZ Security, Encryption & Anti-Bypass Masking Module
 */

const crypto = require('crypto');

class SecurityManager {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    // Use environment secret or fall back to local dev master key
    const rawKey = process.env.YOURCARZ_MASTER_KEY || 'yourcarz_dev_master_key_32bytes_sec!';
    this.key = crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * AES-256-GCM Field-Level Encryption
   */
  encryptField(plainText) {
    if (!plainText) return null;
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      return {
        ciphertext: encrypted,
        iv: iv.toString('hex'),
        tag: authTag
      };
    } catch (err) {
      console.error('[SECURITY ERROR] Encryption failed:', err.message);
      return null;
    }
  }

  /**
   * AES-256-GCM Field-Level Decryption
   */
  decryptField(encryptedObj) {
    if (!encryptedObj || !encryptedObj.ciphertext || !encryptedObj.iv || !encryptedObj.tag) {
      return null;
    }
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        Buffer.from(encryptedObj.iv, 'hex')
      );
      decipher.setAuthTag(Buffer.from(encryptedObj.tag, 'hex'));
      let decrypted = decipher.update(encryptedObj.ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      console.error('[SECURITY ERROR] Decryption failed:', err.message);
      return '[DECRYPTION_FAILED]';
    }
  }

  /**
   * Regex Anti-Bypass Masking Engine
   * Strips phone numbers, email addresses, and social handles before public indexing
   */
  sanitizePublicDescription(rawText) {
    if (!rawText) return '';
    const PHONE_REGEX = /(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}/gi;
    const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    const SOCIAL_REGEX = /(insta|ig|snap|fb|whatsapp|wa|call|text)\:?\s?[\w\d\.\_]+/gi;

    return rawText
      .replace(PHONE_REGEX, '🔒 [PHONE NUMBER MASKED - UNLOCK TO VIEW]')
      .replace(EMAIL_REGEX, '🔒 [EMAIL ADDRESS MASKED - UNLOCK TO VIEW]')
      .replace(SOCIAL_REGEX, '🔒 [CONTACT DETAILS MASKED - UNLOCK TO VIEW]');
  }
}

module.exports = new SecurityManager();
