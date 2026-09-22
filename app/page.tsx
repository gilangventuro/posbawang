'use client'

import { useEffect, useState } from 'react'
import StatCard from '@/components/StatCard'
import PageHeader from '@/components/PageHeader'
import { hitungRingkasan, setModalAwal } from '@/lib/store'
import { formatRupiah, formatKg } from '@/lib/utils'
import { RingkasanKeuangan } from '@/lib/types'
import Link from 'next/link'
import { useRole } from '@/lib/auth'

export default function Dashboard() {
  const [ringkasan, setRingkasan] = useState<RingkasanKeuangan>({
    modalAwal: 0,
    totalPembelian: 0,
    totalJasaKupas: 0,
    totalReseller: 0,
    totalPengeluaran: 0,
    totalPendapatan: 0,
    keuntungan: 0,
    saldoAkhir: 0,
    stokBawangMentah: 0,
    stokBawangKupas: 0,
  })
  const { isAdmin } = useRole()
  const [editModal, setEditModal] = useState(false)
  const [inputModal, setInputModal] = useState('')

  const loadRingkasan = () => setRingkasan(hitungRingkasan())

  useEffect(() => { loadRingkasan() }, [])

  const handleSimpanModal = () => {
    const nilai = parseFloat(inputModal.replace(/\./g, '').replace(',', '.'))
    if (!isNaN(nilai) && nilai >= 0) {
      setModalAwal(nilai)
      loadRingkasan()
    }
    setEditModal(false)
    setInputModal('')
  }

  const quickActions = [
    { href: '/stock-masuk', label: 'Catat Pembelian', desc: 'Tambah stok bawang masuk', color: 'bg-blue-500', icon: 'M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4' },
    { href: '/jasa-kupas', label: 'Catat Jasa Kupas', desc: 'Input biaya jasa kupas', color: 'bg-amber-500', icon: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243zm7.364-4.243a3 3 0 11-4.243 4.243' },
    { href: '/penjualan', label: 'Catat Penjualan', desc: 'Input penjualan bawang', color: 'bg-emerald-500', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
    { href: '/laporan', label: 'Lihat Laporan', desc: 'Laporan keuangan lengkap', color: 'bg-purple-500', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Ringkasan bisnis bawang Anda`}
      />

      {/* Stok Cards */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-200 uppercase tracking-wider mb-3">Stok Saat Ini</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title="Bawang Mentah"
            value={formatKg(ringkasan.stokBawangMentah)}
            subtitle="Siap jual / dikupas"
            color="blue"
            icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
          <StatCard
            title="Bawang Kupas"
            value={formatKg(ringkasan.stokBawangKupas)}
            subtitle="Siap jual"
            color="orange"
            icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </div>
      </section>

      {/* Keuangan Cards */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-200 uppercase tracking-wider mb-3">Ringkasan Keuangan</h2>

        {/* Modal Awal */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-200 uppercase tracking-wide">Modal Awal</p>
              {editModal ? (
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    autoFocus
                    placeholder="contoh: 5000000"
                    value={inputModal}
                    onChange={e => setInputModal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSimpanModal(); if (e.key === 'Escape') { setEditModal(false); setInputModal('') } }}
                    className="w-36 min-w-0 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-800 dark:text-white dark:bg-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                  />
                  <button onClick={handleSimpanModal} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition cursor-pointer">Simpan</button>
                  <button onClick={() => { setEditModal(false); setInputModal('') }} className="px-3 py-1.5 bg-slate-100 text-slate-600 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-200 transition cursor-pointer">Batal</button>
                </div>
              ) : (
                <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{formatRupiah(ringkasan.modalAwal)}</p>
              )}
            </div>
            {!editModal && isAdmin && (
              <button
                onClick={() => { setEditModal(true); setInputModal(String(ringkasan.modalAwal)) }}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
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
              <span className="text-xs text-slate-500 dark:text-slate-300">Saldo Akhir (Modal + Keuntungan)</span>
              <span className={`text-sm font-bold ${ringkasan.saldoAkhir >= ringkasan.modalAwal ? 'text-emerald-700' : 'text-red-600'}`}>
                {formatRupiah(ringkasan.saldoAkhir)}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <StatCard
            title="Total Pendapatan"
            value={formatRupiah(ringkasan.totalPendapatan)}
            subtitle="Dari semua penjualan"
            color="green"
            icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
          <StatCard
            title="Total Pengeluaran"
            value={formatRupiah(ringkasan.totalPengeluaran)}
            subtitle={`Beli: ${formatRupiah(ringkasan.totalPembelian)} + Kupas: ${formatRupiah(ringkasan.totalJasaKupas)} + Reseller: ${formatRupiah(ringkasan.totalReseller)}`}
            color="red"
            icon="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </div>
        <div className={`rounded-2xl border p-5 ${ringkasan.keuntungan >= 0 ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800' : 'bg-red-50 border-red-100 dark:bg-red-900/30 dark:border-red-800'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-200">Keuntungan Bersih</p>
              <p className={`text-3xl font-bold mt-1 ${ringkasan.keuntungan >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatRupiah(ringkasan.keuntungan)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Pendapatan - Pengeluaran</p>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${ringkasan.keuntungan >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <svg className={`w-7 h-7 ${ringkasan.keuntungan >= 0 ? 'text-emerald-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={ringkasan.keuntungan >= 0 ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 'M13 17H5m0 0v-8m0 8l8-8 4 4 6-6'} />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-200 uppercase tracking-wider mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(action => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all duration-150 cursor-pointer"
            >
              <div className={`w-9 h-9 rounded-xl ${action.color} flex items-center justify-center flex-shrink-0`}>
                <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{action.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-300">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
