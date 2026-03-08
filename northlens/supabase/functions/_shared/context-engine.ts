// Canadian Context Engine — provides business-relevant Canadian context to AI

interface CanadianContext {
  exchange_rate: { cad_usd: number; trend: string };
  season: string;
  upcoming_holidays: string[];
  weather?: { temp_c: number; condition: string; location: string };
}

const CANADIAN_HOLIDAYS_2026 = [
  { date: '2026-01-01', name: 'New Year\'s Day' },
  { date: '2026-02-16', name: 'Family Day (ON)' },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-05-18', name: 'Victoria Day' },
  { date: '2026-07-01', name: 'Canada Day' },
  { date: '2026-08-03', name: 'Civic Holiday (ON)' },
  { date: '2026-09-07', name: 'Labour Day' },
  { date: '2026-10-12', name: 'Thanksgiving' },
  { date: '2026-11-11', name: 'Remembrance Day' },
  { date: '2026-12-25', name: 'Christmas Day' },
  { date: '2026-12-26', name: 'Boxing Day' },
];

function getSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Fall';
  return 'Winter';
}

function getUpcomingHolidays(count = 3): string[] {
  const now = new Date().toISOString().split('T')[0];
  return CANADIAN_HOLIDAYS_2026
    .filter(h => h.date >= now)
    .slice(0, count)
    .map(h => `${h.name} (${h.date})`);
}

async function getExchangeRate(): Promise<{ cad_usd: number; trend: string }> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/CAD');
    if (res.ok) {
      const data = await res.json();
      return { cad_usd: data.rates?.USD ?? 0.73, trend: 'stable' };
    }
  } catch {}
  return { cad_usd: 0.73, trend: 'unknown' };
}

async function getWeather(location = 'Waterloo'): Promise<{ temp_c: number; condition: string; location: string } | undefined> {
  try {
    // Open-Meteo — free, no API key needed
    // Waterloo, ON coords: 43.4643, -80.5204
    const lat = 43.4643;
    const lon = -80.5204;
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );
    if (res.ok) {
      const data = await res.json();
      const weather = data.current_weather;
      let condition = 'Clear';
      if (weather.weathercode >= 51) condition = 'Rainy';
      if (weather.weathercode >= 71) condition = 'Snowy';
      if (weather.weathercode >= 80) condition = 'Stormy';
      if (weather.temperature < -10) condition = 'Extreme Cold';
      return { temp_c: weather.temperature, condition, location };
    }
  } catch {}
  return undefined;
}

export async function buildCanadianContext(): Promise<CanadianContext> {
  const [exchange_rate, weather] = await Promise.all([
    getExchangeRate(),
    getWeather(),
  ]);

  return {
    exchange_rate,
    season: getSeason(),
    upcoming_holidays: getUpcomingHolidays(),
    weather,
  };
}

export function formatCanadianContext(ctx: CanadianContext): string {
  let text = `Canadian Business Context:\n`;
  text += `- Season: ${ctx.season}\n`;
  text += `- CAD/USD Exchange Rate: ${ctx.exchange_rate.cad_usd.toFixed(4)} (${ctx.exchange_rate.trend})\n`;
  text += `- Upcoming Holidays: ${ctx.upcoming_holidays.join(', ')}\n`;
  if (ctx.weather) {
    text += `- Weather in ${ctx.weather.location}: ${ctx.weather.temp_c}°C, ${ctx.weather.condition}\n`;
  }
  return text;
}
