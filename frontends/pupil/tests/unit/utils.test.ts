import { describe, it, expect } from 'vitest';
import { cn } from '../../src/lib/utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4');
  });

  it('handles conflicting tailwind classes cleanly', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('ignores falsy values', () => {
    expect(cn('btn', false && 'hidden', null, undefined, 'active')).toBe('btn active');
  });
});

