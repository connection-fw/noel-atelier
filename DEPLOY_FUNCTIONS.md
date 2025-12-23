# Netlify Functionsをデプロイする方法

ドラッグ&ドロップでデプロイする場合、Netlify Functionsが認識されないことがあります。
Netlify CLIを使用してデプロイすると、Functionsが正しくデプロイされます。

## 方法1: Netlify CLIを使用（推奨）

### ステップ1: Netlify CLIをインストール

ターミナルで以下を実行：

```bash
npm install -g netlify-cli
```

### ステップ2: Netlifyにログイン

```bash
netlify login
```

ブラウザが開くので、Netlifyアカウントでログインしてください。

### ステップ3: 既存のプロジェクトに接続

```bash
cd /Users/matsumotoayuuko/noel-atelier
netlify link
```

以下の質問に答えます：
- **"How do you want to link this folder to a site?"** → **"Search by site name"** を選択
- **"Enter the site name"** → `tubular-rolypoly-9d3122` と入力

### ステップ4: ビルドしてデプロイ

```bash
# ビルド
npm run build

# デプロイ（Functionsも含めて）
netlify deploy --prod --dir=dist
```

これで、Functionsも含めてデプロイされます。

## 方法2: Gitリポジトリと連携（長期的な解決策）

### ステップ1: GitHubにリポジトリを作成

1. GitHubで新しいリポジトリを作成
2. リポジトリのURLをコピー

### ステップ2: Gitにプッシュ

ターミナルで：

```bash
cd /Users/matsumotoayuuko/noel-atelier

# Gitリポジトリを初期化（まだの場合）
git init
git add .
git commit -m "Initial commit"

# GitHubリポジトリに接続
git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git
git branch -M main
git push -u origin main
```

### ステップ3: NetlifyでGitリポジトリを接続

1. Netlifyダッシュボードで「Add new site」→「Import an existing project」
2. GitHubを選択して認証
3. リポジトリを選択
4. ビルド設定：
   - Build command: `npm run build`
   - Publish directory: `dist`
5. 「Deploy site」をクリック

これで、Gitにプッシュするたびに自動的にデプロイされ、Functionsも正しく認識されます。

## 確認方法

デプロイ後、「Functions」タブを開いて、`generate-image`関数が表示されているか確認してください。

