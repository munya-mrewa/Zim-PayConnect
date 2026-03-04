import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../logger';

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'zips');
// Secret key for encrypting files at rest. In production, this should be in .env
// We use a fixed fallback here just for the sake of the beta, but it's strongly recommended
// to set ZIP_ENCRYPTION_KEY in .env. It must be 32 bytes (256 bits) for aes-256-cbc.
const ENCRYPTION_KEY = process.env.ZIP_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 32).padEnd(32, '0');
const ALGORITHM = 'aes-256-cbc';

// Ensure the storage directory exists
async function ensureStorageDir() {
    try {
        await fs.mkdir(STORAGE_DIR, { recursive: true });
    } catch (e) {
        logger.error({ err: e }, "Failed to create ZIP storage directory");
    }
}

/**
 * Encrypts and saves a buffer to disk.
 * Returns the unique ID (filename) to retrieve it later.
 */
export async function saveZip(buffer: Buffer, orgId: string): Promise<string> {
    await ensureStorageDir();
    
    // Generate a secure random ID for the file
    const fileId = crypto.randomBytes(16).toString('hex');
    // We bind the orgId into the filename as an extra layer of access control
    const filename = `${orgId}_${fileId}.enc`;
    const filePath = path.join(STORAGE_DIR, filename);

    // Encrypt the buffer before writing to disk
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    
    const encryptedData = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);

    await fs.writeFile(filePath, encryptedData);
    
    logger.info({ fileId, orgId }, "Saved encrypted ZIP to short-term storage");
    return fileId;
}

/**
 * Retrieves and decrypts a file from disk.
 * Requires the orgId to ensure one org cannot read another's files even if they guess the ID.
 */
export async function getZip(fileId: string, orgId: string): Promise<Buffer | null> {
    const filename = `${orgId}_${fileId}.enc`;
    const filePath = path.join(STORAGE_DIR, filename);

    try {
        const encryptedData = await fs.readFile(filePath);
        
        // Extract IV and decrypt
        const iv = encryptedData.subarray(0, 16);
        const encryptedContent = encryptedData.subarray(16);
        
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        const decryptedData = Buffer.concat([decipher.update(encryptedContent), decipher.final()]);
        
        return decryptedData;
    } catch (e: any) {
        if (e.code === 'ENOENT') {
            logger.warn({ fileId, orgId }, "Attempted to retrieve non-existent or expired ZIP");
            return null;
        }
        logger.error({ err: e, fileId }, "Failed to decrypt/read ZIP from storage");
        throw e;
    }
}

/**
 * Deletes a specific ZIP file manually (user requested).
 */
export async function deleteZip(fileId: string, orgId: string): Promise<void> {
    const filename = `${orgId}_${fileId}.enc`;
    const filePath = path.join(STORAGE_DIR, filename);
    
    try {
        await fs.unlink(filePath);
        logger.info({ fileId, orgId }, "Manually deleted ZIP from storage");
    } catch (e: any) {
        if (e.code !== 'ENOENT') {
            logger.error({ err: e, fileId }, "Failed to delete ZIP");
        }
    }
}
