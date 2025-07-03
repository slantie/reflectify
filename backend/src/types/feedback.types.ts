export interface StudentContext {
  departmentId: string;
  semesterId: string;
  divisionId: string;
  batch: string;
}

export interface FeedbackQuestion {
  categoryId: string;
  text: string;
  type: 'rating' | 'text';
  isRequired: boolean;
  displayOrder: number;
  subjectAllocationId: string;
}
