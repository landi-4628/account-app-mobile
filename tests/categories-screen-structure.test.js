import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const categoriesScreenPath = path.resolve('app/categories/index.jsx');
const categoriesScreenSource = fs.readFileSync(categoriesScreenPath, 'utf8');

test('category management screen starts with the add-category form instead of an intro block', () => {
  assert.doesNotMatch(categoriesScreenSource, /SectionHeader/);
  assert.doesNotMatch(categoriesScreenSource, /copy\.subtitle/);
  assert.doesNotMatch(categoriesScreenSource, /<Text style=\{styles\.hint\}>\{copy\.editHint\}<\/Text>/);
  assert.match(
    categoriesScreenSource,
    /<AccountingScreen>\s*\{isAuthenticated \? \(\s*<>\s*<SurfaceCard style=\{styles\.card\}>/
  );
});
