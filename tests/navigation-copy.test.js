import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const checks = [
  {
    file: 'app/modal.tsx',
    forbidden: ['This is a modal', 'Go to home screen'],
  },
  {
    file: 'app/(tabs)/_layout.tsx',
    forbidden: ['棣栭〉', '鏄庣粏', '缁熻', '鎴戠殑'],
  },
];

test('navigation-facing screens do not retain english or mojibake copy', () => {
  checks.forEach(({ file, forbidden }) => {
    const source = readFileSync(path.resolve(process.cwd(), file), 'utf8');

    forbidden.forEach((fragment) => {
      assert.equal(source.includes(fragment), false, `${file} still contains "${fragment}"`);
    });
  });
});
