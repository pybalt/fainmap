import { useState, useEffect, useCallback } from 'react';
import type { SubjectNode, YearLabel, QuarterLabel } from '../../types/database';
import { careerService, studentService } from '../../services/api';
import { subjectCache, progressCache } from '../../services/cache';
import { calculateInitialPositions } from '../../utils/subjectUtils';
import { calculateStats, updateSubjectsWithProgress } from './helpers';
import type { UseSubjectsOptions, UseSubjectsResult } from './types';

export * from './types';

export const useSubjects = ({ careerId, studentId }: UseSubjectsOptions): UseSubjectsResult => {
  const [subjects, setSubjects] = useState<SubjectNode[]>([]);
  const [yearLabels, setYearLabels] = useState<YearLabel[]>([]);
  const [quarterLabels, setQuarterLabels] = useState<QuarterLabel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [criticalNodes, setCriticalNodes] = useState<Array<{ subjectId: number; score: number }>>([]);
  const [stats, setStats] = useState({
    progress: 0,
    weightedProgress: 0,
    inProgress: 0,
    average: 'N/A',
    totalSubjects: 0,
    approvedSubjects: 0
  });

  /**
   * Load student's approved and in-progress subjects
   */
  const loadStudentProgress = useCallback(async (baseSubjects: SubjectNode[]) => {
    if (!studentId || !careerId) return;
    
    try {
      // Load approved subjects
      const approvedSubjectsList = await studentService.getApprovedSubjects(studentId, careerId);
      
      // Load in-progress subjects
      const inProgressSubjects = await studentService.getInProgressSubjects(studentId);
      
      // Update subjects with progress data
      const { updatedSubjects, criticalityScores } = updateSubjectsWithProgress(
        baseSubjects,
        approvedSubjectsList,
        inProgressSubjects
      );
      
      // Update statistics
      const updatedStats = calculateStats(updatedSubjects, criticalityScores);
      
      // Update state
      setCriticalNodes(criticalityScores);
      setStats(updatedStats);
      setSubjects(updatedSubjects);
      setLoading(false);
      
    } catch (error) {
      console.error('Error loading student progress:', error);
      // Don't set an error, just use base subjects
      setLoading(false);
    }
  }, [studentId, careerId]);

  /**
   * Load subjects and their prerequisites
   */
  const loadSubjects = useCallback(async (forceRefresh = false) => {
    if (!careerId || !studentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to get from cache first if not forcing refresh
      let subjectsData: SubjectNode[] | null = null;
      
      if (!forceRefresh) {
        subjectsData = subjectCache.getSubjects(careerId);
      }
      
      // If not in cache or force refresh, fetch from API
      if (!subjectsData) {
        console.log('Cache expired or non-existent, loading from server');
        subjectsData = await careerService.getSubjectsWithPrerequisites(careerId);
        
        if (subjectsData && subjectsData.length > 0) {
          // Update cache
          subjectCache.setSubjects(careerId, subjectsData);
        }
      }
      
      if (!subjectsData || subjectsData.length === 0) {
        setError('No subjects found for this career');
        setLoading(false);
        return;
      }
      
      // Calculate positions
      const layoutData = calculateInitialPositions(subjectsData);
      
      // Set base data
      setSubjects(layoutData.subjects);
      setYearLabels(layoutData.yearLabels);
      setQuarterLabels(layoutData.quarterLabels);
      
      // Load student progress
      await loadStudentProgress(layoutData.subjects);
      
    } catch (error) {
      console.error('Error loading subjects:', error);
      setError(error instanceof Error ? error.message : 'Failed to load subjects. Please try again.');
      setLoading(false);
    }
  }, [careerId, studentId, loadStudentProgress]);

  /**
   * Update subject status
   */
  const updateSubjectStatus = useCallback(async (
    subjectId: number, 
    status: 'pending' | 'in_progress' | 'approved',
    grade?: number
  ) => {
    if (!studentId) return;
    
    try {
      // Optimistically update the UI
      setSubjects(currentSubjects => {
        const updatedSubjects = currentSubjects.map(subject => 
          subject.subjectid === subjectId 
            ? { ...subject, status, grade: status === 'approved' ? (grade || subject.grade) : undefined }
            : subject
        );
        
        // Recalculate criticality and update stats
        const { criticalityScores } = updateSubjectsWithProgress(
          updatedSubjects, [], []
        );
        
        setCriticalNodes(criticalityScores);
        
        // Update stats
        const updatedStats = calculateStats(updatedSubjects, criticalityScores);
        setStats(updatedStats);
        
        return updatedSubjects;
      });
      
      // Send to server
      await studentService.updateSubjectStatus(studentId, subjectId, status, grade);
      
    } catch (error) {
      console.error('Error updating subject status:', error);
      
      // Revert the optimistic update by reloading data
      await loadSubjects(true);
    }
  }, [studentId, loadSubjects]);

  /**
   * Update subject position
   */
  const updateSubjectPosition = useCallback((
    subjectId: number, 
    position: { x: number; y: number },
    isDragging: boolean
  ) => {
    // Optimistically update the UI
    setSubjects(currentSubjects => 
      currentSubjects.map(subject => 
        subject.subjectid === subjectId 
          ? { ...subject, position }
          : subject
      )
    );
    
    // Only save position when dragging ends
    if (!isDragging && studentId && careerId) {
      try {
        studentService.updateSubjectPosition(studentId, careerId, subjectId, position);
        
        // Update in local storage
        const progress = progressCache.getProgress(studentId, careerId) || {};
        progress.subjects = progress.subjects || {};
        progress.subjects[subjectId] = {
          ...(progress.subjects[subjectId] || {}),
          position
        };
        progressCache.setProgress(studentId, careerId, progress);
      } catch (error) {
        console.error('Error updating subject position:', error);
      }
    }
  }, [studentId, careerId]);

  /**
   * Update subject grade
   */
  const updateSubjectGrade = useCallback(async (subjectId: number, grade: number) => {
    if (!studentId) return;
    
    // Call updateSubjectStatus with 'approved' status and the new grade
    await updateSubjectStatus(subjectId, 'approved', grade);
  }, [studentId, updateSubjectStatus]);

  /**
   * Force reload all data
   */
  const reload = useCallback(async () => {
    // Clear the cache and reload
    if (careerId) {
      subjectCache.clearSubjectsCache(careerId);
    }
    await loadSubjects(true);
  }, [careerId, loadSubjects]);

  // Initial data loading
  useEffect(() => {
    if (careerId && studentId) {
      loadSubjects();
    }
  }, [careerId, studentId, loadSubjects]);

  return {
    subjects,
    yearLabels,
    quarterLabels,
    loading,
    error,
    criticalNodes,
    stats,
    updateSubjectStatus,
    updateSubjectPosition,
    updateSubjectGrade,
    reload
  };
}; 