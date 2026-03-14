import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

import WebLayout from "../common/WebLayout";
import {
  getCurrencySnapshot,
  getExternalProfileProxy,
  getWeatherSnapshot,
  type CurrencySnapshot,
  type ExternalProfile,
  type WeatherSnapshot,
} from "@/services/dailyService";

const CURRENCY_CACHE_KEY = "@daily_currency_cache";
const WEATHER_CACHE_KEY = "@daily_weather_cache";
const PROFILE_CACHE_KEY = "@daily_profile_cache";

function formatMoney(value: number, currency = "฿") {
  return `${currency}${value.toFixed(2)}`;
}

function safeThbInput(value: string) {
  return value.replace(/[^0-9.]/g, "");
}

function parseAmount(value: string) {
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : 0;
}

function weatherLabel(weather?: {
  weatherMain?: string;
  weatherDescription?: string;
}) {
  return (
    weather?.weatherDescription ||
    weather?.weatherMain ||
    "No weather description"
  );
}

type CurrencyCardProps = {
  label: string;
  value: string;
  helper?: string;
};

function CurrencyCard({ label, value, helper }: CurrencyCardProps) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 180,
        backgroundColor: "rgba(255,255,255,0.55)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.7)",
        borderRadius: 22,
        padding: 18,
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 8,
      }}
    >
      <Text
        style={{
          color: "#475569",
          fontSize: 12,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color: "#0f172a",
          fontSize: 28,
          fontWeight: "800",
          marginTop: 8,
        }}
      >
        {value}
      </Text>

      {helper ? (
        <Text style={{ color: "#64748b", marginTop: 6, fontSize: 13 }}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

export default function DailyInsightScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 980;

  const [amountThb, setAmountThb] = useState("1000");
  const [profileId, setProfileId] = useState("1");

  const [currency, setCurrency] = useState<CurrencySnapshot | null>(null);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [profile, setProfile] = useState<ExternalProfile | null>(null);

  const [currencyError, setCurrencyError] = useState("");
  const [weatherError, setWeatherError] = useState("");
  const [profileError, setProfileError] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const [banner, setBanner] = useState<"online" | "offline">("online");
  const [usingCache, setUsingCache] = useState(false);

  const isMountedRef = useRef(true);

  const thb = useMemo(() => parseAmount(amountThb), [amountThb]);

  const usd = useMemo(() => thb * (currency?.rates?.USD || 0), [thb, currency]);
  const eur = useMemo(() => thb * (currency?.rates?.EUR || 0), [thb, currency]);
  const jpy = useMemo(() => thb * (currency?.rates?.JPY || 0), [thb, currency]);

  const saveCache = useCallback(async (key: string, value: unknown) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, []);

  const loadCache = useCallback(async <T,>(key: string): Promise<T | null> => {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const loadProfile = useCallback(
    async (targetId: string) => {
      if (!targetId.trim()) {
        setProfileError("Please enter profile ID");
        return;
      }

      setProfileLoading(true);
      setProfileError("");

      try {
        const data = await getExternalProfileProxy(targetId.trim());
        if (!isMountedRef.current) return;

        setProfile(data);
        await saveCache(PROFILE_CACHE_KEY, data);
      } catch (err: any) {
        const message = err?.message || "Failed to load external profile";
        const cached = await loadCache<ExternalProfile>(PROFILE_CACHE_KEY);

        if (!isMountedRef.current) return;

        if (cached) {
          setProfile(cached);
          setProfileError(`${message} • showing cached profile`);
          setUsingCache(true);
        } else {
          setProfileError(message);
        }
      } finally {
        if (isMountedRef.current) {
          setProfileLoading(false);
        }
      }
    },
    [loadCache, saveCache]
  );

  const loadDashboard = useCallback(async () => {
    setRefreshing(true);
    setCurrencyError("");
    setWeatherError("");
    setUsingCache(false);

    try {
      const [currencyResult, weatherResult] = await Promise.allSettled([
        getCurrencySnapshot(),
        getWeatherSnapshot(),
      ]);

      if (!isMountedRef.current) return;

      if (currencyResult.status === "fulfilled") {
        setCurrency(currencyResult.value);
        await saveCache(CURRENCY_CACHE_KEY, currencyResult.value);
      } else {
        const cachedCurrency =
          await loadCache<CurrencySnapshot>(CURRENCY_CACHE_KEY);
        if (cachedCurrency) {
          setCurrency(cachedCurrency);
          setUsingCache(true);
          setCurrencyError("Currency service unavailable • showing cached data");
        } else {
          setCurrencyError("Currency service unavailable");
        }
      }

      if (weatherResult.status === "fulfilled") {
        setWeather(weatherResult.value);
        await saveCache(WEATHER_CACHE_KEY, weatherResult.value);
      } else {
        const cachedWeather =
          await loadCache<WeatherSnapshot>(WEATHER_CACHE_KEY);
        if (cachedWeather) {
          setWeather(cachedWeather);
          setUsingCache(true);
          setWeatherError("Weather service unavailable • showing cached data");
        } else {
          setWeatherError("Weather service unavailable");
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [loadCache, saveCache]);

  useEffect(() => {
    isMountedRef.current = true;

    loadDashboard();
    loadProfile(profileId);

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected;
      setBanner(online ? "online" : "offline");

      if (online) {
        loadDashboard();
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [loadDashboard, loadProfile]);

  return (
    <WebLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
          <View
            style={{
              backgroundColor: banner === "online" ? "#dcfce7" : "#fee2e2",
              paddingVertical: 10,
              paddingHorizontal: 18,
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
            }}
          >
            <Text
              style={{
                color: banner === "online" ? "#166534" : "#991b1b",
                fontWeight: "700",
              }}
            >
              {banner === "online"
                ? usingCache
                  ? "Online • some sections may still be using cached data"
                  : "Online"
                : "Offline • showing cached data when available"}
            </Text>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <View>
                <Text
                  style={{ fontSize: 30, fontWeight: "800", color: "#111827" }}
                >
                  Daily Insight Dashboard
                </Text>
              </View>

              <TouchableOpacity
                onPress={loadDashboard}
                style={{
                  backgroundColor: "#111827",
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  borderRadius: 14,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {refreshing ? "Refreshing..." : "Sync now"}
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                marginTop: 22,
                borderRadius: 28,
                padding: 20,
                backgroundColor: "#dbeafe",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: -40,
                  right: -20,
                  width: 180,
                  height: 180,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.25)",
                }}
              />
              <View
                style={{
                  position: "absolute",
                  bottom: -60,
                  left: -30,
                  width: 220,
                  height: 220,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.18)",
                }}
              />

              <Text
                style={{ fontSize: 24, fontWeight: "800", color: "#0f172a" }}
              >
                THB Converter
              </Text>
              <Text style={{ color: "#475569", marginTop: 4 }}>
                Real-time converter จาก exchange rates API
              </Text>

              {currencyError ? (
                <View
                  style={{
                    marginTop: 12,
                    backgroundColor: "#fef2f2",
                    borderWidth: 1,
                    borderColor: "#fecaca",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <Text style={{ color: "#b91c1c" }}>{currencyError}</Text>
                </View>
              ) : null}

              <View style={{ marginTop: 18, maxWidth: 320 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#334155",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Amount in THB
                </Text>

                <TextInput
                  value={amountThb}
                  onChangeText={(text) => setAmountThb(safeThbInput(text))}
                  keyboardType={
                    Platform.OS === "ios" ? "decimal-pad" : "numeric"
                  }
                  placeholder="Enter THB"
                  placeholderTextColor="#94a3b8"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.75)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.9)",
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 18,
                    color: "#0f172a",
                  }}
                />
              </View>

              <View
                style={{
                  flexDirection: isWide ? "row" : "column",
                  gap: 14,
                  marginTop: 18,
                }}
              >
                <CurrencyCard
                  label="THB"
                  value={formatMoney(thb, "฿")}
                  helper="Empty input = 0"
                />
                <CurrencyCard
                  label="USD"
                  value={usd.toFixed(2)}
                  helper={`1 THB = ${currency?.rates?.USD?.toFixed(4) || "0.0000"} USD`}
                />
                <CurrencyCard
                  label="EUR"
                  value={eur.toFixed(2)}
                  helper={`1 THB = ${currency?.rates?.EUR?.toFixed(4) || "0.0000"} EUR`}
                />
                <CurrencyCard
                  label="JPY"
                  value={jpy.toFixed(2)}
                  helper={`1 THB = ${currency?.rates?.JPY?.toFixed(4) || "0.0000"} JPY`}
                />
              </View>
            </View>

            <View style={{ marginTop: 24 }}>
              <Text
                style={{ fontSize: 24, fontWeight: "800", color: "#111827" }}
              >
                Weather
              </Text>

              {loading ? (
                <View
                  style={{
                    marginTop: 18,
                    backgroundColor: "#fff",
                    borderRadius: 18,
                    padding: 24,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    alignItems: "center",
                  }}
                >
                  <ActivityIndicator size="large" />
                  <Text style={{ marginTop: 10, color: "#6b7280" }}>
                    Loading dashboard...
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    marginTop: 18,
                    backgroundColor: "#fff",
                    borderRadius: 18,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                  }}
                >
                  {weatherError ? (
                    <View
                      style={{
                        marginTop: 12,
                        backgroundColor: "#fff7ed",
                        borderWidth: 1,
                        borderColor: "#fed7aa",
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <Text style={{ color: "#c2410c" }}>{weatherError}</Text>
                    </View>
                  ) : null}

                  {weather ? (
                    <View style={{ marginTop: 6 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "800",
                          color: "#111827",
                        }}
                      >
                        {weather.city}, {weather.country}
                      </Text>

                      <Text style={{ color: "#6b7280", marginTop: 4 }}>
                        {weatherLabel(weather.weather)}
                      </Text>

                      <View
                        style={{
                          flexDirection: "row",
                          gap: 12,
                          flexWrap: "wrap",
                          marginTop: 14,
                        }}
                      >
                        {[
                          {
                            label: "Temp",
                            value: `${weather.weather.temperatureC}°C`,
                          },
                          {
                            label: "Feels like",
                            value: `${weather.weather.feelsLikeC}°C`,
                          },
                          {
                            label: "Humidity",
                            value: `${weather.weather.humidity}%`,
                          },
                          {
                            label: "Pressure",
                            value: `${weather.weather.pressure} hPa`,
                          },
                          {
                            label: "Wind",
                            value: `${weather.weather.windSpeed} m/s`,
                          },
                        ].map((item) => (
                          <View
                            key={item.label}
                            style={{
                              minWidth: 120,
                              backgroundColor: "#f8fafc",
                              borderRadius: 14,
                              padding: 14,
                              borderWidth: 1,
                              borderColor: "#e2e8f0",
                            }}
                          >
                            <Text style={{ color: "#64748b", fontSize: 12 }}>
                              {item.label}
                            </Text>
                            <Text
                              style={{
                                color: "#111827",
                                fontWeight: "800",
                                fontSize: 18,
                                marginTop: 6,
                              }}
                            >
                              {item.value}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : !weatherError ? (
                    <Text style={{ marginTop: 12, color: "#6b7280" }}>
                      No weather data
                    </Text>
                  ) : null}
                </View>
              )}
            </View>

            <View style={{ marginTop: 24 }}>
              <Text
                style={{ fontSize: 24, fontWeight: "800", color: "#111827" }}
              >
                External Profile Proxy
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  flexWrap: "wrap",
                  marginTop: 16,
                }}
              >
                <TextInput
                  value={profileId}
                  onChangeText={setProfileId}
                  placeholder="Profile ID"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  style={{
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    minWidth: 200,
                  }}
                />

                <TouchableOpacity
                  onPress={() => loadProfile(profileId)}
                  style={{
                    backgroundColor: "#111827",
                    paddingHorizontal: 18,
                    paddingVertical: 12,
                    borderRadius: 14,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {profileLoading ? "Loading..." : "Load external profile"}
                  </Text>
                </TouchableOpacity>
              </View>

              {profileError ? (
                <View
                  style={{
                    marginTop: 14,
                    backgroundColor: "#fef2f2",
                    borderWidth: 1,
                    borderColor: "#fecaca",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <Text style={{ color: "#b91c1c" }}>{profileError}</Text>
                </View>
              ) : null}

              <View
                style={{
                  marginTop: 16,
                  backgroundColor: "#fff",
                  borderRadius: 18,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                }}
              >
                {profile ? (
                  <>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: "800",
                        color: "#111827",
                      }}
                    >
                      {profile.name}
                    </Text>
                    <Text style={{ color: "#6b7280", marginTop: 4 }}>
                      @{profile.username}
                    </Text>

                    <View style={{ marginTop: 16, gap: 10 }}>
                      <Text style={{ color: "#374151" }}>
                        Email: {profile.email}
                      </Text>
                      <Text style={{ color: "#374151" }}>
                        Phone: {profile.phone}
                      </Text>
                      <Text style={{ color: "#374151" }}>
                        Website: {profile.website}
                      </Text>
                      <Text style={{ color: "#374151" }}>
                        Company: {profile.company}
                      </Text>
                      <Text style={{ color: "#374151" }}>
                        Company Summary: {profile.companySummary || "-"}
                      </Text>
                      <Text style={{ color: "#374151" }}>
                        Location: {profile.location || "-"}
                      </Text>
                      <Text style={{ color: "#374151" }}>
                        Geo: {profile.geo.lat}, {profile.geo.lng}
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={{ color: "#6b7280" }}>No profile loaded</Text>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </WebLayout>
  );
}