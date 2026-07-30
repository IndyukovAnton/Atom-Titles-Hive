import { BadRequestException } from '@nestjs/common';
import { assertPublicHttpUrl } from './url-safety.util';

describe('assertPublicHttpUrl (SSRF guard)', () => {
  describe('valid public URLs', () => {
    it.each([
      'https://example.com/image.jpg',
      'http://images.kinopoisk.ru/poster/1.jpg',
      'https://8.8.8.8/image.png',
      'https://example.com:8443/img.png?q=1',
    ])('should allow %s', (url) => {
      const parsed = assertPublicHttpUrl(url);
      expect(parsed).toBeInstanceOf(URL);
      expect(parsed.href).toBe(url);
    });
  });

  describe('malformed URLs', () => {
    it.each(['not-a-url', '', 'http://', '://missing-scheme'])(
      'should reject %s',
      (url) => {
        expect(() => assertPublicHttpUrl(url)).toThrow(BadRequestException);
      },
    );
  });

  describe('non-http(s) schemes', () => {
    it.each([
      'ftp://example.com/file',
      'file:///etc/passwd',
      'data:image/png;base64,AAAA',
      'javascript:alert(1)',
      'gopher://internal.host/',
    ])('should reject %s', (url) => {
      expect(() => assertPublicHttpUrl(url)).toThrow(BadRequestException);
    });
  });

  describe('local hostnames', () => {
    it.each([
      'http://localhost:3553/media',
      'https://api.localhost/x',
      'http://printer.local/',
      'http://nas.internal/',
      'http://router.lan/',
      'http://localhost.localdomain/',
    ])('should reject %s', (url) => {
      expect(() => assertPublicHttpUrl(url)).toThrow(BadRequestException);
    });
  });

  describe('private/reserved IPv4', () => {
    it.each([
      'http://127.0.0.1:3553/auth/login',
      'http://127.1.2.3/',
      'http://10.0.0.5/',
      'http://192.168.1.1/',
      'http://172.16.0.1/',
      'http://172.31.255.255/',
      'http://169.254.169.254/latest/meta-data',
      'http://0.0.0.0/',
      'http://100.64.0.1/',
      'http://192.0.0.8/',
      'http://198.18.0.1/',
      'http://224.0.0.1/',
      'http://255.255.255.255/',
    ])('should reject %s', (url) => {
      expect(() => assertPublicHttpUrl(url)).toThrow(BadRequestException);
    });
  });

  describe('private/reserved IPv6', () => {
    it.each([
      'http://[::1]/',
      'http://[::]/',
      'http://[fc00::1]/',
      'http://[fd12::1]/',
      'http://[fe80::1]/',
      'http://[::ffff:127.0.0.1]/',
      'http://[::ffff:192.168.0.1]/',
    ])('should reject %s', (url) => {
      expect(() => assertPublicHttpUrl(url)).toThrow(BadRequestException);
    });
  });

  describe('credentials in URL', () => {
    it.each([
      'https://user:pass@example.com/img.png',
      'http://token@example.com/img.png',
    ])('should reject %s', (url) => {
      expect(() => assertPublicHttpUrl(url)).toThrow(BadRequestException);
    });
  });

  it('should allow public IPv4-mapped IPv6', () => {
    expect(() =>
      assertPublicHttpUrl('http://[::ffff:8.8.8.8]/img.png'),
    ).not.toThrow();
  });

  it('should not treat 172.32 as private (boundary check)', () => {
    expect(() => assertPublicHttpUrl('http://172.32.0.1/')).not.toThrow();
  });
});
