import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const files = [
  'constants/accounting-copy.js',
  'components/accounting/helpers.js',
  'components/accounting/home-details-utils.js',
  'components/accounting/statistics-profile-support.js',
];

const mojibakeFragments = ['娓', '棣', '鏄', '缁', '璐', '鍚', '鏈', '鏉', '宸', '寰'];

test('accounting copy source files do not retain mojibake fragments', () => {
  files.forEach((file) => {
    const source = readFileSync(path.resolve(process.cwd(), file), 'utf8');

    assert.equal(
      mojibakeFragments.some((fragment) => source.includes(fragment)),
      false,
      `${file} still contains mojibake fragments`
    );
  });
});
