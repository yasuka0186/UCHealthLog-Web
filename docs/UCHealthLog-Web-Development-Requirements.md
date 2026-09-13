# UCHealthLog Web版 開発要件書

## 0. Codexへの指示

この文書をWeb版UCHealthLog実装の一次要件とする。

- Web版のプロジェクトルートディレクトリ名は `UCHealthLog-Web` とする。iOS版の `UCHealthLog` とは別ディレクトリ・別プロジェクトとして管理する。
- 本要件書はプロジェクトルート配下の `docs/UCHealthLog-Web-Development-Requirements.md` に配置する。
- Codex向けの恒常的な開発指示である `AGENTS.md` はプロジェクトルート直下（`UCHealthLog-Web/AGENTS.md`）に配置する。
- 参照元iOSアプリ: https://github.com/yasuka0186/UCHealthLog
- 確認した基準コミット: `c2032dcf3b9ddf036b5ab84703e55964ed8b7791`
- iOS版MVP: `MVP ver.1.04`
- 参照元iOSリポジトリは仕様確認用として扱い、明示的な指示がない限り変更しない。
- Web版は、iOS版の機能・情報設計・青基調のUIを維持しつつ、Webに適した実装へ置き換える。
- SwiftUI固有の見た目を完全再現する必要はない。スマホファーストで、PC・タブレットにも最適化する。
- ログイン・バックエンド・クラウド同期はWeb版v1では実装しない。
- ユーザーデータはIndexedDBにローカル保存し、Cloudflareへ体調記録や写真を送信しない。
- 実装はフェーズ単位で進め、各フェーズ終了時に関連テスト・型チェック・ビルドを通す。
- 要件に不明点がある場合は、独断で機能を増やさず質問する。

## 1. 目的

UC（潰瘍性大腸炎）のユーザーが、毎日の体調を手入力を極力減らして記録・振り返りできるWebアプリを提供する。

Web版v1は、iOS版MVP ver.1.04の以下を再現する。

- 日別の体調記録
- 月間カレンダー
- 履歴一覧
- 記録詳細・編集・削除
- 食事写真
- トイレ回数グラフ
- 7日 / 14日 / 30日の期間切り替え
- 同じ日の記録を1件に制御

さらにWeb版特有のデータ消失リスクへ対応するため、バックアップ、ストレージ管理、セキュリティ、レスポンシブ対応を追加する。

## 2. 採用技術

| 分類 | 採用技術 | 用途 |
| --- | --- | --- |
| 言語 | TypeScript | アプリ全体 |
| UI | React | 画面・コンポーネント |
| ビルド | Vite | 開発・ビルド |
| CSS | Tailwind CSS | スマホファースト/レスポンシブ/ダークモード |
| ルーティング | React Router | 画面遷移 |
| ローカルDB | IndexedDB + Dexie.js | 体調記録・食事写真の永続保存 |
| グラフ | Recharts | トイレ回数の折れ線グラフ |
| 日付 | date-fns または小さな自前ヘルパー | 日付範囲・表示・日付キー生成 |
| 単体/コンポーネントテスト | Vitest | 日付・集計・バリデーション・UIロジック |
| E2E | Playwright | 実ブラウザ上の主要ユーザーフロー |
| 配信 | Cloudflare Workers Static Assets | SPAの静的配信 |
| パッケージ管理 | npm | lockfileをコミットする |
| バージョン管理 | Git | ローカル履歴・ブランチ管理 |
| リモートリポジトリ | GitHub | ソースコード管理・変更履歴・Pull Request |

原則としてCDN経由でライブラリを読み込まず、npm依存をビルド成果物へ含める。

## 3. iOS版からWeb版への対応

| iOS版 | Web版 |
| --- | --- |
| Swift / SwiftUI | TypeScript / React |
| SwiftData `HealthRecord` | Dexie `healthRecords` |
| SwiftData `MealPhoto` | Dexie `mealPhotos` |
| Application Support内のJPEG | IndexedDB内の圧縮済みBlob |
| `TabView` | モバイル下部ナビ / PCサイドナビ |
| `NavigationStack` | React Router |
| `PhotosPicker` | `<input type="file" accept="image/*">` 相当 |
| Swift Charts | Recharts |
| `AppTheme` | Tailwind theme / CSS variables |
| `.modelContainer` | Dexie DB初期化・migration |
| SwiftData cascade delete | Dexie transactionで親子を同時削除 |

## 4. 画面・ルート

基本ルートは以下とする。

| Route | 画面 | iOS対応 |
| --- | --- | --- |
| `/` | ホーム | `HomeView` + `HomeCalendarView` |
| `/history` | 履歴一覧 | `HistoryView` |
| `/history/:id` | 記録詳細 | `RecordDetailView` |
| `/graph` | グラフ | `GraphView` |
| `/settings` | 設定・データ管理 | Web版追加 |
| `/privacy` | データ保存・プライバシー説明 | Web版追加 |

`BrowserRouter` を使用する場合、Cloudflare側はSPA fallbackを設定し、詳細URLを直接開いても404にならないようにする。

## 5. 共通UI

### 5.1 デザイン

- iOS版と同じく青をプライマリカラーとする。
- 背景は淡いグレー、入力単位は白基調のカード、角丸を基本とする。
- 体調: 良い=緑、普通=黄、悪い=赤。
- 血便: なし=緑、少し=黄、あり=赤。
- 服薬: 飲んだ=緑、飲んでいない=赤、未入力=グレー。
- 色だけに依存せず、必ずテキストやアクセシブルラベルでも状態を表現する。
- OSの `prefers-color-scheme` に合わせたライト/ダークモードを実装する。

### 5.2 ナビゲーション

- モバイルはiOS版と同様に「ホーム / 履歴 / グラフ」の下部ナビを基本とする。
- 設定はヘッダーの歯車アイコン等から遷移できるようにし、主3画面の構成を崩さない。
- PCは左サイドナビへ切り替えてよい。
- 選択中のナビ項目を色とテキストで明示する。

### 5.3 レスポンシブ

- `< 768px`: 1カラム、下部ナビ、タップ操作最優先。
- `768px〜1023px`: コンテンツ幅を広げ、カードや写真を必要に応じて2カラム化。
- `>= 1024px`: サイドナビ + 最大幅を制御したメイン領域。ホームはカレンダーと入力フォームを2カラム化してよい。
- 横スクロールが通常操作で発生しないこと。
- iPhone相当、タブレット相当、PC相当の3種類で確認する。

## 6. ホーム画面要件

### 6.1 初期表示

- 初期選択日は端末ローカル日付の「今日」。
- 今日の記録が存在する場合はフォームへ読み込む。
- 存在しない場合は以下の初期値とする。
  - 体調: 普通
  - 腹痛レベル: 0
  - トイレ回数: 0
  - 血便: なし
  - 服薬: 未入力
  - メモ: 空文字

### 6.2 月間カレンダー

- 日〜土の7列。
- 前月・翌月ボタンで月移動できる。
- 現在選択中の日を明示する。
- 表示月の前後の日も薄い表示で含めてよい。iOS版と同じ挙動を優先する。
- 記録済みの日は体調に応じた緑/黄/赤のマーカーを表示する。
- 日付を選択すると、その日の保存済みデータをフォームへ読み込む。
- 保存後、カレンダーの状態を即時反映する。

### 6.3 体調

- 「良い / 普通 / 悪い」の3択。
- ボタン選択中心のUIとする。

### 6.4 腹痛レベル

- 0〜5の6段階。
- 範囲外の値を保存できないこと。

### 6.5 トイレ回数

- `-` / `+` ボタンで増減。
- 0未満にできない。
- 整数のみ保存する。

### 6.6 血便

- 「なし / 少し / あり」の3択。

### 6.7 服薬

- 「飲んだ / 飲んでいない / 未入力」の3択。

### 6.8 食事写真

- 朝 / 昼 / 晩 / 間食の4区分。
- 各区分につきv1では最大1枚を基本とする。
- 新規選択時は保存前にサムネイルを表示する。
- 選択した新規画像は保存前なら解除できる。
- 同じ日・同じ食事区分に既存写真がある状態で新しい写真を選び保存した場合、既存を置換する。
- 表示順は必ず「朝 → 昼 → 晩 → 間食」。
- Web版では保存前に画像を縮小・圧縮し、IndexedDBのBlobとして保存する。
- 推奨初期値: 長辺最大1600px程度、JPEG/WebP品質0.8前後。定数化し、変更しやすくする。
- MIME typeが画像でないファイルは拒否する。
- 読み込み・圧縮・保存失敗時はユーザーへエラーを表示する。

### 6.9 メモ

- 複数行テキストを入力可能。
- Reactの通常テキスト描画を使用し、HTMLとして解釈しない。

### 6.10 保存

- 同一ローカル日付は常に1レコード。
- 未登録日は新規作成、登録済み日は更新する。
- 二重クリックで重複作成されないよう保存中はボタンを無効化する。
- 記録本体と写真更新はDexie transactionでアトミックに行う。
- 成功時は「保存しました」を表示する。
- 失敗時はconsole出力だけで終わらせず、ユーザーへ再試行可能なメッセージを表示する。

## 7. 履歴一覧要件

- 記録日が新しい順。
- 0件時は空状態を表示する。
- 1件のカードに以下を表示する。
  - `M月d日（E）`
  - 体調
  - 腹痛レベル
  - トイレ回数
  - 血便
  - 服薬
- カード選択で `/history/:id` へ遷移する。
- 体調は色付きラベルで表現する。

## 8. 記録詳細要件

- 記録日は表示のみ。v1では日付そのものは編集しない。
- 体調、腹痛レベル、トイレ回数、血便、服薬、メモを編集できる。
- 保存済み写真を朝→昼→晩→間食順に2列グリッド等で表示する。
- iOS版v1.04に合わせ、詳細画面からの写真編集は必須としない。
- 「変更を保存する」操作で確定し、保存成功を通知する。
- Webではフォーム用draft stateを使用し、保存前に戻っただけで変更が永続化されないようにする。
- 「この記録を削除」で確認ダイアログを表示する。
- 削除確認文言は、削除後に元へ戻せないことを明示する。
- 削除時はHealthRecordと関連MealPhotoを1つのtransactionで削除する。
- 削除成功後は履歴一覧へ戻る。

## 9. グラフ要件

- 対象はトイレ回数。
- 期間は「7日 / 14日 / 30日」。初期値は7日。
- 今日を含む直近N日を対象とし、未来日の記録はグラフへ含めない。
- X軸は日付、Y軸はトイレ回数。
- 記録点と線を表示する。
- 表示対象期間に記録がない場合は空状態を表示する。
- 平均 / 最高 / 最低を表示する。
- 平均は小数1桁。
- X軸ラベルの目安は7日=1日間隔、14日=2日間隔、30日=5日間隔。
- 補足文としてiOS版の「トイレ回数が普段より増えている日は、体調・血便・メモもあわせて確認しましょう。」を表示する。

## 10. IndexedDBデータ設計

### 10.1 `healthRecords`

```ts
type ConditionStatus = 'good' | 'normal' | 'bad'
type BloodStatus = 'none' | 'little' | 'exists'
type MedicationStatus = 'taken' | 'notTaken' | 'notEntered'

interface HealthRecordRow {
  id: string                // UUID
  dateKey: string           // ローカル日付 YYYY-MM-DD、unique
  condition: ConditionStatus
  stomachPainLevel: number  // integer 0..5
  toiletCount: number       // integer >= 0
  bloodStatus: BloodStatus
  medicationStatus: MedicationStatus
  memo: string
  createdAt: string         // ISO 8601
  updatedAt: string         // ISO 8601
}
```

- `dateKey` にunique indexを設定し、同日重複をDBレベルでも防止する。
- `YYYY-MM-DD` は端末のローカル日付から生成する。UTC変換で日付が前後しない実装にする。

### 10.2 `mealPhotos`

```ts
type MealPhotoType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

interface MealPhotoRow {
  id: string
  recordId: string
  type: MealPhotoType
  blob: Blob
  mimeType: string
  createdAt: string
}
```

- `recordId` をindex化する。
- `recordId + type` の重複を防ぎ、1記録・1食事区分につき1枚とする。
- 記録削除時に関連写真を同じtransactionで削除する。
- iOS版の「HealthRecordに画像本体を持たせない」考え方を踏襲し、写真は別storeに分離する。

### 10.3 DB versioning

- Dexieの `db.version(n).stores(...)` を使用する。
- スキーマ変更時は既存データを消さずmigrationする。
- バックアップ形式にも独立した `backupFormatVersion` を持たせる。

## 11. Web版で追加必須の機能

### P0: v1リリース必須

1. データエクスポート / インポート
2. 画像の縮小・圧縮
3. 保存容量確認とquotaエラーハンドリング
4. `navigator.storage.persist()` による永続ストレージ要求（利用可能なブラウザのみ）
5. レスポンシブ対応
6. ライト / ダークモード
7. セキュリティヘッダー/CSP
8. ローカル保存であることの明示
9. SPAのdeep-link対応
10. IndexedDB migration
11. ユーザー向けエラー表示
12. 自動テスト

### P1: v1後に検討

- PWA化・ホーム画面追加・オフライン静的アセットキャッシュ
- バックアップ実施リマインド
- 保存容量の警告UI強化
- 食事写真の個別削除/詳細画面からの差し替え
- iOS版データの移行手段

### 今回対象外

- ユーザー登録/ログイン
- サーバーDB
- 端末間同期
- 家族共有
- Supabase等のクラウド保存
- 通院メモ
- PDF/レポート出力
- 医療診断や治療提案

## 12. バックアップ要件

### 12.1 エクスポート

- 設定・データ管理画面から手動実行できる。
- 体調記録と写真を含むこと。
- ファイル名例: `UCHealthLog-backup-2026-08-07.zip`。
- 推奨構成:

```text
UCHealthLog-backup-YYYY-MM-DD.zip
├── manifest.json
├── records.json
└── photos/
    ├── <photo-id>.jpg
    └── ...
```

- `manifest.json` には少なくとも `backupFormatVersion`, `exportedAt`, `recordCount`, `photoCount` を含める。
- バックアップには健康情報・写真が含まれる旨をダウンロード前に明示する。
- v1で暗号化しない場合は、そのこともユーザーへ明示する。

### 12.2 インポート

- ファイル選択後、即時に既存DBへ書き込まない。
- 先に形式、version、enum、数値範囲、日付、写真対応を検証する。
- 復元前に記録件数・写真件数・対象期間・競合件数を表示する。
- 同日データが競合する場合、少なくとも「既存を残す」「バックアップで上書き」のどちらかをユーザーが選べるようにする。
- デフォルトは安全側の「既存を残す」。
- import本処理はtransaction化し、途中失敗で半端な復元状態を作らない。
- 不正なバックアップはDBを書き換えずエラー終了する。

## 13. ストレージ要件

- `navigator.storage.estimate()` が利用可能なら使用量とquotaを取得する。
- 設定画面で「このブラウザ内に保存」と現在の概算使用量を表示する。
- `navigator.storage.persist()` が利用可能なら永続化を要求する。拒否されてもアプリは利用可能とし、バックアップを案内する。
- `QuotaExceededError` を捕捉し、写真圧縮/不要写真/バックアップ等の案内を出す。
- サイトデータ削除、ブラウザデータ削除、別originへのURL変更でデータを失う/引き継げない可能性を明示する。
- 別端末・別ブラウザ・別ブラウザプロファイル間では自動同期しないことを明示する。
- 共有PCでは同じブラウザプロファイルを使う他人から記録を見られる可能性があることを注意書きする。

## 14. セキュリティ・プライバシー要件

- 本番はHTTPSのみ。
- 体調記録、メモ、写真をサーバーへ送信しない。
- v1ではアクセス解析、広告、外部エラーレポートへ健康データを渡さない。導入する場合は別途設計レビューする。
- APIキー、token、secretをフロントエンドに埋め込まない。
- `dangerouslySetInnerHTML` を健康記録表示に使用しない。
- サードパーティスクリプトを極力使わず、外部CDNを使わない。
- 画像プレビューのObject URLは不要になったらrevokeする。
- console/error messageにメモ本文や画像データを出さない。
- production source mapは原則公開しない。
- `public/_headers` で少なくとも以下を検討・設定し、本番で実レスポンスを確認する。
  - `Content-Security-Policy`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` またはCSP `frame-ancestors 'none'`
  - `Referrer-Policy: no-referrer`
  - 必要最小限の `Permissions-Policy`
- CSPは外部通信不要の構成を前提に厳しくする。Blob画像表示に必要な `img-src blob:` 等だけを明示的に許可する。
- 依存パッケージは必要最小限とし、lockfileをコミットする。

## 15. Cloudflare Workers Static Assets要件

- Viteのproduction build (`dist`) のみを配信する。
- サーバーAPI/Workerロジックはv1では持たない。
- `wrangler.jsonc` 等でassets directoryを `./dist` に設定する。
- React Routerのdeep link用に `assets.not_found_handling = "single-page-application"` 相当を設定する。
- `_headers` を静的アセット側へ含め、セキュリティヘッダーを設定する。
- デプロイ前に `npm run build` が成功すること。
- 公開後に `/`, `/history`, `/graph`, `/settings`, `/privacy` の直アクセスを確認する。
- Cloudflareの無料枠を前提とし、有料機能を追加する場合は実装前に確認する。

## 16. 自動テスト要件

自動テストは「可能であれば」ではなく、Web版では採用する。

### 16.1 Vitest

最低限、以下を自動化する。

- ローカル日付から `dateKey` が正しく生成される。
- 日付境界でUTC変換により前日/翌日へずれない。
- 体調/血便/服薬のenum validation。
- 腹痛が0〜5のみ。
- トイレ回数が0未満にならない。
- 7/14/30日の抽出範囲。
- 未来日の記録がグラフ集計から除外される。
- 平均/最高/最低の計算。
- 0件時の統計値/空状態。
- 食事写真の表示順が朝→昼→晩→間食。
- import validation（version、不正値、壊れたmanifest）。

### 16.2 Playwright E2E

最低限、以下のユーザーフローを自動化する。

1. 新規日付を選択 → 記録保存 → 再読み込み後も保持。
2. 同じ日に再保存 → 新規レコードを作らず更新。
3. 履歴一覧 → 詳細 → 編集保存 → 反映。
4. 記録削除 → 確認 → 履歴/カレンダー/グラフから消える。
5. 食事写真選択 → 保存 → 詳細で表示。
6. 同じ区分の写真を再選択 → 置換。
7. 7/14/30日グラフ切り替え。
8. 未来日の記録がグラフへ混ざらない。
9. エクスポート → データ復元用テスト環境へインポート → 記録/写真が戻る。
10. `/history/:id` 等のdeep link直接アクセス。
11. モバイル/タブレット/PC幅で主要操作が可能。
12. ライト/ダークモードで主要テキストが読める。

PlaywrightではChromium・Firefox・WebKitを必須テスト対象とする。加えて、リリース前には実ブラウザのGoogle Chrome・Microsoft Edgeで主要フローを確認する。PlaywrightのWebKitやモバイルエミュレーションだけでSafari実機を完全に代替できるとはみなさず、macOS SafariおよびiPhone実機Safariでも主要フローを確認する。

### 16.3 回帰テスト

iOS版 `TEST_RESULT.md` の以下13項目をWeb版でも回帰観点として維持する。

- 新規記録保存
- 同日更新
- 履歴一覧表示
- 詳細表示
- 詳細編集
- 記録削除
- 食事写真保存
- 食事写真表示
- グラフ表示（7日）
- グラフ表示（14日）
- グラフ表示（30日）
- ブラウザ再読み込み/再起動後のデータ保持
- ライト/ダークモード表示

## 17. 品質要件

- TypeScript `strict` を有効にする。
- ESLintを導入し、重大なlint errorを残さない。
- `npm run typecheck`, `npm run test`, `npm run build` を標準スクリプトとして用意する。
- E2E用に `npm run test:e2e` を用意する。
- DBアクセスはコンポーネントへ直書きせず、repository/service層に分離する。
- 日付処理もヘルパーへ分離する。
- UIコンポーネント内にDB schemaやimport処理を混在させない。
- Loading / Saving / Empty / Error状態を明確に扱う。
- ボタンやフォームはキーボード操作可能にし、適切なlabel/aria属性を付ける。
- タップ領域はモバイルで十分な大きさを確保する。

### 17.1 対応ブラウザ

Web版v1の正式な対応対象は以下とする。

| ブラウザ | 対応方針 | 主な確認環境 |
| --- | --- | --- |
| Safari | 正式対応 | iPhone / iPad / macOS |
| Google Chrome | 正式対応 | PC / Androidを中心に確認 |
| Microsoft Edge | 正式対応 | PCを中心に確認 |
| Mozilla Firefox | 正式対応 | PCを中心に確認 |

- 原則として各ブラウザの最新安定版を対象とする。
- IndexedDB、Storage API、ファイル選択・ダウンロード等はブラウザ差異がある可能性を前提に、機能検出とフォールバックを行う。
- `navigator.storage.persist()` / `navigator.storage.estimate()` 等、利用できないAPIがあっても記録・閲覧の主要機能は継続して利用できること。
- ChromeとEdgeがともにChromium系であっても、公開前にはそれぞれの実ブラウザで主要フローをスモークテストする。
- SafariはPlaywright WebKitだけで完了扱いにせず、少なくともiPhone実機Safariで、記録保存・再読み込み・写真・履歴・グラフ・エクスポート/インポートを確認する。
- Yahoo! JAPANは検索サービス/アプリとしての利用を想定し、Yahoo! JAPANアプリ等のアプリ内ブラウザはv1の正式対応対象には含めない。標準ブラウザでの利用を案内し、必要性が確認できた場合に追加検証する。

### 17.2 Git / GitHubによるバージョン管理

- Web版のソースコードはGitでバージョン管理し、GitHubをリモートリポジトリとして使用する。
- `main` は動作確認済み・リリース可能な状態を維持する。
- 機能追加・修正は原則として作業内容ごとにブランチを作成し、確認後に `main` へマージする。
- ブランチ名は変更内容が分かる形式とする。例: `feature/health-record`, `feature/backup-import`, `fix/photo-storage`, `chore/test-setup`。
- 1コミットには関連する変更をまとめ、変更内容が分かるコミットメッセージを付ける。
- `.gitignore` に `node_modules/`, `dist/`, ローカル環境ファイル、エディタ/OS固有ファイル等を適切に設定する。
- secret、token、認証情報、個人の健康記録、テストに使用した実データをGit/GitHubへコミットしない。
- `package-lock.json` は再現可能なビルドのためコミットする。
- `main` へマージする前に、少なくとも `npm run typecheck`, `npm run test`, `npm run build` を成功させる。E2E対象の変更では `npm run test:e2e` も実行する。
- GitHub Pull Requestは、差分・テスト結果・変更理由を確認してから `main` へ反映するために使用する。個人開発でも主要機能や影響範囲の大きい変更ではPRを作成する。
- Cloudflareへの公開方法をGitHub連携にする場合は、`main` への反映を本番デプロイの基準とする。

## 18. 推奨ディレクトリ構成

```text
UCHealthLog-Web/
├── AGENTS.md
├── docs/
│   └── UCHealthLog-Web-Development-Requirements.md
├── src/
│   ├── app/
│   │   ├── router.tsx
│   │   └── App.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── calendar/
│   │   ├── records/
│   │   └── photos/
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── RecordDetailPage.tsx
│   │   ├── GraphPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── PrivacyPage.tsx
│   ├── db/
│   │   ├── db.ts
│   │   ├── schema.ts
│   │   └── recordRepository.ts
│   ├── services/
│   │   ├── photoService.ts
│   │   ├── backupService.ts
│   │   └── storageService.ts
│   ├── domain/
│   │   ├── types.ts
│   │   ├── recordValidation.ts
│   │   └── graph.ts
│   ├── utils/
│   │   └── date.ts
│   ├── styles/
│   └── test/
├── e2e/
└── public/
    ├── _headers
    └── ...
```

プロジェクトルートディレクトリ名は `UCHealthLog-Web` に固定する。`AGENTS.md` はCodexがプロジェクト全体へ適用できるようルート直下に置き、開発要件書などのプロジェクト文書は `docs/` にまとめる。

厳密にこの構成へ固定する必要はないが、UI / domain / DB / backup / storageを分離すること。

## 19. 実装フェーズ

### Phase 1: 基盤

- Git / GitHubリポジトリとブランチ運用の初期設定
- Vite + React + TypeScript
- Tailwind CSS
- React Router
- 共通theme/layout
- モバイル下部ナビ/PCナビ
- Vitest/Playwrightの初期設定

### Phase 2: データ層

- Dexie schema
- repository
- `dateKey` / validation
- transaction
- migration雛形
- データ層テスト

### Phase 3: iOS MVP機能移植

- Home / Calendar
- History
- Detail/Edit/Delete
- Meal Photo
- Graph
- 各機能テスト

### Phase 4: Web固有必須機能

- 画像圧縮
- Storage API
- export/import
- Settings/Privacy
- user-visible error
- responsive/dark mode
- security headers

### Phase 5: E2E・公開準備

- Playwright主要フロー
- Chromium/Firefox/WebKit
- Chrome/Edge実ブラウザ確認
- macOS Safari/iPhone実機Safari確認
- production build
- Cloudflare Workers Static Assets設定
- 公開URLでdeep link/CSP/保存/復元を確認

## 20. 完了条件（Definition of Done）

Web版v1は以下をすべて満たした時点で完了とする。

- iOS版MVP ver.1.04の主要機能がWebで再現されている。
- 同日重複が発生しない。
- 再読み込み後もIndexedDBの記録と写真が残る。
- 記録削除時に関連写真も残骸なく削除される。
- 7/14/30日のグラフと統計値が正しい。
- 未来日の記録がグラフへ含まれない。
- backup export/importで記録と写真を復元できる。
- quota/storage失敗をユーザーへ通知できる。
- PC/スマホ/タブレットでレイアウト崩れなく操作できる。
- Safari / Google Chrome / Microsoft Edge / Mozilla Firefoxの正式対応範囲で主要機能が利用できる。
- ライト/ダークモードで主要UIが読める。
- `npm run typecheck` 成功。
- `npm run test` 成功。
- `npm run test:e2e` の必須シナリオ成功。
- `npm run build` 成功。
- Cloudflare上でdeep linkが404にならない。
- 本番レスポンスに意図したセキュリティヘッダーが付く。
- 健康データ・写真を外部サーバーへ送信していないことをNetworkタブ等で確認できる。
- iPhone Safari実機で新規保存・再読込・写真・履歴・グラフ・バックアップの主要動作を確認する。
- Web版ソースコードがGit/GitHubで管理され、`main` がリリース可能な状態になっている。

## 21. 参照元ソースで確認した仕様

以下のiOS実装を基準にした。

- `UCHealthLog/UCHealthLogApp.swift`: SwiftData model container、青いNavigationBar、TabBar theme
- `UCHealthLog/ContentView.swift`: ホーム/履歴/グラフの3タブ
- `UCHealthLog/Models/HealthRecord.swift`: status値、腹痛、トイレ、血便、服薬、メモ、MealPhoto cascade
- `UCHealthLog/Models/MealPhoto.swift`: 朝/昼/晩/間食、写真メタデータ
- `UCHealthLog/Utilities/PhotoStorageManager.swift`: 画像本体を別保存する設計
- `UCHealthLog/View/HomeView.swift`: 初期値、同日upsert、写真置換、フォーム仕様
- `UCHealthLog/View/HomeCalendarView.swift`: 月移動、選択日、体調色マーカー
- `UCHealthLog/View/HistoryView.swift`: 新しい日付順、履歴カード
- `UCHealthLog/View/RecordDetailView.swift`: 詳細編集、削除、写真表示順
- `UCHealthLog/View/GraphView.swift`: 7/14/30日、未来日除外、平均/最高/最低
- `TEST_RESULT.md`: MVP ver.1.04の手動回帰観点

## 22. 公式ドキュメント

- Cloudflare Workers Static Assets: https://developers.cloudflare.com/workers/static-assets/
- Cloudflare SPA routing: https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/
- Cloudflare Static Assets headers: https://developers.cloudflare.com/workers/static-assets/headers/
- Dexie.js: https://dexie.org/docs
- Dexie + TypeScript: https://dexie.org/docs/Typescript
- Vitest: https://vitest.dev/guide/
- Playwright: https://playwright.dev/docs/intro
- Playwright browsers: https://playwright.dev/docs/browsers
