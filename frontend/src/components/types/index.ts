export interface Schedule {
  subject_code: string;
  semester: number;
  division: string;
  batch?: string;
  is_lab: boolean;
  time_slot: number;
  day: string;
  faculty_code: string;
}
