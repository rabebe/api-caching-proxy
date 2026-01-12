export interface WeatherData {
  cityName: string;
  country: string;
  temperature: number;
  description: string;
  windKmh: number;
  lastUpdated: string;
  apparentTemperature: number;
  windGusts: number;
  cloudCover: number;
  isDay: number;
  humidity: number;
  tempMax: number;
  tempMin: number;
}

const WEATHER_CODE_MAP: Record<number, string> = {
  0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing Rime Fog', 51: 'Drizzle, Light', 53: 'Drizzle, Moderate',
  55: 'Drizzle, Dense', 61: 'Rain, Slight', 63: 'Rain, Moderate', 65: 'Rain, Heavy',
  71: 'Snow, Slight', 73: 'Snow, Moderate', 75: 'Snow, Heavy', 95: 'Thunderstorm',
  96: 'Thunderstorm with Hail', 99: 'Thunderstorm with Heavy Hail',
};

export async function fetchWeather(city: string): Promise<WeatherData> {
  const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
  const geoJson = await geoRes.json();
  if (!geoJson.results || geoJson.results.length === 0) throw new Error('City not found');

  const { latitude, longitude, name: geoCityName, country } = geoJson.results[0];

  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
  );
  const weatherJson = await weatherRes.json();
  if (!weatherJson.current_weather) throw new Error('Weather API error');

  const current = weatherJson.current_weather;
  const daily = weatherJson.daily;

  return {
    cityName: geoCityName,
    country,
    temperature: Math.round(current.temperature),
    description: WEATHER_CODE_MAP[current.weathercode] || 'Unknown',
    windKmh: Math.round(current.windspeed * 10) / 10,
    lastUpdated: current.time,
    apparentTemperature: 0,
    windGusts: 0,
    cloudCover: 0,
    isDay: 1,
    humidity: 0,
    tempMax: daily?.temperature_2m_max?.[0] ?? 0,
    tempMin: daily?.temperature_2m_min?.[0] ?? 0,
  };
}
