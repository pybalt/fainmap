import React, { useCallback } from 'react';
import Draggable from 'react-draggable';
import type { SubjectNode } from '../types/database';
import type { Theme } from '../types/theme';
import SubjectContextMenu from './SubjectContextMenu';

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
  onContextMenu: (position: { x: number; y: number }) => void;
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
  onHoverEnd,
  onContextMenu
}) => {
  const [showGradeInput, setShowGradeInput] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    name: string;
    code: string;
  } | null>(null);
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

  const getStatusColor = () => {
    switch (subject.status) {
      case 'approved':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (subject.status) {
      case 'approved':
        return 'Aprobada';
      case 'in_progress':
        return 'En curso';
      default:
        return 'Pendiente';
    }
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const grade = parseFloat(formData.get('grade') as string);
    if (grade >= 0 && grade <= 10) {
      onGradeChange(grade);
      setShowGradeInput(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!onContextMenu) return;

    const scale = getScale(e.currentTarget.parentElement);
    
    setContextMenu({
      x: subject.position.x + (180 * scale),
      y: subject.position.y - 10,
      name: subject.name,
      code: subject.code
    });
  };

  const getScale = (element: HTMLElement | null): number => {
    if (!element) return 1;
    const transform = window.getComputedStyle(element).transform;
    const matrix = new DOMMatrix(transform);
    return matrix.a;
  };

  return (
    <>
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
            minHeight: '70px',
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
            flex flex-col
            relative
            select-none
            ${theme.textColor}
            ${isHighlighted ? 'ring-2 ring-blue-400 ring-offset-2 scale-105' : ''}
          `}
          onMouseEnter={onHover}
          onMouseLeave={onHoverEnd}
          onContextMenu={handleContextMenu}
        >
          {criticalityScore > 0 && (
            <div 
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
              title={`Desbloquea ${criticalityScore} materia${criticalityScore !== 1 ? 's' : ''}`}
            >
              {criticalityScore}
            </div>
          )}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <div className="flex-1">
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                  <span className={`text-xs ${theme.secondaryText}`}>{getStatusText()}</span>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange('pending');
                  }}
                  className={`text-xs px-1 py-0.5 rounded ${
                    subject.status === 'pending'
                      ? 'bg-gray-200 text-gray-700'
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  P
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange('in_progress');
                  }}
                  className={`text-xs px-1 py-0.5 rounded ${
                    subject.status === 'in_progress'
                      ? 'bg-yellow-200 text-yellow-700'
                      : 'hover:bg-yellow-100 text-yellow-500'
                  }`}
                >
                  C
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange('approved');
                  }}
                  className={`text-xs px-1 py-0.5 rounded ${
                    subject.status === 'approved'
                      ? 'bg-green-200 text-green-700'
                      : 'hover:bg-green-100 text-green-500'
                  }`}
                >
                  A
                </button>
              </div>
            </div>
            <h3 className="text-xs font-semibold truncate">{subject.name}</h3>
            <p className={`text-xs truncate ${theme.secondaryText}`}>{subject.code}</p>
          </div>
          
          {showGradeInput && subject.status === 'approved' && (
            <form onSubmit={handleGradeSubmit} className="space-y-1 mt-1">
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
          )}
        </div>
      </Draggable>

      {contextMenu && (
        <SubjectContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          theme={theme}
          grade={subject.grade}
          onGradeClick={() => {
            setShowGradeInput(true);
            setContextMenu(null);
          }}
          status={subject.status}
          name={contextMenu.name}
          code={contextMenu.code}
        />
      )}
    </>
  );
};

export default SubjectNode; 