import { useState, useCallback } from 'react';

/**
 * Hook para manejar el estado de hover en las materias
 */
export const useHoverState = () => {
  const [hoveredSubject, setHoveredSubject] = useState<number | null>(null);

  const handleNodeMouseEnter = useCallback((subjectId: number) => {
    setHoveredSubject(subjectId);
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredSubject(null);
  }, []);

  return {
    hoveredSubject,
    handleNodeMouseEnter,
    handleNodeMouseLeave
  };
}; 