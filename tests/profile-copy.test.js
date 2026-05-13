import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const files = [
  'app/profile/index.jsx',
  'app/(tabs)/profile.jsx',
  'app/(tabs)/_layout.tsx',
];

test('profile routes do not leave unicode escape sequences in JSX string attributes', () => {
  files.forEach((file) => {
    const source = readFileSync(path.resolve(process.cwd(), file), 'utf8');

    assert.equal(
      /="\s*\\u[0-9a-fA-F]{4}/.test(source) || /='\s*\\u[0-9a-fA-F]{4}/.test(source),
      false,
      `${file} still contains a JSX string attribute with a raw unicode escape`
    );
  });
});
