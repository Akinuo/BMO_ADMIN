const isDev = process.env.NODE_ENV !== 'production'

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  compress: true,
  // The only image is a tiny logo (already resized), so skip the image-optimizer round trip.
  images: { unoptimized: true },
  // Server actions only carry short form fields (an email, a user id); refuse anything big.
  experimental: { serverActions: { bodySizeLimit: '10kb' } },
  async headers() {
    // The Content-Security-Policy (with its per-request nonce) is set in src/middleware.ts.
    const securityHeaders = [
      ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]),
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
      { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
      // This site lists student emails — keep it out of search engines.
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
    ]
    return [
      { source: '/:path*', headers: securityHeaders },
      // Pages and data are never cached (they contain student emails)...
      { source: '/((?!_next/static|logo-mark.png|icon.png).*)', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] },
      // ...but hashed build assets and the two small images are public and safe to cache hard.
      { source: '/_next/static/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/:file(logo-mark.png|icon.png)', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
    ]
  },
}
export default config
