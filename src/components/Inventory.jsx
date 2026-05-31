import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Inventory() {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(null)       // null = 还没搜过
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = async (e) => {
    e?.preventDefault?.()
    const kw = keyword.trim()
    if (!kw) return

    setLoading(true)
    setSearched(true)

    // 模糊搜索：产品名称 + 英文代码
    const pattern = `%${kw}%`
    const { data, count, error } = await supabase
      .from('taobao_stock_qty')
      .select('*', { count: 'exact' })
      .or(`产品名称.ilike.${pattern},英文代码.ilike.${pattern}`)
      .order('库存量', { ascending: false })
      .limit(50)

    if (!error) {
      setResults(data || [])
      setTotal(count || 0)
    }
    setLoading(false)
  }

  // 输入变化时，如果之前搜过就清空（让用户重新搜）
  const handleInputChange = (e) => {
    setKeyword(e.target.value)
    if (searched) {
      setSearched(false)
      setTotal(null)
    }
  }

  return (
    <div>
      {/* 搜索栏 */}
      <form onSubmit={search} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={keyword}
              onChange={handleInputChange}
              placeholder="输入产品名称或英文代码搜索..."
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-stone-200
                         text-sm text-stone-700 placeholder-stone-300 outline-none
                         focus:border-stone-400 focus:ring-2 focus:ring-stone-100
                         transition-all duration-200"
            />
          </div>
          <button
            type="submit"
            disabled={!keyword.trim() || loading}
            className="px-6 py-3.5 bg-stone-800 text-white text-sm rounded-2xl
                       hover:bg-stone-700 active:scale-95 transition-all duration-200
                       disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </div>
      </form>

      {/* 搜索结果 */}
      {loading ? (
        <div className="flex flex-col items-center py-20 text-stone-300">
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-400 rounded-full animate-spin mb-3" />
          <span className="text-sm">搜索中...</span>
        </div>
      ) : total !== null ? (
        <div>
          {/* 结果统计 */}
          <p className="text-xs text-stone-400 mb-4">
            找到 <span className="font-semibold text-stone-600">{total}</span> 条结果
            {results.length < total && `（显示前 ${results.length} 条）`}
          </p>

          {results.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-stone-400 text-sm">没有找到匹配的产品</p>
              <p className="text-stone-300 text-xs mt-1">试试其他关键词</p>
            </div>
          ) : (
            /* 结果列表 - 卡片式 */
            <div className="space-y-2">
              {results.map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4
                             hover:shadow-md hover:border-stone-200 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-stone-800 truncate">
                        {item['产品名称']}
                      </h3>
                      <p className="text-xs text-stone-400 mt-0.5">
                        代码：{item['英文代码']}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-stone-400">库存</p>
                        <p className={`text-sm font-semibold ${
                          item['库存量'] > 10 ? 'text-emerald-600' :
                          item['库存量'] > 0 ? 'text-amber-600' :
                          'text-red-500'
                        }`}>
                          {item['库存量']}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-stone-400">批发价</p>
                        <p className="text-sm font-semibold text-stone-700">
                          ¥{item['批发价']}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 初始状态 - 还没搜 */
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-stone-400 text-sm">输入关键字搜索库存</p>
          <p className="text-stone-300 text-xs mt-1">
            可搜索产品名称或英文代码
          </p>
        </div>
      )}
    </div>
  )
}
