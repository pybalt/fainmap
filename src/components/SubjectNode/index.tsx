import React, { useCallback, useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { getElementScale, getNodeBackgroundColor, getStatusColor, getStatusText } from '../../utils/nodeUtils';
import SubjectContextMenu from '../SubjectContextMenu';
import GradeInput from './GradeInput';
import StatusButtons from './StatusButtons';
import type { SubjectNodeProps, ContextMenuState } from './types';

export * from './types';

const defaultTheme = {
  name: 'Light',
  bgColor: 'bg-gray-100',
  headerBg: 'bg-white',
  cardBg: 'bg-white',
  textColor: 'text-gray-900',
  secondaryText: 'text-gray-500'
};

const SubjectNode: React.FC<SubjectNodeProps> = ({
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
  const [showGradeInput, setShowGradeInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  /**
   * Handle dragging of the node
   */
  const handleDrag = useCallback((_e: any, data: { x: number; y: number }) => {
    if (!isDragging) {
      setIsDragging(true);
    }
    onPositionChange({
      x: Math.max(0, data.x),
      y: Math.max(0, data.y)
    }, true);
  }, [isDragging, onPositionChange]);

  /**
   * Handle drag stop of the node
   */
  const handleDragStop = useCallback((_e: any, data: { x: number; y: number }) => {
    setIsDragging(false);
    onPositionChange({
      x: Math.max(0, data.x),
      y: Math.max(0, data.y)
    }, false);
  }, [onPositionChange]);

  /**
   * Handle right click for context menu
   */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!nodeRef.current) return;
    
    // Get the scale of the parent element to adjust the position
    const scale = getElementScale(nodeRef.current.parentElement);
    
    // Calculate position considering the scale
    const rect = nodeRef.current.getBoundingClientRect();
    const scaleValue = Number(scale);
    if (isNaN(scaleValue)) return;
    
    onContextMenu({
      x: (e.clientX - rect.left) / scaleValue,
      y: (e.clientY - rect.top) / scaleValue
    });
  }, [onContextMenu]);

  // Get background color based on node status and enabled state
  const backgroundColor = getNodeBackgroundColor(subject.status, isEnabled, theme);

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
            ${backgroundColor}
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
          aria-disabled={!isEnabled}
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
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(subject.status)}`} />
                  <span className={`text-xs ${theme.secondaryText}`}>{getStatusText(subject.status)}</span>
                </div>
              </div>
              <StatusButtons 
                currentStatus={subject.status}
                isEnabled={isEnabled}
                onStatusChange={onStatusChange}
                onGradeClick={() => setShowGradeInput(true)}
              />
            </div>
            <h3 className="text-sm font-medium line-clamp-2 mb-1" title={subject.name}>
              {subject.name}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-xs opacity-75">{subject.code}</span>
              {subject.status === 'approved' && subject.grade && (
                <span className="text-xs font-semibold px-1.5 py-0.5 bg-green-100 text-green-800 rounded">
                  {subject.grade}
                </span>
              )}
            </div>
          </div>
          
          {showGradeInput && (
            <GradeInput
              defaultGrade={subject.grade}
              onSubmit={onGradeChange}
              onCancel={() => setShowGradeInput(false)}
            />
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