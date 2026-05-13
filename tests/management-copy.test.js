import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const checks = [
  {
    file: 'app/accounts/index.jsx',
    forbidden: ['Add account', 'New account', 'Existing accounts'],
  },
  {
    file: 'app/categories/index.jsx',
    forbidden: ['Add category', 'New category', 'Expense categories', 'Income categories'],
  },
];

test('management screens do not retain direct english UI copy', () => {
  checks.forEach(({ file, forbidden }) => {
    const source = readFileSync(path.resolve(process.cwd(), file), 'utf8');

    forbidden.forEach((fragment) => {
      assert.equal(source.includes(fragment), false, `${file} still contains "${fragment}"`);
    });
  });
});
