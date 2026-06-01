import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DEBOUNCE_MS = 250

export default function IbrkQuery() {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(null)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)
  const inputRef = useRef(null)

  // 切换到交易查询时自动聚焦输入框
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
      .from('ibkr_trad')
      .select('*', { count: 'exact' })
      .or(`symbol.ilike.${pattern},add_info.ilike.${pattern}`)
      .order('trade_time', { ascending: false })
      .limit(20)

    if (!error) {
      setResults(data || [])
      setTotal(count || 0)
    }
    setLoading(false)
  }, [])

  const handleInputChange = (e) => {
    const val = e.target.value
    setKeyword(val)

    clearTimeout(timerRef.current)
    if (!val.trim()) {
      setResults([])
      setTotal(null)
    } else {
      timerRef.current = setTimeout(() => doSearch(val.trim()), DEBOUNCE_MS)
    }
  }

  const formatTime = (ts) => {
    const d = new Date(ts)
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      {/* 搜索栏 */}
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
          placeholder="输入代码或附加信息，自动搜索..."
          className="w-full pl-12 pr-10 py-3.5 bg-white rounded-2xl border border-stone-200
                     text-sm text-stone-700 placeholder-stone-300 outline-none
                     focus:border-stone-400 focus:ring-2 focus:ring-stone-100
                     transition-all duration-200"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-stone-200 border-t-stone-400 rounded-full animate-spin" />
        )}
      </div>

      {/* 搜索结果 */}
      {total !== null ? (
        <div>
          <p className="text-xs text-stone-400 mb-4">
            找到 <span className="font-semibold text-stone-600">{total}</span> 条交易记录
            {results.length < total && `（显示前 ${results.length} 条，请细化关键字）`}
          </p>

          {results.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-stone-400 text-sm">没有找到匹配的交易记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((item, i) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4
                             hover:shadow-md hover:border-stone-200 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-stone-800">
                          {item.symbol}
                        </h3>
                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                          item.asset === '股票'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-purple-50 text-purple-600'
                        }`}>
                          {item.asset}
                        </span>
                      </div>
                      {item.add_info && item.add_info !== 'Stocks' && (
                        <p className="text-xs text-stone-400 mt-0.5 truncate">
                          {item.add_info}
                        </p>
                      )}
                      <p className="text-xs text-stone-400 mt-1">
                        {formatTime(item.trade_time)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div>
                        <p className="text-xs text-stone-400">数量</p>
                        <p className={`text-sm font-semibold ${
                          item.qty > 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {item.qty > 0 ? '+' : ''}{item.qty}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-400">价格</p>
                        <p className="text-sm font-semibold text-stone-700">
                          ${item.price}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-400">金额</p>
                        <p className={`text-sm font-semibold ${
                          item.proceeds > 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {item.proceeds > 0 ? '+' : ''}{item.proceeds.toFixed(2)}
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
          <div className="text-4xl mb-3">💰</div>
          <p className="text-stone-400 text-sm">输入代码或附加信息，自动搜索交易记录</p>
          <p className="text-stone-300 text-xs mt-1">可搜 symbol 或 add_info</p>
        </div>
      )}
    </div>
  )
}
