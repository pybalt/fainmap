import { useCallback } from 'react';

interface UseSubjectActionsProps {
  onPositionUpdate: (subjectId: number, position: { x: number; y: number }) => void;
  onStatusChange?: (subjectId: number, status: 'pending' | 'in_progress' | 'approved') => void;
  onGradeChange?: (subjectId: number, grade: number) => void;
}

export const useSubjectActions = ({
  onPositionUpdate,
  onStatusChange,
  onGradeChange
}: UseSubjectActionsProps) => {
  
  // Manejo de cambios de posición
  const handleNodePositionChange = useCallback((
    subjectId: number, 
    position: { x: number; y: number }, 
    isDragging: boolean
  ) => {
    if (!isDragging) {
      onPositionUpdate(subjectId, position);
    }
  }, [onPositionUpdate]);

  // Manejo de cambios de estado
  const handleStatusChange = useCallback((
    subjectId: number, 
    status: 'pending' | 'in_progress' | 'approved'
  ) => {
    console.log(`Cambiar estado de ${subjectId} a ${status}`);
    
    if (onStatusChange) {
      onStatusChange(subjectId, status);
    }
  }, [onStatusChange]);

  // Manejo de cambios de nota
  const handleGradeChange = useCallback((subjectId: number, grade: number) => {
    console.log(`Cambiar nota de ${subjectId} a ${grade}`);
    
    if (onGradeChange) {
      onGradeChange(subjectId, grade);
    }
  }, [onGradeChange]);

  return {
    handleNodePositionChange,
    handleStatusChange,
    handleGradeChange
  };
}; 