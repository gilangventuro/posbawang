'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'
import FormCard from '@/components/FormCard'
import { tambahPenjualan, getData, hapusPenjualan } from '@/lib/store'
import { formatRupiah, formatTanggal, formatKg, getTodayISO } from '@/lib/utils'
import { Penjualan, JenisBawang, JenisItem } from '@/lib/types'
import { useRole } from '@/lib/auth'

export default function PenjualanPage() {
  const [list, setList] = useState<Penjualan[]>([])
  const [form, setForm] = useState({ tanggal: getTodayISO(), jenis_item: 'bawang_putih' as JenisItem, jenis: 'tidak_kupas' as JenisBawang, berat_kg: '', harga_jual_per_kg: '', catatan: '' })
  const [success, setSuccess] = useState(false)
  const [stok, setStok] = useState({ putihMentah: 0, merahMentah: 0, kupas: 0 })
  const [filterTanggal, setFilterTanggal] = useState(getTodayISO())

  const { isAdmin } = useRole()

  const loadData = () => {
    const data = getData()
    setList([...data.penjualan].reverse())
    const totalBeliPutih = data.stockMasuk.filter(i => i.jenis_item === 'bawang_putih').reduce((s, i) => s + i.berat_kg, 0)
    const totalBeliMerah = data.stockMasuk.filter(i => i.jenis_item === 'bawang_merah').reduce((s, i) => s + i.berat_kg, 0)
    const totalKupas = data.jasaKupas.reduce((s, i) => s + i.berat_kg, 0)
    const totalJualPutihMentah = data.penjualan.filter(i => i.jenis_item === 'bawang_putih' && i.jenis === 'tidak_kupas').reduce((s, i) => s + i.berat_kg, 0)
    const totalJualMerahMentah = data.penjualan.filter(i => i.jenis_item === 'bawang_merah' && i.jenis === 'tidak_kupas').reduce((s, i) => s + i.berat_kg, 0)
    const totalJualKupas = data.penjualan.filter(i => i.jenis === 'kupas').reduce((s, i) => s + i.berat_kg, 0)
    setStok({
      putihMentah: Math.max(0, totalBeliPutih - totalKupas - totalJualPutihMentah),
      merahMentah: Math.max(0, totalBeliMerah - totalJualMerahMentah),
      kupas: Math.max(0, totalKupas - totalJualKupas),
    })
  }

  useEffect(() => { loadData() }, [])

  const totalHarga = (parseFloat(form.berat_kg) || 0) * (parseFloat(form.harga_jual_per_kg) || 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.berat_kg || !form.harga_jual_per_kg) return
    tambahPenjualan({
      tanggal: form.tanggal,
      jenis_item: form.jenis_item,
      jenis: form.jenis,
      berat_kg: parseFloat(form.berat_kg),
      harga_jual_per_kg: parseFloat(form.harga_jual_per_kg),
      total_harga: totalHarga,
      catatan: form.catatan,
    })
    setForm({ tanggal: getTodayISO(), jenis_item: form.jenis_item, jenis: 'tidak_kupas', berat_kg: '', harga_jual_per_kg: '', catatan: '' })
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    loadData()
  }

  const handleHapus = (id: string) => {
    if (confirm('Hapus data ini?')) {
      hapusPenjualan(id)
      loadData()
    }
  }

  const stokTersedia = form.jenis === 'kupas'
    ? stok.kupas
    : form.jenis_item === 'bawang_putih' ? stok.putihMentah : stok.merahMentah

  const grouped = list.reduce((acc, item) => { if (!acc[item.tanggal]) acc[item.tanggal] = []; acc[item.tanggal].push(item); return acc }, {} as Record<string, Penjualan[]>)
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
  const filteredList = filterTanggal ? list.filter(i => i.tanggal === filterTanggal) : list
  const filteredBerat = filteredList.reduce((s, i) => s + i.berat_kg, 0)
  const filteredTotal = filteredList.reduce((s, i) => s + i.total_harga, 0)

  return (
    <div>
      <PageHeader title="Penjualan" description="Catat penjualan bawang kupas maupun tidak kupas" />

      {/* Stok banner */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-800 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Putih Mentah</p>
            <p className="text-base font-bold text-purple-800 dark:text-purple-200">{formatKg(stok.putihMentah)}</p>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-800 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">Merah Mentah</p>
            <p className="text-base font-bold text-red-800 dark:text-red-200">{formatKg(stok.merahMentah)}</p>
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-800 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Stok Kupas</p>
            <p className="text-base font-bold text-orange-800 dark:text-orange-200">{formatKg(stok.kupas)}</p>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${isAdmin ? 'lg:grid-cols-5' : ''}`}>
        {isAdmin && (
        <div className="col-span-1 lg:col-span-2">
          <FormCard title="Form Penjualan" description="Input data penjualan bawang">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-white mb-1.5">Tanggal</label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={e => setForm({ ...form, tanggal: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-white mb-1.5">Jenis Bawang</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {(['bawang_putih', 'bawang_merah'] as JenisItem[]).map(j => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => setForm({ ...form, jenis_item: j })}
                      className={`py-2 rounded-xl border text-sm font-semibold transition cursor-pointer ${
                        form.jenis_item === j
                          ? j === 'bawang_putih'
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'bg-red-500 border-red-500 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {j === 'bawang_putih' ? 'Bawang Putih' : 'Bawang Merah'}
                    </button>
                  ))}
                </div>
                <select
                  value={form.jenis}
                  onChange={e => setForm({ ...form, jenis: e.target.value as JenisBawang })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition cursor-pointer"
                >
                  <option value="tidak_kupas">Tidak Kupas</option>
                  <option value="kupas">Kupas</option>
                </select>
                <p className="text-xs text-slate-400 dark:text-slate-300 mt-1">
                  Stok tersedia: <span className="font-semibold text-slate-600 dark:text-slate-200">{formatKg(stokTersedia)}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-white mb-1.5">Berat Dijual (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="contoh: 20"
                  value={form.berat_kg}
                  onChange={e => setForm({ ...form, berat_kg: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-white mb-1.5">Harga Jual per kg (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="contoh: 20000"
                  value={form.harga_jual_per_kg}
                  onChange={e => setForm({ ...form, harga_jual_per_kg: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                  required
                />
              </div>

              {totalHarga > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-xl px-4 py-3">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Total Pendapatan</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{formatRupiah(totalHarga)}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-white mb-1.5">Catatan (opsional)</label>
                <textarea
                  placeholder="Nama pembeli, dll."
                  value={form.catatan}
                  onChange={e => setForm({ ...form, catatan: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors duration-150 cursor-pointer"
              >
                Simpan Penjualan
              </button>

              {success && (
                <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl px-4 py-3 text-emerald-700 dark:text-emerald-300 text-sm font-medium text-center">
                  Data berhasil disimpan!
                </div>
              )}
            </form>
          </FormCard>
        </div>
        )}

        <div className={`col-span-1 ${isAdmin ? 'lg:col-span-3' : ''}`}>
          <FormCard title={`Riwayat Penjualan (${filteredList.length} data)`}>
            {list.length > 0 && (
              <div className="mb-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Filter Tanggal</label>
                  <select
                    value={filterTanggal}
                    onChange={e => setFilterTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition cursor-pointer"
                  >
                    <option value="">Semua Tanggal ({list.length} transaksi)</option>
                    {sortedDates.map(date => (
                      <option key={date} value={date}>{formatTanggal(date)} — {grouped[date].length} transaksi</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{filterTanggal ? 'Berat Terjual' : 'Total Semua Berat'}</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{formatKg(filteredBerat)}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl px-4 py-3">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{filterTanggal ? 'Pendapatan Hari Ini' : 'Total Semua Pendapatan'}</p>
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200 mt-0.5">{formatRupiah(filteredTotal)}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              {list.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm">Belum ada data penjualan</p>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-sm">Tidak ada data untuk tanggal ini</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-200 pb-3 pr-4">Jenis</th>
                      <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-200 pb-3 pr-4">Berat</th>
                      <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-200 pb-3 pr-4">Harga/kg</th>
                      <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-200 pb-3 pr-4">Total</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                    {filterTanggal
                      ? filteredList.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="py-3 pr-4">
                              <div className="flex flex-col gap-0.5">
                                {item.jenis_item && <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.jenis_item === 'bawang_putih' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>{item.jenis_item === 'bawang_putih' ? 'Putih' : 'Merah'}</span>}
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.jenis === 'kupas' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{item.jenis === 'kupas' ? 'Kupas' : 'Tidak Kupas'}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-right font-medium text-slate-800 dark:text-white">{formatKg(item.berat_kg)}</td>
                            <td className="py-3 pr-4 text-right text-slate-600 dark:text-slate-200">{formatRupiah(item.harga_jual_per_kg)}</td>
                            <td className="py-3 pr-4 text-right font-semibold text-emerald-700 dark:text-emerald-300">{formatRupiah(item.total_harga)}</td>
                            <td className="py-3">
                              {isAdmin && <button onClick={() => handleHapus(item.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors cursor-pointer" title="Hapus"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
                            </td>
                          </tr>
                        ))
                      : sortedDates.flatMap((date, idx) => [
                          <tr key={`d-${date}`}>
                            <td colSpan={5} className={`pb-1.5 ${idx > 0 ? 'pt-5' : 'pt-1'}`}>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{formatTanggal(date)}</span>
                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
                              </div>
                            </td>
                          </tr>,
                          ...grouped[date].map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                              <td className="py-3 pr-4">
                                <div className="flex flex-col gap-0.5">
                                  {item.jenis_item && <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.jenis_item === 'bawang_putih' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>{item.jenis_item === 'bawang_putih' ? 'Putih' : 'Merah'}</span>}
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.jenis === 'kupas' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{item.jenis === 'kupas' ? 'Kupas' : 'Tidak Kupas'}</span>
                                </div>
                              </td>
                              <td className="py-3 pr-4 text-right font-medium text-slate-800 dark:text-white">{formatKg(item.berat_kg)}</td>
                              <td className="py-3 pr-4 text-right text-slate-600 dark:text-slate-200">{formatRupiah(item.harga_jual_per_kg)}</td>
                              <td className="py-3 pr-4 text-right font-semibold text-emerald-700 dark:text-emerald-300">{formatRupiah(item.total_harga)}</td>
                              <td className="py-3">
                                {isAdmin && <button onClick={() => handleHapus(item.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors cursor-pointer" title="Hapus"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
                              </td>
                            </tr>
                          ))
                        ])
                    }
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                      <td colSpan={3} className="pt-3 text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wide">Total Pendapatan</td>
                      <td className="pt-3 text-right font-bold text-emerald-700 dark:text-emerald-300">{formatRupiah(filteredTotal)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </FormCard>
        </div>
      </div>
    </div>
  )
}
