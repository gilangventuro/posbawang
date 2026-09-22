'use client'

import { RingkasanKeuangan, StockMasuk, JasaKupas, Penjualan, Reseller } from './types'

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

function rp(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

function kg(n: number) {
  return n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' kg'
}

function tglPanjang(t: string) {
  return new Date(t + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function cetakLaporanPDF(
  ringkasan: RingkasanKeuangan,
  rekapHarian: RekapHarian[],
  totalTransaksi: { beli: number; kupas: number; jual: number; reseller: number },
  penjualanPerJenis: { kupas: { berat: number; nominal: number }; tidak_kupas: { berat: number; nominal: number } },
) {
  const now = new Date()
  const tanggalCetak = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const waktuCetak = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const isUntung = ringkasan.keuntungan >= 0

  const rekapRows = rekapHarian.map(hari => {
    const detail: string[] = []

    hari.penjualan.forEach(p => {
      detail.push(`
        <tr class="detail-row">
          <td class="pl-8">↳ Penjualan ${p.jenis === 'kupas' ? 'Bawang Kupas' : 'Bawang Mentah'} ${kg(p.berat_kg)} @ ${rp(p.harga_jual_per_kg)}/kg${p.catatan ? ` — ${p.catatan}` : ''}</td>
          <td class="text-right green">+${rp(p.total_harga)}</td>
        </tr>`)
    })
    hari.stockMasuk.forEach(s => {
      detail.push(`
        <tr class="detail-row">
          <td class="pl-8">↳ Beli ${s.jenis_item === 'bawang_putih' ? 'Bawang Putih' : 'Bawang Merah'} ${kg(s.berat_kg)} @ ${rp(s.harga_per_kg)}/kg${s.catatan ? ` — ${s.catatan}` : ''}</td>
          <td class="text-right red">-${rp(s.total_harga)}</td>
        </tr>`)
    })
    hari.jasaKupas.forEach(j => {
      detail.push(`
        <tr class="detail-row">
          <td class="pl-8">↳ ${j.tipe_kupas === 'sendiri' ? 'Kupas Sendiri' : 'Jasa Kupas'} ${kg(j.berat_kg)}${j.tipe_kupas === 'jasa' ? ` @ ${rp(j.biaya_per_kg)}/kg` : ' (gratis)'}${j.catatan ? ` — ${j.catatan}` : ''}</td>
          <td class="text-right ${j.total_biaya > 0 ? 'red' : 'muted'}">${j.total_biaya > 0 ? `-${rp(j.total_biaya)}` : 'Rp 0'}</td>
        </tr>`)
    })
    hari.reseller.forEach(r => {
      detail.push(`
        <tr class="detail-row">
          <td class="pl-8">↳ Fee Reseller ${r.nama_reseller} ${kg(r.berat_kg)} @ ${rp(r.fee_per_kg)}/kg${r.catatan ? ` — ${r.catatan}` : ''}</td>
          <td class="text-right red">-${rp(r.total_fee)}</td>
        </tr>`)
    })

    const hariUntung = hari.keuntunganHarian >= 0
    return `
      <tr class="day-header">
        <td><strong>${tglPanjang(hari.tanggal)}</strong></td>
        <td class="text-right ${hariUntung ? 'green' : 'red'}"><strong>${hariUntung && hari.keuntunganHarian !== 0 ? '+' : ''}${rp(hari.keuntunganHarian)}</strong></td>
      </tr>
      ${detail.join('')}
    `
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan Keuangan — Rumah Bawang</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; background: #fff; }
  .page { padding: 32px 40px; max-width: 900px; margin: 0 auto; }

  /* Header */
  .header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #8B3A9E; padding-bottom: 16px; margin-bottom: 24px; }
  .header-left h1 { font-size: 22px; font-weight: 700; color: #8B3A9E; }
  .header-left p { color: #64748b; margin-top: 2px; font-size: 11px; }
  .header-right { text-align: right; color: #64748b; font-size: 11px; line-height: 1.6; }

  /* Section title */
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 24px 0 10px; }

  /* Hero card */
  .hero { border-radius: 10px; padding: 18px 22px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
  .hero.untung { background: #f0fdf4; border: 1.5px solid #86efac; }
  .hero.rugi   { background: #fef2f2; border: 1.5px solid #fca5a5; }
  .hero-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
  .hero.untung .hero-label { color: #16a34a; }
  .hero.rugi   .hero-label { color: #dc2626; }
  .hero-value { font-size: 28px; font-weight: 800; margin-top: 2px; }
  .hero.untung .hero-value { color: #15803d; }
  .hero.rugi   .hero-value { color: #dc2626; }
  .hero-margin { font-size: 11px; margin-top: 4px; }
  .hero.untung .hero-margin { color: #16a34a; }
  .hero.rugi   .hero-margin { color: #dc2626; }

  /* 3-col summary */
  .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 8px; }
  .summary-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
  .summary-card .label { font-size: 10px; font-weight: 600; text-transform: uppercase; color: #94a3b8; }
  .summary-card .value { font-size: 16px; font-weight: 700; margin-top: 3px; }
  .summary-card .sub   { font-size: 10px; color: #94a3b8; margin-top: 2px; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  th { background: #f8fafc; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; padding: 7px 10px; border-bottom: 1.5px solid #e2e8f0; }
  td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .text-right { text-align: right; }
  .pl-8 { padding-left: 24px; font-size: 11px; color: #475569; }

  /* Rekap harian */
  .day-header td { background: #f8fafc; font-size: 11.5px; padding: 8px 10px; border-top: 1.5px solid #e2e8f0; }
  .detail-row td { color: #475569; }

  /* Totals row */
  .total-row td { font-weight: 700; font-size: 12px; border-top: 2px solid #e2e8f0; padding-top: 9px; }

  /* Colors */
  .green  { color: #16a34a; }
  .red    { color: #dc2626; }
  .muted  { color: #94a3b8; }
  .purple { color: #8B3A9E; }

  /* Stok */
  .stok-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .stok-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
  .stok-card .label { font-size: 10px; font-weight: 600; text-transform: uppercase; color: #94a3b8; }
  .stok-card .value { font-size: 18px; font-weight: 700; margin-top: 2px; }

  /* Footer */
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }

  /* Print */
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 20px 28px; }
    .no-break { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1>Rumah Bawang</h1>
      <p>Laporan Keuangan &amp; Rekap Transaksi</p>
    </div>
    <div class="header-right">
      Dicetak: ${tanggalCetak}, ${waktuCetak}<br>
      Total transaksi: ${totalTransaksi.beli + totalTransaksi.jual + totalTransaksi.kupas + totalTransaksi.reseller} catatan
    </div>
  </div>

  <!-- Keuntungan hero -->
  <div class="no-break">
    <div class="section-title">Ringkasan Utama</div>
    <div class="hero ${isUntung ? 'untung' : 'rugi'}">
      <div>
        <div class="hero-label">Keuntungan Bersih</div>
        <div class="hero-value">${rp(ringkasan.keuntungan)}</div>
        <div class="hero-margin">Pendapatan − Pengeluaran</div>
      </div>
      <div style="font-size:40px;opacity:0.2">${isUntung ? '↗' : '↘'}</div>
    </div>
  </div>

  <!-- 3 summary cards -->
  <div class="summary-grid" style="margin-top:10px;">
    <div class="summary-card">
      <div class="label">Total Pendapatan</div>
      <div class="value green">${rp(ringkasan.totalPendapatan)}</div>
      <div class="sub">${totalTransaksi.jual} transaksi penjualan</div>
    </div>
    <div class="summary-card">
      <div class="label">Total Pengeluaran</div>
      <div class="value red">${rp(ringkasan.totalPengeluaran)}</div>
      <div class="sub">Beli + Kupas + Reseller</div>
    </div>
    <div class="summary-card">
      <div class="label">Stok Tersisa</div>
      <div class="value purple">${kg(ringkasan.stokBawangMentah)}</div>
      <div class="sub">${kg(ringkasan.stokBawangKupas)} bawang kupas</div>
    </div>
  </div>

  <!-- Rincian arus kas -->
  <div class="no-break" style="margin-top:8px;">
    <div class="section-title">Rincian Arus Kas</div>
    <table>
      <thead><tr><th>Keterangan</th><th class="text-right">Nominal</th></tr></thead>
      <tbody>
        ${ringkasan.modalAwal > 0 ? `<tr><td>Modal Awal</td><td class="text-right">${rp(ringkasan.modalAwal)}</td></tr>` : ''}
        <tr><td>Penjualan Bawang Tidak Kupas (${kg(penjualanPerJenis.tidak_kupas.berat)})</td><td class="text-right green">+${rp(penjualanPerJenis.tidak_kupas.nominal)}</td></tr>
        <tr><td>Penjualan Bawang Kupas (${kg(penjualanPerJenis.kupas.berat)})</td><td class="text-right green">+${rp(penjualanPerJenis.kupas.nominal)}</td></tr>
        <tr><td style="font-weight:600">Total Pendapatan</td><td class="text-right green" style="font-weight:700">= ${rp(ringkasan.totalPendapatan)}</td></tr>
        <tr><td>Pembelian Stok (${totalTransaksi.beli}x)</td><td class="text-right red">-${rp(ringkasan.totalPembelian)}</td></tr>
        <tr><td>Jasa Kupas (${totalTransaksi.kupas}x)</td><td class="text-right red">-${rp(ringkasan.totalJasaKupas)}</td></tr>
        <tr><td>Fee Reseller (${totalTransaksi.reseller}x)</td><td class="text-right red">-${rp(ringkasan.totalReseller)}</td></tr>
        <tr><td style="font-weight:600">Total Pengeluaran</td><td class="text-right red" style="font-weight:700">= ${rp(ringkasan.totalPengeluaran)}</td></tr>
        <tr class="total-row"><td>Keuntungan Bersih</td><td class="text-right ${isUntung ? 'green' : 'red'}">${rp(ringkasan.keuntungan)}</td></tr>
        ${ringkasan.modalAwal > 0 ? `<tr class="total-row"><td>Saldo Akhir (Modal + Keuntungan)</td><td class="text-right ${ringkasan.saldoAkhir >= ringkasan.modalAwal ? 'green' : 'red'}">${rp(ringkasan.saldoAkhir)}</td></tr>` : ''}
      </tbody>
    </table>
  </div>

  <!-- Rekap Harian -->
  ${rekapHarian.length > 0 ? `
  <div style="margin-top:8px;">
    <div class="section-title">Rekap Harian (${rekapHarian.length} hari)</div>
    <table>
      <thead><tr><th>Tanggal / Transaksi</th><th class="text-right">Jumlah</th></tr></thead>
      <tbody>${rekapRows}</tbody>
      <tr class="total-row">
        <td>Total Keseluruhan</td>
        <td class="text-right ${isUntung ? 'green' : 'red'}">${rp(ringkasan.keuntungan)}</td>
      </tr>
    </table>
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    <span>© 2026 Rumah Bawang — Laporan ini dicetak otomatis dari sistem</span>
    <span>${tanggalCetak} ${waktuCetak}</span>
  </div>

</div>
</body>
</html>`

  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => {
    w.print()
  }, 500)
}
