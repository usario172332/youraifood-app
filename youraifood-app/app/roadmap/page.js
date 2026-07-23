import Roadmap from '../../components/Roadmap';

export const metadata = {
  title: 'Roadmap — YourAiFood',
  description:
    "What's next for YourAiFood: one-click supermarket ordering, pantry-aware planning, and family meal planning with per-person portions.",
};

export default function RoadmapPage() {
  return (
    <div className="pt-10 text-center">
      <span className="mb-3 inline-block rounded-full bg-green-50 px-3.5 py-1.5 text-[13px] font-bold text-green-700">
        🗺️ Roadmap
      </span>
      <h1 className="mx-auto mb-2 max-w-2xl text-3xl font-extrabold leading-tight text-green-900 sm:text-4xl">
        What we're building next
      </h1>
      <p className="mx-auto max-w-xl text-ink-soft">
        YourAiFood already plans your week and builds your shopping list. Here's where we're headed.
      </p>
      <Roadmap />
    </div>
  );
}
