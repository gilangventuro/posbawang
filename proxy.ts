import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const auth = request.cookies.get('rb_auth')?.value
  const { pathname } = request.nextUrl
  const isLoginPage = pathname === '/login'

  if (!auth && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (auth && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)'],
}
