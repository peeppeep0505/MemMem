import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import AuthScreen from "../components/auth/AuthScreen";

export default function Index() {
  const { user, loading } = useAuth();

  // While restoring session from AsyncStorage — show spinner
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  // Not logged in → show Auth screen
  if (!user) {
    return <AuthScreen />;
  }

  // Logged in → go to main app
  return <Redirect href="/community" />;
}