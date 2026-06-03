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

  // 品牌筛选
  const [brands, setBrands] = useState([])
  const [activeBrand, setActiveBrand] = useState(null)
  const [brandsLoading, setBrandsLoading] = useState(true)

  // 描述气泡
  const [tooltipId, setTooltipId] = useState(null)

  // 切换到库存查询时自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 加载所有品牌列表
  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    setBrandsLoading(true)
    const { data, error } = await supabase
      .from('taobao_stock_qty')
      .select('品牌')
      .not('品牌', 'is', null)
      .order('品牌')

    if (!error && data) {
      const uniqueBrands = [...new Set(data.map(d => d['品牌']).filter(Boolean))]
      setBrands(uniqueBrands)
    }
    setBrandsLoading(false)
  }

  // 点击品牌：显示该品牌所有商品
  const handleBrandClick = (brand) => {
    if (activeBrand === brand) {
      // 取消选中，回到搜索模式
      setActiveBrand(null)
      setResults([])
      setTotal(null)
      setKeyword('')
      return
    }
    setActiveBrand(brand)
    setKeyword('')
    clearTimeout(timerRef.current)
    searchByBrand(brand)
  }

  const searchByBrand = async (brand) => {
    setLoading(true)
    const { data, count, error } = await supabase
      .from('taobao_stock_qty')
      .select('*', { count: 'exact' })
      .eq('品牌', brand)
      .order('库存量', { ascending: false })

    if (!error) {
      setResults(data || [])
      setTotal(count || 0)
    }
    setLoading(false)
  }

  // 关键词搜索（未选品牌时）
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
      // 如果选了品牌且清空输入，显示该品牌全部商品
      if (activeBrand) {
        searchByBrand(activeBrand)
      } else {
        setResults([])
        setTotal(null)
      }
    } else {
      timerRef.current = setTimeout(() => {
        if (activeBrand) {
          // 在品牌内搜索
          searchInBrand(activeBrand, val.trim())
        } else {
          doSearch(val.trim())
        }
      }, DEBOUNCE_MS)
    }
  }

  // 在已选品牌内搜索
  const searchInBrand = async (brand, kw) => {
    setLoading(true)
    const pattern = `%${kw}%`
    const { data, count, error } = await supabase
      .from('taobao_stock_qty')
      .select('*', { count: 'exact' })
      .eq('品牌', brand)
      .or(`产品名称.ilike.${pattern},英文代码.ilike.${pattern}`)
      .order('库存量', { ascending: false })

    if (!error) {
      setResults(data || [])
      setTotal(count || 0)
    }
    setLoading(false)
  }

  // 点击产品行：切换描述气泡
  const handleItemClick = (itemId) => {
    setTooltipId(tooltipId === itemId ? null : itemId)
  }

  return (
    <div>
      {/* 品牌标签栏 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-stone-500 shrink-0">品牌：</span>
          {brandsLoading ? (
            <span className="text-xs text-stone-300">加载中...</span>
          ) : (
            brands.map((brand) => (
              <button
                key={brand}
                onClick={() => handleBrandClick(brand)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                  ${activeBrand === brand
                    ? 'bg-stone-700 text-white shadow-md'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800'
                  }`}
              >
                {brand}
              </button>
            ))
          )}
          {activeBrand && (
            <button
              onClick={() => {
                setActiveBrand(null)
                setResults([])
                setTotal(null)
                setKeyword('')
              }}
              className="px-2 py-1 rounded-full text-xs text-stone-400 hover:text-stone-600 transition-colors"
              title="清除品牌筛选"
            >
              ✕ 清除
            </button>
          )}
        </div>
      </div>

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
          placeholder={
            activeBrand
              ? `在「${activeBrand}」内搜索产品名称或英文代码...`
              : '输入产品名称或英文代码，自动搜索...'
          }
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
            {activeBrand && <span className="text-stone-300"> · 品牌：{activeBrand}</span>}
            {!activeBrand && results.length < total && `（显示前 ${results.length} 条，请细化关键字）`}
          </p>

          {results.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-stone-400 text-sm">没有找到匹配的产品</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((item, i) => {
                const isOpen = tooltipId === item.id
                return (
                  <div key={item.id || i}>
                    <div
                      onClick={() => handleItemClick(item.id)}
                      className={`bg-white rounded-2xl shadow-sm border p-4 cursor-pointer
                                 hover:shadow-md transition-all duration-200
                                 ${isOpen
                                   ? 'border-stone-400 shadow-md rounded-b-none'
                                   : 'border-stone-100 hover:border-stone-200'
                                 }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* 品牌模式下以型号（英文代码）为主，搜索模式下以产品名称为主 */}
                          {activeBrand ? (
                            <>
                              <h3 className="text-sm font-semibold text-stone-800 truncate">
                                {item['英文代码'] || item['产品名称']}
                              </h3>
                              <p className="text-xs text-stone-400 mt-0.5 truncate">
                                {item['产品名称']}
                              </p>
                            </>
                          ) : (
                            <>
                              <h3 className="text-sm font-medium text-stone-800 truncate">
                                {item['产品名称']}
                              </h3>
                              <p className="text-xs text-stone-400 mt-0.5">
                                代码：{item['英文代码']}
                                {item['品牌'] && (
                                  <span className="ml-2 text-stone-300">| {item['品牌']}</span>
                                )}
                              </p>
                            </>
                          )}
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
                    {/* 描述气泡 */}
                    {isOpen && item['描述'] && (
                      <div className="bg-stone-50 border border-stone-200 border-t-0 rounded-b-2xl px-4 py-3
                                      animate-slideDown">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-medium text-stone-500 shrink-0 mt-0.5">📋</span>
                          <p className="text-xs text-stone-600 leading-relaxed">
                            {item['描述']}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-stone-400 text-sm">输入关键字自动搜索库存</p>
          <p className="text-stone-300 text-xs mt-1">可搜产品名称或英文代码，也可点击品牌筛选</p>
        </div>
      )}
    </div>
  )
}
