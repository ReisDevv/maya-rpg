export class AnonymizeResultDto {
  userId: string;
  patientId?: string;
  anonymizedAt: string;
  fieldsChanged: string[];
}
