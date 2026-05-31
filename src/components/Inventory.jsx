import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DEBOUNCE_MS = 250  // 输入停止 250ms 后自动搜索

export default function Inventory() {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(null)       // null = 还没搜过
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)
  const inputRef = useRef(null)

  // 切换到库存查询时自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const doSearch = useCallback(async (kw) => {
    if (!kw) {
      setResults([])
      setTotal(null)
      return
    }

    setLoading(true)

    const pattern = `%${kw}%`
    const { data, count, error } = await supabase
      .from('taobao_stock_qty')
      .select('*', { count: 'exact' })
      .or(`产品名称.ilike.${pattern},英文代码.ilike.${pattern}`)
      .order('库存量', { ascending: false })
      .limit(20)  // 联想下拉只显示 20 条

    if (!error) {
      setResults(data || [])
      setTotal(count || 0)
    }
    setLoading(false)
  }, [])

  const handleInputChange = (e) => {
    const val = e.target.value
    setKeyword(val)

    // 清除上一次的定时器，重新计时
    clearTimeout(timerRef.current)
    if (!val.trim()) {
      setResults([])
      setTotal(null)
    } else {
      timerRef.current = setTimeout(() => doSearch(val.trim()), DEBOUNCE_MS)
    }
  }

  return (
    <div>
      {/* 搜索栏 - 无按钮，输入即搜 */}
      <div className="relative mb-6">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 z-10"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={keyword}
          onChange={handleInputChange}
          placeholder="输入产品名称或英文代码，自动搜索..."
          className="w-full pl-12 pr-10 py-3.5 bg-white rounded-2xl border border-stone-200
                     text-sm text-stone-700 placeholder-stone-300 outline-none
                     focus:border-stone-400 focus:ring-2 focus:ring-stone-100
                     transition-all duration-200"
        />
        {/* 搜索中的小菊花 */}
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-stone-200 border-t-stone-400 rounded-full animate-spin" />
        )}
      </div>

      {/* 搜索结果 */}
      {total !== null ? (
        <div>
          <p className="text-xs text-stone-400 mb-4">
            找到 <span className="font-semibold text-stone-600">{total}</span> 条结果
            {results.length < total && `（显示前 ${results.length} 条，请细化关键字）`}
          </p>

          {results.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-stone-400 text-sm">没有找到匹配的产品</p>
            </div>
          ) : (
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
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-stone-400 text-sm">输入关键字自动搜索库存</p>
          <p className="text-stone-300 text-xs mt-1">可搜产品名称或英文代码</p>
        </div>
      )}
    </div>
  )
}
