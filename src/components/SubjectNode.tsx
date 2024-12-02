import React, { useCallback } from 'react';
import Draggable from 'react-draggable';
import type { SubjectNode } from '../types/database';
import type { Theme } from '../types/theme';

interface Props {
  subject: SubjectNode;
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
}

const defaultTheme: Theme = {
  name: 'Light',
  bgColor: 'bg-gray-100',
  headerBg: 'bg-white',
  cardBg: 'bg-white',
  textColor: 'text-gray-900',
  secondaryText: 'text-gray-500'
};

const SubjectNode: React.FC<Props> = ({
  subject,
  isEnabled,
  onStatusChange,
  onGradeChange,
  onPositionChange,
  borderColor,
  criticalityScore,
  theme = defaultTheme,
  isHighlighted,
  onHover,
  onHoverEnd
}) => {
  const [showGradeInput, setShowGradeInput] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const nodeRef = React.useRef<HTMLDivElement>(null);

  const getBackgroundColor = () => {
    if (!isEnabled) return 'bg-gray-300 dark:bg-gray-600';
    switch (subject.status) {
      case 'approved':
        return 'bg-green-500 text-white';
      case 'in_progress':
        return 'bg-yellow-500 dark:bg-yellow-600';
      default:
        return `${theme.cardBg}`;
    }
  };

  const handleClick = () => {
    if (!isEnabled || isDragging) return;
    
    const nextStatus = {
      pending: 'in_progress',
      in_progress: 'approved',
      approved: 'pending',
    } as const;

    onStatusChange(nextStatus[subject.status]);
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const grade = parseFloat(form.grade.value);
    if (grade >= 0 && grade <= 10) {
      onGradeChange(grade);
      setShowGradeInput(false);
    }
  };

  const handleDrag = useCallback((_e: any, data: { x: number; y: number }) => {
    if (!isDragging) {
      setIsDragging(true);
    }
    onPositionChange({
      x: Math.max(0, data.x),
      y: Math.max(0, data.y)
    }, true);
  }, [isDragging, onPositionChange]);

  const handleDragStop = useCallback((_e: any, data: { x: number; y: number }) => {
    setIsDragging(false);
    onPositionChange({
      x: Math.max(0, data.x),
      y: Math.max(0, data.y)
    }, false);
  }, [onPositionChange]);

  return (
    <Draggable
      nodeRef={nodeRef}
      position={subject.position}
      onDrag={handleDrag}
      onStop={handleDragStop}
      disabled={!isEnabled}
      bounds="parent"
      defaultClassName={isDragging ? 'react-draggable-dragging' : ''}
    >
      <div
        ref={nodeRef}
        style={{
          width: '180px',
          height: '70px',
          position: 'absolute',
          cursor: isEnabled ? (isDragging ? 'grabbing' : 'grab') : 'not-allowed',
          border: borderColor !== 'transparent' ? `2px solid ${borderColor}` : undefined,
          transition: isDragging ? 'none' : 'all 0.3s ease',
          zIndex: isDragging ? 1000 : 1,
        }}
        className={`
          ${getBackgroundColor()}
          p-2 rounded-lg shadow-md
          ${isEnabled && !isDragging ? 'hover:shadow-lg' : ''}
          ${isDragging ? 'shadow-xl' : ''}
          flex flex-col justify-between
          relative
          select-none
          ${theme.textColor}
          ${isHighlighted ? 'ring-2 ring-blue-400 ring-offset-2 scale-105' : ''}
        `}
        onClick={handleClick}
        onMouseEnter={onHover}
        onMouseLeave={onHoverEnd}
      >
        {criticalityScore > 0 && (
          <div 
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
            title={`Desbloquea ${criticalityScore} materia${criticalityScore !== 1 ? 's' : ''}`}
          >
            {criticalityScore}
          </div>
        )}
        <div>
          <h3 className="text-xs font-semibold truncate">{subject.name}</h3>
          <p className={`text-xs truncate ${theme.secondaryText}`}>{subject.code}</p>
        </div>
        
        {subject.status === 'approved' && (
          <div className="text-xs">
            {showGradeInput ? (
              <form onSubmit={handleGradeSubmit} className="space-y-1">
                <input
                  type="number"
                  name="grade"
                  min="0"
                  max="10"
                  step="0.1"
                  defaultValue={subject.grade}
                  className={`w-full px-1 py-0.5 border rounded ${theme.cardBg} ${theme.textColor}`}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white px-1 py-0.5 rounded hover:bg-green-700 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  Guardar
                </button>
              </form>
            ) : (
              <p
                className={`cursor-pointer hover:underline ${theme.secondaryText}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGradeInput(true);
                }}
              >
                Nota: {subject.grade || 'Click'}
              </p>
            )}
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default SubjectNode; 