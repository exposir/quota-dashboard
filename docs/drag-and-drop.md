# 拖拽排序实现方案

## 概述

基于 HTML5 原生拖放 API 实现，无需第三方依赖库。

## 技术选型

| 方案              | 优点         | 缺点             | 选择 |
| ----------------- | ------------ | ---------------- | ---- |
| HTML5 Drag & Drop | 零依赖、轻量 | 样式控制稍复杂   | ✅   |
| react-dnd         | 功能强大     | 包体积大 (~30KB) |      |
| dnd-kit           | 现代化、灵活 | 学习曲线陡       |      |

## 核心 API

### 事件流程

```
dragStart → dragOver (多次) → dragEnd
   │            │               │
   ▼            ▼               ▼
 记录拖拽项   实时交换位置      清理状态
```

### 关键事件

| 事件          | 触发时机     | 作用                 |
| ------------- | ------------ | -------------------- |
| `onDragStart` | 开始拖拽     | 记录被拖拽元素的标识 |
| `onDragOver`  | 拖拽经过目标 | 计算新位置并更新数组 |
| `onDragEnd`   | 拖拽结束     | 重置拖拽状态         |

## 实现细节

### 1. Provider 卡片拖拽 (App.tsx)

```tsx
// 状态管理
const [draggedProvider, setDraggedProvider] = useState<string | null>(null);

// 事件处理
const handleProviderDragStart = (provider: string) => {
  setDraggedProvider(provider);
};

const handleProviderDragOver = (e: React.DragEvent, provider: string) => {
  e.preventDefault(); // 必须！否则 drop 事件不触发
  if (!draggedProvider || draggedProvider === provider) return;

  // 重新排序
  const newOrder = [...sortedProviders];
  const draggedIdx = newOrder.indexOf(draggedProvider);
  const targetIdx = newOrder.indexOf(provider);

  newOrder.splice(draggedIdx, 1);
  newOrder.splice(targetIdx, 0, draggedProvider);

  // 保存到 localStorage
  saveSortOrder({ ...sortOrder, providers: newOrder });
};
```

### 2. Model 拖拽 (ProviderCard.tsx)

```tsx
// 阻止事件冒泡，避免触发卡片拖拽
const handleModelDragStart = (e: React.DragEvent, modelName: string) => {
  e.stopPropagation();
  setDraggedModel(modelName);
};
```

### 3. 数据持久化

```tsx
const STORAGE_KEY = "quota-dashboard-sort-order";

// 存储结构
interface SortOrder {
  providers: string[]; // Provider 顺序
  models: Record<string, string[]>; // 每个 Provider 下的 Model 顺序
}

// 保存
localStorage.setItem(STORAGE_KEY, JSON.stringify(order));

// 读取
const saved = localStorage.getItem(STORAGE_KEY);
```

## CSS 样式

```css
/* 拖拽状态视觉反馈 */
.provider-wrapper.dragging {
  opacity: 0.6;
  transform: scale(0.98);
}

.model.dragging {
  opacity: 0.5;
  background: rgba(255, 255, 255, 0.08);
}

/* 拖拽手柄 */
.drag-hint,
.model-drag-handle {
  cursor: grab;
  color: var(--text-muted);
}
```

## 注意事项

1. **必须调用 `e.preventDefault()`** - 在 `onDragOver` 中必须阻止默认行为
2. **事件冒泡** - Model 拖拽需要 `e.stopPropagation()` 避免触发父级卡片拖拽
3. **draggable 属性** - 必须设置 `draggable={true}` 或 `draggable`

## 相关文件

- `src/App.tsx` - Provider 拖拽逻辑
- `src/components/ProviderCard.tsx` - Model 拖拽逻辑
- `src/index.css` - 拖拽样式
