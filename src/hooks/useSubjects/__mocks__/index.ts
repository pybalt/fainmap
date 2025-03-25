import { vi } from 'vitest';

export const useSubjects = () => ({
  subjects: [],
  yearLabels: [],
  quarterLabels: [],
  loading: false,
  error: null,
  criticalNodes: [],
  stats: {
    progress: 0,
    weightedProgress: 0,
    inProgress: 0,
    average: 'N/A',
    totalSubjects: 0,
    approvedSubjects: 0
  },
  updateSubjectStatus: vi.fn(),
  updateSubjectPosition: vi.fn((_subjectId, _position, _isDragging) => {
    // Mock implementation
  }),
  updateSubjectGrade: vi.fn(),
  reload: vi.fn(() => {
    // Simulate clearing cache on reload
    localStorage.removeItem('mapped_subjects_1');
    localStorage.removeItem('mapped_subjects_timestamp_1');
    return Promise.resolve();
  })
}); 