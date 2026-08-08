'use client';

import { useEffect } from 'react';
import Hero from './Hero';
import Planner from './Planner';
import KeyBenefits from './KeyBenefits';
import WhyYourAiFood from './WhyYourAiFood';
import SamplePlan from './SamplePlan';
import TrustSection from './TrustSection';
import RecipeGallery from './RecipeGallery';
import Testimonials from './Testimonials';
import FounderNote from './FounderNote';
import FAQ from './FAQ';
import Pricing from './Pricing';
import FinalCTA from './FinalCTA';
import EmailCapture from './EmailCapture';
import InlineCTA from './InlineCTA';
import { useAuth } from '../lib/AuthContext';

export default function HomeContent() {
const { user, session, isPremium, favorites, toggleFavorite } = useAuth();

function scrollToPlanner() {
document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' });
}

// If we arrive here via a hash link (e.g. a locked recipe card linking to
// /#pricing), scroll to that section once the page has laid out — a plain
// browser hash-jump can silently fail on client-side navigation.
useEffect(() => {
if (!window.location.hash) return;
const id = window.location.hash.slice(1);

const tryScroll = () => {
const target = document.getElementById(id);
if (target) target.scrollIntoView({ behavior: 'smooth' });
return !!target;
};

tryScroll();
window.addEventListener('load', tryScroll, { once: true });
const retryTimers = [300, 800, 1600].map((ms) => setTimeout(tryScroll, ms));

return () => {
window.removeEventListener('load', tryScroll);
retryTimers.forEach(clearTimeout);
};
}, []);

return (
<>
<Hero onCta={scrollToPlanner} />

<section className="px-6 pb-14 pt-4">
<div className="mx-auto max-w-[1120px] text-center">
<Planner user={user} session={session} isPremium={isPremium} favorites={favorites} onToggleFavorite={toggleFavorite} />
</div>
</section>

<KeyBenefits />
<SamplePlan />
<WhyYourAiFood />
<InlineCTA label="See My Personalised Week" />
<TrustSection />
<RecipeGallery isPremium={isPremium} user={user} favorites={favorites} onToggleFavorite={toggleFavorite} compact />
<Testimonials />
<Pricing session={session} isPremium={isPremium} />
<FounderNote />
<EmailCapture />
<FAQ />
<FinalCTA />
</>
);
}
