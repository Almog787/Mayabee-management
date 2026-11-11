/**
 * Autonomous Local Profitability & Combinatorial Action Engine (Home Daycare / Mishpachton Sole Proprietor)
 * ---------------------------------------------------------------------------------------------------------
 * Calibrated specifically for a single-person business operating a home-based daycare (משפחתון ביתי של אדם יחיד):
 * - Max legal capacity for a single caregiver at home: 5 children (Child Supervision Regulations).
 * - No hired salaried staff (no 17% employer overhead for assistants); the caregiver's take-home pay IS the business net profit!
 * - Optional backup fund for substitute caregiver during sick/vacation days.
 * - Tax-deductible home operational expenses (food, electricity, water, municipal tax, daycare insurance, accountant, consumables).
 * - Combinatorial sensitivity exploration tailored to home daycare levers.
 * - Local reinforcement learning (Zero-AI, 100% Client-Side) persisting to localStorage.
 */

export type ProfitabilityActionType = 'ADD_INCOME' | 'CUT_OPEX' | 'OPTIMIZE_HOURS' | 'ADJUST_BUFFER' | 'SYNERGISTIC_BUNDLE';

export interface RegulatoryComplianceCheck {
  isCompliant: boolean;
  ruleName: string;
  details: string;
  badgeText: string;
}

export interface ProfitabilityProposal {
  id: string;
  type: ProfitabilityActionType;
  categoryKey: string;
  title: string;
  subtitle: string;
  actionDirection: 'ADD' | 'REDUCE' | 'OPTIMIZE' | 'BUNDLE';
  monthlyShekelDelta: number; // positive = net increase in monthly profit
  costToImplement: number;
  projectedNewProfit: number;
  projectedNewProfitPercent: number;
  profitDeltaPercent: number; // e.g. +2.45%
  feasibilityScore: number; // 0-100 based on learned weights
  learnedWeight: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  regulatoryCompliance: RegulatoryComplianceCheck;
  balanceRationale: string;
  suggestedChanges: {
    childrenCountDelta?: number;
    tuitionPerChildDelta?: number;
    foodCostDelta?: number;
    utilitiesCostDelta?: number;
    consumablesCostDelta?: number;
    insuranceCostDelta?: number;
    backupFundDelta?: number;
    contingencyPercentDelta?: number;
    extraMonthlyIncomeNet?: number;
  };
}

export interface AlgorithmicConclusion {
  id: string;
  timestamp: string;
  dateFormatted: string;
  leverId: string;
  leverTitle: string;
  action: 'ACCEPTED' | 'REJECTED';
  categoryKey: string;
  previousWeight: number;
  newWeight: number;
  learnedRule: string;
  algorithmicAdjustment: string;
}

export interface SiteModelInputs {
  childrenCount: number;
  tuitionPerChild: number;
  vatRatePercent: number;
  backupStaffCost: number; // קרן גיבוי / ממלאת מקום לימי מחלה
  operatingExpenses: number;
  contingencyPercent: number;
  // Specific expense breakdowns
  foodCost?: number;
  accountantCost?: number;
  utilitiesCost?: number;
  arnonaCost?: number;
  insuranceCost?: number;
  consumablesCost?: number;
  maintenanceCost?: number;
}

const WEIGHTS_STORAGE_KEY = 'home_daycare_local_optimizer_weights_v3';
const CONCLUSIONS_STORAGE_KEY = 'home_daycare_local_optimizer_conclusions_v3';

export const DEFAULT_CATEGORY_WEIGHTS: Record<string, number> = {
  capacity: 1.2, // הגעה לתפוסה מלאה (עד 5 ילדים)
  afternoonHours: 1.0, // צהרון מוארך / שעות נוספות
  food: 1.0, // רכש חכם ותפריט שבועי
  homeExpenses: 1.0, // מיצוי הוצאות בית מוכרות במס
  insuranceAndFees: 1.0, // דמי רישום וביטוח שנתיים
  contingencyBuffer: 1.0, // רזרבת ימי חופשה ומחלה
  synergisticBundle: 1.2, // חבילת ייצוב רווחיות משולבת למשפחתון
};

/**
 * Loads learned category weights from localStorage
 */
export function getLearnedWeights(): Record<string, number> {
  try {
    const raw = localStorage.getItem(WEIGHTS_STORAGE_KEY);
    if (raw) return { ...DEFAULT_CATEGORY_WEIGHTS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load learned weights', e);
  }
  return { ...DEFAULT_CATEGORY_WEIGHTS };
}

/**
 * Saves learned category weights to localStorage
 */
export function saveLearnedWeights(weights: Record<string, number>): void {
  try {
    localStorage.setItem(WEIGHTS_STORAGE_KEY, JSON.stringify(weights));
  } catch (e) {
    console.error('Failed to save learned weights', e);
  }
}

/**
 * Loads algorithmic conclusions recorded by the local engine
 */
export function getLearningConclusions(): AlgorithmicConclusion[] {
  try {
    const raw = localStorage.getItem(CONCLUSIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load learning conclusions', e);
  }
  return [
    {
      id: 'init-1',
      timestamp: new Date().toISOString(),
      dateFormatted: 'מסקנת בסיס – משפחתון ביתי',
      leverId: 'home-capacity-rule',
      leverTitle: 'תקן תפוסה חוקי למטפלת יחידה בבית',
      action: 'ACCEPTED',
      categoryKey: 'capacity',
      previousWeight: 1.0,
      newWeight: 1.2,
      learnedRule: 'במשפחתון ביתי של אדם יחיד, התקן המרבי לפי חוק הפיקוח הוא עד 5 ילדים. תפוסה מלאה של 5 ילדים מפיקה שכר נטו יעד של כ-10,000–12,000 ₪ למטפלת.',
      algorithmicAdjustment: 'הגבלת כל הצעות התפוסה לרף חוקי מרבי של 5 ילדים בדיוק, ותעדוף מילוי מקום פנוי כמנוף המשתלם ביותר.',
    },
    {
      id: 'init-2',
      timestamp: new Date().toISOString(),
      dateFormatted: 'מסקנת בסיס – הוצאות בית מוכרות',
      leverId: 'home-tax-baseline',
      leverTitle: 'הכרה בהוצאות משק בית לצורכי מס',
      action: 'ACCEPTED',
      categoryKey: 'homeExpenses',
      previousWeight: 1.0,
      newWeight: 1.0,
      learnedRule: 'עסק ביתי מאפשר הכרה בחלק יחסי (25%-30%) של חשמל, מים, ארנונה ואינטרנט. זהו חיסכון מס ישיר המעלה את הרווח הפנוי של המטפלת.',
      algorithmicAdjustment: 'שמירה על סעיפי התפעול כהוצאות מוכרות המפחיתות את מקדמות מס הכנסה וביטוח לאומי לעצמאית.',
    },
  ];
}

/**
 * Saves algorithmic conclusions to localStorage
 */
export function saveLearningConclusions(conclusions: AlgorithmicConclusion[]): void {
  try {
    localStorage.setItem(CONCLUSIONS_STORAGE_KEY, JSON.stringify(conclusions.slice(0, 50)));
  } catch (e) {
    console.error('Failed to save learning conclusions', e);
  }
}

/**
 * Records user feedback (Accept or Reject) on a specific proposal,
 * adjusts weights via heuristic reinforcement, and writes a detailed conclusion.
 */
export function recordProposalFeedback(
  proposal: ProfitabilityProposal,
  action: 'ACCEPTED' | 'REJECTED'
): { updatedWeights: Record<string, number>; newConclusion: AlgorithmicConclusion } {
  const weights = getLearnedWeights();
  const conclusions = getLearningConclusions();
  const currentWeight = weights[proposal.categoryKey] ?? 1.0;

  let delta = 0;
  let learnedRule = '';
  let algorithmicAdjustment = '';

  if (action === 'ACCEPTED') {
    delta = 0.20;
    const newWeight = Math.min(2.5, +(currentWeight + delta).toFixed(2));
    weights[proposal.categoryKey] = newWeight;
    learnedRule = `המטפלת אישרה את ההצעה "${proposal.title}". האלגוריתם למד כי כיוון פעולה זה מתאים לשגרת המשפחתון בבית, והעלה את ציון האמינות מ-${currentWeight} ל-${newWeight}.`;
    algorithmicAdjustment = `הגברת תדירות הצעות בתחום "${proposal.categoryKey}" ותעדוף ראשון בסימולציות.`;
  } else {
    delta = -0.25;
    const newWeight = Math.max(0.15, +(currentWeight + delta).toFixed(2));
    weights[proposal.categoryKey] = newWeight;
    learnedRule = `המטפלת דחתה את ההצעה "${proposal.title}". האלגוריתם למד כי ישנה התנגדות לשינוי בתחום זה במשפחתון, והוריד את ציון המשקל מ-${currentWeight} ל-${newWeight}.`;
    algorithmicAdjustment = `הפחתת הצעות בתחום "${proposal.categoryKey}" והסטת הדגש למנופי רווחיות חלופיים.`;
  }

  saveLearnedWeights(weights);

  const now = new Date();
  const dateFormatted = `${now.toLocaleDateString('he-IL')} ${now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;

  const newConclusion: AlgorithmicConclusion = {
    id: `conclusion-${Date.now()}`,
    timestamp: now.toISOString(),
    dateFormatted,
    leverId: proposal.id,
    leverTitle: proposal.title,
    action,
    categoryKey: proposal.categoryKey,
    previousWeight: currentWeight,
    newWeight: weights[proposal.categoryKey],
    learnedRule,
    algorithmicAdjustment,
  };

  saveLearningConclusions([newConclusion, ...conclusions]);
  return { updatedWeights: weights, newConclusion };
}

export function resetOptimizerMemory() {
  localStorage.removeItem(WEIGHTS_STORAGE_KEY);
  localStorage.removeItem(CONCLUSIONS_STORAGE_KEY);
  return { weights: { ...DEFAULT_CATEGORY_WEIGHTS }, conclusions: getLearningConclusions() };
}

/**
 * Combinatorial Action for Home Daycare (Single Person):
 * Sweeps across ALL data and options entered on the site and generates
 * tailored proposals for a home daycare of 1 to 5 children.
 */
export function generateProfitabilityProposals(currentParams: SiteModelInputs): ProfitabilityProposal[] {
  const weights = getLearnedWeights();
  const numChildren = Math.max(1, Math.min(6, currentParams.childrenCount || 5));
  const tuition = currentParams.tuitionPerChild || 3500;
  const vatRate = (currentParams.vatRatePercent || 18) / 100;

  const currentGross = numChildren * tuition;
  const currentNet = currentGross / (1 + vatRate);
  const currentBackupCost = currentParams.backupStaffCost ?? 500.0;
  const currentOpex = currentParams.operatingExpenses || 2800.0;
  const contingencyPercent = currentParams.contingencyPercent || 10;
  const contingencyAmount = currentNet * (contingencyPercent / 100);
  const currentTotalExpenses = currentBackupCost + currentOpex + contingencyAmount;
  const currentProfit = currentNet - currentTotalExpenses; // Caregiver's net take-home earnings
  const currentProfitPercent = currentNet > 0 ? (currentProfit / currentNet) * 100 : 0;

  const foodCost = currentParams.foodCost ?? 1250.0;
  const utilitiesCost = currentParams.utilitiesCost ?? 350.0;

  const proposals: ProfitabilityProposal[] = [];

  // =========================================================================
  // OPTION 1: הגעה לתפוסה מלאה (5 ילדים למטפלת יחידה)
  // =========================================================================
  if (numChildren < 5) {
    const extraGross = tuition;
    const extraNet = extraGross / (1 + vatRate);
    const extraContingency = extraNet * (contingencyPercent / 100);
    const marginalFoodCost = 250.0; // food for 1 extra child
    const netGain = extraNet - extraContingency - marginalFoodCost;

    const projectedProfit = currentProfit + netGain;
    const projectedNet = currentNet + extraNet;
    const projectedProfitPercent = (projectedProfit / projectedNet) * 100;
    const weight = weights.capacity ?? 1.2;

    proposals.push({
      id: `lever-capacity-full-5`,
      type: 'ADD_INCOME',
      categoryKey: 'capacity',
      title: `קליטת ילד/ה נוסף/ת לתפוסה מלאה של ${numChildren + 1} ילדים`,
      subtitle: `מילוי מקום פנוי מקפיץ את שכר המטפלת ב-₪${Math.round(netGain)} נטו לחודש!`,
      actionDirection: 'ADD',
      monthlyShekelDelta: Math.round(netGain),
      costToImplement: Math.round(marginalFoodCost),
      projectedNewProfit: Math.round(projectedProfit),
      projectedNewProfitPercent: +projectedProfitPercent.toFixed(2),
      profitDeltaPercent: +(projectedProfitPercent - currentProfitPercent).toFixed(2),
      feasibilityScore: Math.min(100, Math.round(96 * weight)),
      learnedWeight: weight,
      status: 'PENDING',
      regulatoryCompliance: {
        isCompliant: true,
        ruleName: `תקן משפחתון ביתי (עד 5 ילדים)`,
        details: `תפוסה של ${numChildren + 1} ילדים עומדת בדיוק בתקן החוקי המרבי למטפלת יחידה בבית ללא צורך בסייעת שכירה.`,
        badgeText: 'תואם תקן משפחתון ביתי ✓',
      },
      balanceRationale: 'זהו המנוף המשמעותי ביותר במשפחתון ביתי: כל הוצאות הבית, הביטוח והרו"ח כבר משולמות, כך ש-85% משכר הלימוד הנוסף עובר ישירות לכיס המטפלת.',
      suggestedChanges: {
        childrenCountDelta: 1,
        foodCostDelta: 250,
      },
    });
  }

  // =========================================================================
  // OPTION 2: צהרון מוארך / שעות נוספות אחה"צ (16:00 עד 16:30/17:00)
  // =========================================================================
  {
    const feePerChild = 200.0; // תוספת ₪200 לילד עבור חצי שעה - שעה ביום
    const extraGross = numChildren * feePerChild;
    const extraNet = extraGross / (1 + vatRate);
    const extraContingency = extraNet * (contingencyPercent / 100);
    const netGain = Math.round(extraNet - extraContingency);

    const projectedProfit = currentProfit + netGain;
    const projectedNet = currentNet + extraNet;
    const projectedProfitPercent = (projectedProfit / projectedNet) * 100;
    const weight = weights.afternoonHours ?? 1.0;

    proposals.push({
      id: 'lever-extended-hours',
      type: 'ADD_INCOME',
      categoryKey: 'afternoonHours',
      title: 'הפעלת צהרון מוארך / שעת השגחה נוספת אחה"צ',
      subtitle: `תוספת נטו של ₪${netGain}/חודש להכנסת המטפלת עבור הארכת שעות מבוקשת`,
      actionDirection: 'ADD',
      monthlyShekelDelta: netGain,
      costToImplement: 0,
      projectedNewProfit: Math.round(projectedProfit),
      projectedNewProfitPercent: +projectedProfitPercent.toFixed(2),
      profitDeltaPercent: +(projectedProfitPercent - currentProfitPercent).toFixed(2),
      feasibilityScore: Math.min(100, Math.round(88 * weight)),
      learnedWeight: weight,
      status: 'PENDING',
      regulatoryCompliance: {
        isCompliant: true,
        ruleName: 'הסכם שעות התקשרות עם הורים',
        details: 'שירות מבוקש מאוד להורים עובדים. מוגדר כתוספת בחירה בהסכם ההתקשרות השנתי.',
        badgeText: 'הסכם שעות מסודר ✓',
      },
      balanceRationale: 'תוספת הכנסה ישירה ללא שום הוצאות תפעול חדשות – מתבצע באותו חלל ביתי קיים.',
      suggestedChanges: {
        extraMonthlyIncomeNet: netGain,
      },
    });
  }

  // =========================================================================
  // OPTION 3: רכש שבועי מרוכז של מזון טרי וביתי (הזנה)
  // =========================================================================
  if (foodCost >= 800) {
    const foodSavings = 150.0; // חיסכון של ₪150/חודש בתכנון שבועי
    const projectedProfit = currentProfit + foodSavings;
    const projectedProfitPercent = (projectedProfit / currentNet) * 100;
    const weight = weights.food ?? 1.0;

    proposals.push({
      id: 'lever-home-food-planning',
      type: 'CUT_OPEX',
      categoryKey: 'food',
      title: 'תכנון תפריט שבועי מרוכז וקנייה ישירה בשוק/סיטונאות',
      subtitle: `חיסכון של ₪${foodSavings}/חודש בהוצאות המזון ללא שום שינוי באיכות המנות`,
      actionDirection: 'REDUCE',
      monthlyShekelDelta: foodSavings,
      costToImplement: 0,
      projectedNewProfit: Math.round(projectedProfit),
      projectedNewProfitPercent: +projectedProfitPercent.toFixed(2),
      profitDeltaPercent: +(projectedProfitPercent - currentProfitPercent).toFixed(2),
      feasibilityScore: Math.min(100, Math.round(85 * weight)),
      learnedWeight: weight,
      status: 'PENDING',
      regulatoryCompliance: {
        isCompliant: true,
        ruleName: 'תזונת פעוטות ביתית ומאוזנת',
        details: 'כל הארוחות מבושלות טריות בבית (פירות, ירקות, בשר וקטניות). החיסכון מושג מתכנון מוקדם ומניעת פחת מזון.',
        badgeText: 'מזון ביתי איכותי ומאושר ✓',
      },
      balanceRationale: 'הזנת 5 ילדים בבית מאפשרת גמישות ובישול טרי יומיומי בעלות נמוכה בהרבה מרשתות קמעונאיות יקרות.',
      suggestedChanges: {
        foodCostDelta: -foodSavings,
      },
    });
  }

  // =========================================================================
  // OPTION 4: מיצוי הוצאות בית מוכרות במס (חשמל, גז וארנונה)
  // =========================================================================
  {
    const taxSavingNet = 200.0; // חיסכון מס חודשי מוערך ממיצוי הכרה
    const projectedProfit = currentProfit + taxSavingNet;
    const projectedProfitPercent = (projectedProfit / currentNet) * 100;
    const weight = weights.homeExpenses ?? 1.0;

    proposals.push({
      id: 'lever-home-tax-optimization',
      type: 'OPTIMIZE_HOURS',
      categoryKey: 'homeExpenses',
      title: 'הגדלת יחס ההכרה בהוצאות הבית לצורכי מס (מ-20% ל-30%)',
      subtitle: `חיסכון מס מוערך של ₪${taxSavingNet}/חודש במקדמות מס הכנסה וביטוח לאומי`,
      actionDirection: 'OPTIMIZE',
      monthlyShekelDelta: taxSavingNet,
      costToImplement: 0,
      projectedNewProfit: Math.round(projectedProfit),
      projectedNewProfitPercent: +projectedProfitPercent.toFixed(2),
      profitDeltaPercent: +(projectedProfitPercent - currentProfitPercent).toFixed(2),
      feasibilityScore: Math.min(100, Math.round(82 * weight)),
      learnedWeight: weight,
      status: 'PENDING',
      regulatoryCompliance: {
        isCompliant: true,
        ruleName: 'פקודת מס הכנסה – הוצאות בית בעסק',
        details: 'החוק מתיר לנכות חלק יחסי משטח הבית המשמש למשפחתון (חשמל, מים, ארנונה, אינטרנט וחומרי ניקיון).',
        badgeText: 'הכרה במס כחוק ✓',
      },
      balanceRationale: 'ניצול מקלט מס לגיטימי של עסק מהבית המשאיר יותר כסף נטו בידי המטפלת ללא השקעה כספית.',
      suggestedChanges: {
        extraMonthlyIncomeNet: taxSavingNet,
      },
    });
  }

  // =========================================================================
  // OPTION 5: דמי רישום וביטוח שנתיים ייעודיים
  // =========================================================================
  {
    // דמי רישום וביטוח של ₪600 לילד לשנה (מחולק ל-12 חודשים = ₪50 לילד/חודש)
    const monthlyNetAdded = Math.round((numChildren * 50) / (1 + vatRate));
    const projectedProfit = currentProfit + monthlyNetAdded;
    const projectedNet = currentNet + monthlyNetAdded;
    const projectedProfitPercent = (projectedProfit / projectedNet) * 100;
    const weight = weights.insuranceAndFees ?? 1.0;

    proposals.push({
      id: 'lever-annual-registration-fee',
      type: 'ADD_INCOME',
      categoryKey: 'insuranceAndFees',
      title: 'הסדרת דמי רישום וביטוח שנתיים (₪600 לילד לשנה)',
      subtitle: `תוספת חודשית נטו של ₪${monthlyNetAdded}/חודש לכיסוי מלא של פוליסת הביטוח`,
      actionDirection: 'ADD',
      monthlyShekelDelta: monthlyNetAdded,
      costToImplement: 0,
      projectedNewProfit: Math.round(projectedProfit),
      projectedNewProfitPercent: +projectedProfitPercent.toFixed(2),
      profitDeltaPercent: +(projectedProfitPercent - currentProfitPercent).toFixed(2),
      feasibilityScore: Math.min(100, Math.round(84 * weight)),
      learnedWeight: weight,
      status: 'PENDING',
      regulatoryCompliance: {
        isCompliant: true,
        ruleName: 'נוהג משפחתונים פרטיים',
        details: 'גבייה חד-פעמית מקובלת בתחילת שנה לכיסוי פוליסת ביטוח תאונות אישיות וציוד פתיחת שנה.',
        badgeText: 'נוהג מקובל כחוק ✓',
      },
      balanceRationale: 'מבטיח כי עלות הביטוח המקצועי של הילדים מכוסה ישירות ע"י דמי הרישום ולא נגרעת מהרווח החודשי השוטף.',
      suggestedChanges: {
        extraMonthlyIncomeNet: monthlyNetAdded,
      },
    });
  }

  // =========================================================================
  // OPTION 6: חבילת ייצוב רווחיות משולבת למשפחתון ביתי (Synergistic Bundle)
  // =========================================================================
  {
    const capacityDelta = numChildren < 5 ? (tuition / (1 + vatRate)) * 0.85 : 0;
    const hoursDelta = (numChildren * 200) / (1 + vatRate) * 0.9;
    const foodSavings = 150.0;
    const totalBundleDelta = Math.round(capacityDelta + hoursDelta + foodSavings);

    const bundleNewProfit = Math.round(currentProfit + totalBundleDelta);
    const bundleNewNet = currentNet + (numChildren < 5 ? (tuition / (1 + vatRate)) : 0) + ((numChildren * 200) / (1 + vatRate));
    const bundleProfitPercent = (bundleNewProfit / bundleNewNet) * 100;
    const weight = weights.synergisticBundle ?? 1.2;

    proposals.unshift({
      id: 'lever-home-bundle-prime',
      type: 'SYNERGISTIC_BUNDLE',
      categoryKey: 'synergisticBundle',
      title: '⭐ חבילת שגשוג משפחתון ביתי (תפוסה 5 + צהרון + רכש חכם)',
      subtitle: `שילוב מנצח: מזניק את שכר המטפלת ל-₪${bundleNewProfit.toLocaleString()} נטו בחודש!`,
      actionDirection: 'BUNDLE',
      monthlyShekelDelta: totalBundleDelta,
      costToImplement: numChildren < 5 ? 250 : 0,
      projectedNewProfit: bundleNewProfit,
      projectedNewProfitPercent: +bundleProfitPercent.toFixed(2),
      profitDeltaPercent: +(bundleProfitPercent - currentProfitPercent).toFixed(2),
      feasibilityScore: Math.min(100, Math.round(97 * weight)),
      learnedWeight: weight,
      status: 'PENDING',
      regulatoryCompliance: {
        isCompliant: true,
        ruleName: 'מודל משפחתון ביתי מנצח כחוק',
        details: 'כל הצעדים תואמים ב-100% לחוק הפיקוח (5 ילדים למטפלת יחידה בביתה) ולכללי מס הכנסה.',
        badgeText: 'מודל ביתי מושלם ומאושר ✓',
      },
      balanceRationale: 'ממצה את פוטנציאל ההכנסה של המשפחתון מבלי להזדקק לסייעת שכירה או להשכרת מבנה יקר – משאיר מקסימום רווח נקי בידי המטפלת.',
      suggestedChanges: {
        childrenCountDelta: numChildren < 5 ? 1 : 0,
        foodCostDelta: -150,
        extraMonthlyIncomeNet: Math.round(hoursDelta),
      },
    });
  }

  return proposals.sort((a, b) => b.feasibilityScore - a.feasibilityScore);
}
