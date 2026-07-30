import { BadRequestException } from '@nestjs/common';
import { isIP } from 'node:net';

const BLOCKED_HOSTNAMES = new Set(['localhost', 'localhost.localdomain']);

const BLOCKED_HOSTNAME_SUFFIXES = [
  '.localhost',
  '.local',
  '.internal',
  '.lan',
  '.home',
  '.corp',
];

/**
 * Проверяет, что URL безопасен для серверного fetch (защита от SSRF):
 * разрешены только публичные http(s)-адреса. Блокируются loopback,
 * приватные/линк-локальные/мультикаст IP и служебные hostname.
 *
 * Ограничение: проверяется литерал хоста, без DNS-резолва — хост,
 * указывающий DNS-записью на приватный IP, дополнительно отсекается
 * запретом редиректов на уровне fetch (redirect: 'manual').
 */
export function assertPublicHttpUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BadRequestException('Invalid URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new BadRequestException('Only http(s) URLs are allowed');
  }

  if (parsed.username || parsed.password) {
    throw new BadRequestException('URLs with credentials are not allowed');
  }

  // WHATWG URL сохраняет квадратные скобки вокруг IPv6 ([::1]) — снимаем,
  // иначе ни isIP, ни строковые проверки его не распознают.
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (
    BLOCKED_HOSTNAMES.has(host) ||
    BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => host.endsWith(suffix))
  ) {
    throw new BadRequestException('This host is not allowed');
  }

  const ipVersion = isIP(host);
  if (ipVersion === 4 && isPrivateIpv4(host)) {
    throw new BadRequestException(
      'Private or reserved IP addresses are not allowed',
    );
  }
  if (ipVersion === 6 && isPrivateIpv6(host)) {
    throw new BadRequestException(
      'Private or reserved IP addresses are not allowed',
    );
  }

  return parsed;
}

function isPrivateIpv4(host: string): boolean {
  const [a, b] = host.split('.').map(Number);

  return (
    a === 0 || // 0.0.0.0/8 "this network"
    a === 10 || // 10.0.0.0/8 private
    a === 127 || // 127.0.0.0/8 loopback
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 CGNAT
    (a === 169 && b === 254) || // 169.254.0.0/16 link-local
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12 private
    (a === 192 && b === 0) || // 192.0.0.0/24 IETF assignments
    (a === 192 && b === 168) || // 192.168.0.0/16 private
    (a === 198 && (b === 18 || b === 19)) || // benchmarking
    a >= 224 // multicast (224/4) + reserved (240/4)
  );
}

function isPrivateIpv6(host: string): boolean {
  const normalized = host.toLowerCase();

  if (normalized === '::' || normalized === '::1') return true;
  if (/^f[cd]/.test(normalized)) return true; // fc00::/7 unique local
  if (/^fe[89ab]/.test(normalized)) return true; // fe80::/10 link-local

  // IPv4-mapped: dotted-форма ::ffff:a.b.c.d
  const mappedDotted = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(normalized);
  if (mappedDotted) return isPrivateIpv4(mappedDotted[1]);

  // WHATWG URL сериализует mapped-адрес в hex: [::ffff:127.0.0.1] → [::ffff:7f00:1]
  const mappedHex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(normalized);
  if (mappedHex) {
    const hi = parseInt(mappedHex[1], 16);
    const lo = parseInt(mappedHex[2], 16);
    return isPrivateIpv4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  }

  return false;
}
