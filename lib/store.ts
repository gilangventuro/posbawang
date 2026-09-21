'use client'

import { AppData, StockMasuk, JasaKupas, Penjualan, Penyalur, RingkasanKeuangan } from './types'

const STORAGE_KEY = 'posbawang_data'

const defaultData: AppData = {
  stockMasuk: [],
  jasaKupas: [],
  penjualan: [],
  penyalur: [],
  modalAwal: 0,
}

export function getData(): AppData {
  if (typeof window === 'undefined') return defaultData
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData
    const parsed = JSON.parse(raw)
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

export function tambahPenyalur(item: Omit<Penyalur, 'id' | 'createdAt'>) {
  const data = getData()
  const newItem: Penyalur = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  data.penyalur.push(newItem)
  saveData(data)
  return newItem
}

export function hapusPenyalur(id: string) {
  const data = getData()
  data.penyalur = data.penyalur.filter(i => i.id !== id)
  saveData(data)
}

export function setModalAwal(nominal: number) {
  const data = getData()
  data.modalAwal = nominal
  saveData(data)
}

export function hitungRingkasan(): RingkasanKeuangan {
  const data = getData()

  const totalPembelian = data.stockMasuk.reduce((s, i) => s + i.total_harga, 0)
  const totalJasaKupas = data.jasaKupas.reduce((s, i) => s + i.total_biaya, 0)
  const totalPenyalur = (data.penyalur ?? []).reduce((s, i) => s + i.total_fee, 0)
  const totalPengeluaran = totalPembelian + totalJasaKupas + totalPenyalur
  const totalPendapatan = data.penjualan.reduce((s, i) => s + i.total_harga, 0)
  const keuntungan = totalPendapatan - totalPengeluaran

  const totalBeliKg = data.stockMasuk.reduce((s, i) => s + i.berat_kg, 0)
  const totalKupasKg = data.jasaKupas.reduce((s, i) => s + i.berat_kg, 0)
  const totalJualTidakKupasKg = data.penjualan.filter(i => i.jenis === 'tidak_kupas').reduce((s, i) => s + i.berat_kg, 0)
  const totalJualKupasKg = data.penjualan.filter(i => i.jenis === 'kupas').reduce((s, i) => s + i.berat_kg, 0)

  const stokBawangMentah = Math.max(0, totalBeliKg - totalKupasKg - totalJualTidakKupasKg)
  const stokBawangKupas = Math.max(0, totalKupasKg - totalJualKupasKg)

  const modalAwal = data.modalAwal ?? 0
  const saldoAkhir = modalAwal + keuntungan

  return { modalAwal, totalPembelian, totalJasaKupas, totalPenyalur, totalPengeluaran, totalPendapatan, keuntungan, saldoAkhir, stokBawangMentah, stokBawangKupas }
}
