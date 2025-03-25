import { useState, useCallback } from 'react';
import { SubjectNode } from '../types/database';

interface ContextMenuState {
  position: { x: number; y: number };
  subjectId: number | null;
}

export const useContextMenu = (
  subjects: SubjectNode[],
  isSubjectEnabled: (subject: SubjectNode) => boolean
) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleContextMenuOpen = useCallback((subjectId: number, position: { x: number; y: number }) => {
    setContextMenu({ position, subjectId });
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  const getContextMenuActions = useCallback((subjectId: number | null) => {
    if (subjectId === null) return [];

    const subject = subjects.find(s => s.subjectid === subjectId);
    if (!subject) return [];

    return [
      {
        label: subject.status === 'approved' ? 'Marcar como Pendiente' : 'Marcar como Aprobada',
        onClick: () => {
          // Aquí iría la lógica para cambiar el estado
          console.log(`Cambiar estado de ${subject.name} a ${subject.status === 'approved' ? 'pending' : 'approved'}`);
        },
        disabled: !isSubjectEnabled(subject),
      },
      {
        label: subject.status === 'in_progress' ? 'Quitar En Curso' : 'Marcar En Curso',
        onClick: () => {
          // Aquí iría la lógica para cambiar el estado a en curso
          console.log(`Cambiar estado de ${subject.name} a ${subject.status === 'in_progress' ? 'pending' : 'in_progress'}`);
        },
        disabled: !isSubjectEnabled(subject),
      }
    ];
  }, [subjects, isSubjectEnabled]);

  return {
    contextMenu,
    handleContextMenuOpen,
    handleContextMenuClose,
    getContextMenuActions
  };
}; 