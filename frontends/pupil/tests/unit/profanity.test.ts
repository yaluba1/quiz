import { describe, it, expect } from 'vitest';
import { validateNickname } from '../../src/lib/profanity';

describe('validateNickname', () => {
  it('accepts clean nicknames', () => {
    const res = validateNickname('Maya');
    expect(res.isValid).toBe(true);
    expect(res.sanitized).toBe('Maya');
    expect(res.errorMessage).toBeUndefined();
  });

  it('trims whitespace and collapses multiple spaces', () => {
    const res = validateNickname('   Space   Explorer   ');
    expect(res.isValid).toBe(true);
    expect(res.sanitized).toBe('Space Explorer');
  });

  it('rejects empty nickname', () => {
    const res = validateNickname('   ');
    expect(res.isValid).toBe(false);
    expect(res.errorMessage).toBe('Nickname cannot be empty');
  });

  it('rejects nickname longer than 50 characters', () => {
    const longName = 'A'.repeat(51);
    const res = validateNickname(longName);
    expect(res.isValid).toBe(false);
    expect(res.errorMessage).toBe('Nickname must be at most 50 characters');
  });

  it('rejects profane words', () => {
    const res = validateNickname('bad_fuck_word');
    expect(res.isValid).toBe(false);
    expect(res.errorMessage).toBe('Nickname contains inappropriate words');
  });

  it('rejects offensive hate speech terms', () => {
    const res = validateNickname('nazi_fan');
    expect(res.isValid).toBe(false);
    expect(res.errorMessage).toBe('Nickname contains inappropriate words');
  });
});

