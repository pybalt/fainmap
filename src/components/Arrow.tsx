import React from 'react';

interface ArrowProps {
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Arrow component for rendering connections between nodes
 */
const Arrow: React.FC<ArrowProps> = (props) => {
  const { 
    start, 
    end, 
    fromX, 
    fromY, 
    toX, 
    toY, 
    color = '#CBD5E0', 
    strokeWidth = 2 
  } = props;
  
  // Support both property styles for backwards compatibility
  const startX = start?.x || fromX || 0;
  const startY = start?.y || fromY || 0;
  const endX = end?.x || toX || 0;
  const endY = end?.y || toY || 0;
  
  // Calculate path
  const path = `M ${startX} ${startY} L ${endX} ${endY}`;
  
  // Calculate arrowhead direction
  const dx = endX - startX;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dx);
  
  // Arrowhead coordinates
  const arrowSize = 8;
  const arrowPath = `M ${endX} ${endY} L ${endX - arrowSize * Math.cos(angle - Math.PI / 6)} ${endY - arrowSize * Math.sin(angle - Math.PI / 6)} L ${endX - arrowSize * Math.cos(angle + Math.PI / 6)} ${endY - arrowSize * Math.sin(angle + Math.PI / 6)} Z`;
  
  return (
    <svg 
      style={{
        position: 'absolute',
        top: '0px',
        left: '0px',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    >
      <path 
        d={path} 
        stroke={color} 
        strokeWidth={strokeWidth} 
        fill="none" 
      />
      <path 
        d={arrowPath} 
        fill={color} 
      />
    </svg>
  );
};

export default Arrow; 