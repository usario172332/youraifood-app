// Onboarding wizard storage. Everything stays in the visitor's browser
// (localStorage) — body stats are never sent to our servers, matching the
// privacy note in the planner and privacy policy.

const PROFILE_KEY = 'yaf_profile_v1';
const DONE_PREFIX = 'yaf_onboarded_v1_';
const NEW_USER_WINDOW_MS = 14 * 24 * 3600 * 1000;

export const GOAL_OPTIONS = [
  { value: 'lose', icon: '🔥', label: 'Lose weight', desc: 'High-protein meals inside a calorie target.' },
  { value: 'muscle', icon: '💪', label: 'Build muscle', desc: 'Protein-focused meals with a lean surplus.' },
  { value: 'maintain', icon: '🥗', label: 'Eat healthier', desc: 'Balanced meals without the planning.' },
];

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch { /* private mode: not critical */ }
}

export function isOnboarded(userId) {
  try {
    return !!localStorage.getItem(DONE_PREFIX + userId);
  } catch {
    return true; // can't remember the answer, so don't nag
  }
}

export function markOnboarded(userId) {
  try {
    localStorage.setItem(DONE_PREFIX + userId, '1');
  } catch { /* ignore */ }
}

// Only accounts created recently see the wizard, so existing users are not interrupted.
export function isNewUser(user) {
  const t = user && user.created_at ? Date.parse(user.created_at) : NaN;
  return Number.isFinite(t) && Date.now() - t < NEW_USER_WINDOW_MS;
}

// Maps the wizard's avoid lists to the generator's free-text exclusion field.
const TERMS = {
  nuts: 'Nuts', mushrooms: 'Mushrooms', shellfish: 'Shellfish', fish: 'Fish', dairy: 'Dairy', eggs: 'Eggs', soy: 'Soy',
  poultry: 'Chicken, Turkey', redMeat: 'Beef, Pork, Lamb',
};
export function excludedText(profile) {
  if (!profile) return '';
  const keys = [...(profile.avoidMeats || []), ...(profile.avoidIngredients || [])];
  return [...new Set(keys.map((k) => TERMS[k]).filter(Boolean))].join(', ');
}

// Clamp helpers so a hand-edited localStorage value can't break the planner.
export function sanitizeProfile(p) {
  if (!p || typeof p !== 'object') return null;
  const num = (v, lo, hi) => { const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : undefined; };
  const out = {
    goal: ['lose', 'muscle', 'maintain'].includes(p.goal) ? p.goal : undefined,
    weight: num(p.weight, 30, 250),
    height: num(p.height, 120, 230),
    age: num(p.age, 14, 100),
    sex: ['male', 'female'].includes(p.sex) ? p.sex : undefined,
    activityLevel: ['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(p.activityLevel) ? p.activityLevel : undefined,
    avoidMeats: Array.isArray(p.avoidMeats) ? p.avoidMeats.filter((x) => ['poultry', 'redMeat', 'fish'].includes(x)) : [],
    avoidIngredients: Array.isArray(p.avoidIngredients) ? p.avoidIngredients.filter((x) => ['nuts', 'mushrooms', 'shellfish', 'fish', 'dairy', 'eggs', 'soy'].includes(x)) : [],
  };
  return out;
}
