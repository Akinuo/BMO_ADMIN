import test from 'node:test'
import assert from 'node:assert/strict'
import { csvCell, toCsv } from './csv'

test('plain values pass through', () => {
  assert.equal(csvCell('Ana'), 'Ana')
  assert.equal(csvCell(40), '40')
  assert.equal(csvCell(true), 'true')
  assert.equal(csvCell(null), '')
  assert.equal(csvCell(undefined), '')
})

test('commas, quotes and newlines are quoted and escaped', () => {
  assert.equal(csvCell('Cruz, Ana'), '"Cruz, Ana"')
  assert.equal(csvCell('say "hi"'), '"say ""hi"""')
  assert.equal(csvCell('a\nb'), '"a\nb"')
})

test('formula-looking text is neutralised', () => {
  assert.equal(csvCell('=HYPERLINK("http://x")'), `"'=HYPERLINK(""http://x"")"`)
  assert.equal(csvCell('+1+1'), "'+1+1")
  assert.equal(csvCell('-2'), "'-2")
  assert.equal(csvCell('@SUM(A1)'), "'@SUM(A1)")
})

test('negative numbers (real numbers, not text) are untouched', () => {
  assert.equal(csvCell(-5), '-5')
})

test('toCsv writes BOM, header, CRLF rows', () => {
  const out = toCsv(['Name', 'Steps'], [['Ana', 40], ['Ben', 3]])
  assert.equal(out, '﻿Name,Steps\r\nAna,40\r\nBen,3\r\n')
})
