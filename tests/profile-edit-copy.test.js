import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const file = 'app/profile/edit.jsx';
const loginFile = 'app/auth/login.jsx';

test('profile edit screen uses a consistent submitError copy key', () => {
  const source = readFileSync(path.resolve(process.cwd(), file), 'utf8');

  assert.equal(
    source.includes('submitError:'),
    true,
    `${file} should define copy.submitError for submit failure fallback`
  );
  assert.equal(
    source.includes('saveFailed:'),
    false,
    `${file} should not use a one-off saveFailed key`
  );
});

test('login screen declares submitError state before using it', () => {
  const source = readFileSync(path.resolve(process.cwd(), loginFile), 'utf8');

  assert.equal(
    source.includes("const [submitError, setSubmitError] = useState('');"),
    true,
    `${loginFile} should declare submitError state`
  );
});
