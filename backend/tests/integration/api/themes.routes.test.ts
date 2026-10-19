import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer } from '../../../src/api/server.js';
import { setAuthService } from '../../../src/auth/service.factory.js';
import { setupMockRedis } from '../../helpers/mock-redis.js';
import * as dbModule from '../../../src/db/index.js';

describe('Themes Routes Integration', () => {
  let app: FastifyInstance;
  const professor = { id: '00000000-0000-0000-0000-000000000001', email: 'prof@test.com', displayName: 'Prof', locale: 'en' };

  beforeAll(async () => {
    setupMockRedis();
    app = await createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    setAuthService({
      register: vi.fn(),
      login: vi.fn(),
      refreshToken: vi.fn(),
      verifySession: vi.fn().mockResolvedValue(professor),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    });
  });

  it('GET /api/themes lists system presets and custom themes', async () => {
    const preset = {
      id: '11111111-1111-1111-1111-111111111111',
      professorId: null,
      name: 'Default Pistachio & Pumpkin',
      isSystemPreset: true,
      logoUrl: null,
      primaryColor: '#93C572',
      secondaryColor: '#FF7518',
      backgroundColor: '#F7F9F6',
      fontFamily: 'Inter',
      customCssVars: {},
      createdAt: new Date(),
    };
    const custom = {
      id: '22222222-2222-2222-2222-222222222222',
      professorId: professor.id,
      name: 'Dark Academia',
      isSystemPreset: false,
      logoUrl: null,
      primaryColor: '#8B0000',
      secondaryColor: '#FFD700',
      backgroundColor: '#1C1C1C',
      fontFamily: 'Georgia',
      customCssVars: {},
      createdAt: new Date(),
    };

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([preset, custom]),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'GET',
      url: '/api/themes',
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.systemThemes).toHaveLength(1);
    expect(body.customThemes).toHaveLength(1);
    expect(body.systemThemes[0].name).toBe('Default Pistachio & Pumpkin');
  });

  it('POST /api/themes creates a custom theme', async () => {
    const createdTheme = {
      id: '33333333-3333-3333-3333-333333333333',
      professorId: professor.id,
      name: 'Neon Cyber',
      isSystemPreset: false,
      logoUrl: null,
      primaryColor: '#00FFCC',
      secondaryColor: '#FF0099',
      backgroundColor: '#0F0F0F',
      fontFamily: 'Courier New',
      customCssVars: {},
      createdAt: new Date(),
    };

    const mockDb: any = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createdTheme]),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'POST',
      url: '/api/themes',
      headers: { authorization: 'Bearer token' },
      payload: {
        name: 'Neon Cyber',
        primaryColor: '#00FFCC',
        secondaryColor: '#FF0099',
        backgroundColor: '#0F0F0F',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.name).toBe('Neon Cyber');
  });

  it('PUT /api/themes/:id prevents modifying system preset themes', async () => {
    const preset = {
      id: '11111111-1111-1111-1111-111111111111',
      isSystemPreset: true,
      professorId: null,
    };

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([preset]),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'PUT',
      url: `/api/themes/${preset.id}`,
      headers: { authorization: 'Bearer token' },
      payload: { name: 'Attempted Change' },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toContain('System preset themes cannot be modified');
  });

  it('PUT /api/themes/:id updates custom theme', async () => {
    const custom = {
      id: '22222222-2222-2222-2222-222222222222',
      isSystemPreset: false,
      professorId: professor.id,
      name: 'Custom Palette',
      logoUrl: null,
      primaryColor: '#8B0000',
      secondaryColor: '#FFD700',
      backgroundColor: '#1C1C1C',
      fontFamily: 'Georgia',
      customCssVars: {},
      createdAt: new Date(),
    };
    const updated = { ...custom, name: 'Updated Custom Palette' };

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([custom]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'PUT',
      url: `/api/themes/${custom.id}`,
      headers: { authorization: 'Bearer token' },
      payload: { name: 'Updated Custom Palette' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.name).toBe('Updated Custom Palette');
  });

  it('DELETE /api/themes/:id prevents deleting system presets', async () => {
    const preset = {
      id: '11111111-1111-1111-1111-111111111111',
      isSystemPreset: true,
      professorId: null,
    };

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([preset]),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/themes/${preset.id}`,
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toContain('System preset themes cannot be deleted');
  });

  it('DELETE /api/themes/:id deletes custom theme', async () => {
    const custom = {
      id: '22222222-2222-2222-2222-222222222222',
      isSystemPreset: false,
      professorId: professor.id,
    };

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([custom]),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/themes/${custom.id}`,
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(204);
  });

  it('PUT /api/themes/:id returns 404 when theme is not found', async () => {
    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'PUT',
      url: '/api/themes/00000000-0000-0000-0000-000000000000',
      headers: { authorization: 'Bearer token' },
      payload: { name: 'Nonexistent' },
    });

    expect(res.statusCode).toBe(404);
  });

  it('DELETE /api/themes/:id returns 404 when theme is not found', async () => {
    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/themes/00000000-0000-0000-0000-000000000000',
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(404);
  });
});
