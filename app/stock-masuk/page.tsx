'use client'

import { useState, useEffect, useRef } from 'react'
import PageHeader from '@/components/PageHeader'
import FormCard from '@/components/FormCard'
import { tambahStockMasuk, getData, hapusStockMasuk } from '@/lib/store'
import { formatRupiah, formatTanggal, formatKg, getTodayISO } from '@/lib/utils'
import { StockMasuk, JenisItem } from '@/lib/types'
import { simpanInvoice, bukaInvoice, formatUkuran } from '@/lib/invoices'
import { useRole } from '@/lib/auth'

export default function StockMasukPage() {
  const [list, setList] = useState<StockMasuk[]>([])
  const [form, setForm] = useState({ tanggal: getTodayISO(), jenis_item: 'bawang_putih' as JenisItem, berat_kg: '', harga_per_kg: '', catatan: '' })
  const [notaFile, setNotaFile] = useState<File | null>(null)
  const [success, setSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [filterTanggal, setFilterTanggal] = useState(getTodayISO())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { isAdmin } = useRole()

  const loadData = async () => {
    const data = await getData()
    setList([...data.stockMasuk].reverse())
  }

  useEffect(() => { loadData() }, [])

  const totalHarga = (parseFloat(form.berat_kg) || 0) * (parseFloat(form.harga_per_kg) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.berat_kg || !form.harga_per_kg) return

    setUploading(true)
    try {
      let notaId: string | undefined
      if (notaFile) {
        const keterangan = `Nota Belanja — ${form.jenis_item === 'bawang_putih' ? 'Bawang Putih' : 'Bawang Merah'} ${form.berat_kg} kg, ${form.tanggal}`
        const invoice = await simpanInvoice(notaFile, form.tanggal, keterangan)
        notaId = invoice.id
      }

      await tambahStockMasuk({
        tanggal: form.tanggal,
        jenis_item: form.jenis_item,
        berat_kg: parseFloat(form.berat_kg),
        harga_per_kg: parseFloat(form.harga_per_kg),
        total_harga: totalHarga,
        catatan: form.catatan,
        notaId,
      })

      setForm({ tanggal: getTodayISO(), jenis_item: form.jenis_item, berat_kg: '', harga_per_kg: '', catatan: '' })
      setNotaFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      await loadData()
    } finally {
      setUploading(false)
    }
  }

  const handleHapus = async (id: string) => {
    if (confirm('Hapus data ini?')) {
      await hapusStockMasuk(id)
      await loadData()
    }
  }

  const grouped = list.reduce((acc, item) => { if (!acc[item.tanggal]) acc[item.tanggal] = []; acc[item.tanggal].push(item); return acc }, {} as Record<string, StockMasuk[]>)
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
  const filteredList = filterTanggal ? list.filter(i => i.tanggal === filterTanggal) : list
  const filteredBerat = filteredList.reduce((s, i) => s + i.berat_kg, 0)
  const filteredTotal = filteredList.reduce((s, i) => s + i.total_harga, 0)

  return (
    <div>
      <PageHeader title="Stock Masuk" description="Catat pembelian bawang mentah" />

      <div className={`grid grid-cols-1 gap-6 ${isAdmin ? 'lg:grid-cols-5' : ''}`}>
        {isAdmin && (
        <div className="col-span-1 lg:col-span-2">
          <FormCard title="Form Pembelian Bawang" description="Input data stok masuk">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tanggal</label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={e => setForm({ ...form, tanggal: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jenis Item</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['bawang_putih', 'bawang_merah'] as JenisItem[]).map(j => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => setForm({ ...form, jenis_item: j })}
                      className={`py-2.5 rounded-xl border text-sm font-semibold transition cursor-pointer ${
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Berat (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="contoh: 100"
                  value={form.berat_kg}
                  onChange={e => setForm({ ...form, berat_kg: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Harga Beli per kg (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="contoh: 15000"
                  value={form.harga_per_kg}
                  onChange={e => setForm({ ...form, harga_per_kg: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500"
                  required
                />
              </div>

              {totalHarga > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 dark:bg-blue-900/30 dark:border-blue-800">
                  <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">Total Pembelian</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-200 mt-0.5">{formatRupiah(totalHarga)}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Catatan (opsional)</label>
                <textarea
                  placeholder="Nama supplier, dll."
                  value={form.catatan}
                  onChange={e => setForm({ ...form, catatan: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition resize-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Nota Belanja */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nota Belanja (opsional)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full rounded-xl border-2 border-dashed px-4 py-3 cursor-pointer transition-colors ${
                    notaFile
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-600'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:hover:border-slate-500'
                  }`}
                >
                  {notaFile ? (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium truncate">{notaFile.name}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">{formatUkuran(notaFile.size)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span className="text-xs">Upload foto nota / PDF</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={e => setNotaFile(e.target.files?.[0] ?? null)}
                />
                {notaFile && (
                  <button
                    type="button"
                    onClick={() => { setNotaFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="mt-1 text-xs text-red-500 hover:text-red-600 cursor-pointer"
                  >
                    Hapus nota
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors duration-150 cursor-pointer"
              >
                {uploading ? 'Menyimpan...' : 'Simpan Pembelian'}
              </button>

              {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 text-sm font-medium text-center dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300">
                  Data berhasil disimpan!
                </div>
              )}
            </form>
          </FormCard>
        </div>
        )}

        <div className={`col-span-1 ${isAdmin ? 'lg:col-span-3' : ''}`}>
          <FormCard title={`Riwayat Pembelian (${filteredList.length} data)`}>
            {/* Filter tanggal */}
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
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{filterTanggal ? 'Berat Hari Ini' : 'Total Semua Berat'}</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{formatKg(filteredBerat)}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl px-4 py-3">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{filterTanggal ? 'Total Pembelian Hari Ini' : 'Total Semua Pembelian'}</p>
                    <p className="text-sm font-bold text-blue-800 dark:text-blue-200 mt-0.5">{formatRupiah(filteredTotal)}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              {list.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                  <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm">Belum ada data pembelian</p>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                  <p className="text-sm">Tidak ada data untuk tanggal ini</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 pb-3 pr-4">Jenis</th>
                      <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 pb-3 pr-4">Berat</th>
                      <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 pb-3 pr-4">Harga/kg</th>
                      <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 pb-3 pr-4">Total</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                    {filterTanggal
                      ? filteredList.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="py-3 pr-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.jenis_item === 'bawang_putih' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>
                                {item.jenis_item === 'bawang_putih' ? 'Putih' : 'Merah'}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-right font-medium text-slate-800 dark:text-slate-100">{formatKg(item.berat_kg)}</td>
                            <td className="py-3 pr-4 text-right text-slate-600 dark:text-slate-300">{formatRupiah(item.harga_per_kg)}</td>
                            <td className="py-3 pr-4 text-right font-semibold text-blue-700 dark:text-blue-200">{formatRupiah(item.total_harga)}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-1.5">
                                {item.notaId && (
                                  <button onClick={() => bukaInvoice(item.notaId!)} className="text-slate-300 hover:text-blue-500 transition-colors cursor-pointer" title="Lihat Nota">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                  </button>
                                )}
                                {isAdmin && (
                                  <button onClick={() => handleHapus(item.id)} className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer" title="Hapus">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                )}
                              </div>
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
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.jenis_item === 'bawang_putih' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>
                                  {item.jenis_item === 'bawang_putih' ? 'Putih' : 'Merah'}
                                </span>
                              </td>
                              <td className="py-3 pr-4 text-right font-medium text-slate-800 dark:text-slate-100">{formatKg(item.berat_kg)}</td>
                              <td className="py-3 pr-4 text-right text-slate-600 dark:text-slate-300">{formatRupiah(item.harga_per_kg)}</td>
                              <td className="py-3 pr-4 text-right font-semibold text-blue-700 dark:text-blue-200">{formatRupiah(item.total_harga)}</td>
                              <td className="py-3">
                                <div className="flex items-center gap-1.5">
                                  {item.notaId && (
                                    <button onClick={() => bukaInvoice(item.notaId!)} className="text-slate-300 hover:text-blue-500 transition-colors cursor-pointer" title="Lihat Nota">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </button>
                                  )}
                                  {isAdmin && (
                                    <button onClick={() => handleHapus(item.id)} className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer" title="Hapus">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ])
                    }
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                      <td colSpan={3} className="pt-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total</td>
                      <td className="pt-3 text-right font-bold text-blue-700 dark:text-blue-200">{formatRupiah(filteredTotal)}</td>
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
