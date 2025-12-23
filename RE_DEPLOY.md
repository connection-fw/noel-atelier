# 既存プロジェクトに再デプロイする方法

新しいプロジェクトを作成せず、既存のプロジェクトに再デプロイする手順です。

## 方法1: 既存プロジェクトを選択してからデプロイ（推奨）

### ステップ1: 既存のプロジェクトを開く

1. **Netlifyダッシュボードにログイン**
   - https://app.netlify.com/ にアクセス

2. **既存のプロジェクトを探す**
   - ダッシュボードの「Projects」セクションで、以前作成したプロジェクトを探す
   - プロジェクト名を覚えていない場合：
     - 以前のプロジェクトURL（例: `tubular-rolypoly-9d3122.netlify.app`）を確認
     - または、プロジェクト一覧から探す

3. **プロジェクトをクリックして開く**

### ステップ2: 既存プロジェクトにデプロイ

1. **「Deploys」タブを開く**
   - 左サイドバーから「Deploys」をクリック

2. **ドラッグ&ドロップでデプロイ**
   - ローカルでビルドした`dist`フォルダを準備
   - `dist`フォルダをNetlifyの「Deploys」ページにドラッグ&ドロップ
   - **重要**: 新しいプロジェクトを作成するのではなく、既存のプロジェクトの「Deploys」ページにドロップしてください

3. **デプロイが完了するまで待つ**
   - 数秒〜数分かかります
   - 「Published」と表示されれば成功です

## 方法2: Netlify CLIを使用（確実な方法）

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
- **"Enter the site name"** → 既存のプロジェクト名を入力（例: `tubular-rolypoly-9d3122`）

### ステップ4: ビルドしてデプロイ

```bash
# ビルド
npm run build

# 既存プロジェクトにデプロイ
netlify deploy --prod --dir=dist
```

## 方法3: 手動で既存プロジェクトを選択

### ステップ1: ビルドを実行

ターミナルで：

```bash
cd /Users/matsumotoayuuko/noel-atelier
npm run build
```

### ステップ2: Netlifyで既存プロジェクトを選択

1. **Netlifyダッシュボードを開く**
   - https://app.netlify.com/ にアクセス

2. **「Add new site」をクリック**
   - 右上の「Add new site」ボタンをクリック

3. **「Deploy manually」を選択**
   - 「Deploy manually」をクリック

4. **既存のプロジェクトを選択**
   - ドラッグ&ドロップエリアの上または下に、既存のプロジェクトを選択するオプションがある場合があります
   - または、「Import an existing site」を探す

5. **`dist`フォルダをドラッグ&ドロップ**
   - 既存のプロジェクトが選択されていることを確認
   - `dist`フォルダをドロップ

## 環境変数の再設定

新しいプロジェクトとして認識された場合、環境変数を再設定する必要があります。

### ステップ1: 環境変数の設定ページを開く

1. プロジェクトのダッシュボードで「**Project configuration**」をクリック
2. 左サイドバーから「**Environment variables**」を選択

### ステップ2: 環境変数を追加

以下の2つの環境変数を追加：

1. **Key**: `VITE_API_TYPE`
   - **Value**: `huggingface`

2. **Key**: `VITE_HUGGINGFACE_API_KEY`
   - **Value**: Hugging Faceで取得したAPIキー（`hf_` で始まる文字列）

### ステップ3: 再デプロイ

環境変数を設定した後、必ず再デプロイしてください。

## 確認方法

1. **プロジェクトURLを確認**
   - 以前と同じURL（例: `tubular-rolypoly-9d3122.netlify.app`）でアクセスできるか確認

2. **環境変数が設定されているか確認**
   - 「Project configuration」→「Environment variables」で確認

3. **サイトが正常に動作するか確認**
   - サイトにアクセスして、画像生成が動作するか確認

## トラブルシューティング

### 既存のプロジェクトが見つからない場合

1. **プロジェクトURLを確認**
   - 以前にアクセスしたURLを確認
   - ブラウザの履歴を確認

2. **Netlifyのプロジェクト一覧を確認**
   - ダッシュボードの「Projects」セクションで全てのプロジェクトを確認

3. **新しいプロジェクトを作成する場合**
   - 新しいプロジェクトを作成しても問題ありません
   - 環境変数を再設定すれば、同じように動作します

### 環境変数が反映されない場合

- 環境変数を設定した後、**必ず再デプロイ**が必要です
- 再デプロイ後、ブラウザのキャッシュをクリア（Ctrl+Shift+R または Cmd+Shift+R）

