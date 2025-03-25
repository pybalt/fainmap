import React from 'react';

interface StatusButtonsProps {
  currentStatus: 'pending' | 'in_progress' | 'approved';
  isEnabled: boolean;
  onStatusChange: (status: 'pending' | 'in_progress' | 'approved') => void;
  onGradeClick: () => void;
}

const StatusButtons: React.FC<StatusButtonsProps> = ({
  currentStatus,
  isEnabled,
  onStatusChange,
  onGradeClick
}) => {
  return (
    <div className="flex space-x-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStatusChange('pending');
        }}
        className={`text-xs px-1 py-0.5 rounded ${
          currentStatus === 'pending'
            ? 'bg-gray-200 text-gray-700'
            : 'hover:bg-gray-100 text-gray-500'
        }`}
        title="Marcar como pendiente"
        disabled={!isEnabled}
      >
        <span className="sr-only">P</span>
        <span aria-hidden="true">⚪</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStatusChange('in_progress');
        }}
        className={`text-xs px-1 py-0.5 rounded ${
          currentStatus === 'in_progress'
            ? 'bg-yellow-200 text-yellow-700'
            : 'hover:bg-gray-100 text-gray-500'
        }`}
        title="Marcar como en curso"
        disabled={!isEnabled}
      >
        <span className="sr-only">C</span>
        <span aria-hidden="true">🟡</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onGradeClick();
        }}
        className={`text-xs px-1 py-0.5 rounded ${
          currentStatus === 'approved'
            ? 'bg-green-200 text-green-700'
            : 'hover:bg-gray-100 text-gray-500'
        }`}
        title="Marcar como aprobada"
        disabled={!isEnabled}
      >
        <span className="sr-only">A</span>
        <span aria-hidden="true">✅</span>
      </button>
    </div>
  );
};

export default StatusButtons; 