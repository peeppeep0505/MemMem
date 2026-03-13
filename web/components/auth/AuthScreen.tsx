import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams, usePathname } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { apiFetch } from "../../services/api";

type Mode = "login" | "register";
type RegisterStep = 1 | 2 | 3;

type RegisterDraft = {
  username: string;
  email: string;
  password: string;
};

type ToastState = {
  type: "success" | "error" | "info";
  message: string;
} | null;

const REGISTER_DRAFT_KEY = "@auth_register_draft";

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  secure?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "words";
  error?: string;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  secure = false,
  keyboardType = "default",
  autoCapitalize = "none",
  error,
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
          borderColor: error ? "#ef4444" : focused ? "#0f172a" : "#e2e8f0",
          borderRadius: 14,
          backgroundColor: "#fff",
          paddingHorizontal: 16,
        }}
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

        {secure ? (
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={{ padding: 4 }}>
            <Text style={{ fontSize: 16, color: "#94a3b8" }}>
              {showPassword ? "🙈" : "👁"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text style={{ marginTop: 6, color: "#dc2626", fontSize: 12, fontWeight: "600" }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function buildAuthUrl(mode: Mode, step: RegisterStep) {
  return {
    pathname: "/" as const,
    params: {
      mode,
      step: String(step),
    },
  };
}

async function checkUsernameAvailability(username: string) {
  const query = new URLSearchParams({ username }).toString();
  return apiFetch<{ available: boolean; message?: string }>(
    `/users/check-username?${query}`
  );
}

export default function AuthScreen() {
  const { login, register } = useAuth();
  const params = useLocalSearchParams<{ mode?: string; step?: string }>();
  const pathname = usePathname();

  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<RegisterStep>(1);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [usernameStatus, setUsernameStatus] = useState<{
    type: "available" | "unavailable" | "idle";
    message: string;
  }>({
    type: "idle",
    message: "",
  });

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  const resetAll = useCallback(async () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setFieldErrors({});
    setUsernameStatus({ type: "idle", message: "" });
    setStep(1);
    await AsyncStorage.removeItem(REGISTER_DRAFT_KEY);
  }, []);

  const syncUrl = useCallback(
    (nextMode: Mode, nextStep: RegisterStep) => {
      router.replace(buildAuthUrl(nextMode, nextStep));
    },
    []
  );

  useEffect(() => {
    const queryMode = params.mode === "register" ? "register" : "login";
    const rawStep = Number(params.step || "1");
    const safeStep: RegisterStep =
      rawStep === 2 ? 2 : rawStep === 3 ? 3 : 1;

    setMode(queryMode);

    if (queryMode === "register") {
      setStep(safeStep);
    } else {
      setStep(1);
    }
  }, [params.mode, params.step]);

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const raw = await AsyncStorage.getItem(REGISTER_DRAFT_KEY);
        if (!raw) return;

        const draft: RegisterDraft = JSON.parse(raw);
        setUsername(draft.username || "");
        setEmail(draft.email || "");
        setPassword(draft.password || "");
      } catch {
        // ignore corrupt draft
      }
    };

    loadDraft();
  }, []);

  useEffect(() => {
    if (mode !== "register") return;

    AsyncStorage.setItem(
      REGISTER_DRAFT_KEY,
      JSON.stringify({ username, email, password })
    ).catch(() => {});
  }, [mode, username, email, password]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const progress = useMemo(() => {
    if (mode === "login") return 0;
    if (step === 1) return 33.33;
    if (step === 2) return 66.66;
    return 100;
  }, [mode, step]);

  const switchMode = async (next: Mode) => {
    setFieldErrors({});
    setToast(null);
    setUsernameStatus({ type: "idle", message: "" });

    if (next === "login") {
      setMode("login");
      setStep(1);
      syncUrl("login", 1);
      return;
    }

    setMode("register");
    setStep(1);
    syncUrl("register", 1);
  };

  const validateLogin = () => {
    const nextErrors: typeof fieldErrors = {};

    if (!email.trim()) nextErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = "Please enter a valid email.";

    if (!password.trim()) nextErrors.password = "Password is required.";
    else if (password.length < 6) nextErrors.password = "Password must be at least 6 characters.";

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep = (currentStep: RegisterStep) => {
    const nextErrors: typeof fieldErrors = {};

    if (currentStep === 1) {
      if (!username.trim()) nextErrors.username = "Username is required.";
      else if (username.trim().length < 3) nextErrors.username = "Username must be at least 3 characters.";
    }

    if (currentStep === 2) {
      if (!email.trim()) nextErrors.email = "Email is required.";
      else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = "Please enter a valid email.";
    }

    if (currentStep === 3) {
      if (!password.trim()) nextErrors.password = "Password is required.";
      else if (password.length < 6) nextErrors.password = "Password must be at least 6 characters.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCheckUsernameAndNext = async () => {
    if (!validateStep(1)) {
      shake();
      return;
    }

    setCheckingUsername(true);
    setToast(null);

    try {
      const result = await checkUsernameAvailability(username.trim());

      if (!result.available) {
        setFieldErrors({ username: result.message || "Username is already taken." });
        setUsernameStatus({
          type: "unavailable",
          message: result.message || "Username is already taken.",
        });
        setToast({
          type: "error",
          message: result.message || "Username is already taken.",
        });
        shake();
        return;
      }

      setFieldErrors({});
      setUsernameStatus({
        type: "available",
        message: result.message || "Username available",
      });
      setToast({
        type: "success",
        message: result.message || "Username available",
      });

      const nextStep: RegisterStep = 2;
      setStep(nextStep);
      syncUrl("register", nextStep);
    } catch (error: any) {
      const message = error?.message || "Unable to validate username right now.";
      setToast({ type: "error", message });
      shake();
    } finally {
      setCheckingUsername(false);
    }
  };

  const goNext = async () => {
    if (step === 1) {
      await handleCheckUsernameAndNext();
      return;
    }

    if (!validateStep(step)) {
      shake();
      return;
    }

    const nextStep: RegisterStep = step === 2 ? 3 : 3;
    setStep(nextStep);
    syncUrl("register", nextStep);
  };

  const goBack = () => {
    if (step === 1) {
      switchMode("login");
      return;
    }

    const nextStep: RegisterStep = step === 3 ? 2 : 1;
    setStep(nextStep);
    syncUrl("register", nextStep);
  };

  const handleSubmit = async () => {
    setToast(null);

    if (mode === "login") {
      if (!validateLogin()) {
        shake();
        return;
      }

      setLoading(true);
      try {
        await login(email.trim(), password);
        setToast({ type: "success", message: "Logged in successfully!" });
        router.replace("/community");
      } catch (e: any) {
        const raw = e?.message ?? "Something went wrong.";
        const message = String(raw).replace(/^"|"$/g, "");
        setToast({ type: "error", message });
        shake();
      } finally {
        setLoading(false);
      }

      return;
    }

    if (!validateStep(3)) {
      shake();
      return;
    }

    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      setToast({ type: "success", message: "Account created successfully!" });
      await resetAll();
      syncUrl("login", 1);
      setMode("login");
    } catch (e: any) {
      const raw = e?.message ?? "Something went wrong.";
      const message = String(raw).replace(/^"|"$/g, "");
      setToast({ type: "error", message });
      shake();
    } finally {
      setLoading(false);
    }
  };

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

          <Animated.View
            style={{
              width: "100%",
              maxWidth: 460,
              transform: [{ translateX: shakeAnim }],
            }}
          >
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
                  : `Step ${step} of 3 • ${pathname}`}
              </Text>
            </View>

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

              {mode === "register" ? (
                <View style={{ marginBottom: 22 }}>
                  <View
                    style={{
                      height: 10,
                      backgroundColor: "#e2e8f0",
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${progress}%`,
                        height: "100%",
                        backgroundColor: "#0f172a",
                        borderRadius: 999,
                      }}
                    />
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 8,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: "#64748b" }}>Profile</Text>
                    <Text style={{ fontSize: 12, color: "#64748b" }}>Account</Text>
                    <Text style={{ fontSize: 12, color: "#64748b" }}>Security</Text>
                  </View>
                </View>
              ) : null}

              {toast ? (
                <View
                  style={{
                    backgroundColor:
                      toast.type === "error"
                        ? "#fff1f2"
                        : toast.type === "success"
                        ? "#f0fdf4"
                        : "#eff6ff",
                    borderWidth: 1,
                    borderColor:
                      toast.type === "error"
                        ? "#fecdd3"
                        : toast.type === "success"
                        ? "#bbf7d0"
                        : "#bfdbfe",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color:
                        toast.type === "error"
                          ? "#e11d48"
                          : toast.type === "success"
                          ? "#16a34a"
                          : "#1d4ed8",
                    }}
                  >
                    {toast.message}
                  </Text>
                </View>
              ) : null}

              {mode === "login" ? (
                <>
                  <Field
                    label="Email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={fieldErrors.email}
                  />

                  <Field
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    placeholder="Your password"
                    secure
                    error={fieldErrors.password}
                  />

                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    style={{
                      backgroundColor: loading ? "#94a3b8" : "#0f172a",
                      paddingVertical: 15,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 6,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                        Sign In
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {step === 1 ? (
                    <>
                      <Field
                        label="Username"
                        value={username}
                        onChange={(v) => {
                          setUsername(v);
                          setFieldErrors((prev) => ({ ...prev, username: undefined }));
                          setUsernameStatus({ type: "idle", message: "" });
                        }}
                        placeholder="yourname"
                        autoCapitalize="none"
                        error={fieldErrors.username}
                      />

                      {usernameStatus.type !== "idle" ? (
                        <Text
                          style={{
                            marginTop: -8,
                            marginBottom: 16,
                            color:
                              usernameStatus.type === "available"
                                ? "#16a34a"
                                : "#dc2626",
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          {usernameStatus.message}
                        </Text>
                      ) : null}
                    </>
                  ) : null}

                  {step === 2 ? (
                    <Field
                      label="Email"
                      value={email}
                      onChange={(v) => {
                        setEmail(v);
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      placeholder="you@email.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      error={fieldErrors.email}
                    />
                  ) : null}

                  {step === 3 ? (
                    <>
                      <Field
                        label="Password"
                        value={password}
                        onChange={(v) => {
                          setPassword(v);
                          setFieldErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                        placeholder="Min. 6 characters"
                        secure
                        error={fieldErrors.password}
                      />

                      <View
                        style={{
                          backgroundColor: "#f8fafc",
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: "#e2e8f0",
                          padding: 14,
                          marginBottom: 16,
                        }}
                      >
                        <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "700" }}>
                          Review
                        </Text>
                        <Text style={{ marginTop: 8, color: "#0f172a" }}>
                          Username: {username || "-"}
                        </Text>
                        <Text style={{ marginTop: 4, color: "#0f172a" }}>
                          Email: {email || "-"}
                        </Text>
                      </View>
                    </>
                  ) : null}

                  <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                    <TouchableOpacity
                      onPress={goBack}
                      disabled={loading || checkingUsername}
                      style={{
                        flex: 1,
                        backgroundColor: "#f1f5f9",
                        paddingVertical: 14,
                        borderRadius: 14,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#0f172a", fontWeight: "700" }}>
                        {step === 1 ? "Back to Login" : "Back"}
                      </Text>
                    </TouchableOpacity>

                    {step < 3 ? (
                      <TouchableOpacity
                        onPress={goNext}
                        disabled={loading || checkingUsername}
                        style={{
                          flex: 1,
                          backgroundColor:
                            loading || checkingUsername ? "#94a3b8" : "#0f172a",
                          paddingVertical: 14,
                          borderRadius: 14,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {checkingUsername ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={{ color: "#fff", fontWeight: "700" }}>Next</Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={loading}
                        style={{
                          flex: 1,
                          backgroundColor: loading ? "#94a3b8" : "#0f172a",
                          paddingVertical: 14,
                          borderRadius: 14,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {loading ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={{ color: "#fff", fontWeight: "700" }}>
                            Create Account
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}

              <Text
                style={{
                  marginTop: 18,
                  fontSize: 12,
                  color: "#94a3b8",
                  textAlign: "center",
                }}
              >
                URL sync example: ?mode={mode}&step={step}
              </Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}