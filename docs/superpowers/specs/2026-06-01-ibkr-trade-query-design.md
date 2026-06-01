# IBKR 交易查询页 — 设计文档

**日期**: 2026-06-01
**状态**: 待实现

---

## 目标

在网站中新增一个 IBKR 交易记录查询页面，用户可以通过关键字即时搜索 `ibkr_trad` 表中的交易记录。

## 表结构 (`ibkr_trad`)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | int | 主键 |
| `asset` | text | 资产类型（"股票" / "期权"） |
| `symbol` | text | 代码 |
| `trade_time` | timestamptz | 交易时间 |
| `qty` | number | 数量（正=买入，负=卖出） |
| `price` | number | 价格 |
| `proceeds` | number | 金额（负=支出，正=收入） |
| `fee` | number | 费用 |
| `add_info` | text | 附加信息 |

当前共 684 条记录。

## 搜索方式

- **模式**: 输入即搜（同 Inventory 组件）
- **搜索字段**: `symbol` + `add_info`，OR 关系，ILIKE 模糊匹配
- **排序**: `trade_time` 降序（最新在前）
- **防抖**: 250ms
- **分页**: 前 20 条，显示总数提示

## UI 设计

完全遵循 `Inventory.jsx` 的布局模式：

```
┌─────────────────────────────────────┐
│  🔍 [输入 symbol 或代码，自动搜索...] │
│                                     │
│  找到 N 条结果（显示前 20 条...）      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ NAIL  [股票]                 │    │
│  │ qty: 7  price: $49.45       │    │
│  │ 金额: -$346.15              │    │
│  │ 2026-01-02 01:38            │    │
│  └─────────────────────────────┘    │
│  ...更多卡片...                      │
└─────────────────────────────────────┘
```

每个卡片显示：symbol、asset 类型标签、qty、price、proceeds、trade_time。

## 文件变更

1. **新建** `src/components/IbrkQuery.jsx` — 查询组件（参照 Inventory.jsx）
2. **修改** `src/App.jsx` — 添加第三个 Tab `💰 交易查询`，`tabs` 数组新增一项

## 技术要点

- React hooks: `useState`, `useRef`, `useCallback`, `useEffect`
- Supabase `.ilike()` 模糊查询，`.or()` 多字段
- Tailwind CSS 样式，完全复用现有设计 token
- 自动聚焦：切换到交易查询 tab 时聚焦搜索框
