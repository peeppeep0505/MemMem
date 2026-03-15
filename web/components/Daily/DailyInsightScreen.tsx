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
import { useAppTheme } from "@/contexts/ThemeContext";
import { Fonts, Glyphs } from "@/constants/theme";

const CURRENCY_CACHE_KEY = "@daily_currency_cache";
const WEATHER_CACHE_KEY  = "@daily_weather_cache";
const PROFILE_CACHE_KEY  = "@daily_profile_cache";

function formatMoney(value: number, currency = "฿") {
  return `${currency}${value.toFixed(2)}`;
}
function safeThbInput(value: string) { return value.replace(/[^0-9.]/g, ""); }
function parseAmount(value: string) {
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : 0;
}
function weatherLabel(weather?: { weatherMain?: string; weatherDescription?: string }) {
  return weather?.weatherDescription || weather?.weatherMain || "No weather description";
}

// ── Skeleton shimmer block ────────────────────────────────────────────────────
function SkeletonBlock({ width, height, radius = 10, C }: { width: number | string; height: number; radius?: number; C: any }) {
  return (
    <View
      style={{
        width: width as any,
        height,
        borderRadius: radius,
        backgroundColor: C.primarySoft2,
        opacity: 0.7,
      }}
    />
  );
}

// ── Skeleton: Weather ─────────────────────────────────────────────────────────
function WeatherSkeleton({ C }: { C: any }) {
  return (
    <View style={{ gap: 12, padding: 24, backgroundColor: C.surface, borderRadius: 20 }}>
      <SkeletonBlock width="45%" height={20} C={C} />
      <SkeletonBlock width="60%" height={14} radius={8} C={C} />
      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
        {[0,1,2,3,4].map((i) => (
          <View key={i} style={{ gap: 6, padding: 14, borderRadius: 14, backgroundColor: C.primarySoft, minWidth: 110 }}>
            <SkeletonBlock width="60%" height={11} radius={6} C={C} />
            <SkeletonBlock width="80%" height={22} radius={8} C={C} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Skeleton: Profile ─────────────────────────────────────────────────────────
function ProfileSkeleton({ C }: { C: any }) {
  return (
    <View style={{ gap: 14, padding: 24, backgroundColor: C.surface, borderRadius: 20 }}>
      <SkeletonBlock width="50%" height={22} C={C} />
      <SkeletonBlock width="35%" height={14} radius={8} C={C} />
      <View style={{ height: 1, backgroundColor: C.ruledLine, marginVertical: 4 }} />
      {[0,1,2,3,4,5,6].map((i) => (
        <SkeletonBlock key={i} width={`${55 + (i % 3) * 10}%`} height={13} radius={7} C={C} />
      ))}
    </View>
  );
}

// ── Glassmorphism CurrencyCard ────────────────────────────────────────────────
function CurrencyCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 160,
        // glassmorphism: semi-transparent white + blur feel via rgba + shadow
        backgroundColor: "rgba(255,255,255,0.22)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.55)",
        borderRadius: 22,
        padding: 18,
        shadowColor: "#c9607e",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 22,
        elevation: 10,
      }}
    >
      <Text
        style={{
          color: "rgba(255,255,255,0.75)",
          fontSize: 10,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: "#ffffff",
          fontSize: 28,
          fontWeight: "800",
          marginTop: 8,
          textShadowColor: "rgba(180,60,100,0.3)",
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 6,
        }}
      >
        {value}
      </Text>
      {helper ? (
        <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 6, fontSize: 12 }}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

export default function DailyInsightScreen() {
  const { theme: C } = useAppTheme();
  const F = Fonts as any;
  const { width } = useWindowDimensions();
  const isWide = width >= 980;

  const [amountThb, setAmountThb] = useState("1000");
  const [profileId, setProfileId] = useState("1");

  const [currency, setCurrency] = useState<CurrencySnapshot | null>(null);
  const [weather,  setWeather]  = useState<WeatherSnapshot | null>(null);
  const [profile,  setProfile]  = useState<ExternalProfile | null>(null);

  const [currencyError, setCurrencyError] = useState("");
  const [weatherError,  setWeatherError]  = useState("");
  const [profileError,  setProfileError]  = useState("");

  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const [banner,     setBanner]     = useState<"online" | "offline">("online");
  const [usingCache, setUsingCache] = useState(false);

  const isMountedRef = useRef(true);

  const thb = useMemo(() => parseAmount(amountThb), [amountThb]);
  const usd = useMemo(() => thb * (currency?.rates?.USD || 0), [thb, currency]);
  const eur = useMemo(() => thb * (currency?.rates?.EUR || 0), [thb, currency]);
  const jpy = useMemo(() => thb * (currency?.rates?.JPY || 0), [thb, currency]);

  const saveCache = useCallback(async (key: string, value: unknown) => {
    try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, []);

  const loadCache = useCallback(async <T,>(key: string): Promise<T | null> => {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const loadProfile = useCallback(async (targetId: string) => {
    if (!targetId.trim()) { setProfileError("Please enter profile ID"); return; }
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
      if (cached) { setProfile(cached); setProfileError(`${message} • showing cached profile`); setUsingCache(true); }
      else { setProfileError(message); }
    } finally {
      if (isMountedRef.current) setProfileLoading(false);
    }
  }, [loadCache, saveCache]);

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
        const cached = await loadCache<CurrencySnapshot>(CURRENCY_CACHE_KEY);
        if (cached) { setCurrency(cached); setUsingCache(true); setCurrencyError("Currency service unavailable • showing cached data"); }
        else { setCurrencyError("Currency service unavailable"); }
      }
      if (weatherResult.status === "fulfilled") {
        setWeather(weatherResult.value);
        await saveCache(WEATHER_CACHE_KEY, weatherResult.value);
      } else {
        const cached = await loadCache<WeatherSnapshot>(WEATHER_CACHE_KEY);
        if (cached) { setWeather(cached); setUsingCache(true); setWeatherError("Weather service unavailable • showing cached data"); }
        else { setWeatherError("Weather service unavailable"); }
      }
    } finally {
      if (isMountedRef.current) { setLoading(false); setRefreshing(false); }
    }
  }, [loadCache, saveCache]);

  useEffect(() => {
    isMountedRef.current = true;
    loadDashboard();
    loadProfile(profileId);
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected;
      setBanner(online ? "online" : "offline");
      if (online) loadDashboard();
    });
    return () => { isMountedRef.current = false; unsubscribe(); };
  }, [loadDashboard, loadProfile]);

  // ── shared card style (minimal — no border) ──────────────────────────────
  const softCard = {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 22,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3,
  };

  const sectionLabel = {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 2.5,
    textTransform: "uppercase" as const,
    color: C.mutedText,
    marginBottom: 6,
  };

  const inlineRow = (label: string, value: string) => (
    <View key={label} style={{ flexDirection: "row", gap: 8 }}>
      <Text style={{ color: C.mutedText, fontSize: 13, width: 110 }}>{label}</Text>
      <Text style={{ color: C.inkText, fontSize: 13, fontWeight: "500", flex: 1 }}>{value}</Text>
    </View>
  );

  return (
    <WebLayout>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: C.background }}>

          {/* ── Online banner ── */}
          <View
            style={{
              backgroundColor: banner === "online" ? C.primarySoft : C.logoutSoft,
              paddingVertical: 10,
              paddingHorizontal: 18,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}
          >
            <Text style={{ color: banner === "online" ? C.primaryStrong : C.logout, fontWeight: "600", fontSize: 13 }}>
              {banner === "online"
                ? usingCache
                  ? `${Glyphs.sparkle} Online • some sections may still be using cached data`
                  : `${Glyphs.sparkle} Online`
                : `${Glyphs.heart} Offline • showing cached data when available`}
            </Text>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Page header ── */}
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 11, color: C.accent, letterSpacing: 6 }}>
                {`${Glyphs.sparkle} ${Glyphs.soft} ${Glyphs.heart} ${Glyphs.soft} ${Glyphs.sparkle}`}
              </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
              <View>
                <Text style={{ fontSize: 28, fontWeight: "700", color: C.inkText, fontFamily: F?.display ?? F?.serif }}>
                  Daily Insight
                </Text>
                <Text style={{ color: C.mutedText, fontSize: 13, marginTop: 2 }}>
                  {`${Glyphs.soft} Dashboard`}
                </Text>
              </View>

              <TouchableOpacity
                onPress={loadDashboard}
                style={{
                  backgroundColor: C.primary,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  borderRadius: 14,
                  shadowColor: C.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.28,
                  shadowRadius: 10,
                }}
              >
                <Text style={{ color: C.surface, fontWeight: "700" }}>
                  {refreshing ? "Refreshing…" : `Sync now ${Glyphs.sparkle}`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ══════════════════════════════════════════════════════════════
                ── GLASSMORPHISM CURRENCY BANNER ──
                Gradient background + decorative blobs + glass cards
            ══════════════════════════════════════════════════════════════ */}
            <View
              style={{
                marginTop: 16,
                borderRadius: 28,
                padding: 24,
                overflow: "hidden",
                // rich pink-to-blush gradient feel via layered bg
                backgroundColor: C.primaryStrong,
                // outer glow
                shadowColor: C.primary,
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.32,
                shadowRadius: 32,
                elevation: 12,
              }}
            >
              {/* Decorative blobs */}
              <View style={{ position: "absolute", top: -50, right: -30, width: 200, height: 200, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)" }} />
              <View style={{ position: "absolute", bottom: -70, left: -40, width: 250, height: 250, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)" }} />
              <View style={{ position: "absolute", top: 30, left: "50%", width: 120, height: 120, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.07)" }} />

              {/* Header */}
              <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", letterSpacing: 3, textTransform: "uppercase", fontWeight: "700" }}>
                {`${Glyphs.sparkle} Real-time`}
              </Text>
              <Text style={{ fontSize: 22, fontWeight: "700", color: "#ffffff", marginTop: 4, fontFamily: F?.display ?? F?.serif }}>
                THB Converter
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4, fontSize: 13 }}>
                Real-time converter จาก exchange rates API
              </Text>

              {/* Currency error */}
              {currencyError ? (
                <View style={{ marginTop: 12, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" }}>
                  <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13 }}>{currencyError}</Text>
                </View>
              ) : null}

              {/* THB input */}
              <View style={{ marginTop: 20, maxWidth: 320 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 2 }}>
                  Amount in THB
                </Text>
                <TextInput
                  value={amountThb}
                  onChangeText={(text) => setAmountThb(safeThbInput(text))}
                  keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                  placeholder="Enter THB"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  style={{
                    // glassmorphism input
                    backgroundColor: "rgba(255,255,255,0.18)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.45)",
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 18,
                    color: "#ffffff",
                    fontWeight: "600",
                    outline: "none",
                  } as any}
                />
              </View>

              {/* Currency cards row */}
              <View style={{ flexDirection: isWide ? "row" : "column", gap: 12, marginTop: 18 }}>
                <CurrencyCard label="THB" value={formatMoney(thb, "฿")} helper="Empty input = 0" />
                <CurrencyCard label="USD" value={usd.toFixed(2)} helper={`1 THB = ${currency?.rates?.USD?.toFixed(4) || "0.0000"} USD`} />
                <CurrencyCard label="EUR" value={eur.toFixed(2)} helper={`1 THB = ${currency?.rates?.EUR?.toFixed(4) || "0.0000"} EUR`} />
                <CurrencyCard label="JPY" value={jpy.toFixed(2)} helper={`1 THB = ${currency?.rates?.JPY?.toFixed(4) || "0.0000"} JPY`} />
              </View>
            </View>

            {/* ══════════════════════════════════════════════════════════════
                ── WEATHER ──
            ══════════════════════════════════════════════════════════════ */}
            <View style={{ marginTop: 28 }}>
              <Text style={sectionLabel}>{`🌤 ${Glyphs.soft} Weather`}</Text>
              <Text style={{ fontSize: 22, fontWeight: "700", color: C.inkText, fontFamily: F?.display ?? F?.serif, marginBottom: 14 }}>
                Current Conditions
              </Text>

              {loading ? (
                <WeatherSkeleton C={C} />
              ) : (
                <View style={softCard}>
                  {weatherError ? (
                    <View style={{ marginBottom: 14, backgroundColor: C.logoutSoft, borderRadius: 12, padding: 12 }}>
                      <Text style={{ color: C.logout, fontSize: 13 }}>{weatherError}</Text>
                    </View>
                  ) : null}

                  {weather ? (
                    <>
                      <Text style={{ fontSize: 18, fontWeight: "700", color: C.inkText, fontFamily: F?.sans }}>
                        {weather.city}, {weather.country}
                      </Text>
                      <Text style={{ color: C.mutedText, marginTop: 4, fontSize: 13 }}>
                        {weatherLabel(weather.weather)}
                      </Text>

                      <View style={{ height: 1, backgroundColor: C.ruledLine, marginVertical: 14 }} />

                      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                        {[
                          { label: "Temp",     value: `${weather.weather.temperatureC}°C`, icon: "🌡" },
                          { label: "Feels like", value: `${weather.weather.feelsLikeC}°C`, icon: "🤗" },
                          { label: "Humidity", value: `${weather.weather.humidity}%`,      icon: "💧" },
                          { label: "Pressure", value: `${weather.weather.pressure} hPa`,   icon: "🔵" },
                          { label: "Wind",     value: `${weather.weather.windSpeed} m/s`,  icon: "💨" },
                        ].map((item) => (
                          <View
                            key={item.label}
                            style={{
                              minWidth: 110,
                              backgroundColor: C.primarySoft,
                              borderRadius: 16,
                              padding: 14,
                              // no border — minimal
                            }}
                          >
                            <Text style={{ fontSize: 16, marginBottom: 4 }}>{item.icon}</Text>
                            <Text style={{ color: C.mutedText, fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" }}>
                              {item.label}
                            </Text>
                            <Text style={{ color: C.primary, fontWeight: "700", fontSize: 18, marginTop: 4 }}>
                              {item.value}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : !weatherError ? (
                    <Text style={{ color: C.mutedText }}>No weather data</Text>
                  ) : null}
                </View>
              )}
            </View>

            {/* ══════════════════════════════════════════════════════════════
                ── EXTERNAL PROFILE PROXY ──
            ══════════════════════════════════════════════════════════════ */}
            <View style={{ marginTop: 28 }}>
              <Text style={sectionLabel}>{`👤 ${Glyphs.soft} External`}</Text>
              <Text style={{ fontSize: 22, fontWeight: "700", color: C.inkText, fontFamily: F?.display ?? F?.serif, marginBottom: 14 }}>
                Profile Proxy
              </Text>

              {/* Search row */}
              <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                <TextInput
                  value={profileId}
                  onChangeText={setProfileId}
                  placeholder="Profile ID"
                  placeholderTextColor={C.mutedText}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: C.surface,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    minWidth: 200,
                    color: C.inkText,
                    fontFamily: F?.sans,
                    fontSize: 14,
                    // no border — minimal
                    shadowColor: C.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    outline: "none",
                  } as any}
                />
                <TouchableOpacity
                  onPress={() => loadProfile(profileId)}
                  style={{
                    backgroundColor: C.primary,
                    paddingHorizontal: 18,
                    paddingVertical: 12,
                    borderRadius: 14,
                    justifyContent: "center",
                    shadowColor: C.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.28,
                    shadowRadius: 10,
                  }}
                >
                  <Text style={{ color: C.surface, fontWeight: "700" }}>
                    {profileLoading ? "Loading…" : `Load profile ${Glyphs.sparkle}`}
                  </Text>
                </TouchableOpacity>
              </View>

              {profileError ? (
                <View style={{ marginBottom: 14, backgroundColor: C.logoutSoft, borderRadius: 12, padding: 12 }}>
                  <Text style={{ color: C.logout, fontSize: 13 }}>{profileError}</Text>
                </View>
              ) : null}

              {/* Profile card — skeleton while loading */}
              {profileLoading ? (
                <ProfileSkeleton C={C} />
              ) : (
                <View style={softCard}>
                  {profile ? (
                    <>
                      <Text style={{ fontSize: 20, fontWeight: "700", color: C.inkText, fontFamily: F?.display ?? F?.serif }}>
                        {profile.name}
                      </Text>
                      <Text style={{ color: C.accent, marginTop: 3, fontSize: 13 }}>
                        {`${Glyphs.heart} @${profile.username}`}
                      </Text>

                      <View style={{ height: 1, backgroundColor: C.ruledLine, marginVertical: 14 }} />

                      <View style={{ gap: 10 }}>
                        {inlineRow("Email",           profile.email)}
                        {inlineRow("Phone",           profile.phone)}
                        {inlineRow("Website",         profile.website)}
                        {inlineRow("Company",         profile.company)}
                        {inlineRow("Summary",         profile.companySummary || "—")}
                        {inlineRow("Location",        profile.location || "—")}
                        {inlineRow("Geo",             `${profile.geo.lat}, ${profile.geo.lng}`)}
                      </View>
                    </>
                  ) : (
                    <View style={{ alignItems: "center", paddingVertical: 24 }}>
                      <Text style={{ fontSize: 24, marginBottom: 8 }}>{Glyphs.floral}</Text>
                      <Text style={{ color: C.mutedText }}>No profile loaded</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* ── Bottom deco ── */}
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Text style={{ fontSize: 12, color: C.accent, letterSpacing: 4 }}>
                {`${Glyphs.star}˙${Glyphs.moon} ${Glyphs.soft} ${Glyphs.floral} ${Glyphs.soft} ${Glyphs.moon}˙${Glyphs.star}`}
              </Text>
            </View>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </WebLayout>
  );
}