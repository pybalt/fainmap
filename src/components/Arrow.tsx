import React from 'react';

interface ArrowProps {
  start: { x: number; y: number };
  end: { x: number; y: number };
  color?: string;
}

const Arrow: React.FC<ArrowProps> = ({ start, end, color = '#CBD5E0' }) => {
  // Calcular el punto medio para la curva
  const midX = (start.x + end.x) / 2;

  // Crear el path para la flecha
  const path = `
    M ${start.x} ${start.y}
    C ${midX} ${start.y},
      ${midX} ${end.y},
      ${end.x} ${end.y}
  `;

  // Calcular el ángulo para la punta de la flecha
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const arrowLength = 10;

  const arrowHead = `
    M ${end.x} ${end.y}
    L ${end.x - arrowLength * Math.cos(angle - Math.PI/6)} ${end.y - arrowLength * Math.sin(angle - Math.PI/6)}
    L ${end.x - arrowLength * Math.cos(angle + Math.PI/6)} ${end.y - arrowLength * Math.sin(angle + Math.PI/6)}
    Z
  `;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
      <path
        d={arrowHead}
        fill={color}
      />
    </svg>
  );
};

export default Arrow; 