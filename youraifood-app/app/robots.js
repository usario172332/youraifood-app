const SITE_URL = 'https://www.youraifood.com';

// Standard robots.txt via Next.js file convention — allows all crawlers,
// keeps the signed-in-only, admin and password-reset pages plus API routes
// out of the index, and points crawlers straight at the sitemap so the 235
// recipe pages get discovered.
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/profile', '/admin', '/reset-password'],
    },
    sitemap: SITE_URL + '/sitemap.xml',
  };
}
