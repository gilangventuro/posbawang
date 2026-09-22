'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'
import { getData } from '@/lib/store'
import { formatRupiah, formatTanggal, formatKg } from '@/lib/utils'

type TabType = 'semua' | 'pembelian' | 'jasa_kupas' | 'penjualan' | 'reseller'

interface TransaksiItem {
  id: string
  tanggal: string
  kategori: TabType
  deskripsi: string
  berat: number
  jumlah: number
  tipe: 'masuk' | 'keluar'
  catatan: string
  createdAt: string
}

export default function RiwayatPage() {
  const [items, setItems] = useState<TransaksiItem[]>([])
  const [tab, setTab] = useState<TabType>('semua')
  const [cari, setCari] = useState('')

  useEffect(() => {
    const load = async () => {
    const data = await getData()
    const semua: TransaksiItem[] = [
      ...data.stockMasuk.map(i => ({
        id: i.id,
        tanggal: i.tanggal,
        kategori: 'pembelian' as TabType,
        deskripsi: `Beli ${i.jenis_item === 'bawang_putih' ? 'bawang putih' : 'bawang merah'} ${i.berat_kg} kg @ ${formatRupiah(i.harga_per_kg)}/kg`,
        berat: i.berat_kg,
        jumlah: i.total_harga,
        tipe: 'keluar' as const,
        catatan: i.catatan,
        createdAt: i.createdAt,
      })),
      ...data.jasaKupas.map(i => ({
        id: i.id,
        tanggal: i.tanggal,
        kategori: 'jasa_kupas' as TabType,
        deskripsi: `${i.tipe_kupas === 'sendiri' ? 'Kupas sendiri' : 'Jasa kupas'} ${i.berat_kg} kg${i.tipe_kupas === 'jasa' ? ` @ ${formatRupiah(i.biaya_per_kg)}/kg` : ''}`,
        berat: i.berat_kg,
        jumlah: i.total_biaya,
        tipe: 'keluar' as const,
        catatan: i.catatan,
        createdAt: i.createdAt,
      })),
      ...data.penjualan.map(i => ({
        id: i.id,
        tanggal: i.tanggal,
        kategori: 'penjualan' as TabType,
        deskripsi: `Jual bawang ${i.jenis === 'kupas' ? 'kupas' : 'tidak kupas'} ${i.berat_kg} kg @ ${formatRupiah(i.harga_jual_per_kg)}/kg`,
        berat: i.berat_kg,
        jumlah: i.total_harga,
        tipe: 'masuk' as const,
        catatan: i.catatan,
        createdAt: i.createdAt,
      })),
      ...(data.reseller ?? []).map(i => ({
        id: i.id,
        tanggal: i.tanggal,
        kategori: 'reseller' as TabType,
        deskripsi: `Fee reseller ${i.nama_reseller} — ${formatKg(i.berat_kg)} @ ${formatRupiah(i.fee_per_kg)}/kg`,
        berat: i.berat_kg,
        jumlah: i.total_fee,
        tipe: 'keluar' as const,
        catatan: i.catatan,
        createdAt: i.createdAt,
      })),
    ]
    semua.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setItems(semua)
    }
    load()
  }, [])

  const filtered = items.filter(item => {
    const matchTab = tab === 'semua' || item.kategori === tab
    const matchCari = cari === '' || item.deskripsi.toLowerCase().includes(cari.toLowerCase()) || item.catatan.toLowerCase().includes(cari.toLowerCase())
    return matchTab && matchCari
  })

  const tabConfig: { key: TabType; label: string; count: number }[] = [
    { key: 'semua', label: 'Semua', count: items.length },
    { key: 'pembelian', label: 'Pembelian', count: items.filter(i => i.kategori === 'pembelian').length },
    { key: 'jasa_kupas', label: 'Jasa Kupas', count: items.filter(i => i.kategori === 'jasa_kupas').length },
    { key: 'penjualan', label: 'Penjualan', count: items.filter(i => i.kategori === 'penjualan').length },
    { key: 'reseller', label: 'Reseller', count: items.filter(i => i.kategori === 'reseller').length },
  ]

  const kategoriConfig: Record<TabType, { label: string; color: string }> = {
    pembelian: { label: 'Pembelian', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    jasa_kupas: { label: 'Jasa Kupas', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    penjualan: { label: 'Penjualan', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    reseller: { label: 'Reseller', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
    semua: { label: '', color: '' },
  }

  return (
    <div>
      <PageHeader title="Riwayat Transaksi" description="Semua catatan pembelian, jasa kupas, penjualan, dan fee reseller" />

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-1 mb-5">
        {tabConfig.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
              tab === t.key
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
            <span className={`text-xs rounded-full px-1.5 py-0.5 ${tab === t.key ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Cari transaksi..."
          value={cari}
          onChange={e => setCari(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">Belum ada transaksi</p>
            <p className="text-xs mt-1">Mulai catat pembelian atau penjualan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Tanggal</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Kategori</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Deskripsi</th>
                  <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Jumlah</th>
                  <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Tipe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatTanggal(item.tanggal)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${kategoriConfig[item.kategori].color}`}>
                        {kategoriConfig[item.kategori].label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-800 dark:text-slate-100">
                      <p>{item.deskripsi}</p>
                      {item.catatan && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.catatan}</p>}
                    </td>
                    <td className={`px-5 py-3.5 text-right font-semibold whitespace-nowrap ${item.tipe === 'masuk' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {item.tipe === 'masuk' ? '+' : '-'} {formatRupiah(item.jumlah)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.tipe === 'masuk' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                        {item.tipe === 'masuk' ? 'Pendapatan' : 'Pengeluaran'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
