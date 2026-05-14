import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const profileScreenPath = path.resolve(process.cwd(), 'app/(tabs)/profile.jsx');
const profileHubScreenPath = path.resolve(process.cwd(), 'app/profile/index.jsx');
const profileSupportPath = path.resolve(process.cwd(), 'components/accounting/profile-screen-support.js');

test('profile sync summary row wires manual sync action label and handler', () => {
  const source = readFileSync(profileScreenPath, 'utf8');

  assert.match(source, /FeedbackDialog/);
  assert.match(source, /buildAuthRequiredDialogState/);
  assert.match(source, /getSyncActionLabel/);
  assert.match(source, /canSyncRemotely/);
  assert.match(source, /syncInFlight/);
  assert.match(source, /isAuthenticated/);
  assert.match(
    source,
    /const syncActionLabel = getSyncActionLabel\(syncSummary\.status,\s*\{\s*isAutoSyncEnabled:\s*autoSyncEnabled,\s*hasPendingChanges,\s*canSyncRemotely,\s*isSyncInFlight:\s*syncInFlight,\s*\}\);/s
  );
  assert.match(source, /const handleSyncActionPress = \(\) => \{/);
  assert.match(source, /if \(syncInFlight\) \{\s*return;\s*\}/s);
  assert.match(source, /if \(!isAuthenticated\) \{/);
  assert.match(source, /buildAuthRequiredDialogState/);
  assert.match(source, /if \(!canSyncRemotely && hasPendingChanges\) \{/s);
  assert.match(source, /void actions\.syncPendingTransactions\(\);/);
  assert.match(source, /<SyncSummaryRow[\s\S]*actionLabel=\{syncActionLabel\}/);
  assert.match(source, /<SyncSummaryRow[\s\S]*actionDisabled=\{syncInFlight\}/);
  assert.match(
    source,
    /<SyncSummaryRow[\s\S]*onActionPress=\{handleSyncActionPress\}/
  );
  assert.match(source, /<FeedbackDialog/);
});

test('profile hub exposes sync mode switch rows wired to setAutoSyncEnabled', () => {
  const hubSource = readFileSync(profileHubScreenPath, 'utf8');
  const supportSource = readFileSync(profileSupportPath, 'utf8');

  assert.match(hubSource, /buildProfileSyncModeRows/);
  assert.match(
    hubSource,
    /const syncModeRows = buildProfileSyncModeRows\(\{\s*autoSyncEnabled,\s*setAutoSyncEnabled:\s*actions\.setAutoSyncEnabled,\s*\}\);/s
  );
  assert.match(
    hubSource,
    /<QuickLinkSection[\s\S]*title=\{copy\.syncMode\}[\s\S]*rows=\{syncModeRows\}/
  );
  assert.match(supportSource, /export function buildProfileSyncModeRows/);
  assert.match(supportSource, /onPress:\s*\(\)\s*=>\s*setAutoSyncEnabled\(true\)/);
  assert.match(supportSource, /onPress:\s*\(\)\s*=>\s*setAutoSyncEnabled\(false\)/);
});
