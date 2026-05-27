import { PatientStatus, type Patient } from "@/types";
import type { PatientPayload } from "@/services/patient.service";
import { onlyDigits } from "@/lib/input-masks";

export type PatientFormValues = {
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  cpf: string;
  status: PatientStatus;
  notes: string;
};

export const emptyPatientForm: PatientFormValues = {
  fullName: "",
  email: "",
  phone: "",
  birthDate: "",
  cpf: "",
  status: PatientStatus.ACTIVE,
  notes: "",
};

export function patientToFormValues(patient: Patient): PatientFormValues {
  return {
    fullName: patient.fullName,
    email: patient.email,
    phone: onlyDigits(patient.phone),
    birthDate: patient.birthDate ? patient.birthDate.slice(0, 10) : "",
    cpf: onlyDigits(patient.cpf),
    status: patient.status,
    notes: patient.notes ?? "",
  };
}

export function patientFormToPayload(values: PatientFormValues): PatientPayload {
  return {
    fullName: values.fullName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: onlyDigits(values.phone),
    birthDate: values.birthDate,
    cpf: onlyDigits(values.cpf),
    status: values.status,
    notes: values.notes.trim() || undefined,
  };
}

export function isPatientFormValid(values: PatientFormValues) {
  return Boolean(
    values.fullName.trim() &&
    values.email.trim() &&
    values.phone.trim() &&
    values.birthDate &&
    values.cpf.trim(),
  );
}
