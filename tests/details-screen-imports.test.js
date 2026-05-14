import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const detailsScreenPath = path.resolve(process.cwd(), 'app/(tabs)/details.jsx');

test('details screen imports buildDetailsSummaryItems before using it', () => {
  const source = readFileSync(detailsScreenPath, 'utf8');

  assert.match(
    source,
    /import\s*\{[\s\S]*\bbuildDetailsSummaryItems\b[\s\S]*\}\s*from\s*['"]@\/components\/accounting\/home-details-utils\.js['"]/
  );
});
