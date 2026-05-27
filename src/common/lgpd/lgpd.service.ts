import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
const archiver = require('archiver');

import { User } from '../../auth/entities/user.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Prescription } from '../../prescriptions/entities/prescription.entity';
import { CheckIn } from '../../check-ins/entities/check-in.entity';
import { MedicalRecord } from '../../medical-records/entities/medical-record.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class LgpdService {
  private readonly logger = new Logger(LgpdService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Prescription)
    private readonly prescriptionRepo: Repository<Prescription>,
    @InjectRepository(CheckIn)
    private readonly checkInRepo: Repository<CheckIn>,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepo: Repository<MedicalRecord>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    private readonly auditService: AuditService,
  ) {}

  async exportUserDataToZip(userId: string, resStream: NodeJS.WritableStream): Promise<{ filename: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const patient = await this.patientRepo.findOne({ where: { userId } });

    const [prescriptions, checkIns, medicalRecords, appointments] = patient
      ? await Promise.all([
          this.prescriptionRepo.find({ where: { patientId: patient.id } }),
          this.checkInRepo.find({ where: { patientId: patient.id } }),
          this.medicalRecordRepo.find({ where: { patientId: patient.id } }),
          this.appointmentRepo.find({ where: { patientId: patient.id } }),
        ])
      : [[], [], [], []];

    const exportObj = {
      metadata: { userId, generatedAt: new Date().toISOString() },
      user,
      patient,
      prescriptions,
      checkIns,
      medicalRecords,
      appointments,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const archive: any = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err: Error) => { throw err; });
    archive.pipe(resStream);
    archive.append(JSON.stringify(exportObj, null, 2), { name: 'export.json' });

    const mediaFiles = await this.collectMediaFiles(prescriptions);
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    for (const fname of mediaFiles) {
      const fullPath = path.join(uploadsDir, fname);
      if (fs.existsSync(fullPath)) {
        archive.file(fullPath, { name: `media/${fname}` });
      }
    }

    await archive.finalize();

    await this.auditService.createLog({
      userId,
      action: 'LGPD_EXPORT_CREATED',
      method: 'GET',
      path: '/me/lgpd/export',
      statusCode: 200,
    });

    return { filename: `maya-rpg-export-${userId}.zip` };
  }

  async anonymizeUser(userId: string): Promise<{ anonymizedAt: string; fieldsChanged: string[] }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const patient = await this.patientRepo.findOne({ where: { userId } });
    const now = new Date();
    const hash = createHash('sha256').update(userId + now.getTime()).digest('hex').slice(0, 12);
    const fieldsChanged: string[] = [];

    user.name = `ANON_${hash}`;
    user.email = `anon+${hash}@example.invalid`;
    user.isAnonymized = true;
    user.anonymizedAt = now;
    fieldsChanged.push('user.name', 'user.email');
    await this.userRepo.save(user);

    if (patient) {
      patient.fullName = `ANON_${hash}`;
      patient.email = `anon+${hash}@example.invalid`;
      patient.phone = '';
      patient.cpf = '00000000000';
      patient.isAnonymized = true;
      patient.anonymizedAt = now;
      fieldsChanged.push('patient.fullName', 'patient.email', 'patient.phone', 'patient.cpf');
      await this.patientRepo.save(patient);

      // Apaga texto livre com dados pessoais em registros clínicos
      const anonNote = '[dado removido — LGPD]';

      const medicalRecords = await this.medicalRecordRepo.find({
        where: { patientId: patient.id },
      });
      for (const record of medicalRecords) {
        record.chiefComplaint = anonNote;
        record.clinicalNotes = anonNote;
        record.mobilityNotes = anonNote;
        record.postureAssessment = anonNote;
        record.treatmentPlan = anonNote;
      }
      if (medicalRecords.length > 0) {
        await this.medicalRecordRepo.save(medicalRecords);
        fieldsChanged.push('medicalRecords.notes');
      }

      const checkIns = await this.checkInRepo.find({
        where: { patientId: patient.id },
      });
      for (const ci of checkIns) {
        ci.notes = anonNote;
      }
      if (checkIns.length > 0) {
        await this.checkInRepo.save(checkIns);
        fieldsChanged.push('checkIns.notes');
      }

      const appointments = await this.appointmentRepo.find({
        where: { patientId: patient.id },
      });
      for (const appt of appointments) {
        appt.notes = anonNote;
        appt.satisfactionNotes = anonNote;
      }
      if (appointments.length > 0) {
        await this.appointmentRepo.save(appointments);
        fieldsChanged.push('appointments.notes');
      }
    }

    await this.auditService.createLog({
      userId,
      action: 'LGPD_ANONYMIZE',
      method: 'POST',
      path: '/me/lgpd/anonymize',
      statusCode: 200,
    });

    return { anonymizedAt: now.toISOString(), fieldsChanged };
  }

  private async collectMediaFiles(prescriptions: Prescription[]): Promise<Set<string>> {
    const mediaFiles = new Set<string>();
    const exerciseIds = new Set<string>();

    for (const pres of prescriptions) {
      for (const exRef of pres.exercises ?? []) {
        if (exRef.exerciseId) exerciseIds.add(exRef.exerciseId);
      }
    }

    if (exerciseIds.size > 0) {
      const exercises = await this.exerciseRepo.find({ where: { id: In([...exerciseIds]) } });
      for (const ex of exercises) {
        for (const url of ex.imageUrls ?? []) this.addMedia(mediaFiles, url);
        if (ex.videoUrl) this.addMedia(mediaFiles, ex.videoUrl);
      }
    }

    return mediaFiles;
  }

  private addMedia(set: Set<string>, url: string): void {
    if (!url) return;
    try {
      const fname = new URL(url).pathname.split('/').pop();
      if (fname) set.add(fname);
    } catch {
      const fname = url.split('/').pop();
      if (fname) set.add(fname);
    }
  }
}
