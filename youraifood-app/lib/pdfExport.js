// Client-side PDF/CSV export for a generated weekly plan + grocery list.
// jsPDF and its autotable plugin are only pulled in when this module is
// actually imported (Planner.jsx does that lazily, on click), so the PDF
// libraries never bloat the main bundle for people who don't use the button.
import { findRecipe } from './recipes';

const MEAL_LABELS = { breakfast: 'Breakfast', main: 'Lunch & Dinner', snack: 'Snack' };
const GOAL_LABELS = { lose: 'Lose weight', muscle: 'Build muscle', maintain: 'Maintain / general health' };
const CAT_ORDER = ['Protein', 'Produce', 'Pantry', 'Dairy/Alt', 'Spices'];

// Collect every distinct recipe used in the plan (in order of first
// appearance) together with the total servings planned across the week.
function collectPlanRecipes(days, mealSlots) {
  const map = new Map();
  days.forEach((row) => {
    mealSlots.forEach((slot) => {
      (row[`${slot}Dishes`] || []).forEach((d) => {
        const recipe = findRecipe(d.id);
        if (!recipe) return;
        const s = d.servings || 1;
        const entry = map.get(recipe.id) || { recipe, servings: 0, meals: 0, minS: s, maxS: s };
        entry.servings += s;
        entry.meals += 1;
        entry.minS = Math.min(entry.minS, s);
        entry.maxS = Math.max(entry.maxS, s);
        map.set(recipe.id, entry);
      });
    });
  });
  return [...map.values()];
}

function formatQty(q, u) {
  const n = Math.round(q * 10) / 10;
  return u === 'pc' ? `${n} pc` : `${n}${u}`;
}

export async function downloadPlanPdf({ days, mealSlots, groceries, stats, coachNote, goal, proteinTarget, calorieTarget, budgetLevel }) {
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
    `Generated ${dateStr}  ·  Goal: ${GOAL_LABELS[goal] || goal}  ·  Target: ${calorieTarget} kcal / ${proteinTarget}g protein per day  ·  Budget: ${budgetLevel === 'budget' ? 'Budget-friendly' : budgetLevel === 'premium' ? 'Premium' : 'Balanced'}`,
    margin,
    y
  );
  y += 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(20, 100, 60);
  doc.text(
    `Avg daily protein ${stats.avgProtein}g   ·   Avg daily calories ${stats.avgCal} kcal   ·   ${stats.distinctRecipes} distinct recipes`,
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
            `${d.recipe.name}\n${Math.round(d.recipe.protein * d.servings)}g protein · ${d.recipe.time}min`
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

  // Grocery list, grouped by category — each item gets a printable checkbox
  // so the PDF doubles as a physical shopping-list you can tick off in-store.
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
      { content: cat, colSpan: 3, styles: { fillColor: [223, 245, 227], textColor: [20, 83, 45], fontStyle: 'bold' } },
    ]);
    items.forEach(([name, info]) => {
      groceryBody.push(['', name, `${Math.round(info.qty)}${info.unit}`]);
    });
  });

  autoTable(doc, {
    startY: y,
    body: groceryBody,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4.5 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: pageWidth - margin * 2 - 120 },
      2: { cellWidth: 100, halign: 'right' },
    },
    margin: { left: margin, right: margin },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0 && data.cell.raw === '') {
        const size = 9;
        const boxX = data.cell.x + (data.cell.width - size) / 2;
        const boxY = data.cell.y + (data.cell.height - size) / 2;
        doc.setDrawColor(120, 120, 120);
        doc.rect(boxX, boxY, size, size);
      }
    },
  });

  // Recipes section: one block per distinct dish in the plan, with its
  // ingredients (per serving) and the cooking steps.
  const planRecipes = collectPlanRecipes(days, mealSlots);
  if (planRecipes.length) {
    doc.addPage();
    y = 48;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(20, 60, 40);
    doc.text('Recipes in your plan', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(110, 110, 110);
    doc.text('Portions in your plan are scaled to hit your targets, so each meal can be more than 1 serving. Ingredient tables show 1 serving and the amount per meal in your plan.', margin, y);
    y += 18;

    const fmtS = (n) => `${Math.round(n * 10) / 10}`;
    planRecipes.forEach(({ recipe, servings, meals, minS, maxS }) => {
      // Portion used per meal in the plan (a single number or a range).
      const sameS = minS === maxS;
      const perMealLabel = sameS ? `${fmtS(minS)}×` : `${fmtS(minS)}–${fmtS(maxS)}×`;
      const perMealCal = sameS
        ? `${Math.round(recipe.cal * minS)} kcal`
        : `${Math.round(recipe.cal * minS)}–${Math.round(recipe.cal * maxS)} kcal`;
      const perMealProtein = sameS
        ? `${Math.round(recipe.protein * minS)}g`
        : `${Math.round(recipe.protein * minS)}–${Math.round(recipe.protein * maxS)}g`;
      const steps = recipe.steps || [];
      const ingredients = recipe.ingredients || [];

      // Keep a recipe header together with the start of its content.
      if (y > pageHeight - 150) {
        doc.addPage();
        y = 48;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(20, 83, 45);
      doc.text(recipe.name, margin, y);
      y += 13;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      const servingsLabel = Math.round(servings * 10) / 10;
      doc.text(
        `1 serving: ${recipe.cal} kcal · ${recipe.protein}g protein  ·  ${recipe.time} min`,
        margin,
        y
      );
      y += 11;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 100, 60);
      doc.text(
        `In your plan: ${meals} meal${meals === 1 ? '' : 's'} at ${perMealLabel} serving → ${perMealCal} · ${perMealProtein} protein per meal  (${servingsLabel} servings in total)`,
        margin,
        y
      );
      doc.setFont('helvetica', 'normal');
      y += 8;

      if (ingredients.length) {
        autoTable(doc, {
          startY: y,
          head: [['Ingredient', '1 serving', `Per meal in your plan (${perMealLabel})`]],
          body: ingredients.map((ing) => [
            ing.n,
            formatQty(ing.q, ing.u),
            sameS ? formatQty(ing.q * minS, ing.u) : `${formatQty(ing.q * minS, ing.u)} – ${formatQty(ing.q * maxS, ing.u)}`,
          ]),
          theme: 'striped',
          styles: { fontSize: 8.5, cellPadding: 3 },
          headStyles: { fillColor: [22, 101, 52], textColor: 255, fontSize: 8.5 },
          columnStyles: { 1: { cellWidth: 80, halign: 'right' }, 2: { cellWidth: 170, halign: 'right' } },
          margin: { left: margin, right: margin },
        });
        y = doc.lastAutoTable.finalY + 10;
      }

      if (steps.length) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(40, 40, 40);
        if (y > pageHeight - 60) {
          doc.addPage();
          y = 48;
        }
        doc.text('Method', margin, y);
        y += 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        steps.forEach((step, i) => {
          const lines = doc.splitTextToSize(`${i + 1}. ${step}`, pageWidth - margin * 2 - 10);
          if (y + lines.length * 11 > pageHeight - 40) {
            doc.addPage();
            y = 48;
          }
          doc.text(lines, margin + 6, y);
          y += lines.length * 11 + 3;
        });
      }

      y += 16;
    });
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('YourAiFood — AI-generated meal plan. Not medical or dietary advice.', margin, pageHeight - 20);
    doc.text(`Page ${p} of ${pageCount}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
  }

  doc.save('youraifood-weekly-plan.pdf');
}

function escapeCsvCell(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// CSV export of just the grocery list, with a blank "Checked" column so it
// opens cleanly in Numbers/Excel/Sheets for people who'd rather tick boxes
// digitally than print the PDF.
export function downloadGroceryCsv({ groceries }) {
  const rows = [['Category', 'Item', 'Quantity', 'Checked']];
  CAT_ORDER.forEach((cat) => {
    Object.entries(groceries)
      .filter(([, info]) => info.cat === cat)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([name, info]) => {
        rows.push([cat, name, `${Math.round(info.qty)}${info.unit}`, '']);
      });
  });
  const csv = rows.map((r) => r.map(escapeCsvCell).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'youraifood-grocery-list.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
