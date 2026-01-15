const SENSITIVE_KEYS = [
  'password',
  'token',
  'authorization',
  'apiKey',
  'secret',
];

export function sanitizePayload(
  body: unknown,
  maxKb: number,
): Record<string, any> | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const json = JSON.stringify(body);
  const sizeKb = Buffer.byteLength(json) / 1024;

  if (sizeKb > maxKb) {
    return null;
  }

  const sanitized = JSON.parse(json);

  for (const key of SENSITIVE_KEYS) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}
