import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const transactionFormPath = path.resolve('components/accounting/transaction-form.jsx');
const transactionFormSource = fs.readFileSync(transactionFormPath, 'utf8');
const newTransactionScreenPath = path.resolve('app/transaction/new.jsx');
const newTransactionScreenSource = fs.readFileSync(newTransactionScreenPath, 'utf8');

test('transaction form gates the bottom panel behind category selection', () => {
  assert.match(
    transactionFormSource,
    /const shouldShowBottomPanel = Boolean\(draft\.categoryId\);/
  );
  assert.match(
    transactionFormSource,
    /\{shouldShowBottomPanel \? \(\s*<View style=\{styles\.bottomPanel\}>/s
  );
});

test('transaction form integrates the amount expression support module', () => {
  assert.match(transactionFormSource, /from '\.\/transaction-amount-expression-support\.js'/);
});

test('transaction form keeps using the local DatePickerModal', () => {
  assert.match(transactionFormSource, /<DatePickerModal\b/);
});

test('transaction form exposes settle and submit actions in the bottom panel', () => {
  assert.match(transactionFormSource, /\['7', '8', '9', 'date'\]/);
  assert.match(transactionFormSource, /\['\.', '0', 'backspace', 'submit'\]/);
  assert.match(transactionFormSource, /getKeypadButtonLabel\(key, primaryAmountAction\.label, draft\.dateInput\)/);
  assert.match(transactionFormSource, /return dateInput;/);
  assert.match(transactionFormSource, /return primaryActionLabel;/);
  assert.match(transactionFormSource, /resolveTransactionFormPrimaryAmountAction/);
});

test('transaction form category active state no longer relies on optionChipActive', () => {
  assert.doesNotMatch(
    transactionFormSource,
    /active \? \(variant === 'type' \? styles\.typeChipActive : styles\.optionChipActive\) : null/
  );
});

test('transaction form renders the bottom sheet as an absolute overlay drawer', () => {
  assert.match(transactionFormSource, /bottomPanel:\s*\{[\s\S]*position:\s*'absolute'/);
  assert.match(transactionFormSource, /bottomPanel:\s*\{[\s\S]*right:\s*-spacing\.md/);
  assert.match(transactionFormSource, /bottomPanel:\s*\{[\s\S]*bottom:\s*-spacing\.xl/);
  assert.match(transactionFormSource, /bottomPanel:\s*\{[\s\S]*left:\s*-spacing\.md/);
  assert.match(transactionFormSource, /bottomPanel:\s*\{[\s\S]*borderTopLeftRadius:/);
  assert.match(transactionFormSource, /bottomPanel:\s*\{[\s\S]*borderTopRightRadius:/);
  assert.match(transactionFormSource, /bottomPanel:\s*\{[\s\S]*padding:\s*0/);
});

test('transaction form only exposes date selection and no inline time input', () => {
  assert.doesNotMatch(transactionFormSource, /<TextInput[\s\S]*style=\{styles\.timeInput\}/);
  assert.doesNotMatch(transactionFormSource, /inlineCopy\.timeLabel/);
});

test('transaction form removes the separate action row and inline date card', () => {
  assert.doesNotMatch(transactionFormSource, /<View style=\{styles\.actions\}>/);
  assert.doesNotMatch(transactionFormSource, /<Text style=\{styles\.inlineFieldLabel\}>\{inlineCopy\.chooseDate\}<\/Text>/);
});

test('transaction form keeps the bottom keypad compact and renders backspace once', () => {
  assert.match(transactionFormSource, /amountPanel:\s*\{[\s\S]*minHeight:\s*46/);
  assert.match(transactionFormSource, /inlineFieldCard:\s*\{[\s\S]*minHeight:\s*34/);
  assert.match(transactionFormSource, /keypadButton:\s*\{[\s\S]*minHeight:\s*56/);
  assert.match(transactionFormSource, /if \(key === 'backspace'\) \{\s*return '';/);
  assert.match(transactionFormSource, /\{label \? \(/);
});

test('transaction form uses app green for primary actions and blocks future dates', () => {
  assert.match(transactionFormSource, /backgroundColor:\s*colors\.brand/);
  assert.match(transactionFormSource, /maxDateInput=\{todayDateInput\}/);
  assert.match(transactionFormSource, /const disabledDay = disableActions \|\| isDateInputAfter\(day\.value, maxDateInput\);/);
});

test('transaction form uses compact full-width type tabs without a category-grid settings tile', () => {
  assert.match(transactionFormSource, /typeTabs:\s*\{[\s\S]*minHeight:\s*42/);
  assert.match(transactionFormSource, /typeTabs:\s*\{[\s\S]*marginHorizontal:\s*-spacing\.sm/);
  assert.match(transactionFormSource, /typeChip:\s*\{[\s\S]*minHeight:\s*38/);
  assert.doesNotMatch(transactionFormSource, /<SettingsChip/);
});

test('transaction form keeps category management in the category header', () => {
  assert.match(transactionFormSource, /manageCategories:\s*'\\u5206\\u7c7b\\u7ba1\\u7406'/);
  assert.match(transactionFormSource, /<View style=\{styles\.categoryHeader\}>[\s\S]*<Pressable[\s\S]*accessibilityLabel=\{inlineCopy\.manageCategories\}/);
  assert.match(transactionFormSource, /onPress=\{\(\) => onManageCategories\?\.\(draft\.type\)\}/);
  assert.match(transactionFormSource, /name="settings-outline"/);
});

test('transaction form makes the category list scrollable above the bottom panel', () => {
  assert.match(transactionFormSource, /import \{ Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View \}/);
  assert.match(transactionFormSource, /<ScrollView[\s\S]*style=\{styles\.categoryScroll\}/);
  assert.match(
    transactionFormSource,
    /contentContainerStyle=\{\[\s*styles\.categoryScrollContent,\s*shouldShowBottomPanel \? styles\.categoryScrollContentWithBottomPanel : null,\s*\]\}/
  );
  assert.match(transactionFormSource, /categoryScroll:\s*\{[\s\S]*flex:\s*1/);
  assert.match(transactionFormSource, /categoryScrollContent:\s*\{[\s\S]*paddingBottom:\s*spacing\.xl/);
  assert.match(transactionFormSource, /categoryScrollContentWithBottomPanel:\s*\{[\s\S]*paddingBottom:\s*430/);
});

test('new transaction screen no longer passes the add-entry button label into the form', () => {
  assert.doesNotMatch(newTransactionScreenSource, /submitLabel=\{accountingCopy\.actions\.addEntry\}/);
});
