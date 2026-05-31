import { useState } from 'react'
import Notepad from './components/Notepad'
import Inventory from './components/Inventory'
import PasswordGate from './components/PasswordGate'

const tabs = [
  { key: 'notes', label: '📝 记事本' },
  { key: 'stock', label: '📦 库存查询' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('notes')

  return (
    <PasswordGate>
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50">
        {/* 顶部导航 */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-stone-200">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center gap-1 pt-4 pb-0">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    px-5 py-3 text-sm font-medium rounded-t-xl transition-all duration-200
                    ${activeTab === tab.key
                      ? 'bg-stone-50 text-stone-800 shadow-sm'
                      : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100/50'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
              {/* 退出按钮 */}
              <button
                onClick={() => { localStorage.removeItem('notepad_authenticated'); window.location.reload() }}
                className="ml-auto px-3 py-1.5 text-xs text-stone-400 hover:text-stone-600
                           rounded-lg hover:bg-stone-100 transition-colors"
                title="重新锁定"
              >
                🔒
              </button>
            </div>
          </div>
        </header>

        {/* 内容区 */}
        <main className="max-w-3xl mx-auto px-4 py-6">
          {activeTab === 'notes' ? <Notepad /> : <Inventory />}
        </main>

        {/* 底部信息 */}
        <footer className="text-center py-8 text-xs text-stone-400">
          数据存储在 Supabase · 打开即用
        </footer>
      </div>
    </PasswordGate>
  )
}
