import axios from "axios";

const TOKEN_KEY = "snitch.accessToken";

export const getStoredToken = () => {
  return window.localStorage.getItem(TOKEN_KEY);
};

export const storeToken = (token) => {
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
};

export const getTokenClaims = (token) => {
  try {
    const payload = token
      .split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    return JSON.parse(window.atob(payload));
  } catch {
    return {};
  }
};

// Main API client
const api = axios.create({
  baseURL: "https://intership-assignment-z0hd.onrender.com/api",
  withCredentials: true,
});

// Separate client for refresh request
const refreshClient = axios.create({
  baseURL: "https://intership-assignment-z0hd.onrender.com/api",
  withCredentials: true,
});

// Prevent multiple refresh requests at the same time
let refreshRequest;

export const refreshAccessToken = () => {
  if (!refreshRequest) {
    const tokenAtStart = getStoredToken();
    const rotateOrReuse = async () => {
      const currentToken = getStoredToken();
      const expiration = getTokenClaims(currentToken ?? "").exp * 1000;
      const anotherTabRotated = currentToken && currentToken !== tokenAtStart;

      if (anotherTabRotated && expiration > Date.now() + 30_000) {
        const { data } = await api.get("/auth/me", { skipAuthRefresh: true });
        return {
          data: {
            data: {
              accessToken: currentToken,
              user: data.data.user,
            },
          },
        };
      }

      return refreshClient.post("/auth/refresh");
    };

    const request = typeof navigator !== "undefined" && navigator.locks?.request
      ? navigator.locks.request("snitch-auth-refresh", rotateOrReuse)
      : rotateOrReuse();

    refreshRequest = Promise.resolve(request)
      .then((response) => {
        const { accessToken, user } = response.data.data;

        storeToken(accessToken);

        window.dispatchEvent(
          new CustomEvent("snitch:token-refreshed", {
            detail: {
              accessToken,
              user,
            },
          }),
        );

        return response;
      })
      .finally(() => {
        refreshRequest = undefined;
      });
  }

  return refreshRequest;
};

// Attach access token to every request
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Handle expired access token
api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const request = error.config;

    const isRefreshRequest = request?.url?.includes("/auth/refresh");

    // Only refresh when the request failed with 401
    if (
      error.response?.status !== 401 ||
      !request ||
      request._retried ||
      isRefreshRequest ||
      request.skipAuthRefresh
    ) {
      return Promise.reject(error);
    }

    // Prevent infinite retry loop
    request._retried = true;

    try {
      const { data } = await refreshAccessToken();

      const newAccessToken = data.data.accessToken;

      request.headers.Authorization = `Bearer ${newAccessToken}`;

      // Retry the original request
      return api(request);
    } catch (refreshError) {
      // CHANGED: log the real reason the refresh failed
      console.log(
        "REFRESH FAILED:",
        refreshError.response?.status,
        refreshError.response?.data ?? refreshError.message,
      );

      // CHANGED: only end the session if the server rejected the refresh token.
      // Network errors / 500s should not log the user out.
      const status = refreshError.response?.status;
      if (status === 401 || status === 403) {
        storeToken(null);
        window.dispatchEvent(new Event("snitch:session-expired"));
      }

      return Promise.reject(refreshError);
    }
  },
);

export default api;