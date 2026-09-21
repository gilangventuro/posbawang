export type JenisBawang = 'tidak_kupas' | 'kupas'

export interface StockMasuk {
  id: string
  tanggal: string
  berat_kg: number
  harga_per_kg: number
  total_harga: number
  catatan: string
  createdAt: string
}

export interface JasaKupas {
  id: string
  tanggal: string
  berat_kg: number
  biaya_per_kg: number
  total_biaya: number
  catatan: string
  createdAt: string
}

export interface Penjualan {
  id: string
  tanggal: string
  jenis: JenisBawang
  berat_kg: number
  harga_jual_per_kg: number
  total_harga: number
  catatan: string
  createdAt: string
}

export interface AppData {
  stockMasuk: StockMasuk[]
  jasaKupas: JasaKupas[]
  penjualan: Penjualan[]
}

export interface RingkasanKeuangan {
  totalPembelian: number
  totalJasaKupas: number
  totalPengeluaran: number
  totalPendapatan: number
  keuntungan: number
  stokBawangMentah: number
  stokBawangKupas: number
}
