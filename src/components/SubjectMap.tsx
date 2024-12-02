import { useRef, useState, useCallback } from 'react';
import type { SubjectNode as SubjectNodeType } from '../types/database';
import type { Theme } from '../types/theme';
import SubjectNode from './SubjectNode';
import Arrow from './Arrow';

interface SubjectMapProps {
  subjects: SubjectNodeType[];
  yearLabels: Array<{ year: number; x: number; y: number; }>;
  quarterLabels: Array<{ year: number; quarter: number; x: number; y: number; }>;
  currentTheme: Theme;
  criticalNodes: Array<{ subjectId: number; score: number; }>;
  onSubjectStatusChange: (subjectId: number, status: 'pending' | 'in_progress' | 'approved') => void;
  onSubjectGradeChange: (subjectId: number, grade: number) => void;
  onSubjectPositionChange: (position: { x: number; y: number }, isDragging: boolean, subjectId: number) => void;
}

const SubjectMap: React.FC<SubjectMapProps> = ({
  subjects,
  yearLabels,
  quarterLabels,
  currentTheme,
  criticalNodes,
  onSubjectStatusChange,
  onSubjectGradeChange,
  onSubjectPositionChange
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(window.innerWidth < 768 ? 0.5 : 1);
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [hoveredSubject, setHoveredSubject] = useState<number | null>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newScale = Math.min(Math.max(scale + delta, 0.3), 2);
    setScale(newScale);
  };

  const getTouchDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      setLastPinchDistance(getTouchDistance(e.touches[0] as Touch, e.touches[1] as Touch));
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleMapMouseDown({ clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent<HTMLDivElement>);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const currentDistance = getTouchDistance(e.touches[0] as Touch, e.touches[1] as Touch);
      if (lastPinchDistance !== null) {
        const delta = (currentDistance - lastPinchDistance) * 0.01;
        const newScale = Math.min(Math.max(scale + delta, 0.3), 2);
        setScale(newScale);
      }
      setLastPinchDistance(currentDistance);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleMapMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent<HTMLDivElement>);
    }
  };

  const handleTouchEnd = () => {
    setLastPinchDistance(null);
    handleMapMouseUp();
  };

  const handleMapMouseDown = (e: React.MouseEvent) => {
    if (e.target === mapRef.current || e.target === mapRef.current?.firstChild) {
      setIsDraggingMap(true);
      setDragStart({
        x: e.clientX - mapPosition.x,
        y: e.clientY - mapPosition.y
      });
    }
  };

  const handleMapMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingMap) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setMapPosition({
      x: newX,
      y: newY
    });
  };

  const handleMapMouseUp = () => {
    setIsDraggingMap(false);
  };

  const getNodeBorderColor = (subjectId: number): string => {
    const criticalScore = criticalNodes.find(node => node.subjectId === subjectId);
    if (!criticalScore) return 'transparent';

    const index = criticalNodes.findIndex(node => node.subjectId === subjectId);
    const totalNodes = criticalNodes.length;

    if (index < totalNodes * 0.2) {
      return '#FF4444';
    }
    if (index < totalNodes * 0.5) {
      return '#FFA500';
    }
    return 'transparent';
  };

  const isSubjectEnabled = useCallback((subject: SubjectNodeType): boolean => {
    if (subject.status === 'approved' || subject.status === 'in_progress') return true;
    return subject.prerequisites.every(preId => 
      subjects.find(s => s.subjectid === preId)?.status === 'approved'
    );
  }, [subjects]);

  const isCorrelative = useCallback((subjectId: number) => {
    if (!hoveredSubject) return false;
    const subject = subjects.find(s => s.subjectid === hoveredSubject);
    return subject?.prerequisites.includes(subjectId) || 
           subjects.find(s => s.subjectid === subjectId)?.prerequisites.includes(hoveredSubject);
  }, [hoveredSubject, subjects]);

  return (
    <div 
      ref={mapRef}
      className="relative w-full h-full touch-none"
      style={{ 
        transform: `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${scale})`,
        transformOrigin: '0 0',
        cursor: isDraggingMap ? 'grabbing' : 'grab',
      }}
      onWheel={handleWheel}
      onMouseDown={handleMapMouseDown}
      onMouseMove={handleMapMouseMove}
      onMouseUp={handleMapMouseUp}
      onMouseLeave={handleMapMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {yearLabels.map(label => (
        <div
          key={`year-${label.year}`}
          style={{
            position: 'absolute',
            left: label.x,
            top: label.y,
            fontWeight: 'bold',
            fontSize: '1.2rem',
          }}
          className={currentTheme.textColor}
        >
          Año {label.year}
        </div>
      ))}

      {quarterLabels.map(label => (
        <div
          key={`quarter-${label.year}-${label.quarter}`}
          style={{
            position: 'absolute',
            left: label.x,
            top: label.y,
            fontSize: '1rem',
          }}
          className={currentTheme.secondaryText}
        >
          Cuatrimestre {label.quarter}
        </div>
      ))}

      {subjects.map(subject => 
        subject.prerequisites.map(prereqId => {
          const prereq = subjects.find(s => s.subjectid === prereqId);
          if (!prereq) return null;

          const isHighlighted = hoveredSubject && 
            (hoveredSubject === subject.subjectid || hoveredSubject === prereqId);

          return (
            <Arrow
              key={`${prereqId}-${subject.subjectid}`}
              start={{ 
                x: prereq.position.x + (window.innerWidth < 768 ? 140 : 180), 
                y: prereq.position.y + (window.innerWidth < 768 ? 40 : 50)
              }}
              end={{ 
                x: subject.position.x, 
                y: subject.position.y + (window.innerWidth < 768 ? 40 : 50)
              }}
              color={isHighlighted ? '#60A5FA' : (subject.status === 'approved' ? '#48BB78' : isDarkMode ? '#4A5568' : '#CBD5E0')}
            />
          );
        })
      )}

      {subjects.map(subject => (
        <SubjectNode
          key={subject.subjectid}
          subject={subject}
          isEnabled={isSubjectEnabled(subject)}
          onStatusChange={(status) => onSubjectStatusChange(subject.subjectid, status)}
          onGradeChange={(grade) => onSubjectGradeChange(subject.subjectid, grade)}
          onPositionChange={(position, isDragging) => onSubjectPositionChange(position, isDragging, subject.subjectid)}
          borderColor={getNodeBorderColor(subject.subjectid)}
          criticalityScore={criticalNodes.find(node => node.subjectId === subject.subjectid)?.score || 0}
          theme={currentTheme}
          isHighlighted={hoveredSubject ? subject.subjectid === hoveredSubject || isCorrelative(subject.subjectid) : false}
          onHover={() => setHoveredSubject(subject.subjectid)}
          onHoverEnd={() => setHoveredSubject(null)}
        />
      ))}
    </div>
  );
};

export default SubjectMap; 