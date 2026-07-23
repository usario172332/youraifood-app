import './globals.css';
import CookieBanner from '../components/CookieBanner';
import AppShell from '../components/AppShell';

const SITE_URL = 'https://youraifood.com';
const SITE_TITLE = 'YourAiFood — Fitness Recipes & Personalised Meal Plans';
const SITE_DESCRIPTION =
  'Tell us your goal, diet, ingredient preference and time. YourAiFood builds your weekly menu, grocery list, and nutrition breakdown from our curated recipe library and calculated nutrition data.';
const SOCIAL_IMAGE = `${SITE_URL}/recipes/nb50.jpg`;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s',
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'YourAiFood',
    images: [{ url: SOCIAL_IMAGE, width: 1200, height: 900, alt: 'A YourAiFood meal plan recipe' }],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SOCIAL_IMAGE],
  },
};

const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'YourAiFood',
  url: SITE_URL,
};

const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'YourAiFood',
  url: SITE_URL,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }}
        />
        <AppShell>{children}</AppShell>
        <CookieBanner />
      </body>
    </html>
  );
}
