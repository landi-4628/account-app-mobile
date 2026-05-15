import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const providerPath = path.resolve(process.cwd(), 'providers/mock-app-provider.js');
const ledgerScreenPath = path.resolve(process.cwd(), 'app/profile/ledger.jsx');

test('provider wraps remote sync-related requests with shared remote activity tracking', () => {
  const source = readFileSync(providerPath, 'utf8');

  assert.match(source, /const \[remoteActivity, setRemoteActivity\] = useState/);
  assert.match(source, /const runRemoteActivity = useCallback\(/);
  assert.match(source, /await runRemoteActivity\('hydrate-user'/);
  assert.match(source, /await runRemoteActivity\('load-ledgers'/);
  assert.match(source, /await runRemoteActivity\('hydrate-ledger'/);
  assert.match(source, /await runRemoteActivity\('manual-sync'/);
  assert.match(source, /await runRemoteActivity\('create-ledger'/);
  assert.match(source, /await runRemoteActivity\('switch-ledger'/);
  assert.match(source, /await runRemoteActivity\('create-category'/);
  assert.match(source, /await runRemoteActivity\('toggle-category'/);
  assert.match(source, /await runRemoteActivity\('update-category'/);
  assert.match(source, /await runRemoteActivity\('delete-category'/);
  assert.match(source, /React\.createElement\(RemoteActivityBackdrop/);
});

test('provider avoids effect dependency loops for remote ledger hydration', () => {
  const source = readFileSync(providerPath, 'utf8');

  assert.doesNotMatch(
    source,
    /useEffect\(\(\) => \{[\s\S]*?async function hydrateLedgers\(\)[\s\S]*?\}, \[hydrated, ledgerApi, remoteAccessToken, runRemoteActivity, state\.user\]\);/
  );
  assert.doesNotMatch(
    source,
    /useEffect\(\(\) => \{[\s\S]*?async function hydrateRemoteLedger\(\)[\s\S]*?\}, \[hydrated, hydrateRemoteLedgerState, remoteAccessToken, remoteLedgerId, runRemoteActivity, state\]\);/
  );
  assert.doesNotMatch(source, /setLedgerBootstrapLoading\(/);
});

test('ledger management screen keeps button-level busy state for create and switch actions', () => {
  const source = readFileSync(ledgerScreenPath, 'utf8');

  assert.match(source, /const \[busyLedgerId, setBusyLedgerId\] = useState/);
  assert.match(source, /const \[creating, setCreating\] = useState\(false\)/);
  assert.match(source, /disabled=\{creating\}/);
  assert.match(source, /disabled=\{isCurrent \|\| busyLedgerId === ledger\.id\}/);
});
