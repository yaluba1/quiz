import { Type, Static } from '@sinclair/typebox';

export const UserSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ format: 'email' }),
  displayName: Type.String(),
  locale: Type.String(),
});

export const RegisterBodySchema = Type.Object({
  email: Type.String({ format: 'email', description: 'Unique email address' }),
  password: Type.String({ minLength: 8, description: 'Minimum 8 characters' }),
  displayName: Type.String({ minLength: 1, maxLength: 100 }),
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  locale: Type.Optional(Type.String({ maxLength: 10, default: 'en' })),
});
export type RegisterBody = Static<typeof RegisterBodySchema>;

export const LoginBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 1 }),
});
export type LoginBody = Static<typeof LoginBodySchema>;

export const ForgotPasswordBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
});
export type ForgotPasswordBody = Static<typeof ForgotPasswordBodySchema>;

export const ResetPasswordBodySchema = Type.Object({
  token: Type.String({ minLength: 10 }),
  newPassword: Type.String({ minLength: 8 }),
});
export type ResetPasswordBody = Static<typeof ResetPasswordBodySchema>;

export const AuthSuccessResponseSchema = Type.Object({
  user: UserSchema,
  accessToken: Type.String(),
  expiresIn: Type.Integer(),
});

export const RegisterSuccessResponseSchema = Type.Object({
  success: Type.Boolean(),
  message: Type.String(),
  email: Type.String(),
  requiresVerification: Type.Boolean(),
});

export const VerifyEmailBodySchema = Type.Object({
  token: Type.String({ minLength: 10 }),
});
export type VerifyEmailBody = Static<typeof VerifyEmailBodySchema>;

export const VerifyEmailSuccessResponseSchema = Type.Object({
  success: Type.Boolean(),
  message: Type.String(),
});

export const RefreshSuccessResponseSchema = Type.Object({
  accessToken: Type.String(),
  expiresIn: Type.Integer(),
});


