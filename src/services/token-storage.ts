const ACCESS_TOKEN_KEY = "maya_access_token";
const REFRESH_TOKEN_KEY = "maya_refresh_token";

// Access token em sessionStorage: não persiste além da aba/sessão, reduz
// exposição a XSS comparado a localStorage. Refresh token permanece em
// localStorage para suportar renovação automática entre sessões.
export const tokenStorage = {
  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  saveTokens(accessToken: string, refreshToken: string): void {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clear(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },
};
