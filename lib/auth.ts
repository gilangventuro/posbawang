'use client'

import { useState, useEffect } from 'react'

export type UserRole = 'admin' | 'viewer'

export const ACCOUNTS: { username: string; password: string; role: UserRole; label: string }[] = [
  { username: 'admin', password: '12345', role: 'admin', label: 'Administrator' },
]

export function checkLogin(username: string, password: string): UserRole | null {
  const acc = ACCOUNTS.find(a => a.username === username && a.password === password)
  return acc?.role ?? null
}

export function getRoleLabel(role: UserRole): string {
  return ACCOUNTS.find(a => a.role === role)?.label ?? role
}

export function getRole(): UserRole {
  if (typeof document === 'undefined') return 'viewer'
  const m = document.cookie.match(/(?:^|;\s*)rb_auth=([^;]+)/)
  return m?.[1] === 'admin' ? 'admin' : 'viewer'
}

export function doLogin(role: UserRole) {
  document.cookie = `rb_auth=${role}; path=/; max-age=86400`
}

export function doLogout() {
  document.cookie = 'rb_auth=; path=/; max-age=0'
}

export function useRole() {
  const [role, setRole] = useState<UserRole>('viewer')
  useEffect(() => { setRole(getRole()) }, [])
  return { role, isAdmin: role === 'admin', isViewer: role === 'viewer' }
}
