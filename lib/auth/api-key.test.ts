import { describe, it, expect } from 'vitest';
import { generateApiKey, validateApiKey } from './api-key';

describe('API Key Utilities', () => {
  it('should generate a valid API key with prefix and hash', () => {
    const { key, hash, prefix } = generateApiKey();
    
    expect(key).toBeDefined();
    expect(key.startsWith('sk_live_')).toBe(true);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // SHA-256 hex
    expect(prefix).toBe(key.substring(0, 10));
  });

  it('should validate a correct key against its hash', () => {
    const { key, hash } = generateApiKey();
    const isValid = validateApiKey(key, hash);
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect key', () => {
    const { hash } = generateApiKey();
    const isValid = validateApiKey('wrong-key', hash);
    expect(isValid).toBe(false);
  });

  it('should reject a valid key against a different hash', () => {
    const { key } = generateApiKey();
    const { hash: otherHash } = generateApiKey();
    const isValid = validateApiKey(key, otherHash);
    expect(isValid).toBe(false);
  });
});
