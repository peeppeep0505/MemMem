import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { router } from "expo-router";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "login" | "register";

// ─── Field component ──────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  secure?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "words";
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  secure = false,
  keyboardType = "default",
  autoCapitalize = "none",
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: "#64748b",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1.5,
          borderColor: focused ? "#0f172a" : "#e2e8f0",
          borderRadius: 14,
          backgroundColor: focused ? "#fff" : "#f8fafc",
          paddingHorizontal: 16,
          transition: "all 0.15s",
        } as any}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#cbd5e1"
          secureTextEntry={secure && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            paddingVertical: 14,
            fontSize: 15,
            color: "#0f172a",
            outline: "none",
          } as any}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={{ padding: 4 }}>
            <Text style={{ fontSize: 16, color: "#94a3b8" }}>
              {showPassword ? "🙈" : "👁"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuthScreen() {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  // Shake animation for error
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 40, useNativeDriver: true }),
    ]).start();
  };

  // ── Switch mode ────────────────────────────────────────────────────────

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setSuccess(null);
    setUsername("");
    setEmail("");
    setPassword("");
  };

  // ── Submit ─────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      shake();
      return;
    }
    if (mode === "register" && !username.trim()) {
      setError("Username is required.");
      shake();
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email.");
      shake();
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      shake();
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
        setSuccess("Logged in successfully!");
        //goto /community
        router.push("/community");
      } else {
        await register(username.trim(), email.trim(), password);
        setSuccess("Account created! Logging you in…");
      }
    } catch (e: any) {
      const raw = e?.message ?? "Something went wrong.";
      // Clean up raw server strings like "User not found", "Wrong password"
      setError(raw.replace(/^"|"$/g, ""));
      shake();
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flex: 1,
            minHeight: "100vh" as any,
            backgroundColor: "#f8fafc",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          {/* ── Background decoration ── */}
          <View
            style={{
              position: "absolute",
              top: -80,
              right: -80,
              width: 320,
              height: 320,
              borderRadius: 160,
              backgroundColor: "#fce7f3",
              opacity: 0.5,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: -60,
              left: -60,
              width: 240,
              height: 240,
              borderRadius: 120,
              backgroundColor: "#e0f2fe",
              opacity: 0.4,
            }}
          />

          {/* ── Card ── */}
          <Animated.View
            style={{
              width: "100%",
              maxWidth: 420,
              transform: [{ translateX: shakeAnim }],
            }}
          >
            {/* Logo / Brand */}
            <View style={{ alignItems: "center", marginBottom: 32 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: "#0f172a",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  shadowColor: "#0f172a",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                }}
              >
                <Text style={{ fontSize: 26 }}>✦</Text>
              </View>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "800",
                  color: "#0f172a",
                  letterSpacing: -0.5,
                  fontFamily: "Georgia, serif",
                }}
              >
                {mode === "login" ? "Welcome back" : "Create account"}
              </Text>
              <Text style={{ fontSize: 14, color: "#94a3b8", marginTop: 6 }}>
                {mode === "login"
                  ? "Sign in to continue"
                  : "Join and start sharing your story"}
              </Text>
            </View>

            {/* Main card */}
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 24,
                padding: 28,
                borderWidth: 1,
                borderColor: "#f1f5f9",
                shadowColor: "#94a3b8",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
              }}
            >
              {/* Mode toggle tabs */}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#f1f5f9",
                  borderRadius: 12,
                  padding: 4,
                  marginBottom: 24,
                }}
              >
                {(["login", "register"] as Mode[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => switchMode(m)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: "center",
                      backgroundColor: mode === m ? "#fff" : "transparent",
                      shadowColor: mode === m ? "#94a3b8" : "transparent",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: mode === m ? "#0f172a" : "#94a3b8",
                      }}
                    >
                      {m === "login" ? "Sign In" : "Sign Up"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Fields */}
              {mode === "register" && (
                <Field
                  label="Username"
                  value={username}
                  onChange={setUsername}
                  placeholder="yourname"
                  autoCapitalize="none"
                />
              )}

              <Field
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="you@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Field
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder={mode === "register" ? "Min. 6 characters" : "Your password"}
                secure
              />

              {/* Forgot password (login only) */}
              {mode === "login" && (
                <TouchableOpacity
                  style={{ alignSelf: "flex-end", marginTop: -8, marginBottom: 20 }}
                >
                  <Text style={{ fontSize: 13, color: "#94a3b8", fontWeight: "500" }}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              )}

              {/* Error message */}
              {error && (
                <View
                  style={{
                    backgroundColor: "#fff1f2",
                    borderWidth: 1,
                    borderColor: "#fecdd3",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    marginBottom: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>⚠️</Text>
                  <Text style={{ fontSize: 13, color: "#e11d48", flex: 1, fontWeight: "500" }}>
                    {error}
                  </Text>
                </View>
              )}

              {/* Success message */}
              {success && (
                <View
                  style={{
                    backgroundColor: "#f0fdf4",
                    borderWidth: 1,
                    borderColor: "#bbf7d0",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    marginBottom: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>✓</Text>
                  <Text style={{ fontSize: 13, color: "#16a34a", flex: 1, fontWeight: "500" }}>
                    {success}
                  </Text>
                </View>
              )}

              {/* Submit button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={{
                  backgroundColor: loading ? "#94a3b8" : "#0f172a",
                  paddingVertical: 15,
                  borderRadius: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                  shadowColor: "#0f172a",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: loading ? 0 : 0.2,
                  shadowRadius: 12,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                    {mode === "login" ? "Sign In" : "Create Account"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Switch mode footer */}
            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20, gap: 4 }}>
              <Text style={{ fontSize: 14, color: "#94a3b8" }}>
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}
              </Text>
              <TouchableOpacity onPress={() => switchMode(mode === "login" ? "register" : "login")}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a" }}>
                  {mode === "login" ? "Sign up" : "Sign in"}
                </Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}