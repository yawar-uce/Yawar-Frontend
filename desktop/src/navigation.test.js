import { describe, expect, it } from 'vitest';
import { createNavigationPolicy } from './navigation.js';

const policy = createNavigationPolicy('http://localhost:5180', 'http://localhost:8080/auth');

describe('createNavigationPolicy', () => {
  it.each([
    'http://localhost:5180/callback?code=abc',
    'http://localhost:8080/auth/realms/yawar-dev/protocol/openid-connect/auth',
    'https://accounts.google.com/o/oauth2/v2/auth',
  ])('shows %s in the window', (url) => {
    expect(policy.staysInWindow(url)).toBe(true);
  });

  it.each([
    'http://localhost:8025/',
    'http://localhost.evil.example:5180/',
    'http://accounts.google.com/',
    'file:///etc/passwd',
    'not a url',
  ])('keeps %s out of the window', (url) => {
    expect(policy.staysInWindow(url)).toBe(false);
  });

  it('hands only web links to the system browser', () => {
    expect(policy.isWebLink('https://example.org/')).toBe(true);
    expect(policy.isWebLink('http://example.org/')).toBe(true);
    expect(policy.isWebLink('file:///etc/passwd')).toBe(false);
    expect(policy.isWebLink('javascript:alert(1)')).toBe(false);
    expect(policy.isWebLink('not a url')).toBe(false);
  });
});
