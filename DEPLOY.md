# NOËL ATELIER デプロイガイド

このアプリをネット上に公開する方法を説明します。

## 方法1: Netlify（最も簡単・推奨）

### ステップ1: アプリをビルドする

ターミナルで以下のコマンドを実行：

```bash
cd /Users/matsumotoayuuko/noel-atelier
npm install
npm run build
```

これで `dist` フォルダが作成されます。

### ステップ2: Netlifyにデプロイ

1. **Netlifyのアカウント作成**
   - https://www.netlify.com/ にアクセス
   - 「Sign up」をクリック
   - メールアドレスまたはGitHubアカウントで登録（無料）

2. **ドラッグ&ドロップでデプロイ**
   - Netlifyのダッシュボードにログイン
   - 「Sites」ページで「Add new site」→「Deploy manually」を選択
   - `dist` フォルダをドラッグ&ドロップ
   - 数秒でデプロイ完了！
   - 自動的にURLが生成されます（例: `https://random-name-123.netlify.app`）

3. **カスタムドメイン（オプション）**
   - サイト名をクリック
   - 「Site settings」→「Change site name」で好きな名前に変更可能
   - 例: `noel-atelier.netlify.app`

### メリット
- ✅ GitHub不要で簡単
- ✅ 無料
- ✅ 自動的にHTTPS対応
- ✅ 数分で完了

---

## 方法2: Vercel（GitHub連携推奨）

### ステップ1: GitHubにプッシュ（初回のみ）

```bash
cd /Users/matsumotoayuuko/noel-atelier

# Gitリポジトリを初期化（まだの場合）
git init
git add .
git commit -m "Initial commit"

# GitHubでリポジトリを作成後、以下を実行
# （GitHubのリポジトリURLに置き換えてください）
git remote add origin https://github.com/あなたのユーザー名/noel-atelier.git
git branch -M main
git push -u origin main
```

### ステップ2: Vercelにデプロイ

1. **Vercelのアカウント作成**
   - https://vercel.com/ にアクセス
   - 「Sign up」をクリック
   - GitHubアカウントでログイン（推奨）

2. **プロジェクトをインポート**
   - 「Add New...」→「Project」をクリック
   - GitHubリポジトリを選択
   - 「Import」をクリック
   - 設定はそのままで「Deploy」をクリック
   - 数分でデプロイ完了！

3. **自動デプロイ**
   - GitHubにプッシュするたびに自動的に再デプロイされます

### メリット
- ✅ GitHubと連携で自動デプロイ
- ✅ 無料
- ✅ 高速
- ✅ カスタムドメイン対応

---

## 方法3: Cloudflare Pages（無料・高速）

### ステップ1: GitHubにプッシュ（方法2のステップ1と同じ）

### ステップ2: Cloudflare Pagesにデプロイ

1. **Cloudflareアカウント作成**
   - https://pages.cloudflare.com/ にアクセス
   - 「Sign up」でアカウント作成（無料）

2. **プロジェクトを接続**
   - 「Create a project」→「Connect to Git」をクリック
   - GitHubを選択して認証
   - リポジトリを選択

3. **ビルド設定**
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - 「Save and Deploy」をクリック

### メリット
- ✅ 無料
- ✅ 非常に高速
- ✅ 自動デプロイ

---

## トラブルシューティング

### npm install でエラーが出る場合

```bash
# npmキャッシュをクリア
npm cache clean --force

# 再度インストール
npm install
```

### ビルドが失敗する場合

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
npm run build
```

### デプロイ後、ページが真っ白な場合

- `vite.config.js` に base パスを追加：

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // これを追加
})
```

その後、再度ビルドしてデプロイしてください。

---

## 推奨方法

**初心者の方には方法1（Netlifyのドラッグ&ドロップ）を強く推奨します！**

理由：
- GitHub不要
- 最も簡単
- 数分で完了
- 無料

---

## 次のステップ

デプロイ後、以下のことができます：

1. **カスタムドメインの設定**（オプション）
2. **サイト名の変更**
3. **環境変数の設定**（APIキーなどが必要な場合）

質問があれば、各サービスのドキュメントを参照してください。

