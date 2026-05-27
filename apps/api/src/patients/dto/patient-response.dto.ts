import { PatientStatus } from '../../common/enums/patient-status.enum';
import { Patient } from '../entities/patient.entity';

export class PatientResponseDto {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: Date;
  cpf: string;
  status: PatientStatus;
  notes: string;
  lgpdConsentAt: Date;
  acceptedTerms: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(patient: Partial<Patient>) {
    Object.assign(this, patient);
    this.acceptedTerms = !!patient.lgpdConsentAt;
  }
}
