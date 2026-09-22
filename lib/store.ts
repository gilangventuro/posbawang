'use client'

import { supabase } from './supabase'
import { AppData, StockMasuk, JasaKupas, Penjualan, Reseller, Hutang, CicilanHutang, RingkasanKeuangan, SnapshotLaporan } from './types'

// ── Mappers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStock(r: any): StockMasuk {
  return { id: r.id, tanggal: r.tanggal, jenis_item: r.jenis_item, berat_kg: Number(r.berat_kg), harga_per_kg: Number(r.harga_per_kg), total_harga: Number(r.total_harga), catatan: r.catatan ?? '', notaId: r.nota_id ?? undefined, createdAt: r.created_at }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapJasa(r: any): JasaKupas {
  return { id: r.id, tanggal: r.tanggal, tipe_kupas: r.tipe_kupas, berat_kg: Number(r.berat_kg), biaya_per_kg: Number(r.biaya_per_kg), total_biaya: Number(r.total_biaya), catatan: r.catatan ?? '', createdAt: r.created_at }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPenjualan(r: any): Penjualan {
  return { id: r.id, tanggal: r.tanggal, jenis_item: r.jenis_item ?? undefined, jenis: r.jenis, berat_kg: Number(r.berat_kg), harga_jual_per_kg: Number(r.harga_jual_per_kg), total_harga: Number(r.total_harga), catatan: r.catatan ?? '', createdAt: r.created_at }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReseller(r: any): Reseller {
  return { id: r.id, tanggal: r.tanggal, nama_reseller: r.nama_reseller, berat_kg: Number(r.berat_kg), fee_per_kg: Number(r.fee_per_kg), total_fee: Number(r.total_fee), catatan: r.catatan ?? '', createdAt: r.created_at }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHutang(r: any): Hutang {
  return { id: r.id, judul: r.judul, jumlahPokok: Number(r.jumlah_pokok), tanggal: r.tanggal, catatan: r.catatan ?? '', createdAt: r.created_at }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCicilan(r: any): CicilanHutang {
  return { id: r.id, hutangId: r.hutang_id, tanggal: r.tanggal, jumlahBayar: Number(r.jumlah_bayar), catatan: r.catatan ?? '', createdAt: r.created_at }
}

// ── getData ───────────────────────────────────────────────────────────────────

export async function getData(): Promise<AppData> {
  const [sm, jk, pj, rs, ht, ci, st] = await Promise.all([
    supabase.from('stock_masuk').select('*').order('created_at'),
    supabase.from('jasa_kupas').select('*').order('created_at'),
    supabase.from('penjualan').select('*').order('created_at'),
    supabase.from('reseller').select('*').order('created_at'),
    supabase.from('hutang').select('*').order('created_at'),
    supabase.from('cicilan_hutang').select('*').order('created_at'),
    supabase.from('settings').select('value').eq('key', 'modal_awal').single(),
  ])
  return {
    stockMasuk: (sm.data ?? []).map(mapStock),
    jasaKupas: (jk.data ?? []).map(mapJasa),
    penjualan: (pj.data ?? []).map(mapPenjualan),
    reseller: (rs.data ?? []).map(mapReseller),
    hutang: (ht.data ?? []).map(mapHutang),
    cicilan: (ci.data ?? []).map(mapCicilan),
    modalAwal: st.data ? Number(st.data.value) : 0,
  }
}

// ── Stock Masuk ───────────────────────────────────────────────────────────────

export async function tambahStockMasuk(item: Omit<StockMasuk, 'id' | 'createdAt'>): Promise<StockMasuk> {
  const { data, error } = await supabase.from('stock_masuk').insert({
    tanggal: item.tanggal, jenis_item: item.jenis_item, berat_kg: item.berat_kg,
    harga_per_kg: item.harga_per_kg, total_harga: item.total_harga, catatan: item.catatan, nota_id: item.notaId ?? null,
  }).select().single()
  if (error) throw error
  return mapStock(data)
}

export async function hapusStockMasuk(id: string): Promise<void> {
  await supabase.from('stock_masuk').delete().eq('id', id)
}

// ── Jasa Kupas ────────────────────────────────────────────────────────────────

export async function tambahJasaKupas(item: Omit<JasaKupas, 'id' | 'createdAt'>): Promise<JasaKupas> {
  const { data, error } = await supabase.from('jasa_kupas').insert({
    tanggal: item.tanggal, tipe_kupas: item.tipe_kupas, berat_kg: item.berat_kg,
    biaya_per_kg: item.biaya_per_kg, total_biaya: item.total_biaya, catatan: item.catatan,
  }).select().single()
  if (error) throw error
  return mapJasa(data)
}

export async function hapusJasaKupas(id: string): Promise<void> {
  await supabase.from('jasa_kupas').delete().eq('id', id)
}

// ── Penjualan ─────────────────────────────────────────────────────────────────

export async function tambahPenjualan(item: Omit<Penjualan, 'id' | 'createdAt'>): Promise<Penjualan> {
  const { data, error } = await supabase.from('penjualan').insert({
    tanggal: item.tanggal, jenis_item: item.jenis_item ?? null, jenis: item.jenis, berat_kg: item.berat_kg,
    harga_jual_per_kg: item.harga_jual_per_kg, total_harga: item.total_harga, catatan: item.catatan,
  }).select().single()
  if (error) throw error
  return mapPenjualan(data)
}

export async function hapusPenjualan(id: string): Promise<void> {
  await supabase.from('penjualan').delete().eq('id', id)
}

// ── Reseller ──────────────────────────────────────────────────────────────────

export async function tambahReseller(item: Omit<Reseller, 'id' | 'createdAt'>): Promise<Reseller> {
  const { data, error } = await supabase.from('reseller').insert({
    tanggal: item.tanggal, nama_reseller: item.nama_reseller, berat_kg: item.berat_kg,
    fee_per_kg: item.fee_per_kg, total_fee: item.total_fee, catatan: item.catatan,
  }).select().single()
  if (error) throw error
  return mapReseller(data)
}

export async function hapusReseller(id: string): Promise<void> {
  await supabase.from('reseller').delete().eq('id', id)
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function setModalAwal(nominal: number): Promise<void> {
  await supabase.from('settings').upsert({ key: 'modal_awal', value: String(nominal) }, { onConflict: 'key' })
}

// ── Hutang ────────────────────────────────────────────────────────────────────

export async function getHutang(): Promise<Hutang[]> {
  const { data } = await supabase.from('hutang').select('*').order('created_at')
  return (data ?? []).map(mapHutang)
}

export async function tambahHutang(item: Omit<Hutang, 'id' | 'createdAt'>): Promise<Hutang> {
  const { data, error } = await supabase.from('hutang').insert({
    judul: item.judul, jumlah_pokok: item.jumlahPokok, tanggal: item.tanggal, catatan: item.catatan,
  }).select().single()
  if (error) throw error
  return mapHutang(data)
}

export async function hapusHutang(id: string): Promise<void> {
  await supabase.from('hutang').delete().eq('id', id)
}

// ── Cicilan ───────────────────────────────────────────────────────────────────

export async function getCicilan(): Promise<CicilanHutang[]> {
  const { data } = await supabase.from('cicilan_hutang').select('*').order('created_at')
  return (data ?? []).map(mapCicilan)
}

export async function tambahCicilan(item: Omit<CicilanHutang, 'id' | 'createdAt'>): Promise<CicilanHutang> {
  const { data, error } = await supabase.from('cicilan_hutang').insert({
    hutang_id: item.hutangId, tanggal: item.tanggal, jumlah_bayar: item.jumlahBayar, catatan: item.catatan,
  }).select().single()
  if (error) throw error
  return mapCicilan(data)
}

export async function hapusCicilan(id: string): Promise<void> {
  await supabase.from('cicilan_hutang').delete().eq('id', id)
}

// ── Snapshots ─────────────────────────────────────────────────────────────────

export async function getSnapshots(): Promise<SnapshotLaporan[]> {
  const { data } = await supabase.from('snapshots').select('*').order('tanggal_simpan', { ascending: false })
  return (data ?? []).map(r => ({
    id: r.id, judul: r.judul, catatan: r.catatan ?? '', tanggalSimpan: r.tanggal_simpan,
    ringkasan: r.ringkasan, totalTransaksi: r.total_transaksi,
  }))
}

export async function simpanSnapshot(judul: string, catatan: string): Promise<SnapshotLaporan> {
  const [ringkasan, appData] = await Promise.all([hitungRingkasan(), getData()])
  const { data, error } = await supabase.from('snapshots').insert({
    judul: judul.trim(), catatan: catatan.trim(), ringkasan,
    total_transaksi: { beli: appData.stockMasuk.length, kupas: appData.jasaKupas.length, jual: appData.penjualan.length, reseller: appData.reseller.length },
  }).select().single()
  if (error) throw error
  return { id: data.id, judul: data.judul, catatan: data.catatan ?? '', tanggalSimpan: data.tanggal_simpan, ringkasan: data.ringkasan, totalTransaksi: data.total_transaksi }
}

export async function hapusSnapshot(id: string): Promise<void> {
  await supabase.from('snapshots').delete().eq('id', id)
}

// ── Ringkasan ─────────────────────────────────────────────────────────────────

export async function hitungRingkasan(): Promise<RingkasanKeuangan> {
  const data = await getData()

  const totalPembelian = data.stockMasuk.reduce((s, i) => s + i.total_harga, 0)
  const totalJasaKupas = data.jasaKupas.reduce((s, i) => s + i.total_biaya, 0)
  const totalReseller = data.reseller.reduce((s, i) => s + i.total_fee, 0)
  const totalPengeluaran = totalPembelian + totalJasaKupas + totalReseller
  const totalPendapatan = data.penjualan.reduce((s, i) => s + i.total_harga, 0)
  const keuntungan = totalPendapatan - totalPengeluaran
  const totalCicilan = data.cicilan.reduce((s, i) => s + i.jumlahBayar, 0)
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

// ── Export / Import ───────────────────────────────────────────────────────────

export async function exportDataJSON(): Promise<void> {
  const [data, snapshots] = await Promise.all([getData(), getSnapshots()])
  const backup = { data, snapshots, exportedAt: new Date().toISOString(), version: 2 }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `posbawang_backup_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importDataJSON(json: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(json)
    const appData: AppData = parsed.data ?? parsed

    // Hapus semua data lama
    await Promise.all([
      supabase.from('cicilan_hutang').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('hutang').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('stock_masuk').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('jasa_kupas').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('penjualan').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('reseller').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('snapshots').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    ])

    // Insert data baru
    if (appData.stockMasuk?.length) {
      await supabase.from('stock_masuk').insert(appData.stockMasuk.map(i => ({
        id: i.id, tanggal: i.tanggal, jenis_item: i.jenis_item, berat_kg: i.berat_kg,
        harga_per_kg: i.harga_per_kg, total_harga: i.total_harga, catatan: i.catatan,
        nota_id: i.notaId ?? null, created_at: i.createdAt,
      })))
    }
    if (appData.jasaKupas?.length) {
      await supabase.from('jasa_kupas').insert(appData.jasaKupas.map(i => ({
        id: i.id, tanggal: i.tanggal, tipe_kupas: i.tipe_kupas, berat_kg: i.berat_kg,
        biaya_per_kg: i.biaya_per_kg, total_biaya: i.total_biaya, catatan: i.catatan, created_at: i.createdAt,
      })))
    }
    if (appData.penjualan?.length) {
      await supabase.from('penjualan').insert(appData.penjualan.map(i => ({
        id: i.id, tanggal: i.tanggal, jenis_item: i.jenis_item ?? null, jenis: i.jenis, berat_kg: i.berat_kg,
        harga_jual_per_kg: i.harga_jual_per_kg, total_harga: i.total_harga, catatan: i.catatan, created_at: i.createdAt,
      })))
    }
    if (appData.reseller?.length) {
      await supabase.from('reseller').insert(appData.reseller.map(i => ({
        id: i.id, tanggal: i.tanggal, nama_reseller: i.nama_reseller, berat_kg: i.berat_kg,
        fee_per_kg: i.fee_per_kg, total_fee: i.total_fee, catatan: i.catatan, created_at: i.createdAt,
      })))
    }
    if (appData.hutang?.length) {
      await supabase.from('hutang').insert(appData.hutang.map(i => ({
        id: i.id, judul: i.judul, jumlah_pokok: i.jumlahPokok, tanggal: i.tanggal, catatan: i.catatan, created_at: i.createdAt,
      })))
    }
    if (appData.cicilan?.length) {
      await supabase.from('cicilan_hutang').insert(appData.cicilan.map(i => ({
        id: i.id, hutang_id: i.hutangId, tanggal: i.tanggal, jumlah_bayar: i.jumlahBayar, catatan: i.catatan, created_at: i.createdAt,
      })))
    }
    if (appData.modalAwal !== undefined) {
      await supabase.from('settings').upsert({ key: 'modal_awal', value: String(appData.modalAwal) }, { onConflict: 'key' })
    }
    if (Array.isArray(parsed.snapshots) && parsed.snapshots.length) {
      await supabase.from('snapshots').insert(parsed.snapshots.map((s: SnapshotLaporan) => ({
        id: s.id, judul: s.judul, catatan: s.catatan, tanggal_simpan: s.tanggalSimpan,
        ringkasan: s.ringkasan, total_transaksi: s.totalTransaksi,
      })))
    }
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

// ── Migrasi dari localStorage ─────────────────────────────────────────────────

export async function migrasiDariLocalStorage(): Promise<{ berhasil: number; error: string | null }> {
  try {
    if (typeof window === 'undefined') return { berhasil: 0, error: 'Hanya bisa dijalankan di browser' }
    const raw = localStorage.getItem('posbawang_data')
    if (!raw) return { berhasil: 0, error: 'Tidak ada data localStorage di device ini' }
    const parsed = JSON.parse(raw)
    const snapRaw = localStorage.getItem('posbawang_snapshots')
    const json = JSON.stringify({ data: parsed, snapshots: snapRaw ? JSON.parse(snapRaw) : [] })
    await importDataJSON(json)
    const total = (parsed.stockMasuk?.length ?? 0) + (parsed.jasaKupas?.length ?? 0) +
      (parsed.penjualan?.length ?? 0) + (parsed.reseller?.length ?? 0) +
      (parsed.hutang?.length ?? 0) + (parsed.cicilan?.length ?? 0)
    return { berhasil: total, error: null }
  } catch (e) {
    return { berhasil: 0, error: String(e) }
  }
}
