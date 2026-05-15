import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const providerPath = path.resolve('providers/mock-app-provider.js');
const providerSource = fs.readFileSync(providerPath, 'utf8');

test('mock app provider persists added transactions to SQLite before updating state', () => {
  assert.match(
    providerSource,
    /import \{ createTransactionRepository \} from '\.\.\/data\/repositories\/transaction-repository\.js';/
  );
  assert.match(
    providerSource,
    /const transactionRepo = useMemo\([\s\S]*createTransactionRepository/
  );
  assert.match(providerSource, /addTransaction: async \(input\) => \{/);
  assert.match(providerSource, /await transactionRepo\.saveTransaction\(action\.transaction\);[\s\S]*dispatch\(action\);/);
});
