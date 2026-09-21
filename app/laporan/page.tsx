'use client'

import { useState, useEffect, useRef } from 'react'
import PageHeader from '@/components/PageHeader'
import { hitungRingkasan, getData, setModalAwal } from '@/lib/store'
import { formatRupiah, formatKg, getTodayISO } from '@/lib/utils'
import { RingkasanKeuangan, StockMasuk, JasaKupas, Penjualan, Reseller } from '@/lib/types'
import { simpanInvoice, getSemuaInvoice, bukaInvoice, hapusInvoice, formatUkuran, Invoice } from '@/lib/invoices'

interface RekapHarian {
  tanggal: string
  stockMasuk: StockMasuk[]
  jasaKupas: JasaKupas[]
  penjualan: Penjualan[]
  reseller: Reseller[]
  totalPendapatan: number
  totalPengeluaran: number
  keuntunganHarian: number
}

function formatTanggalPanjang(tanggal: string) {
  const date = new Date(tanggal + 'T00:00:00')
  return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default function LaporanPage() {
  const [ringkasan, setRingkasan] = useState<RingkasanKeuangan | null>(null)
  const [editModal, setEditModal] = useState(false)
  const [inputModal, setInputModal] = useState('')
  const [totalTransaksi, setTotalTransaksi] = useState({ beli: 0, kupas: 0, jual: 0, reseller: 0 })
  const [penjualanPerJenis, setPenjualanPerJenis] = useState({ kupas: { berat: 0, nominal: 0 }, tidak_kupas: { berat: 0, nominal: 0 } })
  const [rekapHarian, setRekapHarian] = useState<RekapHarian[]>([])
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoiceForm, setInvoiceForm] = useState({ tanggal: getTodayISO(), keterangan: '' })
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [uploadingInvoice, setUploadingInvoice] = useState(false)
  const invoiceFileRef = useRef<HTMLInputElement>(null)

  const loadData = () => {
    const r = hitungRingkasan()
    setRingkasan(r)

    const data = getData()
    setTotalTransaksi({
      beli: data.stockMasuk.length,
      kupas: data.jasaKupas.length,
      jual: data.penjualan.length,
      reseller: (data.reseller ?? []).length,
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

    // Rekap harian — kumpulkan semua tanggal unik
    const dateSet = new Set<string>()
    data.stockMasuk.forEach(i => dateSet.add(i.tanggal))
    data.jasaKupas.forEach(i => dateSet.add(i.tanggal))
    data.penjualan.forEach(i => dateSet.add(i.tanggal))
    ;(data.reseller ?? []).forEach(i => dateSet.add(i.tanggal))

    const rekap: RekapHarian[] = Array.from(dateSet)
      .sort((a, b) => b.localeCompare(a))
      .map(tanggal => {
        const sm = data.stockMasuk.filter(i => i.tanggal === tanggal)
        const jk = data.jasaKupas.filter(i => i.tanggal === tanggal)
        const pj = data.penjualan.filter(i => i.tanggal === tanggal)
        const py = (data.reseller ?? []).filter(i => i.tanggal === tanggal)
        const totalPendapatan = pj.reduce((s, i) => s + i.total_harga, 0)
        const totalPengeluaran = sm.reduce((s, i) => s + i.total_harga, 0) + jk.reduce((s, i) => s + i.total_biaya, 0) + py.reduce((s, i) => s + i.total_fee, 0)
        return { tanggal, stockMasuk: sm, jasaKupas: jk, penjualan: pj, reseller: py, totalPendapatan, totalPengeluaran, keuntunganHarian: totalPendapatan - totalPengeluaran }
      })
    setRekapHarian(rekap)
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

  const loadInvoices = async () => {
    const list = await getSemuaInvoice()
    setInvoices(list)
  }

  useEffect(() => {
    loadData()
    loadInvoices()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUploadInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoiceFile) return
    setUploadingInvoice(true)
    try {
      await simpanInvoice(invoiceFile, invoiceForm.tanggal, invoiceForm.keterangan)
      setInvoiceFile(null)
      setInvoiceForm({ tanggal: getTodayISO(), keterangan: '' })
      if (invoiceFileRef.current) invoiceFileRef.current.value = ''
      await loadInvoices()
    } finally {
      setUploadingInvoice(false)
    }
  }

  const handleHapusInvoice = async (id: string) => {
    if (!confirm('Hapus invoice ini?')) return
    await hapusInvoice(id)
    await loadInvoices()
  }

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-500"></div>
                <span className="text-sm text-slate-600 dark:text-slate-200">Fee Reseller</span>
                <span className="text-xs text-slate-400 dark:text-slate-300">({totalTransaksi.reseller}x)</span>
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-white">{formatRupiah(ringkasan.totalReseller)}</span>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-white">Total Pengeluaran</span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">{formatRupiah(ringkasan.totalPengeluaran)}</span>
            </div>
          </div>

          {ringkasan.totalPengeluaran > 0 && (
            <div className="mt-4">
              <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                <div className="bg-blue-500 transition-all" style={{ width: `${(ringkasan.totalPembelian / ringkasan.totalPengeluaran) * 100}%` }} />
                <div className="bg-amber-400 transition-all" style={{ width: `${(ringkasan.totalJasaKupas / ringkasan.totalPengeluaran) * 100}%` }} />
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-6">
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
            <tr className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <td className="px-6 py-3.5 text-slate-600 dark:text-slate-200">Fee Reseller</td>
              <td className="px-6 py-3.5 text-right font-semibold text-red-600 dark:text-red-400">- {formatRupiah(ringkasan.totalReseller)}</td>
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

      {/* Rekap Harian */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-white">Rekap Harian</h3>
          <span className="text-xs text-slate-400 dark:text-slate-400">
            {rekapHarian.length > 0 ? `${rekapHarian.length} hari dengan transaksi` : 'Belum ada transaksi'}
          </span>
        </div>

        {rekapHarian.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm">Belum ada transaksi yang tercatat</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rekapHarian.map(hari => {
              const isOpen = expandedDay === hari.tanggal
              const hariUntung = hari.keuntunganHarian >= 0
              const txCount = [
                hari.penjualan.length > 0 && `${hari.penjualan.length} jual`,
                hari.stockMasuk.length > 0 && `${hari.stockMasuk.length} beli`,
                hari.jasaKupas.length > 0 && `${hari.jasaKupas.length} kupas`,
              ].filter(Boolean).join(' · ')

              return (
                <div key={hari.tanggal} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {/* Header row */}
                  <button
                    onClick={() => setExpandedDay(isOpen ? null : hari.tanggal)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{formatTanggalPanjang(hari.tanggal)}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {hari.totalPendapatan > 0 && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+{formatRupiah(hari.totalPendapatan)}</span>
                        )}
                        {hari.totalPengeluaran > 0 && (
                          <span className="text-xs text-red-500 dark:text-red-400 font-medium">-{formatRupiah(hari.totalPengeluaran)}</span>
                        )}
                        <span className="text-xs text-slate-400 dark:text-slate-500">{txCount}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-sm font-bold ${hariUntung ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {hariUntung && hari.keuntunganHarian !== 0 ? '+' : ''}{formatRupiah(hari.keuntunganHarian)}
                      </span>
                      <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Detail transaksi */}
                  {isOpen && (
                    <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-4 space-y-5">
                      {/* Penjualan */}
                      {hari.penjualan.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2">Penjualan</p>
                          <div className="space-y-2">
                            {hari.penjualan.map(pj => (
                              <div key={pj.id} className="flex items-start justify-between gap-4">
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                  {formatKg(pj.berat_kg)} {pj.jenis === 'kupas' ? 'Bawang Kupas' : 'Bawang Mentah'}
                                  <span className="text-slate-400 dark:text-slate-500"> @ {formatRupiah(pj.harga_jual_per_kg)}/kg</span>
                                  {pj.catatan && <span className="block text-xs text-slate-400 dark:text-slate-500 mt-0.5">{pj.catatan}</span>}
                                </span>
                                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex-shrink-0">+{formatRupiah(pj.total_harga)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stock Masuk */}
                      {hari.stockMasuk.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">Pembelian Stok</p>
                          <div className="space-y-2">
                            {hari.stockMasuk.map(sm => (
                              <div key={sm.id} className="flex items-start justify-between gap-4">
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                  {formatKg(sm.berat_kg)} {sm.jenis_item === 'bawang_putih' ? 'Bawang Putih' : 'Bawang Merah'}
                                  <span className="text-slate-400 dark:text-slate-500"> @ {formatRupiah(sm.harga_per_kg)}/kg</span>
                                  {sm.catatan && <span className="block text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sm.catatan}</span>}
                                </span>
                                <span className="text-sm font-semibold text-red-600 dark:text-red-400 flex-shrink-0">-{formatRupiah(sm.total_harga)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Jasa Kupas */}
                      {hari.jasaKupas.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2">Jasa Kupas</p>
                          <div className="space-y-2">
                            {hari.jasaKupas.map(jk => (
                              <div key={jk.id} className="flex items-start justify-between gap-4">
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                  {formatKg(jk.berat_kg)} {jk.tipe_kupas === 'sendiri' ? '(Kupas Sendiri — gratis)' : `@ ${formatRupiah(jk.biaya_per_kg)}/kg`}
                                  {jk.catatan && <span className="block text-xs text-slate-400 dark:text-slate-500 mt-0.5">{jk.catatan}</span>}
                                </span>
                                <span className="text-sm font-semibold flex-shrink-0">
                                  {jk.total_biaya > 0
                                    ? <span className="text-red-600 dark:text-red-400">-{formatRupiah(jk.total_biaya)}</span>
                                    : <span className="text-slate-400 dark:text-slate-500">Rp 0</span>
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reseller */}
                      {hari.reseller.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-2">Fee Reseller</p>
                          <div className="space-y-2">
                            {hari.reseller.map(py => (
                              <div key={py.id} className="flex items-start justify-between gap-4">
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                  {py.nama_reseller} — {formatKg(py.berat_kg)}
                                  <span className="text-slate-400 dark:text-slate-500"> @ {formatRupiah(py.fee_per_kg)}/kg</span>
                                  {py.catatan && <span className="block text-xs text-slate-400 dark:text-slate-500 mt-0.5">{py.catatan}</span>}
                                </span>
                                <span className="text-sm font-semibold text-red-600 dark:text-red-400 flex-shrink-0">-{formatRupiah(py.total_fee)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Total hari */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Total hari ini</span>
                        <span className={`text-sm font-bold ${hariUntung ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'}`}>
                          {hariUntung && hari.keuntunganHarian !== 0 ? '+' : ''}{formatRupiah(hari.keuntunganHarian)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Invoice & Bukti */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-white">Invoice &amp; Bukti</h3>
          <span className="text-xs text-slate-400 dark:text-slate-400">{invoices.length} file tersimpan</span>
        </div>

        <div className="grid grid-cols-5 gap-6">
          {/* Upload form */}
          <div className="col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wide mb-4">Upload Bukti</h4>
              <form onSubmit={handleUploadInvoice} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tanggal</label>
                  <input
                    type="date"
                    value={invoiceForm.tanggal}
                    onChange={e => setInvoiceForm({ ...invoiceForm, tanggal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Keterangan (opsional)</label>
                  <input
                    type="text"
                    placeholder="contoh: Faktur pembelian supplier A"
                    value={invoiceForm.keterangan}
                    onChange={e => setInvoiceForm({ ...invoiceForm, keterangan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">File (gambar / PDF)</label>
                  <div
                    onClick={() => invoiceFileRef.current?.click()}
                    className={`w-full rounded-xl border-2 border-dashed px-4 py-4 cursor-pointer transition-colors text-center ${
                      invoiceFile
                        ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-600'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:hover:border-slate-500'
                    }`}
                  >
                    {invoiceFile ? (
                      <div>
                        <svg className="w-6 h-6 mx-auto mb-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-purple-700 dark:text-purple-300 font-medium truncate">{invoiceFile.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatUkuran(invoiceFile.size)}</p>
                      </div>
                    ) : (
                      <div>
                        <svg className="w-6 h-6 mx-auto mb-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Klik untuk pilih file</p>
                        <p className="text-xs text-slate-300 dark:text-slate-600 mt-0.5">JPG, PNG, PDF</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={invoiceFileRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={e => setInvoiceFile(e.target.files?.[0] ?? null)}
                  />
                  {invoiceFile && (
                    <button
                      type="button"
                      onClick={() => { setInvoiceFile(null); if (invoiceFileRef.current) invoiceFileRef.current.value = '' }}
                      className="mt-1 text-xs text-red-500 hover:text-red-600 cursor-pointer"
                    >
                      Hapus file
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!invoiceFile || uploadingInvoice}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  {uploadingInvoice ? 'Menyimpan...' : 'Simpan Invoice'}
                </button>
              </form>
            </div>
          </div>

          {/* Invoice list */}
          <div className="col-span-3">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {invoices.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                  <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">Belum ada invoice tersimpan</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-700">
                  {invoices.map(inv => {
                    const isPdf = inv.tipe === 'application/pdf'
                    return (
                      <div key={inv.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isPdf ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                          {isPdf ? (
                            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{inv.nama}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-400 dark:text-slate-500">{inv.tanggal}</span>
                            {inv.keterangan && <span className="text-xs text-slate-500 dark:text-slate-400 truncate">· {inv.keterangan}</span>}
                            <span className="text-xs text-slate-300 dark:text-slate-600">· {formatUkuran(inv.ukuran)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => bukaInvoice(inv.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-medium transition cursor-pointer"
                            title="Lihat"
                          >
                            Lihat
                          </button>
                          <button
                            onClick={() => handleHapusInvoice(inv.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer"
                            title="Hapus"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
