import type { SubjectNode } from '../../types/database';
import { calculateCriticalNodes } from '../../utils/criticalityUtils';
import type { UseSubjectsStats } from './types';

/**
 * Calculate and create stats object
 */
export function calculateStats(
  currentSubjects: SubjectNode[], 
  criticalScores: Array<{ subjectId: number; score: number }>
): UseSubjectsStats {
  if (!currentSubjects.length) {
    return {
      progress: 0,
      weightedProgress: 0,
      inProgress: 0,
      average: 'N/A',
      totalSubjects: 0,
      approvedSubjects: 0
    };
  }
  
  const total = currentSubjects.length;
  const approved = currentSubjects.filter(s => s.status === 'approved').length;
  const inProgress = currentSubjects.filter(s => s.status === 'in_progress').length;
  const progress = (approved / total) * 100;
  
  // Calculate weighted progress based on criticality scores
  const maxScore = Math.max(...criticalScores.map(node => node.score || 1), 1);
  
  const getWeight = (subjectId: number): number => {
    const node = criticalScores.find(n => n.subjectId === subjectId);
    if (!node) return 1;
    // Normalize score to a range of 1 to 3
    return 1 + (node.score / maxScore) * 2;
  };
  
  const totalWeight = currentSubjects.reduce((sum, subject) => sum + getWeight(subject.subjectid), 0);
  const approvedWeight = currentSubjects
    .filter(s => s.status === 'approved')
    .reduce((sum, subject) => sum + getWeight(subject.subjectid), 0);
  
  const weightedProgress = totalWeight ? (approvedWeight / totalWeight) * 100 : 0;
  
  // Calculate average grade
  const gradesSum = currentSubjects
    .filter(s => s.status === 'approved' && s.grade !== undefined)
    .reduce((sum, subject) => sum + (subject.grade || 0), 0);
  
  const gradesCount = currentSubjects.filter(s => s.status === 'approved' && s.grade !== undefined).length;
  const average = gradesCount ? (gradesSum / gradesCount).toFixed(2) : 'N/A';
  
  return {
    progress,
    weightedProgress,
    inProgress,
    average,
    totalSubjects: total,
    approvedSubjects: approved
  };
}

/**
 * Update subject statuses from student progress data
 */
export function updateSubjectsWithProgress(
  baseSubjects: SubjectNode[],
  approvedSubjects: any[],
  inProgressSubjects: any[]
): {
  updatedSubjects: SubjectNode[];
  criticalityScores: Array<{ subjectId: number; score: number }>;
} {
  // Create a map for faster lookups
  const subjectsMap = new Map(baseSubjects.map(subject => [subject.subjectid, { ...subject }]));
  
  // Update status for approved subjects
  approvedSubjects.forEach((approvedSubject: any) => {
    const subject = subjectsMap.get(approvedSubject.subjectid);
    if (subject) {
      subject.status = 'approved';
      subject.grade = approvedSubject.grade;
    }
  });
  
  // Update status for in-progress subjects
  inProgressSubjects.forEach((inProgressSubject: any) => {
    const subject = subjectsMap.get(inProgressSubject.subjectid);
    if (subject && subject.status !== 'approved') { // Don't override approved status
      subject.status = 'in_progress';
    }
  });
  
  // Convert map back to array
  const updatedSubjects = Array.from(subjectsMap.values());
  
  // Calculate criticality scores
  const criticalityScores = calculateCriticalNodes(updatedSubjects);
  
  return { 
    updatedSubjects,
    criticalityScores
  };
} 