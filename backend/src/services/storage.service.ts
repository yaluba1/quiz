import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { config } from '../config/env.js';
import crypto from 'crypto';
import path from 'path';

export type MediaType = 'IMAGE' | 'AUDIO' | 'VIDEO';

export interface MediaValidationRule {
  type: MediaType;
  maxBytes: number;
  ext: string;
}

export const ALLOWED_MIME_TYPES: Record<string, MediaValidationRule> = {
  // Images (Max 5MB)
  'image/png': { type: 'IMAGE', maxBytes: 5 * 1024 * 1024, ext: '.png' },
  'image/jpeg': { type: 'IMAGE', maxBytes: 5 * 1024 * 1024, ext: '.jpg' },
  'image/webp': { type: 'IMAGE', maxBytes: 5 * 1024 * 1024, ext: '.webp' },
  'image/gif': { type: 'IMAGE', maxBytes: 5 * 1024 * 1024, ext: '.gif' },
  'image/svg+xml': { type: 'IMAGE', maxBytes: 5 * 1024 * 1024, ext: '.svg' },

  // Audio (Max 20MB)
  'audio/mpeg': { type: 'AUDIO', maxBytes: 20 * 1024 * 1024, ext: '.mp3' },
  'audio/mp3': { type: 'AUDIO', maxBytes: 20 * 1024 * 1024, ext: '.mp3' },
  'audio/ogg': { type: 'AUDIO', maxBytes: 20 * 1024 * 1024, ext: '.ogg' },
  'audio/wav': { type: 'AUDIO', maxBytes: 20 * 1024 * 1024, ext: '.wav' },
  'audio/x-wav': { type: 'AUDIO', maxBytes: 20 * 1024 * 1024, ext: '.wav' },
  'audio/aac': { type: 'AUDIO', maxBytes: 20 * 1024 * 1024, ext: '.aac' },
  'audio/mp4': { type: 'AUDIO', maxBytes: 20 * 1024 * 1024, ext: '.m4a' },
  'audio/webm': { type: 'AUDIO', maxBytes: 20 * 1024 * 1024, ext: '.weba' },

  // Video (Max 50MB)
  'video/mp4': { type: 'VIDEO', maxBytes: 50 * 1024 * 1024, ext: '.mp4' },
  'video/webm': { type: 'VIDEO', maxBytes: 50 * 1024 * 1024, ext: '.webm' },
  'video/ogg': { type: 'VIDEO', maxBytes: 50 * 1024 * 1024, ext: '.ogv' },
  'video/quicktime': { type: 'VIDEO', maxBytes: 50 * 1024 * 1024, ext: '.mov' },
};

export class StorageService {
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;
  private isInitialized = false;

  constructor() {
    this.bucket = config.storage.bucket;
    this.publicUrl = config.storage.publicUrl;
    this.s3 = new S3Client({
      endpoint: config.storage.endpoint,
      region: config.storage.region,
      credentials: {
        accessKeyId: config.storage.accessKey,
        secretAccessKey: config.storage.secretKey,
      },
      forcePathStyle: true, // Necessary for MinIO & local path endpoints
    });
  }

  /**
   * Idempotently ensures the S3 / MinIO bucket exists and has public read access.
   */
  async ensureBucket(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.isInitialized = true;
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        try {
          await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));

          // Set anonymous download policy
          const policy = JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicRead',
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${this.bucket}/*`],
              },
            ],
          });

          await this.s3.send(
            new PutBucketPolicyCommand({
              Bucket: this.bucket,
              Policy: policy,
            })
          );
          this.isInitialized = true;
        } catch (createErr) {
          console.warn(`[StorageService] Notice during bucket init for ${this.bucket}:`, createErr);
        }
      } else {
        console.warn(`[StorageService] S3 HeadBucket check:`, err?.message || err);
      }
    }
  }

  /**
   * Uploads multimedia file buffer to S3 / MinIO storage.
   */
  async uploadMedia(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string
  ): Promise<{
    url: string;
    mediaType: MediaType;
    key: string;
    filename: string;
    size: number;
  }> {
    await this.ensureBucket();

    const normalizedMime = mimeType.toLowerCase();
    const rule = ALLOWED_MIME_TYPES[normalizedMime];

    if (!rule) {
      throw new Error(`Unsupported media type: ${mimeType}. Allowed formats: PNG, JPG, WEBP, GIF, SVG, MP3, WAV, OGG, AAC, MP4, WEBM.`);
    }

    if (buffer.length > rule.maxBytes) {
      const maxMb = Math.round(rule.maxBytes / (1024 * 1024));
      throw new Error(`File size (${(buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of ${maxMb}MB for ${rule.type.toLowerCase()}.`);
    }

    const ext = path.extname(originalFilename).toLowerCase() || rule.ext;
    const uniqueId = crypto.randomUUID();
    const key = `questions/${uniqueId}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: normalizedMime,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    // Build public URL
    const baseUrl = this.publicUrl.replace(/\/+$/, '');
    const url = `${baseUrl}/${key}`;

    return {
      url,
      mediaType: rule.type,
      key,
      filename: `${uniqueId}${ext}`,
      size: buffer.length,
    };
  }
}

export const storageService = new StorageService();

