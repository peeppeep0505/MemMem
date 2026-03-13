import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as authService from "../services/authService";

export interface User {
  _id: string;
  username: string;
  email: string;
  role: "user" | "editor" | "manager" | "admin";
  profilePic?: string;
  backgroundColor?: string;
  friends?: string[];
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasRole: (...roles: User["role"][]) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    role?: User["role"]
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("@user");

      if (storedUser && storedUser !== "undefined") {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch (err) {
      console.log("loadUser error", err);
      setUser(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);

    await AsyncStorage.setItem("@auth_token", data.token);
    await AsyncStorage.setItem("@user", JSON.stringify(data.user));

    setUser(data.user);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    role: User["role"] = "user"
  ) => {
    const data = await authService.register(username, email, password, role);

    await AsyncStorage.setItem("@auth_token", data.token);
    await AsyncStorage.setItem("@user", JSON.stringify(data.user));

    setUser(data.user);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore server error and clear local anyway
    }

    await AsyncStorage.removeItem("@auth_token");
    await AsyncStorage.removeItem("@user");

    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      hasRole: (...roles: User["role"][]) => {
        if (!user) return false;
        if (user.role === "admin") return true;
        return roles.includes(user.role);
      },
      login,
      register,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);