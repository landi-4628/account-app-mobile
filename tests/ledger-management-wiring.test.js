import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const profileHubScreenPath = path.resolve(process.cwd(), 'app/profile/index.jsx');
const profileSupportPath = path.resolve(process.cwd(), 'components/accounting/profile-screen-support.js');
const ledgerScreenPath = path.resolve(process.cwd(), 'app/profile/ledger.jsx');
const providerPath = path.resolve(process.cwd(), 'providers/mock-app-provider.js');

test('profile hub exposes a ledger management quick link', () => {
  const hubSource = readFileSync(profileHubScreenPath, 'utf8');
  const supportSource = readFileSync(profileSupportPath, 'utf8');

  assert.match(supportSource, /href:\s*'\/profile\/ledger'/);
  assert.match(supportSource, /账本管理/);
  assert.match(hubSource, /buildProfileHubSections/);
});

test('ledger management screen reads provider-ledger state and actions', () => {
  const screenSource = readFileSync(ledgerScreenPath, 'utf8');
  const providerSource = readFileSync(providerPath, 'utf8');

  assert.match(screenSource, /currentLedger/);
  assert.match(screenSource, /myLedgers/);
  assert.match(screenSource, /createLedger/);
  assert.match(screenSource, /switchLedger/);
  assert.match(providerSource, /loadMyLedgers/);
  assert.match(providerSource, /createLedger/);
  assert.match(providerSource, /switchLedger/);
});

test('provider exposes logout and profile hub wires a logout confirmation dialog', () => {
  const hubSource = readFileSync(profileHubScreenPath, 'utf8');
  const providerSource = readFileSync(providerPath, 'utf8');

  assert.match(providerSource, /const logout = useCallback/);
  assert.match(providerSource, /await authApi\.logout\(\)/);
  assert.match(providerSource, /setAuthSession\(null\)/);
  assert.match(providerSource, /setRemoteUser\(null\)/);
  assert.match(hubSource, /FeedbackDialog/);
  assert.match(hubSource, /logout/);
  assert.match(hubSource, /退出登录/);
});
