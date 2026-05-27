import { api } from "./api";
import { tokenStorage } from "./token-storage";
import type {
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  RecoverPasswordResponse,
  User,
} from "@/types";

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>("auth/login", {
      identifier: credentials.email,
      password: credentials.password,
    });
    tokenStorage.saveTokens(data.accessToken);
    return data;
  },

  async logout(): Promise<void> {
    // O cookie httpOnly é enviado automaticamente; a API o apaga via Set-Cookie.
    await api.post("auth/logout", {});
    tokenStorage.clear();
  },

  async refreshToken(): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>("auth/refresh", {});
    tokenStorage.saveTokens(data.accessToken);
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<User>("auth/me");
    return data;
  },

  async recoverPassword(email: string): Promise<RecoverPasswordResponse> {
    const { data } = await api.post<RecoverPasswordResponse>("auth/recover-password", { email });
    return data;
  },

  async requestPasswordResetCode(email: string): Promise<{ message: string; requestId: string; devToken?: string }> {
    const { data } = await api.post<{ message: string; requestId: string; devToken?: string }>(
      "auth/password-reset/request-code",
      { email },
    );
    return data;
  },

  async confirmPasswordResetCode(
    requestId: string,
    code: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>("auth/password-reset/confirm-code", {
      requestId,
      code,
      newPassword,
    });
    return data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>("auth/reset-password", {
      token,
      newPassword,
    });
    return data;
  },

  async acceptLgpd(): Promise<{ message: string; lgpdAcceptedAt: string }> {
    const { data } = await api.post<{ message: string; lgpdAcceptedAt: string }>(
      "auth/accept-lgpd",
      {},
    );
    return data;
  },

  async register(payload: RegisterRequest): Promise<void> {
    await api.post("auth/register", payload);
  },

  async requestCurrentEmailChangeCode(): Promise<{ requestId: string; message: string }> {
    const { data } = await api.post<{ requestId: string; message: string }>(
      "auth/email-change/request-current",
      {},
    );
    return data;
  },

  async verifyCurrentEmailChangeCode(
    requestId: string,
    code: string,
  ): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>("auth/email-change/verify-current", {
      requestId,
      code,
    });
    return data;
  },

  async requestNewEmailChangeCode(
    requestId: string,
    newEmail: string,
    confirmEmail: string,
  ): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>("auth/email-change/request-new", {
      requestId,
      newEmail,
      confirmEmail,
    });
    return data;
  },

  async confirmNewEmailChangeCode(requestId: string, code: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>("auth/email-change/confirm-new", {
      requestId,
      code,
    });
    return data;
  },
};
