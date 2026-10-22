# UCHealthLog Web

UCHealthLog Webは、潰瘍性大腸炎（UC）の人が日々の体調を記録し、変化を振り返るためのローカルファーストWebアプリです。iOS版「UCHealthLog」MVP ver.1.04の主要機能を、スマートフォン、タブレット、PCで利用できるWeb UIへ移植しています。

本アプリは日々の記録を補助するものであり、医療診断、治療判断、治療提案を行うサービスではありません。体調に不安がある場合は医療機関へ相談してください。

## 主な機能

- 体調、腹痛レベル、トイレ回数、血便、服薬、メモの日別記録
- 記録済みの日と選択日を確認できる月間カレンダー
- 履歴一覧と記録の詳細表示、編集、削除
- 朝・昼・晩・間食ごとの食事写真の保存と置換
- トイレ回数の折れ線グラフと7日・14日・30日の期間切り替え
- 記録と写真を含むZIPバックアップのエクスポート・インポート
- ブラウザストレージの概算使用量表示と、対応ブラウザでの永続ストレージ要求
- スマートフォン、タブレット、PC向けのレスポンシブ表示
- OS設定に連動するライト／ダークモード

## データ保存とプライバシー

体調記録、メモ、食事写真は、アプリを利用しているブラウザのIndexedDBへ保存されます。これらのデータをCloudflareなどのアプリ運用サーバーへ保存する機能はありません。

- ログイン、クラウド同期、端末間同期、サーバー側バックアップには対応していません。
- 別のブラウザ、端末、ブラウザプロファイルにはデータが自動で引き継がれません。
- ブラウザのサイトデータ削除、ブラウザプロファイルの削除、公開URL（オリジン）の変更などにより、保存データを失う可能性があります。
- IndexedDBのデータには、アプリ独自の暗号化を行っていません。共有PCでは、同じブラウザプロファイルを利用する人から閲覧される可能性があります。
- エクスポートしたZIPには健康情報や写真が含まれ、v1では暗号化されません。安全な場所で管理してください。
- データ消失に備え、設定画面から定期的にバックアップをエクスポートしてください。

詳しくはアプリ内のプライバシー画面と[開発要件書](docs/UCHealthLog-Web-Development-Requirements.md)を参照してください。

## セキュリティ方針

- 本番環境はHTTPSかつ他サービスと共有しない専用オリジンで運用します。
- Content Security Policy（CSP）、クリックジャッキング防止、MIME sniffing防止などのレスポンスヘッダーを設定しています。
- 外部CDNや不要なサードパーティースクリプトを使用せず、依存パッケージをビルド成果物へ含めます。
- ユーザー入力をHTMLとして描画しません。
- 健康データと写真を外部サーバーへ送信する処理を実装していません。

これらはリスクを低減するための対策であり、データの完全な安全性や永続性を保証するものではありません。

## 技術構成

| 分類 | 技術 |
| --- | --- |
| UI | React |
| 言語 | TypeScript |
| 開発・ビルド | Vite |
| スタイル | Tailwind CSS |
| ルーティング | React Router |
| ローカルDB | IndexedDB + Dexie.js |
| グラフ | Recharts |
| 単体・コンポーネントテスト | Vitest |
| E2E | Playwright |
| 配信 | Cloudflare Workers Static Assets |
| パッケージ管理 | npm |

採用versionの範囲は[package.json](package.json)、再現可能な解決versionは[package-lock.json](package-lock.json)を参照してください。

## 対応ブラウザ

原則として、以下の最新安定版を正式対応対象とします。

- Safari（iPhone、iPad、macOS）
- Google Chrome
- Microsoft Edge
- Mozilla Firefox

Yahoo! JAPANアプリなどのアプリ内ブラウザはv1の正式対応対象外です。Safari、Chrome、Edge、Firefoxなどの標準ブラウザで開いてください。

## ローカル開発

Node.jsとnpmを用意し、リポジトリのルートで実行します。

```bash
npm install
```

利用できる主なコマンドは次のとおりです。

| コマンド | 用途 |
| --- | --- |
| `npm run dev` | Vite開発サーバーを起動 |
| `npm run typecheck` | TypeScript型チェック |
| `npm run test` | Vitestを1回実行 |
| `npm run test:watch` | Vitestをwatchモードで実行 |
| `npm run test:e2e` | PlaywrightをChromium、Firefox、WebKitで実行 |
| `npm run test:e2e:chrome` | インストール済みGoogle ChromeでPlaywrightを実行 |
| `npm run lint` | ESLintを実行 |
| `npm run build` | Production buildを`dist/`へ生成 |
| `npm run preview` | Production buildをローカルプレビュー |

Playwrightを初めて実行する環境では、別途テスト用ブラウザのインストールが必要です。

## プロジェクト構成

| パス | 役割 |
| --- | --- |
| `src/app` | アプリ初期化とルーティング |
| `src/components` | レイアウト、カレンダー、記録、写真などのUI部品 |
| `src/pages` | 各ルートのページコンポーネント |
| `src/db` | Dexie schema、migration、repository |
| `src/domain` | 型、バリデーション、グラフ計算などのドメインロジック |
| `src/services` | 写真処理、バックアップ・復元、ストレージ管理 |
| `src/utils` | ローカル日付などの共通ユーティリティ |
| `e2e` | Playwrightの主要ユーザーフロー |
| `public` | セキュリティヘッダーなどの静的ファイル |
| `docs` | 開発要件、リリース、テスト文書 |

## リリース文書

- [変更履歴](CHANGELOG.md)
- [v1.0.0 リリースノート](docs/releases/v1.0.0.md)
- [v1.0.0 テスト結果](docs/testing/v1.0.0-test-results.md)

## 公開URLとスクリーンショット

公開URLは、リポジトリ内の設定やGitHubのリポジトリ情報から確実に確認できなかったため記載していません。公開先を確認後、リリース前に追記してください。

公開可能なスクリーンショットは現在リポジトリに含まれていません。追加する場合は、架空の記録と非個人画像だけを使用し、`docs/assets/screenshots/`への保存を推奨します。
