'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'
import FormCard from '@/components/FormCard'
import { tambahPenyalur, hapusPenyalur, getData } from '@/lib/store'
import { formatRupiah, formatKg, formatTanggal } from '@/lib/utils'
import { Penyalur } from '@/lib/types'

const FEE_PRESETS = [3000, 5000, 7000, 10000]

export default function PenyalurPage() {
  const [list, setList] = useState<Penyalur[]>([])
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [namaPenyalur, setNamaPenyalur] = useState('')
  const [beratKg, setBeratKg] = useState('')
  const [feePerKg, setFeePerKg] = useState('')
  const [catatan, setCatatan] = useState('')
  const [loading, setLoading] = useState(false)
  const [sukses, setSukses] = useState(false)

  const loadData = () => setList([...getData().penyalur].reverse())

  useEffect(() => { loadData() }, [])

  const totalFee = (parseFloat(beratKg) || 0) * (parseFloat(feePerKg) || 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const berat = parseFloat(beratKg)
    const fee = parseFloat(feePerKg)
    if (!namaPenyalur.trim() || !berat || berat <= 0 || !fee || fee <= 0) return

    setLoading(true)
    tambahPenyalur({
      tanggal,
      nama_penyalur: namaPenyalur.trim(),
      berat_kg: berat,
      fee_per_kg: fee,
      total_fee: berat * fee,
      catatan,
    })
    loadData()
    setNamaPenyalur('')
    setBeratKg('')
    setFeePerKg('')
    setCatatan('')
    setSukses(true)
    setLoading(false)
    setTimeout(() => setSukses(false), 3000)
  }

  const handleHapus = (id: string) => {
    hapusPenyalur(id)
    loadData()
  }

  const isValid = namaPenyalur.trim() && parseFloat(beratKg) > 0 && parseFloat(feePerKg) > 0

  return (
    <div>
      <PageHeader title="Penyalur" description="Catat fee pihak ketiga sebagai penyalur bawang" />

      <FormCard title="Catat Fee Penyalur" description="Fee penyalur dihitung sebagai pengeluaran">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wide mb-1.5">Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wide mb-1.5">Nama Penyalur</label>
              <input
                type="text"
                placeholder="contoh: Pak Budi"
                value={namaPenyalur}
                onChange={e => setNamaPenyalur(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wide mb-1.5">Berat (kg)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={beratKg}
                onChange={e => setBeratKg(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wide mb-1.5">Fee per Kg (Rp)</label>
              <input
                type="number"
                min="0"
                step="500"
                placeholder="0"
                value={feePerKg}
                onChange={e => setFeePerKg(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {FEE_PRESETS.map(fee => (
                  <button
                    key={fee}
                    type="button"
                    onClick={() => setFeePerKg(String(fee))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      feePerKg === String(fee)
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-900/30'
                    }`}
                  >
                    {formatRupiah(fee)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Total preview */}
          {totalFee > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
              <span className="text-sm text-red-700 dark:text-red-300 font-medium">Total Fee Penyalur</span>
              <span className="text-lg font-bold text-red-700 dark:text-red-300">{formatRupiah(totalFee)}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wide mb-1.5">Catatan (opsional)</label>
            <input
              type="text"
              placeholder="Keterangan tambahan..."
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
            />
          </div>

          {sukses && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Fee penyalur berhasil dicatat</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            {loading ? 'Menyimpan...' : 'Simpan Fee Penyalur'}
          </button>
        </form>
      </FormCard>

      {/* Riwayat */}
      {list.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-white mb-3">Riwayat Fee Penyalur</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600">
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Tanggal</th>
                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Penyalur</th>
                    <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Berat</th>
                    <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Fee/kg</th>
                    <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Total Fee</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {list.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatTanggal(item.tanggal)}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-800 dark:text-white font-medium">{item.nama_penyalur}</p>
                        {item.catatan && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.catatan}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-700 dark:text-slate-200">{formatKg(item.berat_kg)}</td>
                      <td className="px-5 py-3.5 text-right text-slate-600 dark:text-slate-300">{formatRupiah(item.fee_per_kg)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-red-600 dark:text-red-400">-{formatRupiah(item.total_fee)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleHapus(item.id)}
                          className="text-slate-400 hover:text-red-500 transition cursor-pointer"
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
                <tfoot className="bg-slate-50 dark:bg-slate-700 border-t border-slate-200 dark:border-slate-600">
                  <tr>
                    <td colSpan={4} className="px-5 py-3 text-sm font-semibold text-slate-700 dark:text-white">Total</td>
                    <td className="px-5 py-3 text-right font-bold text-red-600 dark:text-red-400">
                      -{formatRupiah(list.reduce((s, i) => s + i.total_fee, 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
