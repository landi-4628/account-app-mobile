import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const checks = [
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

test('category deletion confirmation explains linked records are deleted too', () => {
  const source = readFileSync(path.resolve(process.cwd(), 'app/categories/index.jsx'), 'utf8');
  const match = source.match(/deleteConfirmBody:\s*'([^']+)'/);

  assert.ok(match, 'expected deleteConfirmBody copy to exist');
  assert.equal(
    JSON.parse(`"${match[1]}"`),
    '删除类别会同时删除该类别下的所有记录'
  );
});
