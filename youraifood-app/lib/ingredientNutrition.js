// Trusted ingredient nutrition table used by the AI Recipe Generator.
//
// All values are per 100 g of the stated state (raw / cooked / canned) and
// are typical reference values (USDA-style, rounded). They are ESTIMATES —
// brands, ripeness and cooking losses vary. Review/extend this table as the
// catalogue grows; the AI model may ONLY use keys from this table, which is
// how we guarantee macros are computed from known data and never invented.
//
// Row format: key: [name, kcal, protein, carbs, fat, tags, gramsPerPiece, densityGPerMl]
// tags: meat poultry redmeat fish shellfish dairy egg gluten nuts peanut soy
//       sesame mushroom honey
const T = (name, kcal, p, c, f, tags = '', pc = null, dens = 1) => ({
  name, kcal, p, c, f,
  tags: tags ? tags.split(' ') : [],
  pc, dens,
});

export const INGREDIENTS = {
  // Poultry / meat / fish
  chicken_breast_raw: T('Chicken breast (raw)', 120, 22.5, 0, 2.6, 'meat poultry'),
  chicken_thigh_raw: T('Chicken thigh, skinless (raw)', 121, 19.7, 0, 4.1, 'meat poultry'),
  turkey_breast_raw: T('Turkey breast (raw)', 114, 24, 0, 1.5, 'meat poultry'),
  turkey_mince_raw: T('Turkey mince, lean (raw)', 150, 19, 0, 8, 'meat poultry'),
  beef_mince_lean_raw: T('Lean beef mince 5% (raw)', 137, 21, 0, 5, 'meat redmeat'),
  beef_sirloin_raw: T('Beef sirloin (raw)', 150, 22, 0, 6, 'meat redmeat'),
  pork_tenderloin_raw: T('Pork tenderloin (raw)', 120, 21, 0, 3.5, 'meat redmeat'),
  salmon_raw: T('Salmon fillet (raw)', 208, 20, 0, 13, 'fish'),
  cod_raw: T('Cod fillet (raw)', 82, 18, 0, 0.7, 'fish'),
  tuna_canned_water: T('Tuna, canned in water (drained)', 116, 26, 0, 1, 'fish'),
  prawns_raw: T('Prawns (raw)', 85, 20, 0, 0.5, 'shellfish'),

  // Eggs, dairy, plant proteins
  egg_whole: T('Egg', 143, 12.6, 0.7, 9.5, 'egg', 50),
  egg_white: T('Egg white', 52, 11, 0.7, 0.2, 'egg', 33),
  tofu_firm: T('Firm tofu', 144, 17, 3, 9, 'soy'),
  tempeh: T('Tempeh', 192, 20, 8, 11, 'soy'),
  greek_yogurt_0: T('Greek yogurt, 0% fat', 59, 10, 3.6, 0.4, 'dairy'),
  greek_yogurt_5: T('Greek yogurt, 5% fat', 97, 9, 4, 5, 'dairy'),
  cottage_cheese_low: T('Cottage cheese, low-fat', 72, 12, 2.7, 1, 'dairy'),
  skyr: T('Skyr', 63, 11, 4, 0.2, 'dairy'),
  feta: T('Feta cheese', 264, 14, 4, 21, 'dairy'),
  mozzarella: T('Mozzarella', 280, 27.5, 3, 17, 'dairy'),
  parmesan: T('Parmesan', 431, 38, 4, 29, 'dairy'),
  cheddar: T('Cheddar', 403, 25, 1.3, 33, 'dairy'),
  cream_cheese_light: T('Light cream cheese', 140, 8, 5, 10, 'dairy'),
  milk_semi: T('Semi-skimmed milk', 50, 3.4, 4.8, 1.7, 'dairy', null, 1.03),
  oat_drink: T('Oat drink', 45, 1, 6.5, 1.5, 'gluten', null, 1.03),
  almond_drink: T('Unsweetened almond drink', 15, 0.6, 0.3, 1.2, 'nuts', null, 1.0),
  whey_protein: T('Whey protein powder', 400, 80, 8, 6, 'dairy'),
  butter: T('Butter', 717, 0.9, 0.1, 81, 'dairy', null, 0.96),

  // Legumes
  black_beans_canned: T('Black beans, canned (drained)', 91, 6, 16.6, 0.3),
  chickpeas_canned: T('Chickpeas, canned (drained)', 139, 7, 22.5, 2.6),
  kidney_beans_canned: T('Kidney beans, canned (drained)', 84, 5.2, 15, 0.5),
  lentils_cooked: T('Lentils (cooked)', 116, 9, 20, 0.4),
  red_lentils_dry: T('Red lentils (dry)', 358, 24, 60, 1.1),

  // Grains, starches
  rice_white_cooked: T('White rice (cooked)', 130, 2.7, 28, 0.3),
  brown_rice_cooked: T('Brown rice (cooked)', 123, 2.7, 26, 1),
  basmati_rice_dry: T('Basmati rice (dry)', 350, 8, 78, 0.7),
  quinoa_cooked: T('Quinoa (cooked)', 120, 4.4, 21, 1.9),
  oats_rolled: T('Rolled oats (dry)', 379, 13, 68, 6.5, 'gluten'),
  pasta_dry: T('Pasta (dry)', 371, 13, 75, 1.5, 'gluten'),
  pasta_gf_dry: T('Gluten-free pasta (dry)', 360, 7, 77, 2),
  couscous_dry: T('Couscous (dry)', 376, 13, 77, 0.6, 'gluten'),
  bread_wholemeal: T('Wholemeal bread', 247, 13, 41, 3.4, 'gluten', 36),
  tortilla_wrap: T('Flour tortilla wrap', 310, 8, 52, 7, 'gluten', 60),
  corn_tortilla: T('Corn tortilla', 218, 5.7, 44, 2.9, '', 26),
  potato_raw: T('Potato (raw)', 77, 2, 17, 0.1, '', 170),
  sweet_potato_raw: T('Sweet potato (raw)', 86, 1.6, 20, 0.1, '', 150),
  flour_plain: T('Plain flour', 364, 10, 76, 1, 'gluten'),
  almond_flour: T('Almond flour', 579, 21, 22, 50, 'nuts'),
  baking_powder: T('Baking powder', 53, 0, 28, 0),

  // Vegetables
  broccoli: T('Broccoli', 34, 2.8, 6.6, 0.4),
  spinach: T('Spinach', 23, 2.9, 3.6, 0.4),
  kale: T('Kale', 35, 2.9, 4.4, 1.5),
  bell_pepper: T('Bell pepper', 31, 1, 6, 0.3, '', 150),
  onion: T('Onion', 40, 1.1, 9.3, 0.1, '', 110),
  garlic: T('Garlic', 149, 6.4, 33, 0.5, '', 3),
  tomato: T('Tomato', 18, 0.9, 3.9, 0.2, '', 120),
  tomato_canned_chopped: T('Chopped tomatoes (canned)', 21, 1.1, 4.3, 0.1),
  tomato_paste: T('Tomato paste', 82, 4.3, 19, 0.5),
  cucumber: T('Cucumber', 15, 0.7, 3.6, 0.1),
  carrot: T('Carrot', 41, 0.9, 9.6, 0.2, '', 70),
  courgette: T('Courgette', 17, 1.2, 3.1, 0.3, '', 200),
  aubergine: T('Aubergine', 25, 1, 6, 0.2, '', 300),
  mushrooms: T('Mushrooms', 22, 3.1, 3.3, 0.3, 'mushroom'),
  spring_onion: T('Spring onion', 32, 1.8, 7.3, 0.2),
  cauliflower: T('Cauliflower', 25, 1.9, 5, 0.3),
  green_beans: T('Green beans', 31, 1.8, 7, 0.2),
  asparagus: T('Asparagus', 20, 2.2, 3.9, 0.1),
  sweetcorn_canned: T('Sweetcorn (canned, drained)', 80, 2.5, 17, 1),
  avocado: T('Avocado', 160, 2, 8.5, 14.7, '', 150),
  ginger: T('Fresh ginger', 80, 1.8, 18, 0.8),

  // Fruit
  banana: T('Banana', 89, 1.1, 23, 0.3, '', 120),
  apple: T('Apple', 52, 0.3, 14, 0.2, '', 180),
  blueberries: T('Blueberries', 57, 0.7, 14, 0.3),
  strawberries: T('Strawberries', 32, 0.7, 7.7, 0.3),
  raspberries: T('Raspberries', 52, 1.2, 12, 0.7),
  mango: T('Mango', 60, 0.8, 15, 0.4),
  dates_medjool: T('Medjool dates', 277, 1.8, 75, 0.2, '', 24),
  lemon_juice: T('Lemon juice', 22, 0.4, 6.9, 0.2, '', null, 1.03),
  lime_juice: T('Lime juice', 25, 0.4, 8.4, 0.1, '', null, 1.03),

  // Fats, nuts, seeds, sweeteners
  olive_oil: T('Olive oil', 884, 0, 0, 100, '', null, 0.92),
  coconut_oil: T('Coconut oil', 862, 0, 0, 100, '', null, 0.92),
  almonds: T('Almonds', 579, 21, 22, 50, 'nuts'),
  walnuts: T('Walnuts', 654, 15, 14, 65, 'nuts'),
  cashews: T('Cashews', 553, 18, 30, 44, 'nuts'),
  peanut_butter: T('Peanut butter', 588, 25, 20, 50, 'peanut', null, 1.07),
  chia_seeds: T('Chia seeds', 486, 17, 42, 31),
  flaxseed: T('Ground flaxseed', 534, 18, 29, 42),
  pumpkin_seeds: T('Pumpkin seeds', 559, 30, 11, 49),
  tahini: T('Tahini', 595, 17, 21, 54, 'sesame', null, 1.1),
  hummus: T('Hummus', 166, 8, 14, 10, 'sesame'),
  honey: T('Honey', 304, 0.3, 82, 0, 'honey', null, 1.4),
  maple_syrup: T('Maple syrup', 260, 0, 67, 0, '', null, 1.33),
  sugar: T('Sugar', 387, 0, 100, 0),
  dark_chocolate_70: T('Dark chocolate 70%', 598, 7.8, 46, 43),
  cocoa_powder: T('Cocoa powder (unsweetened)', 228, 19.6, 57.9, 13.7),

  // Liquids, sauces, stocks
  water: T('Water', 0, 0, 0, 0),
  vegetable_stock: T('Vegetable stock', 4, 0.2, 0.7, 0.1),
  chicken_stock: T('Chicken stock', 5, 0.5, 0.4, 0.2, 'meat poultry'),
  coconut_milk_light: T('Light coconut milk (canned)', 80, 0.8, 2.5, 7.5),
  coconut_milk: T('Coconut milk (canned)', 197, 2, 2.8, 21),
  soy_sauce: T('Soy sauce', 53, 8.1, 4.9, 0.6, 'soy gluten', null, 1.15),
  tamari: T('Tamari', 60, 10, 5, 0.1, 'soy', null, 1.15),
  dijon_mustard: T('Dijon mustard', 66, 4, 6, 4),
  balsamic_vinegar: T('Balsamic vinegar', 88, 0.5, 17, 0, '', null, 1.05),

  // Herbs & spices (small quantities)
  salt: T('Salt', 0, 0, 0, 0),
  black_pepper: T('Black pepper', 251, 10, 64, 3.3),
  paprika: T('Paprika', 282, 14, 54, 13),
  cumin: T('Ground cumin', 375, 18, 44, 22),
  oregano_dried: T('Dried oregano', 265, 9, 69, 4),
  chilli_flakes: T('Chilli flakes', 282, 12, 50, 14),
  turmeric: T('Turmeric', 312, 9.7, 67, 3.3),
  cinnamon: T('Cinnamon', 247, 4, 81, 1.2),
  garlic_powder: T('Garlic powder', 331, 17, 73, 0.7),
  curry_powder: T('Curry powder', 325, 14, 58, 14),
  basil_fresh: T('Fresh basil', 23, 3.2, 2.7, 0.6),
  parsley_fresh: T('Fresh parsley', 36, 3, 6.3, 0.8),
  coriander_fresh: T('Fresh coriander', 23, 2.1, 3.7, 0.5),
};

export const INGREDIENT_KEYS = Object.keys(INGREDIENTS);

export const ALLOWED_UNITS = ['g', 'ml', 'pc', 'tbsp', 'tsp'];

// Converts a quantity in a supported unit to grams, or returns null when the
// unit can't be converted reliably for that ingredient (e.g. pieces of rice).
export function toGrams(key, quantity, unit) {
  const item = INGREDIENTS[key];
  if (!item || !Number.isFinite(quantity) || quantity <= 0) return null;
  switch (unit) {
    case 'g': return quantity;
    case 'ml': return quantity * item.dens;
    case 'tbsp': return quantity * 15 * item.dens;
    case 'tsp': return quantity * 5 * item.dens;
    case 'pc': return item.pc ? quantity * item.pc : null;
    default: return null;
  }
}

// Controlled normalisation: exact key, or exact display-name match (case /
// punctuation-insensitive). Anything else is NOT guessed — it is rejected so
// we never silently substitute a nutritionally different ingredient.
const NAME_INDEX = (() => {
  const idx = {};
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  for (const k of INGREDIENT_KEYS) {
    idx[norm(k)] = k;
    idx[norm(INGREDIENTS[k].name)] = k;
  }
  idx.__norm = norm;
  return idx;
})();

export function resolveIngredientKey(raw) {
  if (typeof raw !== 'string') return null;
  if (INGREDIENTS[raw]) return raw;
  return NAME_INDEX[NAME_INDEX.__norm(raw)] || null;
}
