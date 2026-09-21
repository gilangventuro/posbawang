'use client'

export interface Invoice {
  id: string
  tanggal: string
  keterangan: string
  nama: string
  tipe: string
  ukuran: number
  createdAt: string
}

interface InvoiceRecord extends Invoice {
  data: ArrayBuffer
}

const DB_NAME = 'rumahbawang_db'
const STORE = 'invoices'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = e => resolve((e.target as IDBOpenDBRequest).result)
    req.onerror = () => reject(req.error)
  })
}

export async function simpanInvoice(file: File, tanggal: string, keterangan: string): Promise<Invoice> {
  const db = await openDB()
  const data = await file.arrayBuffer()
  const record: InvoiceRecord = {
    id: crypto.randomUUID(),
    tanggal,
    keterangan,
    nama: file.name,
    tipe: file.type,
    ukuran: file.size,
    data,
    createdAt: new Date().toISOString(),
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).add(record)
    tx.oncomplete = () => {
      const { data: _, ...meta } = record
      void _
      resolve(meta)
    }
    tx.onerror = () => reject(tx.error)
  })
}

export async function getSemuaInvoice(): Promise<Invoice[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => {
      const list = (req.result as InvoiceRecord[]).map(({ data: _, ...meta }) => { void _; return meta })
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      resolve(list)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function bukaInvoice(id: string): Promise<void> {
  const db = await openDB()
  const record: InvoiceRecord | undefined = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  if (!record) return
  const blob = new Blob([record.data], { type: record.tipe })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export async function hapusInvoice(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function formatUkuran(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
