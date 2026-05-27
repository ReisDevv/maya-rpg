const ACCESS_TOKEN_KEY = "maya_access_token";

// Access token em sessionStorage: não persiste além da aba/sessão.
// Refresh token é gerenciado pelo backend via cookie httpOnly (Set-Cookie),
// portanto não há nenhum dado sensível persistido por JavaScript.
export const tokenStorage = {
  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  },

  saveAccessToken(accessToken: string): void {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  },

  saveTokens(accessToken: string): void {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  },

  clear(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },
};
