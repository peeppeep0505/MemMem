import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as authService from "../services/authService";

type User = {
  _id: string;
  email: string;
  username: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: any) => {

  const [user,setUser] = useState<User | null>(null);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    loadUser();
  },[]);

  const loadUser = async () => {

    const storedUser = await AsyncStorage.getItem("@user");

    if(storedUser){
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  };

  const login = async (email:string,password:string) => {

    const data = await authService.login(email,password);

    await AsyncStorage.setItem("@auth_token",data.token);
    await AsyncStorage.setItem("@user",JSON.stringify(data.user));

    setUser(data.user);
  };

  const register = async (
    username:string,
    email:string,
    password:string
  ) => {

    await authService.register(username,email,password);

    await login(email,password);
  };

  const logout = async () => {

    await AsyncStorage.removeItem("@auth_token");
    await AsyncStorage.removeItem("@user");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);