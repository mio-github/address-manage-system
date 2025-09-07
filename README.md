# MC Coordinate Keeper 🎮

Minecraftスクリーンショット座標管理システム - AI画像解析による自動座標抽出機能付き

## 🌟 機能

- **📸 スクリーンショット解析**: OCRとAI画像認識による座標・場所の自動判定
- **📍 座標管理**: 分類、タグ付け、検索、フィルタリング機能
- **🗺️ マップビュー**: 2Dマップ上での座標可視化
- **✏️ 手動修正**: 自動検出結果の手動修正機能
- **💾 ローカルDB**: SQLite3によるデータ管理
- **📤 エクスポート**: JSON/CSV形式でのデータエクスポート

## 🚀 クイックスタート

### 必要要件

- **Node.js** 18.0.0 以上
- **npm** 8.0.0 以上
- **Python** 3.8 以上 (画像解析機能用)

### インストール & 起動

1. **初期セットアップ**:
   ```bash
   # macOS/Linux
   chmod +x scripts/*.sh
   ./scripts/setup.sh
   
   # Windows
   npm install
   ```

2. **開発環境起動**:
   ```bash
   # macOS/Linux
   ./scripts/start-dev.sh
   
   # Windows
   start.bat
   
   # または npm コマンド
   npm run dev
   ```

3. **本番ビルド**:
   ```bash
   # macOS/Linux
   ./scripts/build-production.sh
   
   # npm コマンド
   npm run build
   npm start
   ```

## 📁 プロジェクト構造

```
address-manage-system/
├── src/
│   ├── main/              # Electronメインプロセス
│   │   ├── database/      # SQLite3データベース
│   │   ├── services/      # ビジネスロジック
│   │   └── ipc/          # IPC通信ハンドラー
│   ├── renderer/          # Reactレンダラープロセス
│   │   ├── components/    # UIコンポーネント
│   │   ├── stores/       # 状態管理 (Zustand)
│   │   └── styles/       # スタイル
│   └── shared/           # 共通型定義・ユーティリティ
├── python-service/       # Python画像解析サービス
├── scripts/             # 起動・ビルドスクリプト
└── assets/             # アプリケーションアセット
```

## 🔧 開発コマンド

```bash
# 開発環境
npm run dev              # 全体開発サーバー起動
npm run dev:main         # メインプロセスのみ
npm run dev:renderer     # レンダラープロセスのみ
npm run dev:python       # Pythonサービスのみ

# ビルド
npm run build           # 本番ビルド
npm run build:main      # メインプロセスビルド
npm run build:renderer  # レンダラープロセスビルド

# 配布
npm run pack           # パッケージ作成（非配布）
npm run dist           # 配布パッケージ作成

# 開発ツール
npm run lint           # ESLint実行
npm run typecheck      # TypeScript型チェック
npm test               # テスト実行
```

## 🎯 使用方法

1. **ワールド作成**: 新しいMinecraftワールドを追加
2. **スクリーンショット解析**: F3画面のスクリーンショットをアップロード
3. **自動検出**: 座標と場所が自動的に認識される
4. **手動修正**: 必要に応じて結果を修正
5. **管理**: フィルター・検索機能で座標を整理

## 🏗️ 技術スタック

### フロントエンド
- **Electron** 28 - デスクトップアプリケーション
- **React** 18 - UIライブラリ
- **TypeScript** 5 - 型安全性
- **Tailwind CSS** - スタイリング
- **Zustand** - 状態管理

### バックエンド
- **SQLite3** - ローカルデータベース
- **better-sqlite3** - SQLiteドライバー
- **Sharp** - 画像処理

### 画像解析
- **Python** 3.11
- **FastAPI** - APIフレームワーク
- **OpenCV** - 画像処理
- **Tesseract/EasyOCR** - OCR
- **PyTorch** - 機械学習

## 🔄 開発フロー

1. **機能追加**: `src/` 以下でコード作成
2. **型定義**: `src/shared/types/` に共通型を追加
3. **データベース**: `src/main/database/` でスキーマ更新
4. **UI作成**: `src/renderer/components/` にコンポーネント追加
5. **テスト**: 単体テスト・統合テストを実行

## 🐛 トラブルシューティング

### 起動できない場合

1. **依存関係の再インストール**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **ビルドディレクトリのクリア**:
   ```bash
   rm -rf dist dist-electron
   npm run build
   ```

3. **Python環境の確認**:
   ```bash
   python --version  # または python3 --version
   ```

### よくある問題

- **SQLite3エラー**: `npm rebuild better-sqlite3`
- **Sharp画像処理エラー**: `npm rebuild sharp`
- **Python解析サービス**: Pythonサービスが実装されるまで解析機能は無効

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 👥 コントリビューション

1. Fork このリポジトリ
2. Feature ブランチを作成
3. 変更をコミット
4. Pull Request を作成

---

**MC Coordinate Keeper** - Minecraftの冒険をもっと効率的に! 🎮✨