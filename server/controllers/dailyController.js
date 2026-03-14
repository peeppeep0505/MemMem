const STUDENT_ID = process.env.STUDENT_ID || "YOUR_STUDENT_ID";
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";

const currencyCache = {
  data: null,
  timestamp: 0,
};

const weatherCache = {
  data: null,
  timestamp: 0,
};

const CURRENCY_TTL = 60 * 1000;
const WEATHER_TTL = 5 * 60 * 1000;

function buildHeaders(extra = {}) {
  return {
    Accept: "application/json",
    "X-Student-ID": STUDENT_ID,
    ...extra,
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(),
    ...options,
  });

  const text = await response.text();

  if (!response.ok) {
    const error = new Error(text || `Upstream error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON response from upstream");
  }
}

function safeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function isFresh(timestamp, ttl) {
  return Date.now() - timestamp < ttl;
}

// GET /api/daily/currency
exports.getCurrencySnapshot = async (_req, res) => {
  try {
    if (currencyCache.data && isFresh(currencyCache.timestamp, CURRENCY_TTL)) {
      res.set("X-Student-ID", STUDENT_ID);
      return res.status(200).json(currencyCache.data);
    }

    const currencyURL =
      "https://api.frankfurter.app/latest?from=THB&to=USD,EUR,JPY";

    const data = await fetchJson(currencyURL);

    const payload = {
      source: "frankfurter",
      updatedAt: new Date().toISOString(),
      base: "THB",
      rates: {
        USD: safeNumber(data?.rates?.USD),
        EUR: safeNumber(data?.rates?.EUR),
        JPY: safeNumber(data?.rates?.JPY),
      },
    };

    currencyCache.data = payload;
    currencyCache.timestamp = Date.now();

    res.set("X-Student-ID", STUDENT_ID);
    return res.status(200).json(payload);
  } catch (error) {
    if (currencyCache.data) {
      res.set("X-Student-ID", STUDENT_ID);
      return res.status(200).json(currencyCache.data);
    }

    return res.status(502).json({
      message: "Bad Gateway",
      service: "currency",
      detail: error.message || "Failed to fetch currency data",
    });
  }
};

// GET /api/daily/weather
exports.getWeatherSnapshot = async (_req, res) => {
  try {
    if (!OPENWEATHER_API_KEY) {
      return res.status(500).json({
        message: "Server configuration error",
        service: "weather",
        detail: "OPENWEATHER_API_KEY is missing",
      });
    }

    if (weatherCache.data && isFresh(weatherCache.timestamp, WEATHER_TTL)) {
      res.set("X-Student-ID", STUDENT_ID);
      return res.status(200).json(weatherCache.data);
    }

    const fixedCity = "bangkok";

    const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      fixedCity
    )}&APPID=${OPENWEATHER_API_KEY}&units=metric`;

    const data = await fetchJson(weatherURL);

    const payload = {
      source: "openweathermap",
      city: data?.name || "Bangkok",
      country: data?.sys?.country || "",
      updatedAt: new Date().toISOString(),
      weather: {
        temperatureC: safeNumber(data?.main?.temp),
        feelsLikeC: safeNumber(data?.main?.feels_like),
        humidity: safeNumber(data?.main?.humidity),
        pressure: safeNumber(data?.main?.pressure),
        weatherMain: data?.weather?.[0]?.main || "",
        weatherDescription: data?.weather?.[0]?.description || "",
        windSpeed: safeNumber(data?.wind?.speed),
      },
    };

    weatherCache.data = payload;
    weatherCache.timestamp = Date.now();

    res.set("X-Student-ID", STUDENT_ID);
    return res.status(200).json(payload);
  } catch (error) {
    if (weatherCache.data) {
      res.set("X-Student-ID", STUDENT_ID);
      return res.status(200).json(weatherCache.data);
    }

    return res.status(502).json({
      message: "Bad Gateway",
      service: "weather",
      detail: error.message || "Failed to fetch weather data",
    });
  }
};

// GET /api/daily/profile-proxy/:userId
exports.getExternalProfileProxy = async (req, res) => {
  try {
    const userId = String(req.params.userId || "").trim();

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const user = await fetchJson(
      `https://jsonplaceholder.typicode.com/users/${encodeURIComponent(userId)}`
    );

    const payload = {
      id: user?.id || 0,
      name: user?.name || "",
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
      website: user?.website || "",
      company: user?.company?.name || "",
      companySummary: user?.company
        ? `${user.company.name} • ${user.company.catchPhrase || ""}`.trim()
        : "",
      location: [
        user?.address?.street,
        user?.address?.suite,
        user?.address?.city,
      ]
        .filter(Boolean)
        .join(", "),
      geo: {
        lat: user?.address?.geo?.lat || "",
        lng: user?.address?.geo?.lng || "",
      },
    };

    res.set("X-Student-ID", STUDENT_ID);
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(502).json({
      message: "Bad Gateway",
      service: "profile-proxy",
      detail: error.message || "Failed to fetch external profile",
    });
  }
};