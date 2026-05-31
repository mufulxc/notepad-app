import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Notepad() {
  const [notes, setNotes] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const textareaRef = useRef(null)

  // 加载笔记
  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setNotes(data)
    setLoading(false)
  }

  useEffect(() => { fetchNotes() }, [])

  // 新建笔记
  const addNote = async () => {
    const trimmed = content.trim()
    if (!trimmed || saving) return

    setSaving(true)
    const { data, error } = await supabase
      .from('notes')
      .insert([{ content: trimmed }])
      .select()
      .single()

    if (!error && data) {
      setNotes(prev => [data, ...prev])
      setContent('')
    }
    setSaving(false)
  }

  // 删除笔记
  const deleteNote = async (id) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    await supabase.from('notes').delete().eq('id', id)
  }

  // 开始编辑
  const startEdit = (note) => {
    setEditingId(note.id)
    setEditContent(note.content)
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  // 保存编辑
  const saveEdit = async (id) => {
    const trimmed = editContent.trim()
    if (!trimmed) return

    const { data } = await supabase
      .from('notes')
      .update({ content: trimmed, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (data) {
      setNotes(prev => prev.map(n => n.id === id ? data : n))
    } else {
      // fallback: 本地更新
      setNotes(prev => prev.map(n =>
        n.id === id ? { ...n, content: trimmed, updated_at: new Date().toISOString() } : n
      ))
    }
    setEditingId(null)
    setEditContent('')
  }

  // 回车提交
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (editingId) {
        saveEdit(editingId)
      } else {
        addNote()
      }
    }
  }

  const formatTime = (ts) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = now - d
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins} 分钟前`
    if (hours < 24) return `${hours} 小时前`
    if (days < 7) return `${days} 天前`

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
      {/* 输入区域 */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 mb-8 transition-shadow hover:shadow-md">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="写点什么..."
          rows={3}
          className="w-full resize-none outline-none text-stone-700 placeholder-stone-300 text-sm leading-relaxed bg-transparent"
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
          <span className="text-xs text-stone-400">
            Enter 发送 · Shift+Enter 换行
          </span>
          <button
            onClick={addNote}
            disabled={!content.trim() || saving}
            className="px-5 py-2 bg-stone-800 text-white text-sm rounded-xl
                       hover:bg-stone-700 active:scale-95 transition-all duration-200
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 笔记列表 */}
      {loading ? (
        <div className="flex flex-col items-center py-20 text-stone-300">
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-400 rounded-full animate-spin mb-3" />
          <span className="text-sm">加载中...</span>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📒</div>
          <p className="text-stone-400 text-sm">还没有笔记，写一条吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note, i) => (
            <div
              key={note.id}
              className={`note-card-enter bg-white rounded-2xl shadow-sm border border-stone-100 p-5
                          transition-all duration-200 hover:shadow-md hover:border-stone-200
                          ${i === 0 ? '' : ''}`}
              style={{ animationDelay: `${i * 30}ms`, opacity: 0 }}
              onAnimationEnd={e => { if (e.animationName === 'fadeInUp') e.target.style.opacity = 1 }}
            >
              {editingId === note.id ? (
                /* 编辑模式 */
                <div>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={3}
                    autoFocus
                    className="w-full resize-none outline-none text-stone-700 text-sm leading-relaxed
                               bg-stone-50 rounded-xl p-3 border border-stone-200 focus:border-stone-400"
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-1.5 text-sm text-stone-500 hover:text-stone-700
                                 rounded-lg hover:bg-stone-100 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => saveEdit(note.id)}
                      disabled={!editContent.trim()}
                      className="px-4 py-1.5 text-sm bg-stone-800 text-white rounded-lg
                                 hover:bg-stone-700 active:scale-95 transition-all
                                 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                /* 展示模式 */
                <div>
                  <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-50">
                    <span className="text-xs text-stone-400">
                      {formatTime(note.created_at)}
                      {note.updated_at && note.updated_at !== note.created_at && ' (已编辑)'}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(note)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100
                                   rounded-lg transition-colors text-xs"
                        title="编辑"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50
                                   rounded-lg transition-colors text-xs"
                        title="删除"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
