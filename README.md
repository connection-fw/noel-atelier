# NOËL ATELIER

クリスマスオーナメント画像を生成するアプリケーションです。

## 機能

- **3つのサイズから選択可能**
  - 正方形 (1024×1024)
  - 9:16 縦長 (576×1024)
  - 16:9 横長 (1024×576)

- **モチーフ入力またはAIにおまかせ機能**
  - モチーフを直接入力
  - AIがランダムにモチーフを選択

- **4つの異なるスタイルのオーナメント画像を生成**
  - クリスタルガラス - 繊細で透明なガラスオーナメント
  - シネマティック 3D アニメーション - ピクサー風のレンダリングオーナメント
  - ガラススノードーム - スノードーム型のオーナメント
  - ペーパークラフト - 精巧に重ねられた紙のオーナメント（白1色のみ）

- **1日5回まで生成可能**
  - 本日の残り生成回数を表示
  - 日付が変わると自動的にリセット

- **画像のダウンロード機能**
  - 各画像を個別にダウンロード可能

- **もう一度生成する機能**
  - 生成後、再度生成フォームに戻ることが可能

- **レスポンシブデザイン対応**
  - スマートフォン、タブレット、デスクトップに対応

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド（本番用）
npm run build

# ビルド結果のプレビュー
npm run preview
```

## 画像生成APIの設定

現在、アプリはプレースホルダー画像を生成しています。実際の画像生成APIを使用するには、環境変数でAPIキーを設定してください。

### 方法1: 環境変数ファイルを使用（推奨）

1. プロジェクトルートに `.env` ファイルを作成
2. 以下の内容を追加（使用するAPIに応じて設定）：

```env
# 使用するAPIのタイプを選択
# 'huggingface', 'replicate', 'stable-diffusion', 'dalle', 'placeholder'
VITE_API_TYPE=huggingface

# Hugging Face API キー（無料枠あり・推奨）
# https://huggingface.co/settings/tokens で取得
VITE_HUGGINGFACE_API_KEY=your_api_key_here

# または Replicate API キー（無料枠あり）
# https://replicate.com/account/api-tokens で取得
VITE_REPLICATE_API_KEY=your_api_key_here

# または Stability AI API キー
# https://platform.stability.ai/account/keys で取得
VITE_STABILITY_API_KEY=your_api_key_here

# または OpenAI DALL-E API キー
# https://platform.openai.com/api-keys で取得
VITE_OPENAI_API_KEY=your_api_key_here
```

3. 開発サーバーを再起動

### 方法2: Netlifyの環境変数設定

Netlifyにデプロイする場合：

1. Netlifyダッシュボードでサイトを選択
2. 「Site settings」→「Environment variables」を開く
3. 以下の環境変数を追加：
   - `VITE_API_TYPE`: 使用するAPIタイプ（例: `huggingface`）
   - `VITE_HUGGINGFACE_API_KEY`: Hugging Face APIキー（または使用するAPIのキー）
4. サイトを再デプロイ

### 無料で使えるAPI（推奨）

#### Hugging Face Inference API（推奨）
- **無料枠**: 月30,000リクエストまで無料
- **APIキー取得**: https://huggingface.co/settings/tokens
- **設定**: `VITE_API_TYPE=huggingface` と `VITE_HUGGINGFACE_API_KEY` を設定

#### Replicate API
- **無料枠**: 初回$5のクレジット
- **APIキー取得**: https://replicate.com/account/api-tokens
- **設定**: `VITE_API_TYPE=replicate` と `VITE_REPLICATE_API_KEY` を設定

### 有料API

#### Stability AI
- **料金**: 従量課金
- **APIキー取得**: https://platform.stability.ai/account/keys
- **設定**: `VITE_API_TYPE=stable-diffusion` と `VITE_STABILITY_API_KEY` を設定

#### OpenAI DALL-E
- **料金**: 従量課金
- **APIキー取得**: https://platform.openai.com/api-keys
- **設定**: `VITE_API_TYPE=dalle` と `VITE_OPENAI_API_KEY` を設定

### 注意事項

- `.env` ファイルは `.gitignore` に含まれているため、Gitにコミットされません
- Netlifyにデプロイする場合は、環境変数をNetlifyダッシュボードで設定してください
- APIキーが設定されていない場合、自動的にプレースホルダー画像が使用されます

## 技術スタック

- React 18
- Vite
- CSS3 (レスポンシブデザイン)

## クレジット

Produce by AYUKO MATSUMOTO

