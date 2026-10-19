import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cn, formatDuration, formatDate } from '../../src/lib/utils';
import { apiClient } from '../../src/lib/api-client';

describe('Utils and ApiClient Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('tests cn utility with conditional classes', () => {
    expect(cn('base-class', false && 'hidden', 'extra-class')).toBe('base-class extra-class');
  });

  it('tests formatDuration formatting', () => {
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(125)).toBe('2m 5s');
  });

  it('tests formatDate formatting', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate('2026-10-08T12:00:00Z')).toContain('2026');
  });

  it('tests apiClient token management and requests', async () => {
    apiClient.setToken('my-secret-token');
    expect(apiClient.getToken()).toBe('my-secret-token');

    // Mock global fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [1, 2, 3] }),
    });
    global.fetch = mockFetch;

    const res = await apiClient.request('/test-endpoint');
    expect(res.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-secret-token',
        }),
      })
    );

    // Test error response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not Found' }),
    });

    await expect(apiClient.request('/not-found')).rejects.toThrow('Not Found');

    apiClient.setToken(null);
    expect(apiClient.getToken()).toBeNull();
  });
});

