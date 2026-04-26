import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

type User = {
  id: number;
  username: string;
  full_name: string | null;
  email: string | null;
  role: string;
  permissions: string[];
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const res = await api.get<User>("/auth/me");

        setUser(res.data);
      } catch (error) {
        console.error("Token inválido, cerrando sesión", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await api.post("/auth/login", {
      username,
      password,
    });

    const { access_token, user } = res.data;

    localStorage.setItem("token", access_token);

    api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

    setToken(access_token);
    setUser(user);

    return user;
  };

  const refreshUser = async () => {
    const res = await api.get<User>("/auth/me");
    setUser(res.data);
  };

  const logout = () => {
    localStorage.removeItem("token");

    delete api.defaults.headers.common["Authorization"];

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, refreshUser }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}