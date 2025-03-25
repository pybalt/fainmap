import type { SubjectNode, YearLabel, QuarterLabel } from '../../types/database';

export interface UseSubjectsOptions {
  careerId: number;
  studentId: string;
}

export interface UseSubjectsStats {
  progress: number;
  weightedProgress: number;
  inProgress: number;
  average: string;
  totalSubjects: number;
  approvedSubjects: number;
}

export interface UseSubjectsResult {
  subjects: SubjectNode[];
  yearLabels: YearLabel[];
  quarterLabels: QuarterLabel[];
  loading: boolean;
  error: string | null;
  criticalNodes: Array<{ subjectId: number; score: number }>;
  stats: UseSubjectsStats;
  updateSubjectStatus: (subjectId: number, status: 'pending' | 'in_progress' | 'approved', grade?: number) => Promise<void>;
  updateSubjectPosition: (subjectId: number, position: { x: number; y: number }, isDragging: boolean) => void;
  updateSubjectGrade: (subjectId: number, grade: number) => Promise<void>;
  reload: () => Promise<void>;
} 