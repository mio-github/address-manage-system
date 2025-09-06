# Minecraft座標管理システム コーディング規約

## 1. 全般的な規約

### 1.1 基本原則
- **DRY (Don't Repeat Yourself)**: コードの重複を避ける
- **KISS (Keep It Simple, Stupid)**: シンプルで理解しやすいコードを書く
- **YAGNI (You Aren't Gonna Need It)**: 現時点で必要ない機能は実装しない
- **早期リターン**: ネストを減らし、可読性を向上させる

### 1.2 言語とフレームワーク
- **フロントエンド**: TypeScript + React + Next.js
- **バックエンド**: TypeScript + Node.js + Express/Fastify
- **データベース**: PostgreSQL + Prisma ORM
- **画像処理**: Python (OCR処理用マイクロサービス)

## 2. TypeScript/JavaScript規約

### 2.1 命名規則
```typescript
// インターフェース: PascalCase、Iプレフィックスは使用しない
interface CoordinateData {
  x: number;
  y: number;
  z: number;
}

// 型エイリアス: PascalCase
type DimensionType = 'overworld' | 'nether' | 'end';

// クラス: PascalCase
class CoordinateManager {
  // プライベートプロパティ: アンダースコアプレフィックス
  private _coordinates: CoordinateData[];
  
  // パブリックメソッド: camelCase
  public addCoordinate(coord: CoordinateData): void {}
  
  // プライベートメソッド: camelCase
  private validateCoordinate(coord: CoordinateData): boolean {}
}

// 関数: camelCase
function parseScreenshot(image: Buffer): CoordinateData {}

// 定数: UPPER_SNAKE_CASE
const MAX_COORDINATE_VALUE = 30000000;
const DEFAULT_DIMENSION: DimensionType = 'overworld';

// 変数: camelCase
let currentWorld: string;
const playerPosition: CoordinateData;

// Enum: PascalCase (値はUPPER_SNAKE_CASE)
enum BiomeType {
  PLAINS = 'plains',
  DESERT = 'desert',
  FOREST = 'forest'
}
```

### 2.2 ファイル構成
```
src/
├── components/          # Reactコンポーネント
│   ├── common/         # 共通コンポーネント
│   ├── coordinates/    # 座標関連コンポーネント
│   └── screenshots/    # スクリーンショット関連
├── hooks/              # カスタムフック
├── services/           # ビジネスロジック
├── utils/              # ユーティリティ関数
├── types/              # 型定義
├── constants/          # 定数定義
└── styles/            # スタイル関連
```

### 2.3 インポート順序
```typescript
// 1. 外部ライブラリ
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';

// 2. 内部モジュール（絶対パス）
import { CoordinateService } from '@/services/coordinate';
import { useCoordinates } from '@/hooks/useCoordinates';

// 3. 相対パス
import { CoordinateCard } from './CoordinateCard';

// 4. スタイル
import styles from './Coordinate.module.css';

// 5. 型定義
import type { CoordinateData } from '@/types/coordinate';
```

### 2.4 型安全性
```typescript
// 必ず型を明示的に指定
const coordinates: CoordinateData[] = [];

// anyの使用禁止、unknownを使用
function processData(data: unknown): void {
  if (isCoordinateData(data)) {
    // 型ガードで安全に処理
  }
}

// null/undefinedの明示的な処理
function getCoordinate(id: string): CoordinateData | null {
  return database.findById(id) ?? null;
}

// Optional Chainingの活用
const dimension = world?.dimension?.type ?? 'overworld';
```

## 3. React規約

### 3.1 コンポーネント構成
```typescript
// 関数コンポーネントを使用
const CoordinateList: React.FC<Props> = ({ coordinates, onSelect }) => {
  // 1. hooks
  const [filter, setFilter] = useState<string>('');
  const filtered = useMemo(() => filterCoordinates(coordinates, filter), [coordinates, filter]);
  
  // 2. イベントハンドラ
  const handleFilterChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  }, []);
  
  // 3. レンダリング
  return (
    <div className={styles.container}>
      {/* JSX */}
    </div>
  );
};
```

### 3.2 Props定義
```typescript
interface CoordinateCardProps {
  coordinate: CoordinateData;
  dimension: DimensionType;
  onEdit?: (coord: CoordinateData) => void;
  onDelete?: (id: string) => void;
  className?: string;
}
```

### 3.3 カスタムフック
```typescript
// use接頭辞を必ず使用
function useCoordinateStorage() {
  const [coordinates, setCoordinates] = useState<CoordinateData[]>([]);
  
  // フック内でのみ他のフックを呼び出す
  useEffect(() => {
    loadCoordinates();
  }, []);
  
  return { coordinates, setCoordinates };
}
```

## 4. エラーハンドリング

### 4.1 エラークラス
```typescript
class CoordinateError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CoordinateError';
  }
}
```

### 4.2 Try-Catch
```typescript
async function parseCoordinateFromImage(image: Buffer): Promise<CoordinateData> {
  try {
    const result = await ocrService.process(image);
    return extractCoordinate(result);
  } catch (error) {
    // エラーログ
    logger.error('Failed to parse coordinate', { error });
    
    // 適切なエラーを再スロー
    throw new CoordinateError(
      'スクリーンショットから座標を読み取れませんでした',
      'PARSE_ERROR',
      error
    );
  }
}
```

## 5. テスト規約

### 5.1 テストファイル配置
```
src/
├── components/
│   ├── CoordinateCard.tsx
│   └── CoordinateCard.test.tsx  # 同じディレクトリに配置
```

### 5.2 テスト構造
```typescript
describe('CoordinateCard', () => {
  describe('レンダリング', () => {
    it('座標情報を正しく表示する', () => {
      // Arrange
      const coordinate = { x: 100, y: 64, z: -200 };
      
      // Act
      const { getByText } = render(<CoordinateCard coordinate={coordinate} />);
      
      // Assert
      expect(getByText('X: 100')).toBeInTheDocument();
    });
  });
  
  describe('インタラクション', () => {
    it('編集ボタンクリックでonEditが呼ばれる', () => {
      // テスト実装
    });
  });
});
```

## 6. パフォーマンス最適化

### 6.1 メモ化
```typescript
// 重い計算はuseMemoで最適化
const sortedCoordinates = useMemo(
  () => coordinates.sort((a, b) => a.x - b.x),
  [coordinates]
);

// コールバックはuseCallbackで最適化
const handleClick = useCallback((id: string) => {
  selectCoordinate(id);
}, [selectCoordinate]);
```

### 6.2 遅延ロード
```typescript
// 動的インポート
const ScreenshotProcessor = lazy(() => import('./ScreenshotProcessor'));

// Suspenseでラップ
<Suspense fallback={<LoadingSpinner />}>
  <ScreenshotProcessor />
</Suspense>
```

## 7. セキュリティ

### 7.1 入力検証
```typescript
function validateCoordinate(coord: unknown): CoordinateData {
  // Zodやyupを使用した厳密な検証
  const schema = z.object({
    x: z.number().min(-30000000).max(30000000),
    y: z.number().min(-64).max(320),
    z: z.number().min(-30000000).max(30000000)
  });
  
  return schema.parse(coord);
}
```

### 7.2 XSS対策
```typescript
// React使用時は自動エスケープされるが、dangerouslySetInnerHTMLは避ける
// どうしても必要な場合はDOMPurifyでサニタイズ
const sanitizedHTML = DOMPurify.sanitize(userInput);
```

## 8. Git規約

### 8.1 コミットメッセージ
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- feat: 新機能
- fix: バグ修正
- docs: ドキュメント変更
- style: コードスタイル変更
- refactor: リファクタリング
- test: テスト追加・修正
- chore: ビルドプロセスやツールの変更

例:
```
feat(coordinates): スクリーンショットからの座標自動抽出機能を追加

- OCRライブラリを統合
- 座標パターンの認識アルゴリズムを実装
- エラーハンドリングとリトライ機能を追加

Closes #123
```

### 8.2 ブランチ戦略
- main: 本番環境
- develop: 開発環境
- feature/*: 機能開発
- bugfix/*: バグ修正
- hotfix/*: 緊急修正