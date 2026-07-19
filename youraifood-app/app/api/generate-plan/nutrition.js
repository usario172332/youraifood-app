// Mifflin-St Jeor equation — the formula most fitness apps use for BMR,
// generally considered more accurate than the older Harris-Benedict one.

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2, // little or no exercise
  light: 1.375, // light exercise 1-3 days/week
  moderate: 1.55, // moderate exercise 3-5 days/week
  active: 1.725, // hard exercise 6-7 days/week
  very_active: 1.9, // physical job or 2x/day training
};

const GOAL_CALORIE_ADJUSTMENT = {
  lose: -500, // ~0.5kg/week deficit
  muscle: 350, // lean surplus
  maintain: 0,
};

const GOAL_PROTEIN_PER_KG = {
  lose: 1.8, // higher protein preserves muscle in a deficit
  muscle: 2.0,
  maintain: 1.6,
};

const MIN_SAFE_CALORIES = 1200;

export function calculateBMR({ weight, height, age, sex }) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'female' ? base - 161 : base + 5;
}

export function calculateTargets({ weight, height, age, sex, activityLevel, goal }) {
  const bmr = calculateBMR({ weight, height, age, sex });
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderate;
  const tdee = bmr * multiplier;
  const adjustment = GOAL_CALORIE_ADJUSTMENT[goal] ?? 0;
  const calorieTarget = Math.max(MIN_SAFE_CALORIES, Math.round(tdee + adjustment));
  const proteinPerKg = GOAL_PROTEIN_PER_KG[goal] ?? GOAL_PROTEIN_PER_KG.maintain;
  const proteinTarget = Math.round(weight * proteinPerKg);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieTarget,
    proteinTarget,
  };
}

export const ACTIVITY_OPTIONS = [
  { key: 'sedentary', label: 'Sedentary (little/no exercise)' },
  { key: 'light', label: 'Light (1-3 days/week)' },
  { key: 'moderate', label: 'Moderate (3-5 days/week)' },
  { key: 'active', label: 'Active (6-7 days/week)' },
  { key: 'very_active', label: 'Very active (physical job / 2x/day)' },
];
