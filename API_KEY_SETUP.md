# APIキー設定ガイド

実際の画像を生成するために、Hugging Face APIキーを取得して設定する手順です。

## ステップ1: Hugging Faceアカウントを作成

1. **Hugging Faceのウェブサイトにアクセス**
   - https://huggingface.co/join を開く

2. **アカウントを作成**
   - メールアドレスまたはGitHubアカウントで登録
   - 無料アカウントで十分です

## ステップ2: APIキー（トークン）を取得

1. **設定ページにアクセス**
   - https://huggingface.co/settings/tokens を開く
   - または、右上のプロフィールアイコン → 「Settings」 → 左メニューの「Access Tokens」

2. **新しいトークンを作成**
   - 「New token」ボタンをクリック
   - **Token name**: `noel-atelier` など、好きな名前を入力
   - **Type**: 「Read」を選択（読み取り専用で十分です）
   - 「Generate token」ボタンをクリック

3. **トークンをコピー**
   - 表示されたトークン（`hf_` で始まる文字列）をコピー
   - ⚠️ **重要**: このトークンは一度しか表示されません。必ずコピーして保存してください

## ステップ3: Netlifyで環境変数を設定

1. **Netlifyダッシュボードにログイン**
   - https://app.netlify.com/ にアクセス
   - あなたのサイトを選択

2. **環境変数の設定ページを開く**

   **新しいNetlify UIの場合（推奨）:**
   - 左サイドバーで「**Project configuration**」をクリック
   - 表示されたページで「**Environment variables**」または「**Variables**」タブを探す
   - または、ページ内で「Environment」セクションを探す

   **従来のNetlify UIの場合:**
   - 左サイドバーで「Site settings」をクリック
   - 「Environment variables」を選択
   - または、「Build & deploy」→「Environment」を選択

   **直接URLでアクセス（確実な方法）:**
   - プロジェクト名が `tubular-rolypoly-9d3122` の場合
   - `https://app.netlify.com/projects/tubular-rolypoly-9d3122/configuration/env` に直接アクセス
   - または、`https://app.netlify.com/sites/tubular-rolypoly-9d3122/configuration/env`

3. **環境変数を追加**
   - 「Add a variable」ボタンをクリック
   - 以下の2つの環境変数を追加：

   **1つ目:**
   - **Key**: `VITE_API_TYPE`
   - **Value**: `huggingface`
   - 「Save」をクリック

   **2つ目:**
   - **Key**: `VITE_HUGGINGFACE_API_KEY`
   - **Value**: ステップ2でコピーしたAPIキー（`hf_` で始まる文字列）
   - 「Save」をクリック

   **3つ目（重要）:**
   - **Key**: `HUGGINGFACE_API_KEY`（VITE_なし）
   - **Value**: ステップ2でコピーしたAPIキー（`hf_` で始まる文字列、2つ目と同じ値）
   - 「Save」をクリック
   - ⚠️ **重要**: Netlify Functionsで使用するため、`VITE_`なしの環境変数も必要です

4. **サイトを再デプロイ**
   - 「Deploys」タブを開く
   - 「Trigger deploy」→「Deploy site」をクリック
   - または、`dist`フォルダを再度ドラッグ&ドロップ

## 確認方法

1. 再デプロイが完了したら、サイトにアクセス
2. モチーフを入力して「生成する」をクリック
3. 実際の画像が生成されれば成功です！

## トラブルシューティング

### エラーが表示される場合

- **「API key not set」**: 環境変数が正しく設定されていない可能性があります
  - Netlifyの環境変数設定を確認
  - サイトを再デプロイ

- **「Rate limited」**: レート制限に達しています
  - 少し時間をおいてから再試行
  - または、Hugging Faceの有料プランを検討

- **「Model is loading」**: モデルがロード中です
  - 10〜30秒待ってから再試行
  - 初回リクエスト時によく発生します

### 環境変数が反映されない場合

- Netlifyで環境変数を設定した後、**必ず再デプロイ**が必要です
- ブラウザのキャッシュをクリアして再読み込み

## 無料枠について

Hugging Faceの無料アカウントでは：
- 月30,000リクエストまで無料
- 個人利用には十分な量です

## その他のAPIオプション

Hugging Face以外にも、以下のAPIが使用可能です：

- **Replicate API**: 初回$5のクレジット付き
- **Stability AI**: 従量課金
- **OpenAI DALL-E**: 従量課金

詳細は `README.md` を参照してください。

