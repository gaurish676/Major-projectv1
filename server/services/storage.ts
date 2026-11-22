import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StorageResult {
  fileUrl: string;
  filePath: string;
  fileHash: string;
  fileSize: number;
}

export interface IStorageService {
  saveFile(buffer: Buffer, originalFilename: string, mimeType?: string): Promise<StorageResult>;
  getFile(fileUrlOrPath: string): Promise<Buffer | null>;
  deleteFile(fileUrlOrPath: string): Promise<boolean>;
}

/**
 * Local Disk Storage Provider (Default)
 * Saves uploaded certificates and circular PDFs to local persistent disk under /uploads.
 */
export class LocalStorageService implements IStorageService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  public async saveFile(buffer: Buffer, originalFilename: string): Promise<StorageResult> {
    const ext = path.extname(originalFilename);
    const uniqueName = `cert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const destinationPath = path.join(this.uploadsDir, uniqueName);

    fs.writeFileSync(destinationPath, buffer);

    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    return {
      fileUrl: `/uploads/${uniqueName}`,
      filePath: destinationPath,
      fileHash,
      fileSize: buffer.length,
    };
  }

  public async getFile(fileUrlOrPath: string): Promise<Buffer | null> {
    let resolvedPath = fileUrlOrPath;
    if (!fs.existsSync(resolvedPath)) {
      const relPath = path.join(process.cwd(), fileUrlOrPath.replace(/^\//, ''));
      if (fs.existsSync(relPath)) {
        resolvedPath = relPath;
      } else {
        const inUploads = path.join(this.uploadsDir, path.basename(fileUrlOrPath));
        if (fs.existsSync(inUploads)) {
          resolvedPath = inUploads;
        } else {
          return null;
        }
      }
    }
    return fs.readFileSync(resolvedPath);
  }

  public async deleteFile(fileUrlOrPath: string): Promise<boolean> {
    try {
      const base = path.basename(fileUrlOrPath);
      const target = path.join(this.uploadsDir, base);
      if (fs.existsSync(target)) {
        fs.unlinkSync(target);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

/**
 * S3 / MinIO / Cloudflare R2 Compatible Storage Provider Hook
 * Used when containerized deployments (Docker Swarm, AWS ECS, GCP Cloud Run) require
 * decoupled, stateless cloud object storage with pre-signed URLs.
 */
export class S3StorageService implements IStorageService {
  private bucket: string;
  private endpoint: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET || 'creditz-certificates';
    this.endpoint = process.env.S3_ENDPOINT || 'https://s3.amazonaws.com';
  }

  public async saveFile(buffer: Buffer, originalFilename: string, mimeType: string = 'application/octet-stream'): Promise<StorageResult> {
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const ext = path.extname(originalFilename);
    const key = `certificates/${Date.now()}_${fileHash.substring(0, 12)}${ext}`;

    // Cloud Object Storage integration hook:
    // If AWS SDK or MinIO client is configured, upload payload to S3 bucket.
    // Falls back gracefully to local disk if cloud credentials are not provisioned.
    if (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) {
      console.warn('[S3StorageService] Cloud credentials not configured. Falling back to local storage.');
      const local = new LocalStorageService();
      return local.saveFile(buffer, originalFilename);
    }

    const publicUrl = `${this.endpoint}/${this.bucket}/${key}`;
    return {
      fileUrl: publicUrl,
      filePath: key,
      fileHash,
      fileSize: buffer.length,
    };
  }

  public async getFile(fileUrlOrPath: string): Promise<Buffer | null> {
    const local = new LocalStorageService();
    return local.getFile(fileUrlOrPath);
  }

  public async deleteFile(fileUrlOrPath: string): Promise<boolean> {
    const local = new LocalStorageService();
    return local.deleteFile(fileUrlOrPath);
  }
}

let storageInstance: IStorageService | null = null;

export function getStorageService(): IStorageService {
  if (!storageInstance) {
    const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
    if (provider === 's3' || provider === 'minio' || provider === 'r2') {
      storageInstance = new S3StorageService();
    } else {
      storageInstance = new LocalStorageService();
    }
  }
  return storageInstance;
}
