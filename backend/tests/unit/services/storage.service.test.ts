import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService, ALLOWED_MIME_TYPES } from '../../../src/services/storage.service.js';

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService();
    // Stub S3Client send
    vi.spyOn((storageService as any).s3, 'send').mockImplementation(async () => ({}));
  });

  it('correctly maps MIME types to categories and enforces limits', () => {
    expect(ALLOWED_MIME_TYPES['image/png']?.type).toBe('IMAGE');
    expect(ALLOWED_MIME_TYPES['image/png']?.maxBytes).toBe(5 * 1024 * 1024);

    expect(ALLOWED_MIME_TYPES['audio/mpeg']?.type).toBe('AUDIO');
    expect(ALLOWED_MIME_TYPES['audio/mpeg']?.maxBytes).toBe(20 * 1024 * 1024);

    expect(ALLOWED_MIME_TYPES['video/mp4']?.type).toBe('VIDEO');
    expect(ALLOWED_MIME_TYPES['video/mp4']?.maxBytes).toBe(50 * 1024 * 1024);
  });

  it('rejects unsupported MIME types', async () => {
    const dummyBuffer = Buffer.from('hello');
    await expect(
      storageService.uploadMedia(dummyBuffer, 'document.pdf', 'application/pdf')
    ).rejects.toThrow(/Unsupported media type/);
  });

  it('rejects files exceeding size limit for their media type', async () => {
    // 6MB buffer for an image (max is 5MB)
    const oversizedImage = Buffer.alloc(6 * 1024 * 1024);
    await expect(
      storageService.uploadMedia(oversizedImage, 'large.png', 'image/png')
    ).rejects.toThrow(/exceeds maximum limit of 5MB/);
  });

  it('uploads valid image and returns public URL with IMAGE category', async () => {
    const validImage = Buffer.from('fake-png-data');
    const result = await storageService.uploadMedia(validImage, 'flag.png', 'image/png');

    expect(result.mediaType).toBe('IMAGE');
    expect(result.url).toMatch(/\/questions\/[a-f0-9-]+\.png$/);
    expect(result.size).toBe(validImage.length);
  });

  it('uploads valid audio and returns public URL with AUDIO category', async () => {
    const validAudio = Buffer.from('fake-audio-data');
    const result = await storageService.uploadMedia(validAudio, 'anthem.mp3', 'audio/mpeg');

    expect(result.mediaType).toBe('AUDIO');
    expect(result.url).toMatch(/\/questions\/[a-f0-9-]+\.mp3$/);
    expect(result.size).toBe(validAudio.length);
  });

  it('uploads valid video and returns public URL with VIDEO category', async () => {
    const validVideo = Buffer.from('fake-video-data');
    const result = await storageService.uploadMedia(validVideo, 'experiment.mp4', 'video/mp4');

    expect(result.mediaType).toBe('VIDEO');
    expect(result.url).toMatch(/\/questions\/[a-f0-9-]+\.mp4$/);
    expect(result.size).toBe(validVideo.length);
  });
});

