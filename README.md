# 轻记（记账移动端）

基于 **Expo** 与 **Expo Router** 的跨平台记账应用（Android / iOS / Web），面向个人日常收支记录、分类管理与简单统计分析。本地使用 **SQLite** 持久化数据，并可在登录后对接远端账本同步（具体能力由 Provider / Mock 实现决定）。

## 功能概览

### 底部导航（四个 Tab）

| Tab | 说明 |
| --- | --- |
| **首页** | 当前账本与月份展示；本月收支汇总卡片（结余、收入、支出及同步概况）；近期流水预览；快捷进入「记一笔」 |
| **明细** | 按月份浏览流水；支持切换月份；列表按日分组；可长按条目进行编辑等操作；悬浮按钮新增记录 |
| **统计** | 当前月份收支结构：汇总卡片与按分类维度拆解（支出 / 收入占比与金额） |
| **我的** | 个人入口：资料与账本、同步模式说明、手动同步；跳转登录/注册、分类管理、账本管理等子页面 |

### 记账与分类

- **记一笔**（`/transaction/new`）：选择收支类型、分类（含图标展示）、金额（内置数字键盘）、日期与备注；可通过分类旁的设置入口进入 **分类管理**
- **编辑 / 删除流水**（`/transaction/[id]`）：修改单笔记录或删除
- **分类管理**（`/categories`）：查看支出/收入分类列表；系统分类与自定义分类区分展示；支持启用/停用；自定义分类支持编辑、删除（具体能力依赖后端能力位）；可从记一笔页带入 `entryType` 参数以默认展示对应分组

### 账户与设置

- **登录 / 注册**（`/auth/login`、`/auth/register`）
- **个人资料**：编辑资料、修改密码、账本管理（见 `app/profile/` 下路由）

## 技术栈

- **React Native** + **Expo**（SDK 约 55）
- **expo-router**：文件式路由（入口见 `app/`）
- **expo-sqlite**：本地数据库
- **TypeScript / JSX**：路由与部分组件为 TS，记账领域组件多为 JS

## 环境要求

- Node.js（建议使用当前 LTS）
- iOS 开发需 Xcode；Android 开发需 Android Studio 与环境变量配置

## 安装与运行

```bash
npm install
```

启动开发服务器：

```bash
npm run start
```

按需选择终端中的 **Expo Go**、**Android 模拟器**、**iOS 模拟器** 或 **Web**。

常用脚本：

| 命令 | 说明 |
| --- | --- |
| `npm run start` | 启动 Metro / Expo |
| `npm run android` | 构建并在 Android 设备/模拟器运行 |
| `npm run ios` | 构建并在 iOS 模拟器运行 |
| `npm run web` | Web 端 |
| `npm run lint` | ESLint 检查 |
| `npm run typecheck` | TypeScript 检查（`tsc --noEmit`） |
| `npm run test:state` | 运行部分状态相关 Node 测试 |

> **说明**：`npm run reset-project` 会将当前 `app` 示例移至 `app-example` 并清空 `app`，一般仅在刻意重置脚手架时使用。

## 配置说明

### 远端 API 地址

登录后与账本、分类等相关的请求会使用 **`EXPO_PUBLIC_API_BASE_URL`** 作为后端根地址。

在项目根目录创建 `.env`（勿提交密钥类配置；仓库若有 `.gitignore` 请保留对 `.env` 的忽略）：

```bash
# 示例：本地局域网后端（请改成你机器或服务器的地址与端口）
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000
```

- **未设置时**：代码中会回落到开发用的默认地址（见 `providers/mock-app-provider.js` 内的常量），一般为局域网 IP + `:3000`，真机调试时请务必改成电脑在当前 Wi‑Fi 下的可达地址。
- **修改 `.env` 后**：需要重新启动 Metro（必要时清理缓存：`npx expo start --clear`），以便 Expo 重新注入 `EXPO_PUBLIC_*` 变量。

仅有前缀 **`EXPO_PUBLIC_`** 的变量会被打进前端包内，请勿在此存放服务端密钥或 OAuth Secret。

## 目录提示

- `app/`：页面与路由（含 `(tabs)` 主导航）
- `components/accounting/`：记账领域 UI 与表单等
- `providers/mock-app-provider.js`：应用状态、本地存储与同步相关聚合（Mock / 接入层）
- `state/`、`lib/`：账本状态、同步与工具函数
- `constants/`：主题与文案等

## 相关文档

- [Expo 文档](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)

仓库内若有 `AGENTS.md`，可补充团队协作与提交约定。
