// Post-login destinations must be same-site paths. Rejects absolute URLs,
// protocol-relative (//host), backslash tricks, and javascript:/data: schemes.
export function safeNext(raw: string | null | undefined, fallback = '/'): string {
  if (!raw || raw[0] !== '/' || raw[1] === '/' || raw[1] === '\\' || /[\r\n\t]/.test(raw)) return fallback
  return raw
}
