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

test('profile tab rows use stable keys instead of display copy', () => {
  const source = readFileSync(path.resolve(process.cwd(), 'app/(tabs)/profile.jsx'), 'utf8');

  assert.match(source, /key=\{row\.key \?\? `\$\{title\}-\$\{index\}`\}/);
  assert.match(source, /\{ key: 'ledger', label: accountingCopy\.profile\.ledger, value: user\.ledgerName \}/);
  assert.match(source, /\{ key: 'email', label: accountingCopy\.profile\.email, value: user\.email \}/);
  assert.match(
    source,
    /\{ key: 'sync-mode', label: accountingCopy\.profile\.syncMode, value: getProfileSyncModeCopy\(autoSyncEnabled\) \}/
  );
});

test('profile hub does not spread row key props into ManagementRow', () => {
  const source = readFileSync(path.resolve(process.cwd(), 'app/profile/index.jsx'), 'utf8');

  assert.equal(source.includes('<ManagementRow key={row.key ?? row.href ?? `${title}-${index}`} {...row} />'), false);
  assert.match(source, /const \{ key: rowKey, \.\.\.rowProps \} = row;/);
  assert.match(source, /<ManagementRow\s+key=\{rowKey \?\? row\.href \?\? `\$\{title\}-\$\{index\}`\}\s+\{\.\.\.rowProps\}\s+\/>/);
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
