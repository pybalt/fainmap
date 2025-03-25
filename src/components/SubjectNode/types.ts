import type { SubjectNode as SubjectNodeType } from '../../types/database';
import type { Theme } from '../../types/theme';

export interface SubjectNodeProps {
  subject: SubjectNodeType;
  isEnabled: boolean;
  onStatusChange: (status: 'pending' | 'in_progress' | 'approved') => void;
  onGradeChange: (grade: number) => void;
  onPositionChange: (position: { x: number; y: number }, isDragging: boolean) => void;
  borderColor: string;
  criticalityScore: number;
  theme: Theme;
  isHighlighted: boolean;
  onHover: () => void;
  onHoverEnd: () => void;
  onContextMenu: (position: { x: number; y: number }) => void;
}

export interface ContextMenuState {
  x: number;
  y: number;
  name: string;
  code: string;
} 