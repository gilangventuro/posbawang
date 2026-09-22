'use client'

import { AppData, StockMasuk, JasaKupas, Penjualan, Reseller, Hutang, CicilanHutang, RingkasanKeuangan, SnapshotLaporan } from './types'

const STORAGE_KEY = 'posbawang_data'
const SNAPSHOT_KEY = 'posbawang_snapshots'

const defaultData: AppData = {
  stockMasuk: [],
  jasaKupas: [],
  penjualan: [],
  reseller: [],
  hutang: [],
  cicilan: [],
  modalAwal: 0,
}

export function getData(): AppData {
  if (typeof window === 'undefined') return defaultData
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData
    const parsed = JSON.parse(raw)
    // migrate old 'penyalur' field to 'reseller'
    if (parsed.penyalur && !parsed.reseller) {
      parsed.reseller = parsed.penyalur.map((i: Reseller & { nama_penyalur?: string }) => ({
        ...i,
        nama_reseller: i.nama_reseller ?? i.nama_penyalur ?? '',
      }))
      delete parsed.penyalur
    }
    return { ...defaultData, ...parsed }
  } catch {
    return defaultData
  }
}

function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function tambahStockMasuk(item: Omit<StockMasuk, 'id' | 'createdAt'>) {
  const data = getData()
  const newItem: StockMasuk = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  data.stockMasuk.push(newItem)
  saveData(data)
  return newItem
}

export function hapusStockMasuk(id: string) {
  const data = getData()
  data.stockMasuk = data.stockMasuk.filter(i => i.id !== id)
  saveData(data)
}

export function tambahJasaKupas(item: Omit<JasaKupas, 'id' | 'createdAt'>) {
  const data = getData()
  const newItem: JasaKupas = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  data.jasaKupas.push(newItem)
  saveData(data)
  return newItem
}

export function hapusJasaKupas(id: string) {
  const data = getData()
  data.jasaKupas = data.jasaKupas.filter(i => i.id !== id)
  saveData(data)
}

export function tambahPenjualan(item: Omit<Penjualan, 'id' | 'createdAt'>) {
  const data = getData()
  const newItem: Penjualan = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  data.penjualan.push(newItem)
  saveData(data)
  return newItem
}

export function hapusPenjualan(id: string) {
  const data = getData()
  data.penjualan = data.penjualan.filter(i => i.id !== id)
  saveData(data)
}

export function tambahReseller(item: Omit<Reseller, 'id' | 'createdAt'>) {
  const data = getData()
  const newItem: Reseller = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  data.reseller.push(newItem)
  saveData(data)
  return newItem
}

export function hapusReseller(id: string) {
  const data = getData()
  data.reseller = data.reseller.filter(i => i.id !== id)
  saveData(data)
}

export function setModalAwal(nominal: number) {
  const data = getData()
  data.modalAwal = nominal
  saveData(data)
}

// ── Hutang ───────────────────────────────────────────────────────────────────

export function getHutang(): Hutang[] {
  return getData().hutang ?? []
}

export function tambahHutang(item: Omit<Hutang, 'id' | 'createdAt'>) {
  const data = getData()
  const newItem: Hutang = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  if (!data.hutang) data.hutang = []
  data.hutang.push(newItem)
  saveData(data)
  return newItem
}

export function hapusHutang(id: string) {
  const data = getData()
  data.hutang = (data.hutang ?? []).filter(h => h.id !== id)
  data.cicilan = (data.cicilan ?? []).filter(c => c.hutangId !== id)
  saveData(data)
}

// ── Cicilan ──────────────────────────────────────────────────────────────────

export function getCicilan(): CicilanHutang[] {
  return getData().cicilan ?? []
}

export function tambahCicilan(item: Omit<CicilanHutang, 'id' | 'createdAt'>) {
  const data = getData()
  const newItem: CicilanHutang = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  if (!data.cicilan) data.cicilan = []
  data.cicilan.push(newItem)
  saveData(data)
  return newItem
}

export function hapusCicilan(id: string) {
  const data = getData()
  data.cicilan = (data.cicilan ?? []).filter(c => c.id !== id)
  saveData(data)
}

// ── Snapshot Laporan ────────────────────────────────────────────────────────

export function getSnapshots(): SnapshotLaporan[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function simpanSnapshot(judul: string, catatan: string): SnapshotLaporan {
  const snapshots = getSnapshots()
  const data = getData()
  const ringkasan = hitungRingkasan()
  const snap: SnapshotLaporan = {
    id: crypto.randomUUID(),
    judul: judul.trim(),
    catatan: catatan.trim(),
    tanggalSimpan: new Date().toISOString(),
    ringkasan,
    totalTransaksi: {
      beli: data.stockMasuk.length,
      kupas: data.jasaKupas.length,
      jual: data.penjualan.length,
      reseller: (data.reseller ?? []).length,
    },
  }
  snapshots.unshift(snap)
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots))
  return snap
}

export function hapusSnapshot(id: string) {
  const updated = getSnapshots().filter(s => s.id !== id)
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(updated))
}

// ── Backup / Restore ─────────────────────────────────────────────────────────

export function exportDataJSON() {
  const backup = {
    data: getData(),
    snapshots: getSnapshots(),
    exportedAt: new Date().toISOString(),
    version: 1,
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `posbawang_backup_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importDataJSON(json: string): boolean {
  try {
    const parsed = JSON.parse(json)
    const appData: AppData = parsed.data ?? parsed
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData))
    if (Array.isArray(parsed.snapshots)) {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(parsed.snapshots))
    }
    return true
  } catch { return false }
}

// ── Ringkasan ────────────────────────────────────────────────────────────────

export function hitungRingkasan(): RingkasanKeuangan {
  const data = getData()

  const totalPembelian = data.stockMasuk.reduce((s, i) => s + i.total_harga, 0)
  const totalJasaKupas = data.jasaKupas.reduce((s, i) => s + i.total_biaya, 0)
  const totalReseller = (data.reseller ?? []).reduce((s, i) => s + i.total_fee, 0)
  const totalPengeluaran = totalPembelian + totalJasaKupas + totalReseller
  const totalPendapatan = data.penjualan.reduce((s, i) => s + i.total_harga, 0)
  const keuntungan = totalPendapatan - totalPengeluaran
  const totalCicilan = (data.cicilan ?? []).reduce((s, i) => s + i.jumlahBayar, 0)
  const keuntunganSetelahHutang = keuntungan - totalCicilan

  const totalBeliKg = data.stockMasuk.reduce((s, i) => s + i.berat_kg, 0)
  const totalKupasKg = data.jasaKupas.reduce((s, i) => s + i.berat_kg, 0)
  const totalJualTidakKupasKg = data.penjualan.filter(i => i.jenis === 'tidak_kupas').reduce((s, i) => s + i.berat_kg, 0)
  const totalJualKupasKg = data.penjualan.filter(i => i.jenis === 'kupas').reduce((s, i) => s + i.berat_kg, 0)

  const stokBawangMentah = Math.max(0, totalBeliKg - totalKupasKg - totalJualTidakKupasKg)
  const stokBawangKupas = Math.max(0, totalKupasKg - totalJualKupasKg)

  const modalAwal = data.modalAwal ?? 0
  const saldoAkhir = modalAwal + keuntunganSetelahHutang

  return { modalAwal, totalPembelian, totalJasaKupas, totalReseller, totalPengeluaran, totalPendapatan, keuntungan, totalCicilan, keuntunganSetelahHutang, saldoAkhir, stokBawangMentah, stokBawangKupas }
}
