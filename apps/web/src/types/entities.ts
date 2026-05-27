import type { UserRole, PatientStatus, ExerciseCategory } from "./enums";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  cpf: string;
  status: PatientStatus;
  notes?: string;
  lgpdConsentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  category: ExerciseCategory;
  tags: string[];
  videoUrl?: string;
  imageUrls?: string[];
  instructions: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionExercise {
  exerciseId: string;
  sets?: number;
  repetitions?: number;
  holdTimeSeconds?: number;
  frequency: string;
  notes?: string;
  order: number;
}

export interface Prescription {
  id: string;
  patientId: string;
  professionalId: string;
  title: string;
  description?: string;
  exercises: PrescriptionExercise[];
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  professionalId: string;
  date: string;
  chiefComplaint?: string;
  clinicalNotes: string;
  painLevel?: number;
  mobilityNotes?: string;
  postureAssessment?: string;
  treatmentPlan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseExecution {
  id: string;
  prescriptionId: string;
  exerciseId: string;
  patientId: string;
  executedAt: string;
  painLevel?: number;
  feelingLevel?: number;
  notes?: string;
  completed: boolean;
  createdAt: string;
}

export type AppointmentType = "RPG" | "FISIO_ORTOPEDICA" | "AVALIACAO" | "RETORNO" | "OUTROS";

export interface ClinicAppointment {
  id: string;
  patientId: string;
  patient?: { fullName?: string; email?: string; phone?: string; cpf?: string };
  patientName?: string;
  patientEmail?: string;
  dateTime: string;
  durationMinutes: number;
  bufferMinutes: number;
  type: AppointmentType;
  notes?: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  satisfactionRating?: "MUITO_MAL" | "MAL" | "NEUTRO" | "BEM" | "SUPER_BEM";
}

export interface AppointmentPayload {
  patientId: string;
  dateTime: string;
  durationMinutes: number;
  bufferMinutes: number;
  type: AppointmentType;
  notes?: string;
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole.ADMIN | UserRole.PROFESSIONAL;
}
