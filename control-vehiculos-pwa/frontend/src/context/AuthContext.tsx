import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

type User = {
  username: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await api.post("/auth/login", {
      username,
      password,
    });

    const { access_token, user } = res.data;

    localStorage.setItem("token", access_token);

    setToken(access_token);
    setUser(user);

    api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
  };

  const logout = () => {
    localStorage.removeItem("token");

    // limpiar header global
    delete api.defaults.headers.common["Authorization"];

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}