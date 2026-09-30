import { createContext, useContext, useEffect, useState } from "react";
import api, { getStoredToken, getTokenClaims, refreshAccessToken, storeToken } from "../axiosInstance/axiosInstance";

const AuthContext = createContext(null);

const userWithRole = (user, token) => ({
  ...user,
  role: getTokenClaims(token).role ?? "user",
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        const storedToken = getStoredToken();
        const claims = storedToken ? getTokenClaims(storedToken) : {};
        const accessTokenIsValid = claims.exp * 1000 > Date.now();

        if (accessTokenIsValid) {
          try {
            const { data } = await api.get("/auth/me", { skipAuthRefresh: true });
            if (active) {
              setToken(storedToken);
              setUser(userWithRole(data.data.user, storedToken));
            }
            return;
          } catch {
            // Fall through to refresh if the stored access token is rejected.
          }
        }

        const { data } = await refreshAccessToken();
        const nextToken = data.data.accessToken;
        storeToken(nextToken);
        if (active) {
          setToken(nextToken);
          setUser(userWithRole(data.data.user, nextToken));
        }
      } catch {
        storeToken(null);
        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    restoreSession();

    const expireSession = () => {
      setToken(null);
      setUser(null);
    };
    const updateSession = (event) => {
      const { accessToken, user: refreshedUser } = event.detail;
      setToken(accessToken);
      setUser(userWithRole(refreshedUser, accessToken));
    };
    window.addEventListener("snitch:session-expired", expireSession);
    window.addEventListener("snitch:token-refreshed", updateSession);
    return () => {
      active = false;
      window.removeEventListener("snitch:session-expired", expireSession);
      window.removeEventListener("snitch:token-refreshed", updateSession);
    };
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    const expiresAt = getTokenClaims(token).exp * 1000;
    if (!expiresAt) return undefined;

    const refreshTimer = window.setTimeout(() => {
      refreshAccessToken().catch(() => {
        storeToken(null);
        setToken(null);
        setUser(null);
      });
    }, Math.max(expiresAt - Date.now() - 60_000, 0));

    return () => window.clearTimeout(refreshTimer);
  }, [token]);

  const acceptSession = (data) => {
    storeToken(data.accessToken);
    setToken(data.accessToken);
    setUser(userWithRole(data.user, data.accessToken));
  };

  const login = async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    acceptSession(data.data);
  };

  const register = async (details) => {
    const { data } = await api.post("/auth/register", details);
    acceptSession(data.data);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      storeToken(null);
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);