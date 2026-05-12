# Accounting UI Chinese Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将移动端记账 Mock MVP 的主要 UI 文案统一为简洁自然的中文，并清理当前页面中的英文残留。

**Architecture:** 以 `constants/accounting-copy.js` 为主要文案入口，优先收拢复用文案；页面内保留少量场景化短句。实现分为“共享文案/辅助函数”和“页面落地”两批，最后统一校验并提交。

**Tech Stack:** Expo Router、React Native、JSDoc typed JavaScript、TypeScript typecheck、Expo lint、Node test

---

### Task 1: 规划与计划文件入库

**Files:**
- Create: `docs/superpowers/plans/2026-05-12-accounting-ui-chinese.md`

- [ ] **Step 1: 写入实现计划**

将中文化范围、目标文件、验证命令和提交节奏写入计划文档。

- [ ] **Step 2: 提交计划**

Run: `git add -- 'docs/superpowers/plans/2026-05-12-accounting-ui-chinese.md' && git commit -m "补充移动端记账中文化实现计划"`

Expected: 生成只包含计划文档的独立提交。

### Task 2: 共享文案与辅助逻辑中文化

**Files:**
- Modify: `constants/accounting-copy.js`
- Modify: `components/accounting/helpers.js`
- Modify: `components/accounting/home-details-utils.js`
- Modify: `components/accounting/statistics-profile-support.js`
- Modify: `components/accounting/account-summary-row.js`
- Modify: `components/accounting/summary-card.js`
- Modify: `components/accounting/transaction-form-support.js`
- Modify: `components/accounting/transaction-form.jsx`
- Test: `components/accounting/helpers.test.js`
- Test: `components/accounting/home-details-utils.test.js`
- Test: `components/accounting/statistics-profile-support.test.js`
- Test: `components/accounting/transaction-form-support.test.js`

- [ ] **Step 1: 更新 failing tests 以表达中文预期**

将现有辅助函数测试中的英文期望值改为中文，例如月份、统计标签、账户类型、表单错误提示。

- [ ] **Step 2: 运行相关测试确认先失败**

Run: `node --experimental-default-type=module --test components/accounting/helpers.test.js components/accounting/home-details-utils.test.js components/accounting/statistics-profile-support.test.js components/accounting/transaction-form-support.test.js`

Expected: 至少出现中文期望与当前英文实现不匹配的 FAIL。

- [ ] **Step 3: 实现共享文案与辅助函数中文化**

重写 `constants/accounting-copy.js` 中当前乱码与旧文案，统一中文标签；同步修改 helper 和表单辅助逻辑返回中文。

- [ ] **Step 4: 运行相关测试确认通过**

Run: `node --experimental-default-type=module --test components/accounting/helpers.test.js components/accounting/home-details-utils.test.js components/accounting/statistics-profile-support.test.js components/accounting/transaction-form-support.test.js`

Expected: PASS，0 fail。

### Task 3: 页面与路由中文化

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/details.jsx`
- Modify: `app/(tabs)/statistics.jsx`
- Modify: `app/(tabs)/profile.jsx`
- Modify: `app/transaction/new.jsx`
- Modify: `app/transaction/[id].jsx`

- [ ] **Step 1: 替换页面中的英文残留**

将标题、副标题、空状态、按钮、明细摘要、编辑页缺失状态全部改为中文，并优先复用 `accountingCopy`。

- [ ] **Step 2: 自查页面表达一致性**

确认“新增一笔 / 保存修改 / 删除 / 这个月还没有记录 / 同步状态”等说法在各页面一致。

### Task 4: 全量验证与提交

**Files:**
- Modify: `constants/accounting-copy.js`
- Modify: `components/accounting/helpers.js`
- Modify: `components/accounting/home-details-utils.js`
- Modify: `components/accounting/statistics-profile-support.js`
- Modify: `components/accounting/account-summary-row.js`
- Modify: `components/accounting/summary-card.js`
- Modify: `components/accounting/transaction-form-support.js`
- Modify: `components/accounting/transaction-form.jsx`
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/details.jsx`
- Modify: `app/(tabs)/statistics.jsx`
- Modify: `app/(tabs)/profile.jsx`
- Modify: `app/transaction/new.jsx`
- Modify: `app/transaction/[id].jsx`
- Test: `state/mock-app-state.test.js`
- Test: `components/accounting/helpers.test.js`
- Test: `components/accounting/home-details-utils.test.js`
- Test: `components/accounting/statistics-profile-support.test.js`
- Test: `components/accounting/transaction-form-support.test.js`

- [ ] **Step 1: 运行完整校验**

Run: `npm.cmd run typecheck`

Expected: exit 0

Run: `npm.cmd run lint`

Expected: exit 0

Run: `node --experimental-default-type=module --test state/mock-app-state.test.js components/accounting/helpers.test.js components/accounting/home-details-utils.test.js components/accounting/statistics-profile-support.test.js components/accounting/transaction-form-support.test.js`

Expected: PASS，0 fail。

- [ ] **Step 2: 提交中文化改动**

Run: `git add -- 'constants/accounting-copy.js' 'components/accounting/helpers.js' 'components/accounting/home-details-utils.js' 'components/accounting/statistics-profile-support.js' 'components/accounting/account-summary-row.js' 'components/accounting/summary-card.js' 'components/accounting/transaction-form-support.js' 'components/accounting/transaction-form.jsx' 'app/(tabs)/index.tsx' 'app/(tabs)/details.jsx' 'app/(tabs)/statistics.jsx' 'app/(tabs)/profile.jsx' 'app/transaction/new.jsx' 'app/transaction/[id].jsx' && git commit -m "完成移动端记账界面中文化"`

Expected: 生成只包含中文化 UI 调整的独立提交。
