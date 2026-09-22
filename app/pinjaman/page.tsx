'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'
import { formatRupiah, getTodayISO } from '@/lib/utils'
import { getHutang, tambahHutang, hapusHutang, getCicilan, tambahCicilan, hapusCicilan } from '@/lib/store'
import { Hutang, CicilanHutang } from '@/lib/types'
import { useRole } from '@/lib/auth'

export default function PinjamanPage() {
  const { isAdmin } = useRole()

  const [hutangList, setHutangList] = useState<Hutang[]>([])
  const [cicilanList, setCicilanList] = useState<CicilanHutang[]>([])
  const [selectedHutangId, setSelectedHutangId] = useState<string | null>(null)

  const [formHutang, setFormHutang] = useState({ judul: '', jumlahPokok: '', tanggal: getTodayISO(), catatan: '' })
  const [formCicilan, setFormCicilan] = useState({ jumlahBayar: '', tanggal: getTodayISO(), catatan: '' })

  const loadData = () => {
    setHutangList(getHutang())
    setCicilanList(getCicilan())
  }

  useEffect(() => { loadData() }, [])

  const handleTambahHutang = (e: React.FormEvent) => {
    e.preventDefault()
    const nominal = parseFloat(formHutang.jumlahPokok.replace(/\./g, '').replace(',', '.'))
    if (!formHutang.judul.trim() || isNaN(nominal) || nominal <= 0) return
    tambahHutang({
      judul: formHutang.judul.trim(),
      jumlahPokok: nominal,
      tanggal: formHutang.tanggal,
      catatan: formHutang.catatan.trim(),
    })
    setFormHutang({ judul: '', jumlahPokok: '', tanggal: getTodayISO(), catatan: '' })
    loadData()
  }

  const handleHapusHutang = (id: string) => {
    if (!confirm('Hapus hutang dan semua cicilannya?')) return
    hapusHutang(id)
    if (selectedHutangId === id) setSelectedHutangId(null)
    loadData()
  }

  const handleTambahCicilan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedHutangId) return
    const nominal = parseFloat(formCicilan.jumlahBayar.replace(/\./g, '').replace(',', '.'))
    if (isNaN(nominal) || nominal <= 0) return
    tambahCicilan({
      hutangId: selectedHutangId,
      tanggal: formCicilan.tanggal,
      jumlahBayar: nominal,
      catatan: formCicilan.catatan.trim(),
    })
    setFormCicilan({ jumlahBayar: '', tanggal: getTodayISO(), catatan: '' })
    loadData()
  }

  const handleHapusCicilan = (id: string) => {
    if (!confirm('Hapus catatan cicilan ini?')) return
    hapusCicilan(id)
    loadData()
  }

  const totalPokok = hutangList.reduce((s, h) => s + h.jumlahPokok, 0)
  const totalDibayar = cicilanList.reduce((s, c) => s + c.jumlahBayar, 0)
  const totalSisa = Math.max(0, totalPokok - totalDibayar)

  const selectedHutang = hutangList.find(h => h.id === selectedHutangId)
  const cicilanSelected = cicilanList.filter(c => c.hutangId === selectedHutangId).sort((a, b) => b.tanggal.localeCompare(a.tanggal))
  const dibayarSelected = cicilanSelected.reduce((s, c) => s + c.jumlahBayar, 0)
  const sisaSelected = selectedHutang ? Math.max(0, selectedHutang.jumlahPokok - dibayarSelected) : 0
  const persenSelected = selectedHutang ? Math.min(100, (dibayarSelected / selectedHutang.jumlahPokok) * 100) : 0

  const formatTanggal = (t: string) =>
    new Date(t + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div>
      <PageHeader title="Pinjaman & Cicilan" description="Pantau pinjaman modal dan catat pembayaran cicilan" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Pinjaman</p>
          <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{formatRupiah(totalPokok)}</p>
          <p className="text-xs text-slate-400 mt-1">{hutangList.length} data tercatat</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Terbayar</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatRupiah(totalDibayar)}</p>
          <p className="text-xs text-slate-400 mt-1">{cicilanList.length} kali cicilan</p>
        </div>
        <div className={`rounded-2xl border p-5 ${totalSisa > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${totalSisa > 0 ? 'text-red-500' : 'text-emerald-600'}`}>Sisa Hutang</p>
          <p className={`text-xl font-bold mt-1 ${totalSisa > 0 ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{formatRupiah(totalSisa)}</p>
          <p className="text-xs text-slate-400 mt-1">{totalPokok > 0 ? ((totalDibayar / totalPokok) * 100).toFixed(1) : '0'}% lunas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left column */}
        <div className="col-span-1 lg:col-span-2 space-y-5">

          {/* Form tambah hutang */}
          {isAdmin && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-white mb-4">Tambah Pinjaman Baru</h3>
              <form onSubmit={handleTambahHutang} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Nama / Sumber Pinjaman</label>
                  <input
                    type="text"
                    placeholder="cth: Modal Bank BRI, Pinjaman Keluarga"
                    value={formHutang.judul}
                    onChange={e => setFormHutang(f => ({ ...f, judul: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:border-[#B04B87] focus:ring-2 focus:ring-[#B04B87]/20 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Jumlah Pinjaman</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formHutang.jumlahPokok}
                    onChange={e => setFormHutang(f => ({ ...f, jumlahPokok: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:border-[#B04B87] focus:ring-2 focus:ring-[#B04B87]/20 transition"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Tanggal Pinjam</label>
                  <input
                    type="date"
                    value={formHutang.tanggal}
                    onChange={e => setFormHutang(f => ({ ...f, tanggal: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:border-[#B04B87] focus:ring-2 focus:ring-[#B04B87]/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Catatan</label>
                  <input
                    type="text"
                    placeholder="opsional"
                    value={formHutang.catatan}
                    onChange={e => setFormHutang(f => ({ ...f, catatan: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:border-[#B04B87] focus:ring-2 focus:ring-[#B04B87]/20 transition"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition"
                  style={{ background: 'linear-gradient(135deg, #B04B87 0%, #8B3A9E 100%)' }}
                >
                  Simpan Pinjaman
                </button>
              </form>
            </div>
          )}

          {/* Form catat cicilan */}
          {isAdmin && selectedHutang && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#B04B87]/40 dark:border-[#B04B87]/30 p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-white">Catat Cicilan</h3>
                <button onClick={() => setSelectedHutangId(null)} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">✕ tutup</button>
              </div>
              <p className="text-xs text-[#B04B87] font-medium mb-4">{selectedHutang.judul}</p>
              <form onSubmit={handleTambahCicilan} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Jumlah Bayar</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formCicilan.jumlahBayar}
                    onChange={e => setFormCicilan(f => ({ ...f, jumlahBayar: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:border-[#B04B87] focus:ring-2 focus:ring-[#B04B87]/20 transition"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Tanggal Bayar</label>
                  <input
                    type="date"
                    value={formCicilan.tanggal}
                    onChange={e => setFormCicilan(f => ({ ...f, tanggal: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:border-[#B04B87] focus:ring-2 focus:ring-[#B04B87]/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Catatan</label>
                  <input
                    type="text"
                    placeholder="opsional"
                    value={formCicilan.catatan}
                    onChange={e => setFormCicilan(f => ({ ...f, catatan: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:border-[#B04B87] focus:ring-2 focus:ring-[#B04B87]/20 transition"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
                  <span>Sisa setelah bayar</span>
                  <span className="font-semibold text-red-500">{formatRupiah(sisaSelected)}</span>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition"
                  style={{ background: 'linear-gradient(135deg, #B04B87 0%, #8B3A9E 100%)' }}
                >
                  Catat Cicilan
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right column — daftar hutang */}
        <div className="col-span-1 lg:col-span-3">
          {hutangList.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 text-center">
              <div className="text-4xl mb-3 opacity-30">💳</div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Belum ada pinjaman tercatat</p>
            </div>
          ) : (
            <div className="space-y-4">
              {hutangList.map(h => {
                const dibayar = cicilanList.filter(c => c.hutangId === h.id).reduce((s, c) => s + c.jumlahBayar, 0)
                const sisa = Math.max(0, h.jumlahPokok - dibayar)
                const persen = Math.min(100, (dibayar / h.jumlahPokok) * 100)
                const lunas = sisa === 0
                const isSelected = selectedHutangId === h.id
                const cicilanH = cicilanList.filter(c => c.hutangId === h.id).sort((a, b) => b.tanggal.localeCompare(a.tanggal))

                return (
                  <div
                    key={h.id}
                    className={`bg-white dark:bg-slate-800 rounded-2xl border transition ${isSelected ? 'border-[#B04B87]/50 dark:border-[#B04B87]/40' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                    {/* Header hutang */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-white truncate">{h.judul}</h4>
                            {lunas && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">✓ Lunas</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{formatTanggal(h.tanggal)}{h.catatan ? ` — ${h.catatan}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isAdmin && !lunas && (
                            <button
                              onClick={() => { setSelectedHutangId(isSelected ? null : h.id); setFormCicilan({ jumlahBayar: '', tanggal: getTodayISO(), catatan: '' }) }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition"
                              style={{ background: isSelected ? '#e9d5ff' : 'linear-gradient(135deg, #B04B87 0%, #8B3A9E 100%)', color: isSelected ? '#7c3aed' : '#fff' }}
                            >
                              {isSelected ? 'Batal' : '+ Cicilan'}
                            </button>
                          )}
                          {isAdmin && (
                            <button onClick={() => handleHapusHutang(h.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Nominal info */}
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wide">Pinjaman</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-white mt-0.5">{formatRupiah(h.jumlahPokok)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wide">Terbayar</p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatRupiah(dibayar)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wide">Sisa</p>
                          <p className={`text-sm font-bold mt-0.5 ${lunas ? 'text-emerald-600' : 'text-red-500'}`}>{formatRupiah(sisa)}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>{persen.toFixed(1)}% lunas</span>
                          <span>{cicilanH.length}x cicilan</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${lunas ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#B04B87] to-[#8B3A9E]'}`}
                            style={{ width: `${persen}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Riwayat cicilan */}
                    {cicilanH.length > 0 && (
                      <div className="border-t border-slate-100 dark:border-slate-700 px-5 pb-4 pt-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Riwayat Cicilan</p>
                        <div className="space-y-1.5">
                          {cicilanH.map(c => (
                            <div key={c.id} className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                                <span className="text-xs text-slate-500 dark:text-slate-300">{formatTanggal(c.tanggal)}</span>
                                {c.catatan && <span className="text-xs text-slate-400 truncate">— {c.catatan}</span>}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatRupiah(c.jumlahBayar)}</span>
                                {isAdmin && (
                                  <button onClick={() => handleHapusCicilan(c.id)} className="text-slate-300 hover:text-red-400 transition cursor-pointer">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
