import { Type, Static } from '@sinclair/typebox';

export const ThemeSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  professorId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
  name: Type.String(),
  isSystemPreset: Type.Boolean(),
  logoUrl: Type.Union([Type.String(), Type.Null()]),
  primaryColor: Type.String(),
  secondaryColor: Type.String(),
  backgroundColor: Type.String(),
  fontFamily: Type.String(),
  customCssVars: Type.Optional(Type.Record(Type.String(), Type.String())),
  createdAt: Type.String(),
});

export const CreateThemeBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  primaryColor: Type.Optional(Type.String({ default: '#93C572' })),
  secondaryColor: Type.Optional(Type.String({ default: '#FF7518' })),
  backgroundColor: Type.Optional(Type.String({ default: '#F7F9F6' })),
  fontFamily: Type.Optional(Type.String({ default: 'Inter' })),
  logoUrl: Type.Optional(Type.String()),
  customCssVars: Type.Optional(Type.Record(Type.String(), Type.String())),
});
export type CreateThemeBody = Static<typeof CreateThemeBodySchema>;

export const UpdateThemeBodySchema = Type.Partial(CreateThemeBodySchema);
export type UpdateThemeBody = Static<typeof UpdateThemeBodySchema>;

export const UploadLogoResponseSchema = Type.Object({
  logoUrl: Type.String(),
});

