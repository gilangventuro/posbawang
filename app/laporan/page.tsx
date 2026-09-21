'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'
import { hitungRingkasan, getData, setModalAwal } from '@/lib/store'
import { formatRupiah, formatKg } from '@/lib/utils'
import { RingkasanKeuangan } from '@/lib/types'

export default function LaporanPage() {
  const [ringkasan, setRingkasan] = useState<RingkasanKeuangan | null>(null)
  const [editModal, setEditModal] = useState(false)
  const [inputModal, setInputModal] = useState('')
  const [totalTransaksi, setTotalTransaksi] = useState({ beli: 0, kupas: 0, jual: 0 })
  const [penjualanPerJenis, setPenjualanPerJenis] = useState({ kupas: { berat: 0, nominal: 0 }, tidak_kupas: { berat: 0, nominal: 0 } })

  const loadData = () => {
    const r = hitungRingkasan()
    setRingkasan(r)

    const data = getData()
    setTotalTransaksi({
      beli: data.stockMasuk.length,
      kupas: data.jasaKupas.length,
      jual: data.penjualan.length,
    })

    const jualKupas = data.penjualan.filter(i => i.jenis === 'kupas')
    const jualTidakKupas = data.penjualan.filter(i => i.jenis === 'tidak_kupas')
    setPenjualanPerJenis({
      kupas: {
        berat: jualKupas.reduce((s, i) => s + i.berat_kg, 0),
        nominal: jualKupas.reduce((s, i) => s + i.total_harga, 0),
      },
      tidak_kupas: {
        berat: jualTidakKupas.reduce((s, i) => s + i.berat_kg, 0),
        nominal: jualTidakKupas.reduce((s, i) => s + i.total_harga, 0),
      },
    })
  }

  const handleSimpanModal = () => {
    const nilai = parseFloat(inputModal.replace(/\./g, '').replace(',', '.'))
    if (!isNaN(nilai) && nilai >= 0) {
      setModalAwal(nilai)
      loadData()
    }
    setEditModal(false)
    setInputModal('')
  }

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ringkasan) return null

  const isUntung = ringkasan.keuntungan >= 0
  const marginPersen = ringkasan.totalPendapatan > 0
    ? ((ringkasan.keuntungan / ringkasan.totalPendapatan) * 100).toFixed(1)
    : '0'

  return (
    <div>
      <PageHeader title="Laporan Keuangan" description="Ringkasan lengkap pendapatan, pengeluaran, dan keuntungan" />

      {/* Keuntungan bersih - hero card */}
      <div className={`rounded-2xl border p-6 mb-6 ${isUntung ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800' : 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${isUntung ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>Keuntungan Bersih</p>
            <p className={`text-4xl font-bold mt-1 ${isUntung ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-700 dark:text-red-300'}`}>
              {formatRupiah(ringkasan.keuntungan)}
            </p>
            <p className={`text-sm mt-2 ${isUntung ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              Margin: <span className="font-bold">{marginPersen}%</span> dari total pendapatan
            </p>
          </div>
          <div className={`text-5xl opacity-20 ${isUntung ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {isUntung ? '↗' : '↘'}
          </div>
        </div>
      </div>

      {/* Keuangan breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-200 uppercase tracking-wide">Total Pendapatan</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{formatRupiah(ringkasan.totalPendapatan)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-300 mt-1">Dari {totalTransaksi.jual} transaksi penjualan</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-200 uppercase tracking-wide">Total Pengeluaran</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">{formatRupiah(ringkasan.totalPengeluaran)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-300 mt-1">Beli stock + Jasa kupas</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-200 uppercase tracking-wide">Stok Tersisa</p>
          <p className="text-base font-bold text-slate-700 dark:text-white mt-1">
            {formatKg(ringkasan.stokBawangMentah)} mentah
          </p>
          <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
            {formatKg(ringkasan.stokBawangKupas)} kupas
          </p>
        </div>
      </div>

      {/* Pengeluaran detail */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-white mb-4">Rincian Pengeluaran</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <span className="text-sm text-slate-600 dark:text-slate-200">Pembelian Stok</span>
                <span className="text-xs text-slate-400 dark:text-slate-300">({totalTransaksi.beli}x)</span>
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-white">{formatRupiah(ringkasan.totalPembelian)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span className="text-sm text-slate-600 dark:text-slate-200">Jasa Kupas</span>
                <span className="text-xs text-slate-400 dark:text-slate-300">({totalTransaksi.kupas}x)</span>
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-white">{formatRupiah(ringkasan.totalJasaKupas)}</span>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-white">Total Pengeluaran</span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">{formatRupiah(ringkasan.totalPengeluaran)}</span>
            </div>
          </div>

          {/* Progress bar pengeluaran */}
          {ringkasan.totalPengeluaran > 0 && (
            <div className="mt-4">
              <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                <div
                  className="bg-blue-500 transition-all"
                  style={{ width: `${(ringkasan.totalPembelian / ringkasan.totalPengeluaran) * 100}%` }}
                />
                <div
                  className="bg-amber-400 transition-all"
                  style={{ width: `${(ringkasan.totalJasaKupas / ringkasan.totalPengeluaran) * 100}%` }}
                />
              </div>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-slate-500 dark:text-slate-300">
                    Stok {ringkasan.totalPengeluaran > 0 ? ((ringkasan.totalPembelian / ringkasan.totalPengeluaran) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <span className="text-xs text-slate-500 dark:text-slate-300">
                    Kupas {ringkasan.totalPengeluaran > 0 ? ((ringkasan.totalJasaKupas / ringkasan.totalPengeluaran) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-white mb-4">Penjualan per Jenis</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Bawang Tidak Kupas</span>
                <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                  {formatKg(penjualanPerJenis.tidak_kupas.berat)}
                </span>
              </div>
              <p className="text-lg font-bold text-blue-800 dark:text-blue-200">{formatRupiah(penjualanPerJenis.tidak_kupas.nominal)}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Bawang Kupas</span>
                <span className="text-xs bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium">
                  {formatKg(penjualanPerJenis.kupas.berat)}
                </span>
              </div>
              <p className="text-lg font-bold text-orange-800 dark:text-orange-200">{formatRupiah(penjualanPerJenis.kupas.nominal)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Awal */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-200 uppercase tracking-wide mb-1">Modal Awal</p>
            {editModal ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  autoFocus
                  placeholder="contoh: 5000000"
                  value={inputModal}
                  onChange={e => setInputModal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSimpanModal(); if (e.key === 'Escape') { setEditModal(false); setInputModal('') } }}
                  className="w-44 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
                <button onClick={handleSimpanModal} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition cursor-pointer">Simpan</button>
                <button onClick={() => { setEditModal(false); setInputModal('') }} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-200 transition cursor-pointer">Batal</button>
              </div>
            ) : (
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatRupiah(ringkasan.modalAwal)}</p>
            )}
          </div>
          {!editModal && (
            <button
              onClick={() => { setEditModal(true); setInputModal(String(ringkasan.modalAwal)) }}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition cursor-pointer"
              title="Ubah modal awal"
            >
              <svg className="w-4 h-4 text-slate-600 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>
        {ringkasan.modalAwal > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-200">Saldo Akhir (Modal Awal + Keuntungan Bersih)</span>
            <span className={`text-base font-bold ${ringkasan.saldoAkhir >= ringkasan.modalAwal ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'}`}>
              {formatRupiah(ringkasan.saldoAkhir)}
            </span>
          </div>
        )}
      </div>

      {/* Ringkasan tabel */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-white">Ringkasan Arus Kas</h3>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {ringkasan.modalAwal > 0 && (
              <tr className="border-b border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <td className="px-6 py-3.5 text-slate-600 dark:text-slate-200">Modal Awal</td>
                <td className="px-6 py-3.5 text-right font-semibold text-slate-700 dark:text-white">{formatRupiah(ringkasan.modalAwal)}</td>
              </tr>
            )}
            <tr className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <td className="px-6 py-3.5 text-slate-600 dark:text-slate-200">Pendapatan Bawang Tidak Kupas</td>
              <td className="px-6 py-3.5 text-right font-semibold text-emerald-700 dark:text-emerald-300">+ {formatRupiah(penjualanPerJenis.tidak_kupas.nominal)}</td>
            </tr>
            <tr className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <td className="px-6 py-3.5 text-slate-600 dark:text-slate-200">Pendapatan Bawang Kupas</td>
              <td className="px-6 py-3.5 text-right font-semibold text-emerald-700 dark:text-emerald-300">+ {formatRupiah(penjualanPerJenis.kupas.nominal)}</td>
            </tr>
            <tr className="border-b border-slate-100 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-900/30">
              <td className="px-6 py-3.5 font-semibold text-slate-700 dark:text-white">Total Pendapatan</td>
              <td className="px-6 py-3.5 text-right font-bold text-emerald-700 dark:text-emerald-300">= {formatRupiah(ringkasan.totalPendapatan)}</td>
            </tr>
            <tr className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <td className="px-6 py-3.5 text-slate-600 dark:text-slate-200">Pengeluaran Pembelian Stok</td>
              <td className="px-6 py-3.5 text-right font-semibold text-red-600 dark:text-red-400">- {formatRupiah(ringkasan.totalPembelian)}</td>
            </tr>
            <tr className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <td className="px-6 py-3.5 text-slate-600 dark:text-slate-200">Pengeluaran Jasa Kupas</td>
              <td className="px-6 py-3.5 text-right font-semibold text-red-600 dark:text-red-400">- {formatRupiah(ringkasan.totalJasaKupas)}</td>
            </tr>
            <tr className="border-b border-slate-100 dark:border-slate-700 bg-red-50 dark:bg-red-900/30">
              <td className="px-6 py-3.5 font-semibold text-slate-700 dark:text-white">Total Pengeluaran</td>
              <td className="px-6 py-3.5 text-right font-bold text-red-600 dark:text-red-400">= {formatRupiah(ringkasan.totalPengeluaran)}</td>
            </tr>
            <tr className={isUntung ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-100 dark:bg-red-900/40'}>
              <td className="px-6 py-4 font-bold text-slate-800 dark:text-white text-base">Keuntungan Bersih</td>
              <td className={`px-6 py-4 text-right font-bold text-xl ${isUntung ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                {formatRupiah(ringkasan.keuntungan)}
              </td>
            </tr>
            {ringkasan.modalAwal > 0 && (
              <tr className="bg-slate-800">
                <td className="px-6 py-4 font-bold text-white text-base">Saldo Akhir</td>
                <td className={`px-6 py-4 text-right font-bold text-xl ${ringkasan.saldoAkhir >= ringkasan.modalAwal ? 'text-emerald-300' : 'text-red-300'}`}>
                  {formatRupiah(ringkasan.saldoAkhir)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
