export type JenisBawang = 'tidak_kupas' | 'kupas'
export type JenisItem = 'bawang_putih' | 'bawang_merah'

export interface StockMasuk {
  id: string
  tanggal: string
  jenis_item: JenisItem
  berat_kg: number
  harga_per_kg: number
  total_harga: number
  catatan: string
  createdAt: string
}

export type TipeKupas = 'jasa' | 'sendiri'

export interface JasaKupas {
  id: string
  tanggal: string
  tipe_kupas: TipeKupas
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

export interface Penyalur {
  id: string
  tanggal: string
  nama_penyalur: string
  berat_kg: number
  fee_per_kg: number
  total_fee: number
  catatan: string
  createdAt: string
}

export interface AppData {
  stockMasuk: StockMasuk[]
  jasaKupas: JasaKupas[]
  penjualan: Penjualan[]
  penyalur: Penyalur[]
  modalAwal: number
}

export interface RingkasanKeuangan {
  modalAwal: number
  totalPembelian: number
  totalJasaKupas: number
  totalPenyalur: number
  totalPengeluaran: number
  totalPendapatan: number
  keuntungan: number
  saldoAkhir: number
  stokBawangMentah: number
  stokBawangKupas: number
}
