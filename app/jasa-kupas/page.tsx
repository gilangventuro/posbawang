'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'
import FormCard from '@/components/FormCard'
import { tambahJasaKupas, getData, hapusJasaKupas } from '@/lib/store'
import { formatRupiah, formatTanggal, formatKg, getTodayISO } from '@/lib/utils'
import { JasaKupas } from '@/lib/types'

export default function JasaKupasPage() {
  const [list, setList] = useState<JasaKupas[]>([])
  const [form, setForm] = useState({ tanggal: getTodayISO(), berat_kg: '', biaya_per_kg: '', catatan: '' })
  const [success, setSuccess] = useState(false)
  const [stokMentah, setStokMentah] = useState(0)

  const loadData = () => {
    const data = getData()
    setList([...data.jasaKupas].reverse())
    const totalBeli = data.stockMasuk.reduce((s, i) => s + i.berat_kg, 0)
    const totalKupas = data.jasaKupas.reduce((s, i) => s + i.berat_kg, 0)
    const totalJualMentah = data.penjualan.filter(i => i.jenis === 'tidak_kupas').reduce((s, i) => s + i.berat_kg, 0)
    setStokMentah(Math.max(0, totalBeli - totalKupas - totalJualMentah))
  }

  useEffect(() => { loadData() }, [])

  const totalBiaya = (parseFloat(form.berat_kg) || 0) * (parseFloat(form.biaya_per_kg) || 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.berat_kg || !form.biaya_per_kg) return
    tambahJasaKupas({
      tanggal: form.tanggal,
      berat_kg: parseFloat(form.berat_kg),
      biaya_per_kg: parseFloat(form.biaya_per_kg),
      total_biaya: totalBiaya,
      catatan: form.catatan,
    })
    setForm({ tanggal: getTodayISO(), berat_kg: '', biaya_per_kg: '', catatan: '' })
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    loadData()
  }

  const handleHapus = (id: string) => {
    if (confirm('Hapus data ini?')) {
      hapusJasaKupas(id)
      loadData()
    }
  }

  return (
    <div>
      <PageHeader title="Jasa Kupas" description="Catat biaya jasa pengupasan bawang" />

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Stok Bawang Mentah Tersedia</p>
            <p className="text-2xl font-bold text-amber-800 mt-1">{formatKg(stokMentah)}</p>
            <p className="text-xs text-amber-600 mt-0.5">Siap dikupas atau dijual mentah</p>
          </div>

          <FormCard title="Form Jasa Kupas" description="Input biaya pengupasan bawang">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal</label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={e => setForm({ ...form, tanggal: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Berat Dikupas (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="contoh: 50"
                  value={form.berat_kg}
                  onChange={e => setForm({ ...form, berat_kg: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Biaya Jasa per kg (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="contoh: 3000"
                  value={form.biaya_per_kg}
                  onChange={e => setForm({ ...form, biaya_per_kg: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition"
                  required
                />
              </div>

              {totalBiaya > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-amber-600 font-medium">Total Biaya Jasa</p>
                  <p className="text-lg font-bold text-amber-700 mt-0.5">{formatRupiah(totalBiaya)}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Catatan (opsional)</label>
                <textarea
                  placeholder="Nama buruh kupas, dll."
                  value={form.catatan}
                  onChange={e => setForm({ ...form, catatan: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors duration-150 cursor-pointer"
              >
                Simpan Jasa Kupas
              </button>

              {success && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm font-medium text-center">
                  Data berhasil disimpan!
                </div>
              )}
            </form>
          </FormCard>
        </div>

        <div className="col-span-3">
          <FormCard title={`Riwayat Jasa Kupas (${list.length} data)`}>
            <div className="overflow-x-auto">
              {list.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm">Belum ada data jasa kupas</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-500 pb-3 pr-4">Tanggal</th>
                      <th className="text-right text-xs font-semibold text-slate-500 pb-3 pr-4">Berat</th>
                      <th className="text-right text-xs font-semibold text-slate-500 pb-3 pr-4">Biaya/kg</th>
                      <th className="text-right text-xs font-semibold text-slate-500 pb-3 pr-4">Total</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {list.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 pr-4 text-slate-700">{formatTanggal(item.tanggal)}</td>
                        <td className="py-3 pr-4 text-right font-medium text-slate-800">{formatKg(item.berat_kg)}</td>
                        <td className="py-3 pr-4 text-right text-slate-600">{formatRupiah(item.biaya_per_kg)}</td>
                        <td className="py-3 pr-4 text-right font-semibold text-amber-700">{formatRupiah(item.total_biaya)}</td>
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
                    <tr className="border-t-2 border-slate-200">
                      <td colSpan={3} className="pt-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</td>
                      <td className="pt-3 text-right font-bold text-amber-700">
                        {formatRupiah(list.reduce((s, i) => s + i.total_biaya, 0))}
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
