# 🚀 5分で公開！クイックスタートガイド

## 最も簡単な方法：Netlifyで公開

### ステップ1: ビルド（2分）

ターミナルを開いて、以下を実行：

```bash
cd /Users/matsumotoayuuko/noel-atelier
npm install
npm run build
```

✅ `dist` フォルダが作成されれば成功！

### ステップ2: Netlifyにアップロード（3分）

1. **https://www.netlify.com/** にアクセス
2. 「Sign up」をクリック（メールアドレスで登録、無料）
3. ログイン後、「Sites」→「Add new site」→「Deploy manually」
4. **`dist` フォルダをドラッグ&ドロップ**
5. 数秒待つと、URLが表示されます！

🎉 **完了！** 例: `https://amazing-app-123.netlify.app`

### サイト名を変更したい場合

- サイト名をクリック
- 「Site settings」→「Change site name」
- 例: `noel-atelier` → `https://noel-atelier.netlify.app`

---

## よくある質問

**Q: npm install でエラーが出る**
A: ターミナルで以下を実行：
```bash
npm cache clean --force
npm install
```

**Q: ページが真っ白になる**
A: もう一度ビルドして再デプロイ：
```bash
npm run build
```
その後、Netlifyで `dist` フォルダを再度アップロード

**Q: 無料で使える？**
A: はい！Netlifyは無料プランで十分使えます。

---

## 次のステップ

- カスタムドメインを設定（オプション）
- より詳しい情報は `DEPLOY.md` を参照

