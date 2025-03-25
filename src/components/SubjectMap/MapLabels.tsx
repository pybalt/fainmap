import React from 'react';
import type { Theme } from '../../types/theme';

interface YearLabel {
  year: number;
  x: number;
  y: number;
}

interface QuarterLabel {
  year: number;
  quarter: number;
  x: number;
  y: number;
}

interface MapLabelsProps {
  yearLabels: YearLabel[];
  quarterLabels: QuarterLabel[];
  theme: Theme;
}

const MapLabels: React.FC<MapLabelsProps> = ({ yearLabels, quarterLabels, theme }) => {
  return (
    <>
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
          className={theme.textColor}
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
          className={theme.secondaryText}
        >
          Cuatrimestre {label.quarter}
        </div>
      ))}
    </>
  );
};

export default MapLabels; 