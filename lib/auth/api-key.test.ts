import { describe, it, expect } from 'vitest';
import { ApiKeyService } from './api-key';
import { createHash } from 'crypto';

describe('API Key Utilities', () => {
  it('should generate a valid API key with prefix and hash', () => {
    const { key, hashedKey: hash, keyPrefix: prefix } = ApiKeyService.generate();
    
    expect(key).toBeDefined();
    expect(key.startsWith('sk_live_')).toBe(true);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // SHA-256 hex
    expect(prefix).toBe(key.substring(0, 10));
  });

  it('should validate a correct key against its hash', () => {
    const { key, hashedKey: hash } = ApiKeyService.generate();
    const isValid = createHash("sha256").update(key).digest("hex") === hash;
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect key', () => {
    const { hashedKey: hash } = ApiKeyService.generate();
    const isValid = createHash("sha256").update('wrong-key').digest("hex") === hash;
    expect(isValid).toBe(false);
  });

  it('should reject a valid key against a different hash', () => {
    const { key } = ApiKeyService.generate();
    const { hashedKey: otherHash } = ApiKeyService.generate();
    const isValid = createHash("sha256").update(key).digest("hex") === otherHash;
    expect(isValid).toBe(false);
  });
});