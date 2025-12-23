# 新しいNetlifyプロジェクトを作成する方法

新しいプロジェクトを作成して、Gitリポジトリと連携する方法です。
この方法なら、Functionsも正しく認識され、自動デプロイも設定できます。

## ステップ1: GitHubにリポジトリを作成

### 1. GitHubでリポジトリを作成

1. **GitHubにログイン**
   - https://github.com/ にアクセス
   - アカウントがない場合は作成（無料）

2. **新しいリポジトリを作成**
   - 右上の「+」ボタン → 「New repository」をクリック
   - Repository name: `noel-atelier` など、好きな名前を入力
   - 「Public」または「Private」を選択
   - 「Create repository」をクリック

3. **リポジトリのURLをコピー**
   - 例: `https://github.com/あなたのユーザー名/noel-atelier.git`

## ステップ2: プロジェクトをGitにプッシュ

ターミナルで以下を実行：

```bash
cd /Users/matsumotoayuuko/noel-atelier

# Gitリポジトリを初期化（まだの場合）
git init

# すべてのファイルを追加
git add .

# コミット
git commit -m "Initial commit"

# GitHubリポジトリに接続（URLをあなたのリポジトリURLに置き換える）
git remote add origin https://github.com/あなたのユーザー名/noel-atelier.git

# メインブランチに設定
git branch -M main

# GitHubにプッシュ
git push -u origin main
```

## ステップ3: Netlifyで新しいプロジェクトを作成

### 1. Netlifyでリポジトリをインポート

1. **Netlifyダッシュボードを開く**
   - https://app.netlify.com/ にアクセス

2. **「Add new site」をクリック**
   - 右上の「Add new site」ボタンをクリック

3. **「Import an existing project」を選択**

4. **GitHubを選択**
   - 「GitHub」をクリック
   - 初回の場合は、GitHubアカウントで認証

5. **リポジトリを選択**
   - 作成したリポジトリ（`noel-atelier`）を選択

### 2. ビルド設定

1. **ビルド設定を入力**
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

2. **「Deploy site」をクリック**
   - デプロイが開始されます

## ステップ4: 環境変数を設定

### 1. 環境変数の設定ページを開く

1. 新しいプロジェクトのダッシュボードを開く
2. 「Project configuration」→「Environment variables」を開く

### 2. 環境変数を追加

以下の3つの環境変数を追加：

1. **Key**: `VITE_API_TYPE`
   - **Value**: `huggingface`

2. **Key**: `VITE_HUGGINGFACE_API_KEY`
   - **Value**: Hugging Faceで取得したAPIキー

3. **Key**: `HUGGINGFACE_API_KEY`（VITE_なし）
   - **Value**: Hugging Faceで取得したAPIキー（2つ目と同じ値）

### 3. 再デプロイ

環境変数を設定した後、自動的に再デプロイされます。
または、「Deploys」タブで「Trigger deploy」→「Deploy site」をクリック

## ステップ5: 確認

1. **Functionsがデプロイされているか確認**
   - 「Functions」タブを開く
   - `generate-image`関数が表示されていれば成功

2. **サイトが正常に動作するか確認**
   - サイトにアクセスして、画像生成が動作するか確認

## メリット

- ✅ Functionsが正しく認識される
- ✅ Gitにプッシュするたびに自動デプロイ
- ✅ 環境変数も正しく設定される
- ✅ 長期的に管理しやすい

## まとめ

新しいプロジェクトを作成して、Gitリポジトリと連携する方法が最も確実です。
この方法なら、Functionsも正しく動作し、今後の更新も簡単になります。

