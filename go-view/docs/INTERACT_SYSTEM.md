# 交互系统使用指南

## 概述

交互系统是一个**最小侵入性**的组件间通信解决方案，无需修改现有组件即可实现组件间的数据流转和刷新。

## 核心特性

- ✅ **完全解耦**：组件之间不需要知道彼此的存在
- ✅ **最小侵入**：可选的 Hook，支持渐进式集成
- ✅ **性能优化**：通过 Pinia 响应式系统，自动批量更新
- ✅ **易于扩展**：可以轻松添加新的交互类型
- ✅ **向后兼容**：不影响现有组件的工作方式

## 文件结构

```
src/
├── utils/
│   └── interactEventBus.ts              # 事件总线
├── store/modules/
│   ├── interactDataStore/             # 交互数据存储
│   │   └── interactDataStore.ts
│   └── interactConfigStore/           # 交互配置管理
│       └── interactConfigStore.ts
├── plugins/
│   └── interactListener.ts            # 全局事件监听器
└── hooks/
    └── useInteractData.hook.ts        # 交互数据 Hook
```

## 快速开始

### 1. 事件自动监听（推荐）

系统已自动集成到 `main.ts`，无需额外配置。

### 2. 组件触发交互事件

在组件的 click 或其他事件中调用：

```typescript
import { triggerInteract } from '@/utils/interactEventBus'

const handleClick = (params) => {
  // 原有逻辑
  console.log('点击了', params)

  // 触发交互事件
  triggerInteract('chart-123', 'click', {
    data: { name: '北京', value: 1234 },
    seriesName: '销量'
  })
}
```

### 3. 组件监听交互数据

使用 Hook 监听其他组件的交互数据：

```typescript
import { useInteractData } from '@/hooks'

export default defineComponent({
  setup() {
    // 监听 chart-456 组件的数据
    const { data } = useInteractData('chart-456')

    // 监听数据变化
    watch(data, (newData) => {
      if (newData) {
        console.log('收到数据更新:', newData)
        // 更新组件
      }
    })

    return { data }
  }
})
```

## 使用示例

### 示例 1：图表点击联动

**场景**：点击地图的某个省份，其他图表显示该省份的详细数据

```typescript
// 地图组件 - 触发事件
const handleMapClick = (params) => {
  triggerInteract('china-map', 'click', {
    province: params.name,
    code: params.data.code
  })
}

// 柱状图组件 - 接收数据
const { data } = useInteractData('china-map')

watch(data, (mapData) => {
  if (mapData) {
    // 使用地图点击的省份数据刷新柱状图
    fetchDataByProvince(mapData.province)
  }
})
```

### 示例 2：使用交互数据触发

```typescript
// 包装事件处理器
const { wrappedHandlers, triggerClick } = useInteractTrigger('my-chart', {
  click: (params) => {
    console.log('原有点击逻辑')
  }
})

// 在模板中使用
// <div @click="wrappedHandlers.click">...</div>

// 或者手动触发
triggerClick({ name: '测试', value: 100 })
```

### 示例 3：批量监听多个组件

```typescript
import { useBatchInteractData } from '@/hooks'

const { dataMap } = useBatchInteractData(['chart-1', 'chart-2', 'chart-3'])

// dataMap 包含所有组件的数据
watch(dataMap, (maps) => {
  console.log('chart-1:', maps['chart-1'])
  console.log('chart-2:', maps['chart-2'])
  console.log('chart-3:', maps['chart-3'])
})
```

### 示例 4：使用交互配置

```typescript
import { useInteractConfigStore } from '@/store/modules/interactConfigStore/interactConfigStore'

const configStore = useInteractConfigStore()

// 添加交互规则
configStore.addRule('source-chart', {
  id: 'rule-1',
  name: '联动柱状图',
  eventType: 'click',
  mappings: [
    { sourceId: 'source-chart', sourceField: 'name', targetId: 'bar-chart', targetField: 'category' }
  ],
  targetIds: ['bar-chart'],
  enabled: true
})
```

## API 文档

### 工具函数

#### `triggerInteract(sourceId, eventType, data)`

触发交互事件。

**参数**：
- `sourceId` (string): 源组件 ID
- `eventType` (string): 事件类型，如 'click', 'hover', 'select'
- `data` (any): 事件数据

**示例**：
```typescript
triggerInteract('chart-1', 'click', { value: 123 })
```

### Hooks

#### `useInteractData(componentId, options?)`

监听指定组件的交互数据。

**参数**：
- `componentId` (string): 要监听的组件 ID
- `options` (object, 可选): 配置选项
  - `watchProps` (boolean): 是否监听 props 变化
  - `debounce` (number): 防抖时间（毫秒）
  - `immediate` (boolean): 是否立即执行回调

**返回值**：
- `data`: 组件数据的响应式引用
- `getCurrentData()`: 获取当前数据的方法
- `getAllData()`: 获取所有交互数据
- `hasData()`: 检查是否有数据
- `getTimestamp()`: 获取数据更新时间戳

#### `useInteractTrigger(componentId, eventHandlers?)`

包装事件处理器，自动触发交互事件。

**参数**：
- `componentId` (string): 组件 ID
- `eventHandlers` (object, 可选): 事件处理器映射

**返回值**：
- `wrappedHandlers`: 包装后的事件处理器
- `trigger(eventType, data)`: 触发事件的方法
- `triggerClick(data)`: 触发点击事件
- `triggerHover(data)`: 触发悬停事件

### Store

#### `useInteractDataStore`

交互数据存储。

**State**:
- `[componentId]`: 组件 ID 到交互数据的映射

**Getters**:
- `getData(componentId, maxAge?)`: 获取指定组件的数据
- `getAllData()`: 获取所有交互数据
- `hasData(componentId)`: 检查是否有数据

**Actions**:
- `setData(componentId, data)`: 设置交互数据
- `setBatchData(dataMap)`: 批量设置数据
- `clearData(componentId)`: 清除指定数据
- `clearAll()`: 清除所有数据

#### `useInteractConfigStore`

交互配置管理。

**Getters**:
- `getRules(componentId)`: 获取组件的所有规则
- `getEnabledRules(componentId)`: 获取启用的规则
- `getRuleCount()`: 获取规则数量

**Actions**:
- `addRule(componentId, rule)`: 添加规则
- `updateRule(componentId, ruleId, updates)`: 更新规则
- `removeRule(componentId, ruleId)`: 删除规则
- `toggleRule(componentId, ruleId, enabled)`: 启用/禁用规则

## 高级用法

### 使用 window.postMessage

支持跨域/跨窗口通信：

```typescript
// 在父窗口发送消息
iframe.contentWindow.postMessage({
  type: 'interact',
  source: 'parent-chart',
  eventType: 'click',
  data: { value: 123 }
}, '*')
```

### 手动管理事件监听

```typescript
import { interactEventBus } from '@/utils/interactEventBus'

// 订阅特定事件
const unsubscribe = interactEventBus.on('click', (event) => {
  console.log('收到点击事件:', event)
})

// 订阅所有事件
const unsubscribeAll = interactEventBus.onAny((event) => {
  console.log('收到任何交互事件:', event)
})

// 取消订阅
unsubscribe()
unsubscribeAll()
```

## 注意事项

1. **性能考虑**：避免创建过多的事件监听器，及时取消订阅
2. **数据过期**：交互数据默认 5 分钟后自动过期
3. **内存管理**：组件卸载时确保清除相关监听
4. **类型安全**：建议使用 TypeScript 以获得更好的类型提示

## 常见问题

### Q: 如何调试交互事件？

在开发模式下，系统会自动打印交互事件的日志：

```typescript
// 控制台输出
[Interact Listener] click from chart-123: { name: '北京', value: 1234 }
```

### Q: 如何禁用自动日志？

在生产环境中，日志会自动禁用。如需手动控制：

```typescript
// 在 .env 文件中设置
VITE_DEBUG_INTERACT=false
```

### Q: 如何处理事件冲突？

使用优先级机制：

```typescript
configStore.addRule('chart-1', {
  id: 'rule-1',
  name: '高优先级规则',
  eventType: 'click',
  priority: 1,  // 数字越小优先级越高
  // ...
})
```

## 更新日志

### v1.0.0 (2026-04-02)
- 初始版本
- 支持组件间事件通信
- 支持数据共享和监听
- 支持交互配置管理
