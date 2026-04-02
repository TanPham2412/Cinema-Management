import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Coffee, Plus, Pencil, Trash2, X, Save, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const CATEGORIES = ['COMBO', 'POPCORN', 'DRINK', 'SNACK']

const EMPTY = { name: '', description: '', price: '', imageUrl: '', category: 'COMBO', available: true }

const ComboManagement = () => {
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchCombos() }, [])

  const fetchCombos = async () => {
    setLoading(true)
    try {
      const res = await api.get('/combos/admin')
      setCombos(res.data || [])
    } catch {
      toast.error('Kh�ng th? t?i danh s�ch combo')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => { setEditTarget(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (c) => { setEditTarget(c); setForm({ name: c.name, description: c.description || '', price: c.price, imageUrl: c.imageUrl || '', category: c.category || 'COMBO', available: c.available }); setShowModal(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price) { toast.error('Vui l�ng nh?p t�n v� gi�'); return }
    setSaving(true)
    try {
      const payload = { ...form, price: parseFloat(form.price) }
      if (editTarget) {
        const res = await api.put('/combos/admin/' + editTarget.id, payload)
        setCombos(prev => prev.map(c => c.id === editTarget.id ? res.data : c))
        toast.success('D� c?p nh?t combo')
      } else {
        const res = await api.post('/combos/admin', payload)
        setCombos(prev => [...prev, res.data])
        toast.success('D� t?o combo m?i')
      }
      setShowModal(false)
    } catch {
      toast.error('Luu th?t b?i')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (combo) => {
    if (!window.confirm('X�a combo "' + combo.name + '"?')) return
    try {
      const res = await api.delete('/combos/admin/' + combo.id)
      toast.success(res.data?.message || 'D� x�a combo')
      fetchCombos()
    } catch {
      toast.error('X�a th?t b?i')
    }
  }

  const handleToggleAvailable = async (combo) => {
    try {
      const res = await api.put('/combos/admin/' + combo.id, { available: !combo.available })
      setCombos(prev => prev.map(c => c.id === combo.id ? res.data : c))
      toast.success(res.data.available ? 'D� k�ch ho?t' : 'D� v� hi?u h�a')
    } catch {
      toast.error('Thao t�c th?t b?i')
    }
  }

  const filtered = combos.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.category?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-cinema-darker">
      <div className="bg-cinema-gray border-b border-cinema-gray-light">
        <div className="container mx-auto px-4 py-5 flex items-center gap-3">
          <Link to="/d57" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <Coffee className="w-6 h-6 text-yellow-400" />
          <h1 className="text-2xl font-bold text-white">Qu?n l� Combo & D? an</h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="T�m combo..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 bg-cinema-gray-light border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm w-48" />
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-cinema-red text-white rounded-lg hover:bg-cinema-red-dark text-sm">
              <Plus className="w-4 h-4" /> T?o m?i
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-cinema-gray rounded-xl border border-cinema-gray-light overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-cinema-gray-light">
              <tr className="text-gray-400">
                <th className="text-left px-4 py-3">T�n combo</th>
                <th className="text-left px-4 py-3">M� t?</th>
                <th className="text-left px-4 py-3">Danh m?c</th>
                <th className="text-left px-4 py-3">Gi�</th>
                <th className="text-left px-4 py-3">Tr?ng th�i</th>
                <th className="text-right px-4 py-3">Thao t�c</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-gray-light">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>{[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-cinema-gray-light rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-500">
                  <Coffee className="w-10 h-10 mx-auto mb-3 opacity-50" />Kh�ng c� combo n�o
                </td></tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="hover:bg-cinema-gray-lighter/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {c.imageUrl ? (
                          <img src={c.imageUrl} alt={c.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-cinema-gray-light flex items-center justify-center">
                            <Coffee className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                        <span className="text-white font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{c.description || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-400/20 rounded-full text-xs">{c.category || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-cinema-gold font-semibold">{c.price?.toLocaleString()}d</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleAvailable(c)} className="flex items-center gap-1.5 text-xs">
                        {c.available ? (
                          <><ToggleRight className="w-5 h-5 text-green-400" /><span className="text-green-400">Dang b�n</span></>
                        ) : (
                          <><ToggleLeft className="w-5 h-5 text-gray-500" /><span className="text-gray-500">Ngung b�n</span></>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-white hover:bg-cinema-gray-light rounded-lg" title="S?a">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg" title="X�a">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-cinema-gray rounded-2xl border border-cinema-gray-light w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b border-cinema-gray-light">
              <h2 className="text-xl font-bold text-white">{editTarget ? 'S?a combo' : 'T?o combo m?i'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">T�n combo <span className="text-red-400">*</span></label>
                <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-cinema-gray-lighter border border-cinema-gray-light text-white rounded-lg text-sm focus:outline-none focus:border-cinema-red" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">M� t?</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-cinema-gray-lighter border border-cinema-gray-light text-white rounded-lg text-sm focus:outline-none focus:border-cinema-red resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Gi� (VND) <span className="text-red-400">*</span></label>
                  <input type="number" required min={0} step={1000} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full px-3 py-2 bg-cinema-gray-lighter border border-cinema-gray-light text-white rounded-lg text-sm focus:outline-none focus:border-cinema-red" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Danh m?c</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-cinema-gray-lighter border border-cinema-gray-light text-white rounded-lg text-sm focus:outline-none focus:border-cinema-red">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">URL h�nh ?nh</label>
                <input type="url" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  className="w-full px-3 py-2 bg-cinema-gray-lighter border border-cinema-gray-light text-white rounded-lg text-sm focus:outline-none focus:border-cinema-red" placeholder="https://..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="available" checked={form.available} onChange={e => setForm(f => ({ ...f, available: e.target.checked }))}
                  className="w-4 h-4 accent-cinema-red" />
                <label htmlFor="available" className="text-sm text-gray-300">Dang b�n</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-cinema-red text-white rounded-xl hover:bg-cinema-red-dark disabled:opacity-50 text-sm">
                  <Save className="w-4 h-4" /> {saving ? 'Dang luu...' : 'Luu'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-cinema-gray-light text-white rounded-xl hover:bg-cinema-gray-lighter text-sm">H?y</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComboManagement