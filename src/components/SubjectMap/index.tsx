import React, { useRef } from 'react';
import { SubjectNode } from '../../types/database';
import { useTheme } from '../../hooks/useTheme';
import { useMapControls } from '../../hooks/useMapControls';
import { useSubjectMapUtils } from '../../hooks/useSubjectMapUtils';
import { useMapLabels } from '../../hooks/useMapLabels';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useSubjectActions } from '../../hooks/useSubjectActions';
import { useHoverState } from '../../hooks/useHoverState';
import SubjectNodeComp from '../SubjectNode';
import MapLabels from './MapLabels';
import ArrowsRenderer from './ArrowsRenderer';
import ContextMenu from './ContextMenu';

interface SubjectMapProps {
  subjects: SubjectNode[];
  onPositionUpdate: (subjectId: number, position: { x: number; y: number }) => void;
  onStatusChange?: (subjectId: number, status: 'pending' | 'in_progress' | 'approved') => void;
  onGradeChange?: (subjectId: number, grade: number) => void;
  readOnly?: boolean;
}

const SubjectMap: React.FC<SubjectMapProps> = ({ 
  subjects, 
  onPositionUpdate,
  onStatusChange,
  onGradeChange,
  readOnly = false 
}) => {
  // Referencias
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Hooks básicos
  const themeContext = useTheme();
  const theme = themeContext.currentTheme;
  const isDarkMode = theme.name === 'Dark';
  
  // Estado de hover
  const { hoveredSubject, handleNodeMouseEnter, handleNodeMouseLeave } = useHoverState();
  
  // Utilidades de mapa y nodos
  const { mapPosition, scale, containerEvents } = useMapControls();
  const { getNodeBorderColor, isSubjectEnabled } = useSubjectMapUtils({
    subjects, 
    hoveredSubject
  });
  
  // Etiquetas del mapa
  const { yearLabels, quarterLabels } = useMapLabels(subjects);
  
  // Acciones de nodos
  const { 
    handleNodePositionChange,
    handleStatusChange,
    handleGradeChange
  } = useSubjectActions({
    onPositionUpdate,
    onStatusChange,
    onGradeChange
  });
  
  // Menú contextual
  const {
    contextMenu,
    handleContextMenuOpen,
    handleContextMenuClose,
    getContextMenuActions
  } = useContextMenu(subjects, isSubjectEnabled);

  // Renderizar los nodos de materias
  const renderSubjectNodes = () => {
    return subjects.map(subject => {
      if (!subject.position) return null;
      
      const selected = hoveredSubject === subject.subjectid;
      const borderColor = getNodeBorderColor(subject);
      const criticalityScore = 0; // Implementar cálculo de criticidad

      return (
        <SubjectNodeComp
          key={subject.subjectid}
          subject={subject}
          isEnabled={!readOnly && isSubjectEnabled(subject)}
          onStatusChange={(status) => handleStatusChange(subject.subjectid, status)}
          onGradeChange={(grade) => handleGradeChange(subject.subjectid, grade)}
          onPositionChange={(pos, isDragging) => handleNodePositionChange(subject.subjectid, pos, isDragging)}
          borderColor={borderColor}
          criticalityScore={criticalityScore}
          theme={theme}
          isHighlighted={selected}
          onHover={() => handleNodeMouseEnter(subject.subjectid)}
          onHoverEnd={handleNodeMouseLeave}
          onContextMenu={(pos) => handleContextMenuOpen(subject.subjectid, pos)}
        />
      );
    });
  };

  return (
    <div 
      ref={mapContainerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden', 
        position: 'relative',
        backgroundColor: theme.bgColor
      }}
      {...containerEvents}
    >
      <div
        style={{
          transform: `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
          position: 'absolute'
        }}
      >
        {/* Etiquetas de año y cuatrimestre */}
        <MapLabels 
          yearLabels={yearLabels} 
          quarterLabels={quarterLabels} 
          theme={theme} 
        />
        
        {/* Flechas entre nodos */}
        <ArrowsRenderer 
          subjects={subjects} 
          hoveredSubject={hoveredSubject} 
          isDarkMode={isDarkMode} 
        />
        
        {/* Nodos de materias */}
        {renderSubjectNodes()}
      </div>

      {/* Menú contextual */}
      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          onClose={handleContextMenuClose}
          actions={getContextMenuActions(contextMenu.subjectId)}
          theme={theme}
        />
      )}
    </div>
  );
};

export default SubjectMap; 