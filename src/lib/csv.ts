// CSV export. Names are typed in by students, so a cell like `=HYPERLINK(...)` would run as a
// formula when an admin opens the file in Excel/Sheets ("CSV injection"). Any text cell that
// starts with = + - @ (or a tab/CR) is prefixed with an apostrophe so it stays plain text.

export function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  let s = String(value)
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(header: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const lines = [header, ...rows].map(r => r.map(csvCell).join(','))
  // BOM so Excel opens UTF-8 names (Ñ, é, …) correctly
  return '﻿' + lines.join('\r\n') + '\r\n'
}
