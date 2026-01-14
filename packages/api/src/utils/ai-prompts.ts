export const buildMonthlySummaryPrompt = (data: {
  vehicle: any;
  refills: any[];
  expenses: any[];
  statistics: any;
  timeframe: string;
}) => {
  return `You are a vehicle analytics assistant. Analyze this data and provide TWO separate monthly summaries: one in English and one in Ukrainian.

Vehicle: ${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}
Period: ${data.timeframe}

Refills (${data.refills.length} total):
${JSON.stringify(data.refills.slice(0, 10), null, 2)}

Expenses (${data.expenses.length} total):
${JSON.stringify(data.expenses.slice(0, 10), null, 2)}

Statistics (already converted to user preferences):
- Total fuel cost: ${data.statistics.totalFuelCost} ${data.statistics.currency}
- Total expenses: ${data.statistics.totalExpenses} ${data.statistics.currency}
- Average fuel volume per refill: ${data.statistics.avgVolume} ${data.statistics.volumeUnit}

IMPORTANT: All amounts are already in ${data.statistics.currency}. All volumes are in ${data.statistics.volumeUnit}. All distances are in ${data.statistics.distanceUnit}. Use these units in your summary.

Provide a well-formatted summary with:
1. **Key Performance Metrics** (2-3 sentences)
2. **Notable Trends or Patterns** (2-3 sentences)
3. **Top 3 Actionable Recommendations** (numbered list)
4. **Prediction for Next Month** (1-2 sentences)

Use markdown formatting:
- Use **bold** for section headers and important terms
- Use numbered lists (1., 2., 3.) for recommendations
- Add blank lines between sections

IMPORTANT: Respond ONLY with valid JSON:
{
  "en": "Full English summary with markdown formatting",
  "uk": "Повний український переклад з markdown форматуванням"
}

The Ukrainian version must be a complete translation. Keep each under 300 words.`;
};
