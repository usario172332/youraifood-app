'use client';

import { useMemo, useState } from 'react';
import { INGREDIENTS } from '../lib/ingredientNutrition';

// Mirrors PANTRY_STAPLES in lib/aiRecipeConfig.js (not imported: that file reads
// server env vars). The server is the source of truth for validation.
const PANTRY_STAPLES = ['water', 'salt', 'black_pepper', 'olive_oil', 'paprika', 'cumin', 'oregano_dried', 'chilli_flakes', 'turmeric', 'cinnamon', 'garlic_powder', 'curry_powder'];

const GROUPS = ['Protein', 'Vegetables & fruit', 'Carbs & grains', 'Dairy & alternatives', 'Fats, nuts & seeds', 'Sauces & other'];
const VEG = new Set(['broccoli', 'spinach', 'kale', 'bell_pepper', 'onion', 'garlic', 'tomato', 'tomato_canned_chopped', 'cucumber', 'carrot', 'courgette', 'aubergine', 'mushrooms', 'spring_onion', 'cauliflower', 'green_beans', 'asparagus', 'sweetcorn_canned', 'avocado', 'ginger', 'banana', 'apple', 'blueberries', 'strawberries', 'raspberries', 'mango', 'dates_medjool', 'potato_raw', 'sweet_potato_raw']);
const CARB = new Set(['black_beans_canned', 'chickpeas_canned', 'kidney_beans_canned', 'lentils_cooked', 'red_lentils_dry', 'rice_white_cooked', 'brown_rice_cooked', 'basmati_rice_dry', 'quinoa_cooked', 'oats_rolled', 'pasta_dry', 'pasta_gf_dry', 'couscous_dry', 'bread_wholemeal', 'tortilla_wrap', 'corn_tortilla', 'flour_plain', 'almond_flour']);
const FATS = new Set(['olive_oil', 'coconut_oil', 'butter', 'almonds', 'walnuts', 'cashews', 'peanut_butter', 'chia_seeds', 'flaxseed', 'pumpkin_seeds', 'tahini']);

function groupOf(key) {
  const it = INGREDIENTS[key];
  if (VEG.has(key)) return 'Vegetables & fruit';
  if (CARB.has(key)) return 'Carbs & grains';
  if (FATS.has(key)) return 'Fats, nuts & seeds';
  if (it.tags.includes('dairy') || ['oat_drink', 'almond_drink', 'cream_cheese_light'].includes(key)) return 'Dairy & alternatives';
  if (it.tags.some((t) => ['meat', 'poultry', 'fish', 'shellfish', 'egg'].includes(t)) || ['tofu_firm', 'tempeh', 'whey_protein'].includes(key)) return 'Protein';
  return 'Sauces & other';
}

const chip = (active) =>
  `rounded-full border px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${
    active ? 'border-green-600 bg-green-600 text-white' : 'border-gray-200 bg-white text-ink hover:bg-green-50'
  }`;

export default function PantryPicker({ value, onChange, strict, onStrict, staples, onStaples }) {
  const [q, setQ] = useState('');
  const staplesSet = useMemo(() => new Set(PANTRY_STAPLES), []);
  const items = useMemo(
    () => Object.keys(INGREDIENTS).filter((k) => !staplesSet.has(k)).map((k) => ({ key: k, name: INGREDIENTS[k].name, group: groupOf(k) })),
    [staplesSet]
  );
  const term = q.trim().toLowerCase();
  const visible = items.filter((i) => !term || i.name.toLowerCase().includes(term));
  const toggle = (key) => onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key].slice(0, 25));

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="rg-pantry-q" className="mb-1.5 block text-sm font-bold text-green-900">
          What do you have? <span className="font-normal text-ink-soft">(pick at least 2 — {value.length}/25 selected)</span>
        </label>
        <input
          id="rg-pantry-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ingredients, e.g. chicken, rice, spinach"
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200"
        />
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Selected ingredients">
          {value.map((k) => (
            <button type="button" key={k} onClick={() => toggle(k)} className={chip(true)} aria-label={`Remove ${INGREDIENTS[k].name}`}>
              {INGREDIENTS[k].name} ✕
            </button>
          ))}
          <button type="button" onClick={() => onChange([])} className="text-sm font-semibold text-ink-soft underline">Clear all</button>
        </div>
      )}

      <div className="max-h-72 space-y-3 overflow-y-auto rounded-xl border border-gray-100 p-3">
        {visible.length === 0 && <p className="text-sm text-ink-soft">No match. Try another word — we can only cook with ingredients from our nutrition list.</p>}
        {GROUPS.map((g) => {
          const list = visible.filter((i) => i.group === g);
          if (!list.length) return null;
          return (
            <div key={g}>
              <div className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-green-700">{g}</div>
              <div className="flex flex-wrap gap-2">
                {list.map((i) => (
                  <button type="button" key={i.key} aria-pressed={value.includes(i.key)} onClick={() => toggle(i.key)} className={chip(value.includes(i.key))}>{i.name}</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 rounded-xl bg-gray-50 p-3 text-sm">
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={staples} onChange={(e) => onStaples(e.target.checked)} className="mt-1" />
          <span>I have basic staples <span className="text-ink-soft">(water, salt, pepper, olive oil, common spices)</span></span>
        </label>
        <fieldset>
          <legend className="sr-only">How strictly to use my ingredients</legend>
          <label className="mb-1 flex items-start gap-2">
            <input type="radio" name="rg-strict" checked={strict} onChange={() => onStrict(true)} className="mt-1" />
            <span><b>Only what I have</b> <span className="text-ink-soft">— nothing else, no shopping needed</span></span>
          </label>
          <label className="flex items-start gap-2">
            <input type="radio" name="rg-strict" checked={!strict} onChange={() => onStrict(false)} className="mt-1" />
            <span><b>Allow up to 3 extras</b> <span className="text-ink-soft">— we&apos;ll tell you what to pick up</span></span>
          </label>
        </fieldset>
      </div>
    </div>
  );
}
