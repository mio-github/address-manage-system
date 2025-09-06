# Minecraft座標管理システム システム設計書

## 1. システム概要

### 1.1 システム名
**MC Coordinate Keeper** (マイクラ座標キーパー)

### 1.2 システムの目的
Minecraftのスクリーンショットから座標情報（X, Y, Z）を自動的に抽出し、分類・管理・共有を可能にする統合座標管理システム

### 1.3 主要機能
1. **スクリーンショット解析**: 
   - OCRによる座標自動抽出
   - AI画像認識による場所の自動判定（建造物、地形、バイオーム等）
   - 手動での座標・場所情報の修正機能
2. **座標管理**: 分類、タグ付け、検索、フィルタリング
3. **マップビュー**: 2D/3Dマップ上での座標可視化
4. **データ管理**: SQLite3によるローカルデータベース管理
5. **インポート/エクスポート**: データバックアップと共有

## 2. システムアーキテクチャ

### 2.1 全体構成
```
┌─────────────────────────────────────────────────┐
│           Desktop Application (Electron)         │
│  ┌─────────────────────────────────────────┐    │
│  │  React + TypeScript + Tailwind CSS       │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
                         ↓ ↑
                    IPC (Inter-Process Communication)
                         ↓ ↑
┌─────────────────────────────────────────────────┐
│               Main Process (Node.js)             │
└─────────────────────────────────────────────────┘
                         ↓ ↑
      ┌──────────────┬───────────────┬────────────┐
      ↓              ↓               ↓            ↓
┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────┐
│ Database │ │  Coordinate  │ │ Image    │ │ File     │
│ (SQLite) │ │   Manager    │ │ Analyzer │ │ Manager  │
└──────────┘ └──────────────┘ └──────────┘ └──────────┘
                         ↓
                ┌────────────────┐
                │  Python OCR    │
                │  & AI Service  │
                └────────────────┘
```

### 2.2 技術スタック

#### デスクトップアプリケーション
- **Framework**: Electron 28
- **UI Library**: React 18
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + CSS Modules
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **Map Rendering**: Leaflet (2Dビュー)
- **Image Processing**: Canvas API + Sharp

#### メインプロセス (Electron)
- **Runtime**: Node.js 20 LTS (Electron内蔵)
- **Language**: TypeScript 5
- **Database**: SQLite3 + better-sqlite3
- **ORM**: Prisma (SQLite adapter)
- **Validation**: Zod
- **File Management**: Node.js fs module
- **IPC**: Electron IPC + electron-store

#### 画像解析サービス
- **Language**: Python 3.11
- **OCR Engine**: Tesseract OCR + EasyOCR
- **画像認識**: 
  - YOLO v8 (建造物・エンティティ検出)
  - ResNet (バイオーム分類)
  - カスタムCNNモデル (Minecraft特有オブジェクト)
- **Framework**: FastAPI (ローカルサーバー)
- **Image Processing**: OpenCV + Pillow
- **Machine Learning**: PyTorch + Transformers

#### データストレージ
- **Database**: SQLite3 (ローカルファイル)
- **Image Storage**: ローカルファイルシステム
- **Backup**: 自動バックアップ (JSON/SQLダンプ)
- **設定管理**: electron-store (JSON)

#### 開発・配布
- **Package Manager**: npm / yarn
- **Builder**: electron-builder
- **Auto Update**: electron-updater
- **Testing**: Jest, Spectron, pytest
- **Logging**: electron-log
- **Distribution**: GitHub Releases / Microsoft Store / Mac App Store

## 3. データモデル

### 3.1 主要エンティティ

```typescript
// ユーザー
interface User {
  id: string;
  username: string;
  email: string;
  minecraftUsername?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ワールド
interface World {
  id: string;
  name: string;
  seed?: string;
  version: string;
  userId: string;
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 座標
interface Coordinate {
  id: string;
  worldId: string;
  x: number;
  y: number;
  z: number;
  dimension: 'overworld' | 'nether' | 'end';
  name: string;  // 手動編集可能
  description?: string;
  category: CoordinateCategory;  // 画像解析 or 手動設定
  detectedLocation?: DetectedLocation;  // AIで検出した場所情報
  isManuallyEdited: boolean;  // 手動編集フラグ
  tags: string[];
  screenshotPath?: string;  // ローカルファイルパス
  thumbnailPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 座標カテゴリ
enum CoordinateCategory {
  BASE = 'base',           // 拠点
  FARM = 'farm',           // 農場・トラップ
  VILLAGE = 'village',     // 村
  STRONGHOLD = 'stronghold', // 要塞
  MONUMENT = 'monument',   // 海底神殿等
  PORTAL = 'portal',       // ポータル
  RESOURCE = 'resource',   // 資源
  LANDMARK = 'landmark',   // ランドマーク
  OTHER = 'other'         // その他
}

// スクリーンショット
interface Screenshot {
  id: string;
  url: string;
  thumbnailUrl: string;
  coordinateId?: string;
  processedAt?: Date;
  ocrResult?: OcrResult;
  uploadedBy: string;
  createdAt: Date;
}

// OCR結果
interface OcrResult {
  id: string;
  screenshotId: string;
  detectedCoordinates?: {
    x: number;
    y: number;
    z: number;
    confidence: number;
    isManuallyEdited?: boolean;  // 手動修正済みフラグ
  };
  rawText: string;
  processedAt: Date;
}

// AI検出場所情報
interface DetectedLocation {
  id: string;
  type: LocationType;  // 建造物、自然地形、バイオーム等
  name: string;  // 検出された場所名
  confidence: number;  // 検出信頼度
  details: {
    structures?: string[];  // 検出された構造物
    biome?: string;  // バイオーム
    entities?: string[];  // 検出されたMob等
    blocks?: string[];  // 特徴的なブロック
  };
  isManuallyEdited?: boolean;  // 手動修正フラグ
}

enum LocationType {
  PLAYER_BASE = 'player_base',
  VILLAGE = 'village',
  STRONGHOLD = 'stronghold',
  DUNGEON = 'dungeon',
  MINESHAFT = 'mineshaft',
  MONUMENT = 'monument',
  MANSION = 'mansion',
  PORTAL = 'portal',
  FARM = 'farm',
  NATURAL = 'natural',
  CUSTOM = 'custom'
}
```

### 3.2 SQLite3データベーススキーマ
```sql
-- settings table (アプリ設定)
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- worlds table
CREATE TABLE worlds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  seed TEXT,
  version TEXT NOT NULL,
  folder_path TEXT,  -- ワールドフォルダパス
  is_active INTEGER DEFAULT 0,  -- 現在選択中のワールド
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- coordinates table
CREATE TABLE coordinates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  world_id INTEGER REFERENCES worlds(id) ON DELETE CASCADE,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  z INTEGER NOT NULL,
  dimension TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  location_type TEXT,  -- AI検出した場所タイプ
  location_details TEXT,  -- JSON形式で詳細情報保存
  is_manually_edited INTEGER DEFAULT 0,  -- 手動編集フラグ
  tags TEXT,  -- JSON配列として保存
  screenshot_path TEXT,
  thumbnail_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_world_id ON coordinates(world_id);
CREATE INDEX idx_dimension ON coordinates(dimension);
CREATE INDEX idx_category ON coordinates(category);
CREATE INDEX idx_coordinates ON coordinates(x, z);
CREATE INDEX idx_location_type ON coordinates(location_type);

-- screenshots table
CREATE TABLE screenshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coordinate_id INTEGER REFERENCES coordinates(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  ocr_result TEXT,  -- JSON形式でOCR結果保存
  ai_analysis TEXT,  -- JSON形式でAI解析結果保存
  is_processed INTEGER DEFAULT 0,
  processed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- edit_history table (編集履歴)
CREATE TABLE edit_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coordinate_id INTEGER REFERENCES coordinates(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,  -- 編集したフィールド名
  old_value TEXT,
  new_value TEXT,
  edit_type TEXT,  -- 'manual' or 'auto'
  edited_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 4. IPC通信設計 (Electron)

### 4.1 メインプロセス ↔ レンダラープロセス通信

#### データベース操作
```typescript
// Renderer → Main
ipcRenderer.invoke('db:coordinates:create', coordinateData)
ipcRenderer.invoke('db:coordinates:update', { id, data })
ipcRenderer.invoke('db:coordinates:delete', id)
ipcRenderer.invoke('db:coordinates:find', { worldId, filters })

// Main → Renderer
ipcMain.handle('db:coordinates:create', async (event, data) => { /* SQLite操作 */ })
```

#### 画像処理
```typescript
// スクリーンショット解析
ipcRenderer.invoke('image:analyze', {
  imagePath: string,
  options: {
    detectCoordinates: boolean,
    detectLocation: boolean,
    enhanceImage: boolean
  }
})

// 手動修正
ipcRenderer.invoke('image:update-analysis', {
  screenshotId: number,
  coordinates?: { x, y, z },
  location?: { type, name, details }
})
```

#### ファイル操作
```typescript
// エクスポート
ipcRenderer.invoke('file:export', {
  format: 'json' | 'csv' | 'sql',
  worldId?: number,
  filters?: FilterOptions
})

// インポート
ipcRenderer.invoke('file:import', {
  filePath: string,
  format: 'json' | 'csv' | 'sql',
  options: ImportOptions
})

// バックアップ
ipcRenderer.invoke('file:backup', {
  backupPath?: string,  // 指定しない場合はデフォルトパス
  includeImages: boolean
})
```

### 4.2 Python画像解析サービス (ローカルHTTP)

```python
# FastAPIエンドポイント
POST /analyze/screenshot
{
  "image_path": "string",
  "options": {
    "detect_coordinates": true,
    "detect_location": true,
    "detect_structures": true,
    "detect_biome": true
  }
}

# レスポンス
{
  "coordinates": {
    "x": -123,
    "y": 64,
    "z": 456,
    "confidence": 0.95
  },
  "location": {
    "type": "village",
    "name": "Plains Village",
    "confidence": 0.87,
    "details": {
      "structures": ["house", "well", "farm"],
      "biome": "plains",
      "entities": ["villager", "iron_golem"],
      "blocks": ["oak_planks", "cobblestone"]
    }
  }
}
```

### 4.3 データベースアクセスレイヤー

```typescript
// CoordinateRepository
class CoordinateRepository {
  // 基本操作
  create(data: CoordinateInput): Promise<Coordinate>
  update(id: number, data: Partial<Coordinate>): Promise<Coordinate>
  delete(id: number): Promise<boolean>
  findById(id: number): Promise<Coordinate | null>
  findAll(filters: FilterOptions): Promise<Coordinate[]>
  
  // 手動編集用
  updateManually(id: number, data: ManualEdit): Promise<Coordinate>
  saveEditHistory(coordinateId: number, changes: EditChange[]): Promise<void>
  getEditHistory(coordinateId: number): Promise<EditHistory[]>
}

// ImageAnalysisService
class ImageAnalysisService {
  analyzeScreenshot(imagePath: string): Promise<AnalysisResult>
  updateAnalysis(id: number, corrections: ManualCorrections): Promise<void>
  reprocessImage(screenshotId: number): Promise<AnalysisResult>
}
```

## 5. 画面設計

### 5.1 画面一覧

1. **ログイン/登録画面**
   - Minecraftランチャー風のデザイン
   - ソーシャルログイン対応

2. **ダッシュボード**
   - 最近追加された座標
   - クイックアクセス（お気に入り）
   - ワールド切り替え

3. **座標一覧画面**
   - グリッド/リスト表示切り替え
   - フィルタリング（ディメンション、カテゴリ、タグ）
   - ソート機能
   - 一括操作

4. **座標詳細/編集画面**
   - 座標情報表示・編集
   - スクリーンショット表示
   - ネザー座標自動計算
   - メモ・タグ管理

5. **マップビュー**
   - 2Dトップダウンビュー
   - 座標マーカー表示
   - 距離計測ツール
   - チャンク境界表示

6. **スクリーンショット処理画面**
   - ドラッグ&ドロップアップロード
   - OCR・画像解析処理状況表示
   - 手動修正モード（座標・場所情報）
   - 解析結果の確認・承認
   - バッチ処理

7. **設定画面**
   - プロフィール設定
   - ワールド管理
   - データエクスポート/インポート
   - テーマ設定

### 5.2 UIコンポーネント（Minecraft風）

```typescript
// ブロック風ボタン
const BlockButton = styled.button`
  background: linear-gradient(to bottom, #8B8B8B 0%, #717171 100%);
  border: 2px solid #373737;
  box-shadow: 
    inset -2px -2px 0 rgba(0,0,0,0.5),
    inset 2px 2px 0 rgba(255,255,255,0.3);
  font-family: 'Minecraft', monospace;
  padding: 8px 16px;
  
  &:hover {
    background: linear-gradient(to bottom, #9B9B9B 0%, #818181 100%);
  }
`;

// インベントリ風グリッド
const InventoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 2px;
  background: #8B8B8B;
  border: 2px solid #373737;
  padding: 8px;
`;

// 座標表示コンポーネント
const CoordinateDisplay = ({ x, y, z, dimension }) => (
  <div className="coordinate-display">
    <span className="dimension-icon">{getDimensionIcon(dimension)}</span>
    <span className="coords">
      X: {x} / Y: {y} / Z: {z}
    </span>
  </div>
);
```

## 6. セキュリティ設計

### 6.1 ローカルアプリケーションセキュリティ
- データベースファイルの暗号化（オプション）
- アプリケーションサンドボックス
- コンテンツセキュリティポリシー (CSP)

### 6.2 データ保護
- SQLiteデータベースの定期バックアップ
- SQLインジェクション対策（Prisma ORM）
- XSS対策（React自動エスケープ）
- ローカルファイルアクセス制限

### 6.3 画像処理セキュリティ
- ファイルタイプ検証（PNG, JPG, BMPのみ許可）
- ファイルサイズ制限（10MB）
- 画像メタデータ削除（プライバシー保護）
- Pythonサービスのサンドボックス化

## 7. パフォーマンス最適化

### 7.1 フロントエンド
- Code Splitting（動的インポート）
- 画像最適化（WebP, AVIF）
- Virtual Scrolling（大量データ）
- Service Worker（オフライン対応）
- CDN配信

### 7.2 バックエンド
- データベースインデックス最適化
- Redisキャッシング
- 非同期処理（Queue）
- Connection Pooling
- Rate Limiting

### 7.3 画像解析処理
- バッチ処理対応
- 処理結果キャッシング（SQLite）
- 並列処理（マルチスレッド）
- GPUアクセラレーション対応（CUDA/Metal）
- 手動修正結果の学習フィードバック

## 8. 監視・ログ

### 8.1 アプリケーション監視
- ヘルスチェックエンドポイント
- メトリクス収集（Prometheus）
- ダッシュボード（Grafana）
- アラート設定

### 8.2 ログ管理
- 構造化ログ（JSON形式）
- ログレベル管理
- ログローテーション
- 集約・検索（Elasticsearch）

## 9. デプロイメント

### 9.1 ビルド・配布
- **開発環境**: Electron開発サーバー
- **ビルド**: electron-builder
- **配布プラットフォーム**:
  - Windows: .exeインストーラー
  - macOS: .dmg / Mac App Store
  - Linux: AppImage / .deb / .rpm

### 9.2 自動更新
- electron-updaterを使用
- GitHub Releasesを更新サーバーとして使用
- バックグラウンドでの自動アップデートチェック

## 10. 今後の拡張計画

### Phase 1（MVP）
- 基本的な座標管理機能
- スクリーンショットOCR（座標読み取り）
- AI画像認識（場所判定）
- 手動修正機能
- SQLite3データベース
- シンプルな2Dマップ

### Phase 2
- 学習モデルの最適化（手動修正データを活用）
- エクスポート/インポート機能強化
- クラウドバックアップ対応
- モバイルアプリ対応

### Phase 3
- 3Dマップビュー
- 構造物自動認識
- コマンドブロック生成
- Modとの連携