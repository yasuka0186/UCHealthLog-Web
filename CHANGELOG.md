# Changelog

このプロジェクトの利用者・開発者向けの主な変更を記録します。

## [1.0.0] - Unreleased

リリース日はGitHub Release作成時に確定します。詳細は[v1.0.0リリースノート](docs/releases/v1.0.0.md)を参照してください。

### Added

- 体調、腹痛レベル、トイレ回数、血便、服薬、メモの日別記録
- 月間カレンダー、履歴一覧、記録詳細、編集、削除
- 朝・昼・晩・間食ごとの圧縮済み食事写真の保存と置換
- 7日・14日・30日のトイレ回数グラフ、統計値、未来日の集計除外
- 記録と写真を含むZIPバックアップのエクスポート・検証・インポート
- ストレージ使用量表示、永続ストレージ要求、容量超過時の案内
- スマートフォン、タブレット、PC向けレスポンシブUIとライト／ダークモード
- IndexedDB migration、同日重複防止、記録と写真のtransaction処理
- Chromium、Firefox、WebKitを対象とする自動E2Eテスト
- Cloudflare Workers Static Assets向けのSPA fallbackと静的アセット配信設定

### Security

- 体調記録、メモ、写真をブラウザのIndexedDB内に保持し、アプリ運用サーバーへ送信しないローカルファースト構成
- IndexedDB内の写真をWebKit互換性のある`ArrayBuffer`として保存
- CSP、`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、`Permissions-Policy`を設定
- 外部CDNと不要なサードパーティースクリプトを使用しない構成
- ユーザー入力をHTMLとして描画せず、Production source mapを生成しない設定
- バックアップをIndexedDB更新前に検証し、transactionで復元する仕組み

### Known limitations

- ログイン、クラウド同期、端末間同期、サーバー側バックアップはありません。
- IndexedDBとエクスポートファイルにはアプリ独自の暗号化を行っていません。
- サイトデータ削除や公開URLの変更により、保存データを失う可能性があります。
- データは別ブラウザ、別端末、別ブラウザプロファイルへ自動で引き継がれません。
- Yahoo! JAPANアプリなどのアプリ内ブラウザは正式対応対象外です。
- PWA、ホーム画面追加、オフライン用静的アセットキャッシュはv1の対象外です。
- 本アプリは医療診断や治療提案を行いません。
