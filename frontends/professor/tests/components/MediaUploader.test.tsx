import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MediaUploader, inferMediaType } from '../../src/components/studio/MediaUploader';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { apiClient } from '../../src/lib/api-client';

describe('MediaUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly infers media type from extensions', () => {
    expect(inferMediaType('https://example.com/flags/spain.png')).toBe('IMAGE');
    expect(inferMediaType('https://example.com/anthem.mp3')).toBe('AUDIO');
    expect(inferMediaType('https://example.com/anthem.wav')).toBe('AUDIO');
    expect(inferMediaType('https://example.com/video.mp4')).toBe('VIDEO');
    expect(inferMediaType('https://example.com/video.webm')).toBe('VIDEO');
  });

  it('renders upload prompt when no media is set', () => {
    const handleChange = vi.fn();
    render(
      <I18nProvider>
        <MediaUploader mediaUrl={null} mediaType={null} onChange={handleChange} />
      </I18nProvider>
    );

    expect(screen.getByTestId('media-uploader')).toBeDefined();
    expect(screen.getByText(/Question Media/i)).toBeDefined();
    expect(screen.getByText(/Drop image, audio, or video here/i)).toBeDefined();
  });

  it('renders image preview when an image URL is provided', () => {
    const handleChange = vi.fn();
    render(
      <I18nProvider>
        <MediaUploader
          mediaUrl="https://example.com/flag.webp"
          mediaType="IMAGE"
          onChange={handleChange}
        />
      </I18nProvider>
    );

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('https://example.com/flag.webp');
    expect(img.getAttribute('alt')).toBe('Question Preview');
    expect(screen.getByText('Image')).toBeDefined();
  });

  it('renders localized alt text when another language is active', () => {
    localStorage.setItem('quiz_locale', 'es');
    const handleChange = vi.fn();
    render(
      <I18nProvider initialLocale="es">
        <MediaUploader
          mediaUrl="https://example.com/flag.webp"
          mediaType="IMAGE"
          onChange={handleChange}
        />
      </I18nProvider>
    );

    const img = screen.getByRole('img');
    expect(img.getAttribute('alt')).toBe('Vista previa de la pregunta');
    localStorage.removeItem('quiz_locale');
  });

  it('allows clearing media via remove button', () => {
    const handleChange = vi.fn();
    render(
      <I18nProvider>
        <MediaUploader
          mediaUrl="https://example.com/flag.webp"
          mediaType="IMAGE"
          onChange={handleChange}
        />
      </I18nProvider>
    );

    const clearBtn = screen.getByTestId('clear-media-button');
    fireEvent.click(clearBtn);

    expect(handleChange).toHaveBeenCalledWith(null, null);
  });

  it('allows uploading a file and calls onChange with uploaded URL and type', async () => {
    const handleChange = vi.fn();
    vi.spyOn(apiClient, 'upload').mockResolvedValueOnce({
      url: 'https://quiz.example.com/media/questions/test.png',
      mediaType: 'IMAGE',
      filename: 'test.png',
      size: 1024,
    });

    render(
      <I18nProvider>
        <MediaUploader mediaUrl={null} mediaType={null} onChange={handleChange} />
      </I18nProvider>
    );

    const input = screen.getByTestId('media-file-input') as HTMLInputElement;
    const file = new File(['fake-png'], 'test.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(apiClient.upload).toHaveBeenCalledWith('/media/upload', expect.any(FormData));
      expect(handleChange).toHaveBeenCalledWith(
        'https://quiz.example.com/media/questions/test.png',
        'IMAGE'
      );
    });
  });

  it('allows switching to URL mode and manually typing an external URL', () => {
    const handleChange = vi.fn();
    render(
      <I18nProvider>
        <MediaUploader mediaUrl={null} mediaType={null} onChange={handleChange} />
      </I18nProvider>
    );

    const urlTabBtn = screen.getByText(/External URL/i);
    fireEvent.click(urlTabBtn);

    const urlInput = screen.getByTestId('media-url-input');
    fireEvent.change(urlInput, { target: { value: 'https://example.com/audio.mp3' } });

    expect(handleChange).toHaveBeenCalledWith('https://example.com/audio.mp3', 'AUDIO');
  });

  it('displays error message when upload fails', async () => {
    const handleChange = vi.fn();
    vi.spyOn(apiClient, 'upload').mockRejectedValueOnce(new Error('File exceeds limit'));

    render(
      <I18nProvider>
        <MediaUploader mediaUrl={null} mediaType={null} onChange={handleChange} />
      </I18nProvider>
    );

    const input = screen.getByTestId('media-file-input') as HTMLInputElement;
    const file = new File(['fake-png'], 'test.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('File exceeds limit')).toBeDefined();
    });
  });

  it('displays fallback localized error message when upload fails with no message', async () => {
    const handleChange = vi.fn();
    vi.spyOn(apiClient, 'upload').mockRejectedValueOnce({});

    render(
      <I18nProvider>
        <MediaUploader mediaUrl={null} mediaType={null} onChange={handleChange} />
      </I18nProvider>
    );

    const input = screen.getByTestId('media-file-input') as HTMLInputElement;
    const file = new File(['fake-png'], 'test.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Upload failed. Please check file type and size.')).toBeDefined();
    });
  });

  it('handles drag over, drag leave, and drop for file upload', async () => {
    const handleChange = vi.fn();
    vi.spyOn(apiClient, 'upload').mockResolvedValueOnce({
      url: 'https://quiz.example.com/media/questions/dropped.png',
      mediaType: 'IMAGE',
      filename: 'dropped.png',
      size: 2048,
    });

    render(
      <I18nProvider>
        <MediaUploader mediaUrl={null} mediaType={null} onChange={handleChange} />
      </I18nProvider>
    );

    const dropZone = screen.getByText(/Drop image, audio, or video here/i).closest('div[class*="border-dashed"]')!;

    fireEvent.dragOver(dropZone);
    expect(dropZone.className).toContain('border-emerald-500');

    fireEvent.dragLeave(dropZone);
    expect(dropZone.className).toContain('border-slate-300');

    const file = new File(['dropped-content'], 'dropped.png', { type: 'image/png' });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(apiClient.upload).toHaveBeenCalledWith('/media/upload', expect.any(FormData));
      expect(handleChange).toHaveBeenCalledWith(
        'https://quiz.example.com/media/questions/dropped.png',
        'IMAGE'
      );
    });
  });
});

