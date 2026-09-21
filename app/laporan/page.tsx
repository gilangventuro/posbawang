'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'
import { hitungRingkasan, getData } from '@/lib/store'
import { formatRupiah, formatKg } from '@/lib/utils'
import { RingkasanKeuangan } from '@/lib/types'

export default function LaporanPage() {
  const [ringkasan, setRingkasan] = useState<RingkasanKeuangan | null>(null)
  const [totalTransaksi, setTotalTransaksi] = useState({ beli: 0, kupas: 0, jual: 0 })
  const [penjualanPerJenis, setPenjualanPerJenis] = useState({ kupas: { berat: 0, nominal: 0 }, tidak_kupas: { berat: 0, nominal: 0 } })

  useEffect(() => {
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
      <div className={`rounded-2xl border p-6 mb-6 ${isUntung ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${isUntung ? 'text-emerald-600' : 'text-red-600'}`}>Keuntungan Bersih</p>
            <p className={`text-4xl font-bold mt-1 ${isUntung ? 'text-emerald-800' : 'text-red-700'}`}>
              {formatRupiah(ringkasan.keuntungan)}
            </p>
            <p className={`text-sm mt-2 ${isUntung ? 'text-emerald-600' : 'text-red-500'}`}>
              Margin: <span className="font-bold">{marginPersen}%</span> dari total pendapatan
            </p>
          </div>
          <div className={`text-5xl opacity-20 ${isUntung ? 'text-emerald-600' : 'text-red-600'}`}>
            {isUntung ? '↗' : '↘'}
          </div>
        </div>
      </div>

      {/* Keuangan breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Pendapatan</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatRupiah(ringkasan.totalPendapatan)}</p>
          <p className="text-xs text-slate-400 mt-1">Dari {totalTransaksi.jual} transaksi penjualan</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Pengeluaran</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatRupiah(ringkasan.totalPengeluaran)}</p>
          <p className="text-xs text-slate-400 mt-1">Beli stock + Jasa kupas</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Stok Tersisa</p>
          <p className="text-base font-bold text-slate-700 mt-1">
            {formatKg(ringkasan.stokBawangMentah)} mentah
          </p>
          <p className="text-sm font-semibold text-orange-600 mt-0.5">
            {formatKg(ringkasan.stokBawangKupas)} kupas
          </p>
        </div>
      </div>

      {/* Pengeluaran detail */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Rincian Pengeluaran</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <span className="text-sm text-slate-600">Pembelian Stok</span>
                <span className="text-xs text-slate-400">({totalTransaksi.beli}x)</span>
              </div>
              <span className="text-sm font-semibold text-slate-800">{formatRupiah(ringkasan.totalPembelian)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span className="text-sm text-slate-600">Jasa Kupas</span>
                <span className="text-xs text-slate-400">({totalTransaksi.kupas}x)</span>
              </div>
              <span className="text-sm font-semibold text-slate-800">{formatRupiah(ringkasan.totalJasaKupas)}</span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between">
              <span className="text-sm font-semibold text-slate-700">Total Pengeluaran</span>
              <span className="text-sm font-bold text-red-600">{formatRupiah(ringkasan.totalPengeluaran)}</span>
            </div>
          </div>

          {/* Progress bar pengeluaran */}
          {ringkasan.totalPengeluaran > 0 && (
            <div className="mt-4">
              <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
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
                  <span className="text-xs text-slate-500">
                    Stok {ringkasan.totalPengeluaran > 0 ? ((ringkasan.totalPembelian / ringkasan.totalPengeluaran) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <span className="text-xs text-slate-500">
                    Kupas {ringkasan.totalPengeluaran > 0 ? ((ringkasan.totalJasaKupas / ringkasan.totalPengeluaran) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Penjualan per Jenis</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Bawang Tidak Kupas</span>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                  {formatKg(penjualanPerJenis.tidak_kupas.berat)}
                </span>
              </div>
              <p className="text-lg font-bold text-blue-800">{formatRupiah(penjualanPerJenis.tidak_kupas.nominal)}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Bawang Kupas</span>
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                  {formatKg(penjualanPerJenis.kupas.berat)}
                </span>
              </div>
              <p className="text-lg font-bold text-orange-800">{formatRupiah(penjualanPerJenis.kupas.nominal)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ringkasan tabel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Ringkasan Arus Kas</h3>
        </div>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-50 hover:bg-slate-50">
              <td className="px-6 py-3.5 text-slate-600">Pendapatan Bawang Tidak Kupas</td>
              <td className="px-6 py-3.5 text-right font-semibold text-emerald-700">+ {formatRupiah(penjualanPerJenis.tidak_kupas.nominal)}</td>
            </tr>
            <tr className="border-b border-slate-50 hover:bg-slate-50">
              <td className="px-6 py-3.5 text-slate-600">Pendapatan Bawang Kupas</td>
              <td className="px-6 py-3.5 text-right font-semibold text-emerald-700">+ {formatRupiah(penjualanPerJenis.kupas.nominal)}</td>
            </tr>
            <tr className="border-b border-slate-100 bg-emerald-50">
              <td className="px-6 py-3.5 font-semibold text-slate-700">Total Pendapatan</td>
              <td className="px-6 py-3.5 text-right font-bold text-emerald-700">= {formatRupiah(ringkasan.totalPendapatan)}</td>
            </tr>
            <tr className="border-b border-slate-50 hover:bg-slate-50">
              <td className="px-6 py-3.5 text-slate-600">Pengeluaran Pembelian Stok</td>
              <td className="px-6 py-3.5 text-right font-semibold text-red-600">- {formatRupiah(ringkasan.totalPembelian)}</td>
            </tr>
            <tr className="border-b border-slate-50 hover:bg-slate-50">
              <td className="px-6 py-3.5 text-slate-600">Pengeluaran Jasa Kupas</td>
              <td className="px-6 py-3.5 text-right font-semibold text-red-600">- {formatRupiah(ringkasan.totalJasaKupas)}</td>
            </tr>
            <tr className="border-b border-slate-100 bg-red-50">
              <td className="px-6 py-3.5 font-semibold text-slate-700">Total Pengeluaran</td>
              <td className="px-6 py-3.5 text-right font-bold text-red-600">= {formatRupiah(ringkasan.totalPengeluaran)}</td>
            </tr>
            <tr className={isUntung ? 'bg-emerald-100' : 'bg-red-100'}>
              <td className="px-6 py-4 font-bold text-slate-800 text-base">Keuntungan Bersih</td>
              <td className={`px-6 py-4 text-right font-bold text-xl ${isUntung ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatRupiah(ringkasan.keuntungan)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
