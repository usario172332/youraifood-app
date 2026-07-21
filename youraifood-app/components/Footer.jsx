import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 px-6 py-9 text-center text-sm text-ink-soft">
      <div className="mx-auto mb-3 flex max-w-[1120px] flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <Link href="/about" className="font-semibold text-green-700 hover:underline">About</Link><Link href="/tools/macro-calculator" className="font-semibold text-green-700 hover:underline">Free Macro Calculator</Link><Link href="/privacy" className="font-semibold text-green-700 hover:underline">
          Privacy Policy
        </Link>
        <Link href="/terms" className="font-semibold text-green-700 hover:underline">
          Terms of Service
        </Link>
        <a href="mailto:support@youraifood.com" className="font-semibold text-green-700 hover:underline">
          Contact
        </a>
      </div>
      <p>© {new Date().getFullYear()} YourAiFood. Meal plans are AI-generated suggestions — not medical or dietary advice.</p>
    </footer>
  );
}
