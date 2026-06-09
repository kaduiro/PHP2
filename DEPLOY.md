# Simply Static 静的サイトの起動・Vercel デプロイ方法

このリポジトリは、Docker で起動した WordPress を **Simply Static** で静的化した出力です。  
ローカルでの確認方法と、**Vercel** へのデプロイ手順をまとめます。

---

## 1. このリポジトリの構成

| パス | 説明 |
|------|------|
| `index.html` | トップページ |
| `sample-page/`, `author/`, `category/`, `2026/...` | 各ページ（各フォルダに `index.html`） |
| `wp-content/` | テーマの CSS・JS・画像など |
| `wp-includes/` | WordPress 由来の CSS・JS（Simply Static が含めたもの） |

- アセットはすべて **ルート起点の絶対パス**（例: `/wp-content/themes/home/assets/css/style.css`）で参照されているため、**Vercel のドメインルートでそのまま配信できます**。パスの書き換えは不要です。

---

## 2. ローカルで起動する（確認用）

ビルドは不要です。静的ファイルをそのまま配信するサーバーで開きます。

### 方法 A: Node.js の `npx serve`（推奨）

```bash
# リポジトリのルートで実行
npx serve . -p 3000
```

ブラウザで **http://localhost:3000** を開きます。

### 方法 B: Python

```bash
# Python 3
python -m http.server 3000
```

ブラウザで **http://localhost:3000** を開きます。

### 方法 C: PHP

```bash
php -S localhost:3000
```

ブラウザで **http://localhost:3000** を開きます。

---

## 3. Vercel にデプロイする

### 前提

- [Vercel](https://vercel.com) のアカウント
- このリポジトリを **GitHub / GitLab / Bitbucket** にプッシュ済み（または Vercel CLI でデプロイ）

### 手順（Vercel ダッシュボード）

1. **https://vercel.com** にログイン
2. **Add New… → Project** でリポジトリをインポート
3. **Configure Project** で次のように設定：
   - **Framework Preset**: 未指定のまま（または **Other**）
   - **Build Command**: 空のまま（静的サイトのためビルド不要）
   - **Output Directory**: 空のまま（ルートがそのまま公開される）
   - **Install Command**: 空のままで問題なし
4. **Deploy** をクリック

デプロイ後、`https://＜プロジェクト名＞.vercel.app` でサイトが表示されます。

### 手順（Vercel CLI）

```bash
# Vercel CLI を未導入の場合
npm i -g vercel

# リポジトリのルートで実行
vercel
```

プロンプトに従い、ログイン・プロジェクト選択後、デプロイが完了します。

---

## 4. Vercel での挙動

- **ルート（/）** → `index.html` が配信されます。
- **サブパス（例: /sample-page, /sample-page/）** → 対応するフォルダ内の `index.html` が配信されます（Vercel が自動で `index.html` を探します）。
- **静的ファイル（/wp-content/..., /wp-includes/...）** → そのまま配信されます。

`vercel.json` を置いている場合は、そこに書いたリダイレクト・ヘッダーが適用されます（後述）。

---

## 5. オプション: vercel.json

リポジトリルートの `vercel.json` で、次のような設定ができます。

- **トレイリングスラッシュの統一**（例: `/sample-page` → `/sample-page/` にリダイレクト）
- **カスタム 404 ページ**（Simply Static に 404 が含まれていれば、そのファイル名に合わせて設定）
- **キャッシュやセキュリティ用のヘッダー**

詳細は [Vercel のドキュメント](https://vercel.com/docs/project-configuration) を参照してください。

---

## 6. 注意点

- **フォーム送信・検索・コメント** など、WordPress の PHP や DB に依存していた機能は、静的化後は動作しません。フォームは **Vercel の Serverless Function** や **外部サービス（Formspree 等）** に置き換える必要があります。
- **RSS（/feed/）や wp-json** へのリンクが HTML に残っていても、静的サイトには対応する JSON/XML がないため 404 になります。必要なら別途静的ファイルを用意するか、リンクを削除してください。
- 再静的化する場合は、再度 Simply Static でエクスポートし、このリポジトリのファイルを置き換えてからコミット・プッシュすると、Vercel が自動で再デプロイします。

---

## まとめ

| 目的 | コマンド・操作 |
|------|----------------|
| ローカルで確認 | リポジトリルートで `npx serve . -p 3000` など |
| Vercel にデプロイ | ダッシュボードでリポジトリをインポートし、Build/Output は空のまま Deploy |
| 本番 URL | デプロイ後に表示される `https://＜プロジェクト＞.vercel.app` |

このリポジトリは「ビルドなし・ルートをそのまま公開」する形で Vercel に読み込ませれば正しく動作します。
