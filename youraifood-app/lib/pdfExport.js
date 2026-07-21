// Client-side PDF export for a generated weekly plan + grocery list.
// jsPDF and its autotable plugin are only pulled in when this module is
// actually imported (Planner.jsx does that lazily, on click), so the PDF
// libraries never bloat the main bundle for people who don't use the button.
import { findRecipe } from './recipes';

const MEAL_LABELS = { breakfast: 'Breakfast', main: 'Lunch & Dinner', snack: 'Snack' };
const GOAL_LABELS = { lose: 'Lose weight', muscle: 'Build muscle', maintain: 'Maintain / general health' };
const CAT_ORDER = ['Protein', 'Produce', 'Pantry', 'Dairy/Alt', 'Spices'];

export async function downloadPlanPdf({ days, mealSlots, groceries, stats, coachNote, goal, proteinTarget, calorieTarget, budget }) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = 48;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 60, 40);
  doc.text('YourAiFood — Your Weekly Plan', margin, y);
  y += 18;

  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Generated ${dateStr}  ·  Goal: ${GOAL_LABELS[goal] || goal}  ·  Target: ${calorieTarget} kcal / ${proteinTarget}g protein per day  ·  Budget: €${budget}/week`,
    margin,
    y
  );
  y += 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(20, 100, 60);
  doc.text(
    `Est. weekly cost €${stats.totalCost.toFixed(0)}   ·   Avg daily protein ${stats.avgProtein}g   ·   Avg daily calories ${stats.avgCal} kcal   ·   ${stats.distinctRecipes} distinct recipes`,
    margin,
    y
  );
  y += 18;

  if (coachNote) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);
    const wrapped = doc.splitTextToSize(`Coach note: ${coachNote}`, pageWidth - margin * 2);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 11 + 12;
  }

  // 7-day menu table
  const head = [['Day', ...mealSlots.map((s) => MEAL_LABELS[s] || s)]];
  const body = days.map((row) => {
    const cells = mealSlots.map((slot) => {
      const dishes = (row[`${slot}Dishes`] || [])
        .map((d) => ({ ...d, recipe: findRecipe(d.id) }))
        .filter((d) => d.recipe);
      if (!dishes.length) return '—';
      return dishes
        .map(
          (d) =>
            `${d.recipe.name}\n${Math.round(d.recipe.protein * d.servings)}g protein · ${d.recipe.time}min · €${(
              d.recipe.cost * d.servings
            ).toFixed(2)}`
        )
        .join('\n\n');
    });
    return [row.day, ...cells];
  });

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 4, valign: 'top', overflow: 'linebreak', textColor: [40, 40, 40] },
    headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 52, textColor: [20, 83, 45] } },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 26;

  // Grocery list, grouped by category
  if (y > pageHeight - 120) {
    doc.addPage();
    y = 48;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 60, 40);
  doc.text('Grocery list', margin, y);
  y += 12;

  const groceryBody = [];
  CAT_ORDER.forEach((cat) => {
    const items = Object.entries(groceries)
      .filter(([, info]) => info.cat === cat)
      .sort((a, b) => a[0].localeCompare(b[0]));
    if (!items.length) return;
    groceryBody.push([
      { content: cat, colSpan: 2, styles: { fillColor: [223, 245, 227], textColor: [20, 83, 45], fontStyle: 'bold' } },
    ]);
    items.forEach(([name, info]) => {
      groceryBody.push([name, `${Math.round(info.qty)}${info.unit}`]);
    });
  });

  autoTable(doc, {
    startY: y,
    body: groceryBody,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4.5 },
    columnStyles: { 0: { cellWidth: pageWidth - margin * 2 - 100 }, 1: { cellWidth: 100, halign: 'right' } },
    margin: { left: margin, right: margin },
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('YourAiFood — AI-generated meal plan. Not medical or dietary advice.', margin, pageHeight - 20);

  doc.save('youraifood-weekly-plan.pdf');
}
