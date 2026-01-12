import { NextRequest, NextResponse } from 'next/server';
import { fetchWeather, WeatherData } from '@/utils/weatherApi';
import { getCachedData, setCachedData, isCacheValid } from '@/utils/cache';
import { allowRequest } from '@/utils/rateLimit';

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city')?.trim();
  if (!city) return NextResponse.json({ error: 'City required' }, { status: 400 });

  const cacheKey = city.toLowerCase();

  // --- Rate limiting ---
  const ip = req.headers.get('x-forwarded-for') || cacheKey;
  if (!allowRequest(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // --- Cache check ---
  const cached = await getCachedData<WeatherData>(cacheKey, 'weather_cache');
  if (cached && isCacheValid(cached)) {
    return NextResponse.json({ ...cached.data, source: 'cache' });
  }

  // --- Fetch from API with error handling & stale fallback ---
  try {
    const fresh = await fetchWeather(city);
    await setCachedData(cacheKey, 'weather_cache', fresh);
    return NextResponse.json({ ...fresh, source: 'api' });
  } catch (err) {
    console.error('Weather fetch error:', err);
    if (cached) {
      return NextResponse.json({ ...cached.data, source: 'stale_cache' });
    }
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 502 });
  }
}