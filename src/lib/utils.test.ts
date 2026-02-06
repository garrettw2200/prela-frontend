import { describe, it, expect } from 'vitest';
import { formatDuration, formatTokens, formatCurrency } from './utils';

describe('formatDuration', () => {
  it('formats milliseconds (<1s)', () => {
    expect(formatDuration(500)).toBe('500ms');
  });

  it('formats seconds', () => {
    expect(formatDuration(1500)).toBe('1.5s');
  });

  it('formats minutes', () => {
    expect(formatDuration(75000)).toBe('1.3m');
  });

  it('formats hours', () => {
    expect(formatDuration(3600000)).toBe('1.0h');
  });

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0ms');
  });

  it('handles negative values', () => {
    expect(formatDuration(-100)).toBe('-100ms');
  });
});

describe('formatTokens', () => {
  it('formats raw numbers (<1k)', () => {
    expect(formatTokens(500)).toBe('500');
  });

  it('formats thousands', () => {
    expect(formatTokens(1000)).toBe('1.0k');
    expect(formatTokens(1500)).toBe('1.5k');
  });

  it('formats millions', () => {
    expect(formatTokens(1000000)).toBe('1.0M');
    expect(formatTokens(1500000)).toBe('1.5M');
  });

  it('handles zero', () => {
    expect(formatTokens(0)).toBe('0');
  });

  it('handles negative values', () => {
    expect(formatTokens(-1000)).toBe('-1000');
  });

  it('rounds to one decimal place', () => {
    expect(formatTokens(1234)).toBe('1.2k');
    expect(formatTokens(1560000)).toBe('1.6M');
  });
});

describe('formatCurrency', () => {
  it('formats with up to 4 decimal places', () => {
    expect(formatCurrency(1.234567)).toBe('$1.2346');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('handles large amounts with commas', () => {
    expect(formatCurrency(1234.5678)).toBe('$1,234.5678');
  });

  it('handles small amounts', () => {
    expect(formatCurrency(0.0001)).toBe('$0.0001');
  });

  it('handles negative values', () => {
    expect(formatCurrency(-5.5)).toBe('-$5.50');
  });

  it('formats with minimum 2 decimal places', () => {
    expect(formatCurrency(1.2)).toBe('$1.20');
  });
});
