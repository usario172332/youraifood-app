import { createElement as h } from 'react';
import TipsContent from '../../components/TipsContent';

export const metadata = {
    title: 'Guides - YourAiFood',
    description: 'Essential and nice-to-have kitchen tools, plus quick ratios and timings for cooking rice, quinoa, pasta, beans, chicken, beef, eggs, and vegetables.',
};

export default function TipsPage() {
    return h(TipsContent);
}
