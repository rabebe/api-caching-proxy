import { NextRequest, NextResponse } from 'next/server';
import { fetchWeather, WeatherData } from '@/utils/weatherApi';
import { getCachedData, setCachedData, isCacheValid } from '@/utils/cache';
import { allowRequest } from '@/utils/rateLimit';

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city')?.trim();
  if (!city) return NextResponse.json({ error: 'City required' }, { status: 400 });

  const cacheKey = city.toLowerCase();
  const ip = req.headers.get('x-forwarded-for') || cacheKey;

  // --- Check cache first ---
  const cached = await getCachedData<WeatherData>(cacheKey, 'weather_cache');
  if (cached && isCacheValid(cached)) {
    // Apply soft rate limit for cached requests
    const { allowed, reason } = await allowRequest(ip, false); // soft limit
    if (!allowed) {
      return NextResponse.json({ error: `Rate limit exceeded (${reason})` }, { status: 429 });
    }

    return NextResponse.json({ ...cached.data, source: 'cache' });
  }

  // --- Hard limit for fresh API requests ---
  const { allowed: apiAllowed, reason: apiReason } = await allowRequest(ip, true); // hard limit
  if (!apiAllowed) {
    if (cached) {
      // Return stale cache if available
      return NextResponse.json({ ...cached.data, source: 'stale_cache' });
    }
    return NextResponse.json({ error: `Rate limit exceeded (${apiReason})` }, { status: 429 });
  }

  // --- Fetch from external API ---
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
