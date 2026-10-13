import { createContext, useContext, useEffect, useState } from "react";
import api, { getStoredToken, getTokenClaims, refreshAccessToken, storeToken } from "../axiosInstance/axiosInstance";

const AuthContext = createContext(null);
let hydrationRequest;
let cachedSession;
let cachedToken;
let hasHydrated = false;

const userWithRole = (user = {}, token) => {
  const claims = getTokenClaims(token);
  return {
    ...user,
    id: user.id ?? claims.userId,
    role: user.role ?? claims.role ?? "user",
  };
};

const rememberSession = (session) => {
  cachedSession = session;
  cachedToken = getStoredToken();
  hasHydrated = true;
};

export function hydrateSession() {
  const storedToken = getStoredToken();
  if (hasHydrated && cachedToken === storedToken) return Promise.resolve(cachedSession);
  if (hydrationRequest) return hydrationRequest;

  hydrationRequest = (async () => {
    const claims = storedToken ? getTokenClaims(storedToken) : {};
    const accessTokenIsValid = Number(claims.exp) * 1000 > Date.now();

    if (storedToken && accessTokenIsValid) {
      try {
        const { data } = await api.get("/auth/me", { skipAuthRefresh: true });
        return { token: storedToken, user: userWithRole(data.data.user, storedToken) };
      } catch (error) {
        if (error.response?.status !== 401) {
          return { token: storedToken, user: userWithRole({}, storedToken) };
        }
      }
    }

    try {
      const { data } = await refreshAccessToken();
      const nextToken = data.data.accessToken;
      storeToken(nextToken);
      return { token: nextToken, user: userWithRole(data.data.user, nextToken) };
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        storeToken(null);
        return null;
      }

      return storedToken
        ? { token: storedToken, user: userWithRole({}, storedToken) }
        : null;
    }
  })()
    .then((session) => {
      rememberSession(session);
      return session;
    })
    .finally(() => {
      hydrationRequest = undefined;
    });

  return hydrationRequest;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const expireSession = () => {
      storeToken(null);
      rememberSession(null);
      setToken(null);
      setUser(null);
      setLoading(false);
    };

    const updateSession = (event) => {
      const { accessToken, user: refreshedUser } = event.detail;
      const session = { token: accessToken, user: userWithRole(refreshedUser, accessToken) };
      rememberSession(session);
      setToken(accessToken);
      setUser(session.user);
    };

    window.addEventListener("snitch:session-expired", expireSession);
    window.addEventListener("snitch:token-refreshed", updateSession);

    hydrateSession()
      .then((session) => {
        if (!active) return;
        setToken(session?.token ?? null);
        setUser(session?.user ?? null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.removeEventListener("snitch:session-expired", expireSession);
      window.removeEventListener("snitch:token-refreshed", updateSession);
    };
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    const expiresAt = Number(getTokenClaims(token).exp) * 1000;
    if (!expiresAt) return undefined;

    let refreshTimer;
    const refreshSession = () => {
      refreshAccessToken().catch((error) => {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          storeToken(null);
          window.dispatchEvent(new Event("snitch:session-expired"));
          return;
        }

        refreshTimer = window.setTimeout(refreshSession, 30_000);
      });
    };

    refreshTimer = window.setTimeout(refreshSession, Math.max(expiresAt - Date.now() - 60_000, 0));
    return () => window.clearTimeout(refreshTimer);
  }, [token]);

  const acceptSession = (data) => {
    storeToken(data.accessToken);
    const session = { token: data.accessToken, user: userWithRole(data.user, data.accessToken) };
    rememberSession(session);
    setToken(session.token);
    setUser(session.user);
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
      rememberSession(null);
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
