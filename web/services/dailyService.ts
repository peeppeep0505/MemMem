import { apiFetch } from "./api";

export type CurrencySnapshot = {
  source: string;
  updatedAt: string;
  base: string;
  rates: {
    USD: number;
    EUR: number;
    JPY: number;
  };
};

export type WeatherSnapshot = {
  source: string;
  city: string;
  country: string;
  updatedAt: string;
  weather: {
    temperatureC: number;
    feelsLikeC: number;
    humidity: number;
    pressure: number;
    weatherMain: string;
    weatherDescription: string;
    windSpeed: number;
  };
};

export type ExternalProfile = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
  company: string;
  companySummary: string;
  location: string;
  geo: {
    lat: string;
    lng: string;
  };
};

export const getCurrencySnapshot = (): Promise<CurrencySnapshot> => {
  return apiFetch<CurrencySnapshot>("/daily/currency");
};

export const getWeatherSnapshot = (): Promise<WeatherSnapshot> => {
  return apiFetch<WeatherSnapshot>("/daily/weather");
};

export const getExternalProfileProxy = (
  userId: string
): Promise<ExternalProfile> => {
  return apiFetch<ExternalProfile>(
    `/daily/profile-proxy/${encodeURIComponent(userId)}`
  );
};