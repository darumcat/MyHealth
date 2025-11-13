
export enum RecordType {
  Vitals = 'vitals',
  BloodTest = 'bloodTest',
  Symptom = 'symptom',
  Vaccination = 'vaccination',
}

export interface RecordBase {
  id: string;
  date: string; // ISO string
  notes?: string;
}

export interface Vitals extends RecordBase {
  type: RecordType.Vitals;
  systolic: number;
  diastolic: number;
  pulse: number;
  temperature: number;
  weight: number;
}

export interface BloodTestValue {
  name: string;
  value: number;
  unit: string;
  refMin?: number;
  refMax?: number;
}

export interface BloodTest extends RecordBase {
  type: RecordType.BloodTest;
  name: string;
  values: BloodTestValue[];
}

export interface Symptom extends RecordBase {
  type: RecordType.Symptom;
  description: string;
}

export interface Vaccination extends RecordBase {
  type: RecordType.Vaccination;
  name:string;
  reminderDate?: string; // ISO string
}

export type MedicalRecord = Vitals | BloodTest | Symptom | Vaccination;

export interface AppData {
  records: MedicalRecord[];
  userName?: string;
  userDob?: string; // ISO string
}