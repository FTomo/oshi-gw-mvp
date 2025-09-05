# Copilot Instructions for oshi-gw-mvp

## 1. アーキテクチャ概要
- フロント: `frontend/` React + TypeScript + Vite。状態は Recoil (`src/state/`) + 一部カスタム hooks。
- バックエンド: AWS Amplify (AppSync GraphQL + Cognito + DynamoDB)。設定は `amplify/` と自動生成の `frontend/src/aws-exports.js` / `amplifyconfiguration.json`。
- データアクセス: GraphQL (queries/mutations/subscriptions) → `services/*.ts` が低レベル API ラッパ、`hooks/useXXX.ts` が画面向けロジック。
- モデル: GraphQL スキーマは `amplify/backend/api/*/schema.graphql`。自動生成型は `frontend/src/API.ts` と `models/`。

## 2. 主要ディレクトリ
| パス | 役割 |
|------|------|
| `frontend/src/pages/` | 画面 (UI) コンポーネント |
| `frontend/src/components/` | レイアウト/共通 UI |
| `frontend/src/hooks/` | 業務ロジック + CRUD 抽象 (サービス呼び出し) |
| `frontend/src/services/` | GraphQL 呼び出し (AppSync) の薄いラッパ |
| `frontend/src/state/` | Recoil atoms (認証・言語など) |
| `frontend/src/i18n/` | 多言語メッセージ |
| `amplify/backend/api/` | GraphQL スキーマと CloudFormation 派生物 |
| `amplify/backend/auth/` | Cognito 設定 |

## 3. データフロー (例: User プロフィール同期)
Auth(Cognito) → `useUser.ensureSyncedOnSignIn()` → `userService.getById()` → (存在しなければ) `userService.create()` → Recoil `currentUserAtom` へ `toUserInfo()` で格納 → 画面(`Profile`, `Dashboard`)が `useUser()` から取得。
更新: `Profile` → `useUser.updateMyProfile()` → `userService.update()` → Recoil 反映。

## 4. コーディング規約 / パターン
- 画面は副作用を直接書かず `hooks/useXXX.ts` 経由。
- サービス層は Amplify `generateClient().graphql({ query, variables, authMode })` を使用。戻り値は null 許容で例外は catch & ログ。
- URL 型 (`AWSURL`) には空文字を送らず `null` に正規化 (例: avatarUrl)。
- Recoil に保存するユーザー型は `UserInfo`。DynamoDB からの `DbUser` は `toUserInfo()` 変換。
- ID 不整合 (Cognito sub ≠ DB id) 検出時はサインアウト (呼び出し側でハンドリング)。

## 5. 環境とブランチ
- Git ブランチ: `dev` (開発) / `main` (本番)。
- Amplify 環境: `dev` / `prod`。ブランチ切替後は: `amplify env checkout <env>` → `amplify pull` で `aws-exports.js` を更新。
- 誤接続防止: `frontend/src/aws-exports.js` の `aws_appsync_graphqlEndpoint` が期待環境か確認。

## 6. よく使うコマンド
```
# 開発フロントエンド
cd frontend && pnpm install && pnpm dev
# Amplify 環境確認 / 切替
a amplify env list
amplify env checkout dev
amplify pull
# スキーマ更新反映
amplify push
```

## 7. デバッグ
- VS Code 複合デバッグ: Vite Dev Server (pnpm dev) + Chrome (`pwa-chrome`).
- ブラウザブレークポイントは `pwa-chrome` 構成使用。`pwa-node` はフロントでは効かない。

## 8. 追加実装指針 (AI 用)
- 新規モデル追加時: `schema.graphql` 編集 → `amplify push` → `API.ts` 再生成 → service → hook → page の順で薄い層から。
- 既存 CRUD 拡張時は: service に純粋関数追加 → hook で組み合わせ → page で使用。
- 例外処理: service で catch しログ、hook では UI 通知を判断。

## 9. 代表的ファイル参照
- User サービス: `frontend/src/services/userService.ts`
- User Hook: `frontend/src/hooks/useUser.ts`
- 認証状態: `frontend/src/state/auth.ts`
- GraphQL 定義: `frontend/src/queries.ts`, `frontend/src/mutations.ts`

## 10. よくある落とし穴
- 空文字の `avatarUrl` 送信で AWSURL 型エラー → null 正規化必要。
- ブランチ切替後 `amplify pull` 忘れで prod に書き込む事故。
- `useUser()` が `me` を返さない改修漏れで Dashboard 不具合。

---

# 基本設計

## 1. 開発方針

* **最優先度**：開発コスト削減・ランニングコスト最小化・短期間（1人日規模）での構築
* **利用範囲**：主に社内利用（社員のみ）。将来的にゲストユーザーを外部公開する可能性あり
* **アピール要素**：React・TypeScript・Amplify など最新技術スタックを使用して「最新感」を出す


## 2. インフラ構成（最小・サーバレス）

### ホスティング & バックエンド

* **AWS Amplify Hosting**

  * フロント（Reactアプリ）を GitHub リポジトリから自動デプロイ
  * 標準ドメイン提供（`https://xxxxx.amplifyapp.com`）
  * 後から独自ドメイン追加可能（例: `app.company.jp`）

### 認証

* **Amazon Cognito（Amplify Auth）**

  * 社員ログイン（メールアドレス＋パスワード）
  * 将来的にゲストユーザー（グループ分け `employee` / `guest`）

### API / DB

* **AWS AppSync（GraphQL API）**
* **Amazon DynamoDB**（サーバレス NoSQL）

  * `User` / `Attendance` / `Project` / `Task` モデルを保存
  * Amplify Codegen により型付け API を自動生成

### ログ・監視

* **AWS CloudWatch Logs**（Amplify が裏で連携）
* 初期運用は Amplify ダッシュボードで十分

---

## 3. 開発環境

* **エディタ**：Visual Studio Code
* **AI支援**：GitHub Copilot / Amazon Q Developer / ChatGPT（コード生成主体）
* **フロントエンド**：

  * React + TypeScript + Vite
  * 状態管理：Recoil
  * UI コンポーネント：MUI (Material UI)
  * フォーム：React Hook Form + Zod
  * カレンダー：FullCalendar
  * ガントチャート：gantt-task-react
* **パッケージ管理**：pnpm（または npm）

---

## 4. データモデル（MVP）

* **User**

  * id (Cognito sub), email, name, role (`admin`/`member`/`guest`), avatarUrl?
* **Attendance**

  * id, userId, date, clockIn, clockOut, plannedOff, note
* **Project**

  * id, name, managerUserId, startDate, endDate, description
* **Task**

  * id, projectId, assigneeUserId, title, description, startDate, endDate, progress, status

---

## 5. 主要機能

### 認証・プロフィール

* サインイン／サインアップ（Amplify Auth UI or MUI）
* プロフィール表示・編集（名前、簡易アバター）

### 勤怠管理

* 出勤／退勤ボタン（当日の記録）
* 休日予定登録
* 実績編集（過去データ修正）
* カレンダー表示（FullCalendar）で可視化

### プロジェクト管理

* プロジェクト作成／一覧
* タスク管理（タスクNo、担当者、説明、開始日、終了日、進捗）
* ガントチャート（gantt-task-react、日単位、横スクロール可能）

---

## 6. アーキテクチャ概要図（簡易）

```
社員 / ゲスト
   │
   ▼
[Amplify Hosting] --- React+TS+Recoil+MUI (フロント)
   │
   ▼
[Amplify Auth] Cognito ← 社員/ゲストログイン
   │
   ▼
[Amplify API] AppSync GraphQL
   │
   ▼
[DynamoDB] User, Attendance, Project, Task
```

---

## 7. 運用ポリシー

* **開発環境**：Amplify dev 環境（自動デプロイ）
* **本番環境**：Amplify prod 環境（main ブランチ連動）
* **初期公開**：標準ドメイン（amplifyapp.com）
* **将来公開**：独自ドメイン（`app.company.jp`）追加、ゲストユーザーを限定公開

---

## 8. 今後の拡張（MVP後）

* プロジェクトタスク → 勤怠スケジュール連携（選択的に反映）
* ガントチャート表示切替（日／週／月）
* 日本の祝日API連携（勤務表に反映）
* CSVエクスポート・帳票
* 管理者画面でのユーザー管理（ロール割当）
