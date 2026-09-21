'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'
import FormCard from '@/components/FormCard'
import { tambahStockMasuk, getData, hapusStockMasuk } from '@/lib/store'
import { formatRupiah, formatTanggal, formatKg, getTodayISO } from '@/lib/utils'
import { StockMasuk, JenisItem } from '@/lib/types'

export default function StockMasukPage() {
  const [list, setList] = useState<StockMasuk[]>([])
  const [form, setForm] = useState({ tanggal: getTodayISO(), jenis_item: 'bawang_putih' as JenisItem, berat_kg: '', harga_per_kg: '', catatan: '' })
  const [success, setSuccess] = useState(false)

  const loadData = () => setList([...getData().stockMasuk].reverse())

  useEffect(() => { loadData() }, [])

  const totalHarga = (parseFloat(form.berat_kg) || 0) * (parseFloat(form.harga_per_kg) || 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.berat_kg || !form.harga_per_kg) return
    tambahStockMasuk({
      tanggal: form.tanggal,
      jenis_item: form.jenis_item,
      berat_kg: parseFloat(form.berat_kg),
      harga_per_kg: parseFloat(form.harga_per_kg),
      total_harga: totalHarga,
      catatan: form.catatan,
    })
    setForm({ tanggal: getTodayISO(), jenis_item: form.jenis_item, berat_kg: '', harga_per_kg: '', catatan: '' })
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    loadData()
  }

  const handleHapus = (id: string) => {
    if (confirm('Hapus data ini?')) {
      hapusStockMasuk(id)
      loadData()
    }
  }

  return (
    <div>
      <PageHeader title="Stock Masuk" description="Catat pembelian bawang mentah" />

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2">
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
                  step="100"
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

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors duration-150 cursor-pointer"
              >
                Simpan Pembelian
              </button>

              {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 text-sm font-medium text-center dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300">
                  Data berhasil disimpan!
                </div>
              )}
            </form>
          </FormCard>
        </div>

        <div className="col-span-3">
          <FormCard title={`Riwayat Pembelian (${list.length} data)`}>
            <div className="overflow-x-auto">
              {list.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                  <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm">Belum ada data pembelian</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 pb-3 pr-4">Tanggal</th>
                      <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 pb-3 pr-4">Jenis</th>
                      <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 pb-3 pr-4">Berat</th>
                      <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 pb-3 pr-4">Harga/kg</th>
                      <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 pb-3 pr-4">Total</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                    {list.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="py-3 pr-4 text-slate-700 dark:text-slate-200">{formatTanggal(item.tanggal)}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.jenis_item === 'bawang_putih'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {item.jenis_item === 'bawang_putih' ? 'Putih' : 'Merah'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right font-medium text-slate-800 dark:text-slate-100">{formatKg(item.berat_kg)}</td>
                        <td className="py-3 pr-4 text-right text-slate-600 dark:text-slate-300">{formatRupiah(item.harga_per_kg)}</td>
                        <td className="py-3 pr-4 text-right font-semibold text-blue-700 dark:text-blue-200">{formatRupiah(item.total_harga)}</td>
                        <td className="py-3">
                          <button
                            onClick={() => handleHapus(item.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                      <td colSpan={4} className="pt-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total</td>
                      <td className="pt-3 text-right font-bold text-blue-700 dark:text-blue-200">
                        {formatRupiah(list.reduce((s, i) => s + i.total_harga, 0))}
                      </td>
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
