// Shared recipe catalog — used by the UI gallery, the planner display,
// and the AI prompt (the model picks recipe ids; the app computes the
// real numbers from this data, so nutrition/cost are never hallucinated).

export const RECIPES = [
  // BREAKFASTS
  { id: 'b1', name: 'Overnight Oats with Berries', meal: 'Breakfast', diets: ['vegan', 'vegetarian', 'dairy-free', 'gluten-free'], time: 5, cost: 1.2, protein: 12, cal: 350, carbs: 55, fat: 8,
    ingredients: [{ n: 'Rolled oats (gf)', q: 60, u: 'g', cat: 'Pantry' }, { n: 'Plant milk', q: 200, u: 'ml', cat: 'Dairy/Alt' }, { n: 'Mixed berries', q: 80, u: 'g', cat: 'Produce' }, { n: 'Chia seeds', q: 10, u: 'g', cat: 'Pantry' }, { n: 'Maple syrup', q: 10, u: 'ml', cat: 'Pantry' }],
    steps: ['Add oats, chia seeds and plant milk to a jar or bowl and stir well.', 'Sweeten with maple syrup and stir again.', 'Cover and refrigerate for at least 4 hours, or overnight.', 'Top with mixed berries just before eating.'] },
  { id: 'b2', name: 'Greek Yogurt Protein Bowl', meal: 'Breakfast', diets: ['vegetarian', 'gluten-free'], time: 5, cost: 1.8, protein: 22, cal: 320, carbs: 30, fat: 9,
    ingredients: [{ n: 'Greek yogurt', q: 200, u: 'g', cat: 'Dairy/Alt' }, { n: 'Granola', q: 40, u: 'g', cat: 'Pantry' }, { n: 'Honey', q: 15, u: 'g', cat: 'Pantry' }, { n: 'Banana', q: 1, u: 'pc', cat: 'Produce' }],
    steps: ['Spoon the Greek yogurt into a bowl.', 'Slice the banana and arrange on top.', 'Sprinkle over the granola.', 'Drizzle with honey and serve immediately.'] },
  { id: 'b3', name: 'Tofu Scramble', meal: 'Breakfast', diets: ['vegan', 'vegetarian', 'dairy-free', 'gluten-free'], time: 15, cost: 1.6, protein: 18, cal: 300, carbs: 12, fat: 18,
    ingredients: [{ n: 'Firm tofu', q: 150, u: 'g', cat: 'Protein' }, { n: 'Spinach', q: 50, u: 'g', cat: 'Produce' }, { n: 'Turmeric', q: 2, u: 'g', cat: 'Spices' }, { n: 'Nutritional yeast', q: 10, u: 'g', cat: 'Pantry' }, { n: 'Olive oil', q: 10, u: 'ml', cat: 'Pantry' }],
    steps: ['Pat the tofu dry and crumble it into bite-sized pieces with your hands.', 'Heat olive oil in a pan over medium heat.', 'Add the tofu and turmeric, stirring to coat evenly, and cook for 5 minutes.', 'Stir in the spinach and nutritional yeast, and cook for 3–4 minutes until spinach wilts.', 'Season with salt and pepper and serve warm.'] },
  { id: 'b4', name: 'Veggie Omelette', meal: 'Breakfast', diets: ['vegetarian', 'gluten-free'], time: 12, cost: 1.9, protein: 20, cal: 340, carbs: 8, fat: 22,
    ingredients: [{ n: 'Eggs', q: 3, u: 'pc', cat: 'Protein' }, { n: 'Bell pepper', q: 50, u: 'g', cat: 'Produce' }, { n: 'Cheddar cheese', q: 30, u: 'g', cat: 'Dairy/Alt' }, { n: 'Olive oil', q: 5, u: 'ml', cat: 'Pantry' }],
    steps: ['Whisk the eggs in a bowl with a pinch of salt and pepper.', 'Heat olive oil in a nonstick pan over medium heat and add the diced bell pepper. Cook for 2 minutes.', 'Pour in the eggs and tilt the pan to spread evenly.', 'Sprinkle cheese over one half once the edges set, then fold the omelette over.', 'Cook for another minute until the cheese melts, then serve.'] },
  { id: 'b5', name: 'Dairy-Free Protein Smoothie', meal: 'Breakfast', diets: ['vegan', 'vegetarian', 'dairy-free', 'gluten-free'], time: 5, cost: 2.1, protein: 25, cal: 310, carbs: 35, fat: 6,
    ingredients: [{ n: 'Pea protein powder', q: 30, u: 'g', cat: 'Pantry' }, { n: 'Oat milk', q: 250, u: 'ml', cat: 'Dairy/Alt' }, { n: 'Banana', q: 1, u: 'pc', cat: 'Produce' }, { n: 'Spinach', q: 30, u: 'g', cat: 'Produce' }, { n: 'Peanut butter', q: 15, u: 'g', cat: 'Pantry' }],
    steps: ['Add oat milk, banana and spinach to a blender.', 'Add the protein powder and peanut butter.', 'Blend on high for 45–60 seconds until smooth.', 'Pour into a glass and drink right away.'] },

  // LUNCHES
  { id: 'l1', name: 'Chickpea Buddha Bowl', meal: 'Lunch', diets: ['vegan', 'vegetarian', 'dairy-free', 'gluten-free'], time: 18, cost: 2.4, protein: 20, cal: 480, carbs: 60, fat: 14,
    ingredients: [{ n: 'Chickpeas', q: 150, u: 'g', cat: 'Protein' }, { n: 'Quinoa', q: 60, u: 'g', cat: 'Pantry' }, { n: 'Kale', q: 50, u: 'g', cat: 'Produce' }, { n: 'Tahini', q: 20, u: 'g', cat: 'Pantry' }, { n: 'Lemon', q: 1, u: 'pc', cat: 'Produce' }],
    steps: ['Rinse the quinoa and simmer in double its volume of water for 12–15 minutes, until fluffy.', 'Drain and rinse the chickpeas, then pan-fry for 4–5 minutes until lightly golden.', 'Massage the kale with a little lemon juice and olive oil to soften it.', 'Whisk tahini with lemon juice and a splash of water to make a dressing.', 'Assemble quinoa, kale and chickpeas in a bowl and drizzle with the tahini dressing.'] },
  { id: 'l2', name: 'Grilled Chicken & Quinoa Salad', meal: 'Lunch', diets: ['dairy-free', 'gluten-free'], time: 18, cost: 3.2, protein: 38, cal: 460, carbs: 40, fat: 12,
    ingredients: [{ n: 'Chicken breast', q: 150, u: 'g', cat: 'Protein' }, { n: 'Quinoa', q: 60, u: 'g', cat: 'Pantry' }, { n: 'Cucumber', q: 60, u: 'g', cat: 'Produce' }, { n: 'Cherry tomatoes', q: 60, u: 'g', cat: 'Produce' }, { n: 'Olive oil', q: 10, u: 'ml', cat: 'Pantry' }],
    steps: ['Rinse the quinoa and simmer in double its volume of water for 12–15 minutes, then set aside to cool slightly.', 'Season the chicken breast with salt and pepper and grill or pan-sear 5–6 minutes per side until cooked through.', 'Dice the cucumber and halve the cherry tomatoes.', 'Slice the chicken and toss everything together with olive oil.', 'Season to taste and serve warm or cold.'] },
  { id: 'l3', name: 'Red Lentil Soup', meal: 'Lunch', diets: ['vegan', 'vegetarian', 'dairy-free', 'gluten-free'], time: 20, cost: 1.5, protein: 18, cal: 380, carbs: 55, fat: 6,
    ingredients: [{ n: 'Red lentils', q: 100, u: 'g', cat: 'Protein' }, { n: 'Carrot', q: 50, u: 'g', cat: 'Produce' }, { n: 'Onion', q: 50, u: 'g', cat: 'Produce' }, { n: 'Vegetable stock', q: 400, u: 'ml', cat: 'Pantry' }, { n: 'Cumin', q: 3, u: 'g', cat: 'Spices' }],
    steps: ['Dice the onion and carrot.', 'Sauté them in a pot with a little oil for 3–4 minutes until softened.', 'Stir in the cumin and cook for 30 seconds until fragrant.', 'Add the lentils and stock, bring to a boil, then simmer for 15 minutes until the lentils are soft.', 'Blend partially or fully for a creamier texture, then season and serve.'] },
  { id: 'l4', name: 'Tuna & White Bean Salad', meal: 'Lunch', diets: ['dairy-free', 'gluten-free'], time: 10, cost: 2.6, protein: 32, cal: 400, carbs: 30, fat: 14,
    ingredients: [{ n: 'Canned tuna', q: 120, u: 'g', cat: 'Protein' }, { n: 'White beans', q: 100, u: 'g', cat: 'Protein' }, { n: 'Red onion', q: 30, u: 'g', cat: 'Produce' }, { n: 'Olive oil', q: 10, u: 'ml', cat: 'Pantry' }, { n: 'Lemon', q: 1, u: 'pc', cat: 'Produce' }],
    steps: ['Drain the tuna and white beans well.', 'Finely slice the red onion.', 'Combine tuna, beans and onion in a bowl.', 'Dress with olive oil and a good squeeze of lemon juice.', 'Season with salt and pepper and serve immediately.'] },
  { id: 'l5', name: 'Falafel Wrap', meal: 'Lunch', diets: ['vegan', 'vegetarian', 'dairy-free'], time: 20, cost: 2.2, protein: 16, cal: 450, carbs: 60, fat: 15,
    ingredients: [{ n: 'Falafel mix', q: 150, u: 'g', cat: 'Protein' }, { n: 'Wholewheat wrap', q: 1, u: 'pc', cat: 'Pantry' }, { n: 'Hummus', q: 40, u: 'g', cat: 'Pantry' }, { n: 'Mixed greens', q: 40, u: 'g', cat: 'Produce' }],
    steps: ['Prepare the falafel mix according to package instructions, forming small patties.', 'Pan-fry or bake the falafel for 10–12 minutes, turning once, until golden and crisp.', 'Warm the wrap briefly in a dry pan or microwave.', 'Spread hummus over the wrap, then add mixed greens and falafel.', 'Roll up tightly and slice in half to serve.'] },

  // DINNERS
  { id: 'd1', name: 'Salmon & Roasted Veg', meal: 'Dinner', diets: ['dairy-free', 'gluten-free'], time: 20, cost: 4.5, protein: 34, cal: 480, carbs: 25, fat: 24,
    ingredients: [{ n: 'Salmon fillet', q: 150, u: 'g', cat: 'Protein' }, { n: 'Broccoli', q: 100, u: 'g', cat: 'Produce' }, { n: 'Sweet potato', q: 150, u: 'g', cat: 'Produce' }, { n: 'Olive oil', q: 10, u: 'ml', cat: 'Pantry' }],
    steps: ['Preheat the oven to 200°C (400°F).', 'Cube the sweet potato and toss with half the olive oil; roast for 10 minutes.', 'Add broccoli florets to the tray and roast for another 10 minutes.', 'Season the salmon and pan-sear 3–4 minutes per side, or add to the oven tray for the last 10 minutes.', 'Plate the salmon alongside the roasted vegetables.'] },
  { id: 'd2', name: 'Turkey Chili', meal: 'Dinner', diets: ['dairy-free', 'gluten-free'], time: 20, cost: 3.1, protein: 36, cal: 420, carbs: 35, fat: 12,
    ingredients: [{ n: 'Ground turkey', q: 150, u: 'g', cat: 'Protein' }, { n: 'Kidney beans', q: 100, u: 'g', cat: 'Protein' }, { n: 'Tomato passata', q: 150, u: 'g', cat: 'Pantry' }, { n: 'Bell pepper', q: 50, u: 'g', cat: 'Produce' }, { n: 'Chili spice mix', q: 3, u: 'g', cat: 'Spices' }],
    steps: ['Brown the ground turkey in a pot over medium-high heat, breaking it up as it cooks.', 'Add the diced bell pepper and cook for 2–3 minutes.', 'Stir in the chili spice mix and cook for 30 seconds until fragrant.', 'Add the passata and kidney beans, bring to a simmer.', 'Cook for 10–12 minutes, stirring occasionally, until thickened.'] },
  { id: 'd3', name: 'Vegan Tofu Stir-Fry', meal: 'Dinner', diets: ['vegan', 'vegetarian', 'dairy-free', 'gluten-free'], time: 15, cost: 2.3, protein: 22, cal: 410, carbs: 45, fat: 14,
    ingredients: [{ n: 'Firm tofu', q: 150, u: 'g', cat: 'Protein' }, { n: 'Broccoli', q: 80, u: 'g', cat: 'Produce' }, { n: 'Carrot', q: 50, u: 'g', cat: 'Produce' }, { n: 'Tamari (gf soy sauce)', q: 15, u: 'ml', cat: 'Pantry' }, { n: 'Brown rice', q: 70, u: 'g', cat: 'Pantry' }],
    steps: ['Cook the brown rice according to package instructions.', 'Press and cube the tofu, then pan-fry in a hot wok until golden on all sides.', 'Add sliced carrot and broccoli florets, stir-fry for 4–5 minutes until crisp-tender.', 'Pour in the tamari and toss to coat everything evenly.', 'Serve the stir-fry over the brown rice.'] },
  { id: 'd4', name: 'Beef & Broccoli', meal: 'Dinner', diets: ['dairy-free', 'gluten-free'], time: 18, cost: 3.8, protein: 35, cal: 440, carbs: 30, fat: 18,
    ingredients: [{ n: 'Lean beef strips', q: 150, u: 'g', cat: 'Protein' }, { n: 'Broccoli', q: 100, u: 'g', cat: 'Produce' }, { n: 'Garlic', q: 5, u: 'g', cat: 'Produce' }, { n: 'Tamari (gf soy sauce)', q: 15, u: 'ml', cat: 'Pantry' }, { n: 'Brown rice', q: 70, u: 'g', cat: 'Pantry' }],
    steps: ['Cook the brown rice according to package instructions.', 'Sear the beef strips in a hot pan for 2–3 minutes until browned; set aside.', 'In the same pan, sauté minced garlic and broccoli florets for 3–4 minutes.', 'Return the beef to the pan, add tamari, and toss together for 1–2 minutes.', 'Serve over the brown rice.'] },
  { id: 'd5', name: 'Chickpea & Spinach Curry', meal: 'Dinner', diets: ['vegan', 'vegetarian', 'dairy-free', 'gluten-free'], time: 20, cost: 2.0, protein: 16, cal: 400, carbs: 50, fat: 12,
    ingredients: [{ n: 'Chickpeas', q: 150, u: 'g', cat: 'Protein' }, { n: 'Spinach', q: 80, u: 'g', cat: 'Produce' }, { n: 'Coconut milk', q: 150, u: 'ml', cat: 'Dairy/Alt' }, { n: 'Curry paste', q: 20, u: 'g', cat: 'Pantry' }, { n: 'Brown rice', q: 70, u: 'g', cat: 'Pantry' }],
    steps: ['Cook the brown rice according to package instructions.', 'Fry the curry paste in a pot for 1 minute until fragrant.', 'Add the coconut milk and chickpeas, and simmer for 8–10 minutes.', 'Stir in the spinach and cook until just wilted, about 2 minutes.', 'Season to taste and serve over the brown rice.'] },
  { id: 'd6', name: 'Baked Cod with Quinoa', meal: 'Dinner', diets: ['dairy-free', 'gluten-free'], time: 20, cost: 3.6, protein: 33, cal: 380, carbs: 30, fat: 8,
    ingredients: [{ n: 'Cod fillet', q: 150, u: 'g', cat: 'Protein' }, { n: 'Quinoa', q: 60, u: 'g', cat: 'Pantry' }, { n: 'Green beans', q: 80, u: 'g', cat: 'Produce' }, { n: 'Lemon', q: 1, u: 'pc', cat: 'Produce' }],
    steps: ['Preheat the oven to 200°C (400°F). Rinse the quinoa and simmer in double its volume of water for 12–15 minutes.', 'Place the cod on a lined baking tray, season, and top with lemon slices.', 'Bake for 12–15 minutes until the fish flakes easily.', 'Steam or blanch the green beans for 3–4 minutes until tender-crisp.', 'Plate the cod with quinoa and green beans, and finish with a squeeze of lemon.'] },

  // SNACKS
  { id: 's1', name: 'No-Bake Protein Balls', meal: 'Snack', diets: ['vegan', 'vegetarian', 'dairy-free', 'gluten-free'], time: 10, cost: 0.9, protein: 8, cal: 180, carbs: 20, fat: 8,
    ingredients: [{ n: 'Dates', q: 40, u: 'g', cat: 'Produce' }, { n: 'Oats (gf)', q: 30, u: 'g', cat: 'Pantry' }, { n: 'Pea protein powder', q: 15, u: 'g', cat: 'Pantry' }, { n: 'Peanut butter', q: 15, u: 'g', cat: 'Pantry' }],
    steps: ['Pit the dates and add them to a food processor with the oats, protein powder and peanut butter.', 'Blend until the mixture forms a sticky dough.', 'Roll into small balls with your hands.', 'Refrigerate for at least 30 minutes to firm up before eating.'] },
  { id: 's2', name: 'Cottage Cheese & Pineapple', meal: 'Snack', diets: ['vegetarian', 'gluten-free'], time: 2, cost: 1.3, protein: 15, cal: 150, carbs: 15, fat: 3,
    ingredients: [{ n: 'Cottage cheese', q: 150, u: 'g', cat: 'Dairy/Alt' }, { n: 'Pineapple', q: 80, u: 'g', cat: 'Produce' }],
    steps: ['Spoon the cottage cheese into a bowl.', 'Dice the pineapple and add on top.', 'Serve immediately, chilled.'] },
  { id: 's3', name: 'Hummus & Veggie Sticks', meal: 'Snack', diets: ['vegan', 'vegetarian', 'dairy-free', 'gluten-free'], time: 5, cost: 1.1, protein: 6, cal: 160, carbs: 18, fat: 8,
    ingredients: [{ n: 'Hummus', q: 60, u: 'g', cat: 'Pantry' }, { n: 'Carrot sticks', q: 60, u: 'g', cat: 'Produce' }, { n: 'Cucumber sticks', q: 60, u: 'g', cat: 'Produce' }],
    steps: ['Wash and cut the carrot and cucumber into sticks.', 'Spoon the hummus into a small bowl.', 'Arrange the veggie sticks around the hummus and serve.'] },
  { id: 's4', name: 'Almond & Dark Chocolate Mix', meal: 'Snack', diets: ['vegan', 'vegetarian', 'dairy-free', 'gluten-free'], time: 1, cost: 1.0, protein: 6, cal: 200, carbs: 14, fat: 15,
    ingredients: [{ n: 'Almonds', q: 25, u: 'g', cat: 'Pantry' }, { n: 'Dark chocolate', q: 20, u: 'g', cat: 'Pantry' }],
    steps: ['Roughly chop the dark chocolate.', 'Mix with the almonds in a small bowl or container.', 'Portion out and enjoy, or store for later.'] },
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function findRecipe(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// Compact catalog (no prose) — what we send to the LLM, to keep the prompt
// small and cheap. Full recipe objects (with steps) stay server/client side.
export function catalogForPrompt() {
  return RECIPES.map((r) => ({
    id: r.id,
    name: r.name,
    meal: r.meal,
    diets: r.diets,
    time: r.time,
    cost: r.cost,
    protein: r.protein,
    cal: r.cal,
  }));
}
