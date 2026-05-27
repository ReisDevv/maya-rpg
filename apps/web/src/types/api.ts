export interface PaginatedRequest {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RecoverPasswordResponse {
  message: string;
  devToken?: string;
}

export interface DashboardStats {
  activePatients: number;
  totalPatients?: number;
  totalExercises: number;
  activePrescriptions: number;
  recentCheckIns?: number;
  upcomingAppointments?: number;
  nextAppointment?: unknown;
  averageAdherenceRate: number;
}

export interface PainEvolutionData {
  date: string;
  painLevel: number;
}
