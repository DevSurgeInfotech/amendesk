import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * AmenDesk Multi-Domain Routing Engine
 *
 * Directs incoming traffic based on hostname:
 * - ERP Domain (e.g. desk.amenmartgh.com, desk.localhost):
 *     Serves AmenDesk ERP directly. Root "/" rewrites to "/desk",
 *     and module routes ("/payments", "/auctions", etc.) rewrite to "/desk/*".
 * - Website Domain (e.g. amenmartgh.com, localhost):
 *     Serves the public auction & showroom website.
 *     Requests to "/desk" are redirected to the dedicated ERP domain.
 */

const ERP_DOMAIN = (process.env.ERP_DOMAIN || process.env.NEXT_PUBLIC_ERP_DOMAIN || 'desk.amenmartgh.com').toLowerCase();
const SITE_DOMAIN = (process.env.SITE_DOMAIN || process.env.NEXT_PUBLIC_SITE_DOMAIN || 'amenmartgh.com').toLowerCase();

const ERP_MODULE_PREFIXES = [
  '/payments',
  '/accounts',
  '/auctions',
  '/payment-plans',
  '/dealership',
  '/land',
  '/property',
  '/inventory',
  '/crm',
  '/migration',
];

function isErpHostname(hostname: string): boolean {
  const cleanHost = hostname.split(':')[0].toLowerCase();
  const cleanErpDomain = ERP_DOMAIN.split(':')[0];

  if (cleanHost === cleanErpDomain) return true;
  if (cleanHost === 'desk.localhost' || cleanHost === 'erp.localhost' || cleanHost === 'amendesk.localhost') return true;
  if (cleanHost.startsWith('desk.') || cleanHost.startsWith('erp.') || cleanHost.startsWith('amendesk.')) return true;
  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const hostname = host.split(':')[0].toLowerCase();
  const port = host.includes(':') ? `:${host.split(':')[1]}` : '';
  const isErp = isErpHostname(hostname) || request.headers.get('x-erp-domain') === '1';

  // 1. Bypass static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    Boolean(pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$/))
  ) {
    return NextResponse.next();
  }

  // 2. Handling requests on ERP Domain (e.g. desk.amenmartgh.com, desk.localhost:3001)
  if (isErp) {
    // If staff access root "/", rewrite to the AmenDesk ERP dashboard ("/desk")
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone();
      url.pathname = '/desk';
      return NextResponse.rewrite(url);
    }

    // If path already starts with /desk, pass through directly
    if (pathname === '/desk' || pathname.startsWith('/desk/')) {
      return NextResponse.next();
    }

    // If requesting an ERP module directly (e.g. "/payments", "/auctions", "/crm", etc.)
    const isErpModule = ERP_MODULE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    if (isErpModule) {
      const url = request.nextUrl.clone();
      url.pathname = `/desk${pathname}`;
      return NextResponse.rewrite(url);
    }

    // Public marketing showroom pages visited on ERP domain -> redirect to public website
    const isPublicSitePage = ['/about', '/showroom', '/contact', '/properties'].some(
      (page) => pathname === page || pathname.startsWith(`${page}/`)
    );
    if (isPublicSitePage) {
      const protocol = request.nextUrl.protocol || 'https:';
      const redirectHost = hostname.includes('localhost') ? `localhost${port}` : SITE_DOMAIN;
      const redirectUrl = new URL(pathname + request.nextUrl.search, `${protocol}//${redirectHost}`);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  // 3. Handling requests on Public Website Domain (e.g. amenmartgh.com, localhost:3001)
  // If a request hits /desk on the website domain, redirect to the dedicated ERP domain
  if (pathname === '/desk' || pathname.startsWith('/desk/')) {
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const targetHost = isLocalhost ? `desk.localhost${port}` : ERP_DOMAIN;
    const protocol = isLocalhost ? request.nextUrl.protocol : 'https:';

    // Allow local development bypass if ?direct=1
    if (isLocalhost && request.nextUrl.searchParams.has('direct')) {
      return NextResponse.next();
    }

    const targetPath = pathname === '/desk' ? '/' : pathname.replace(/^\/desk/, '');
    const redirectUrl = new URL(`${targetPath}${request.nextUrl.search}`, `${protocol}//${targetHost}`);
    return NextResponse.redirect(redirectUrl, 307);
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
