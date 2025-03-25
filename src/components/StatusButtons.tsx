import React from 'react';

type StatusButtonsProps = {
  onStatusChange: (status: string) => void;
  disabled?: boolean;
  className?: string;
};

const StatusButtons: React.FC<StatusButtonsProps> = ({
  onStatusChange,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`flex space-x-1 ${className}`}>
      <button
        className="w-6 h-6 bg-yellow-500 rounded-full text-white font-bold text-xs flex items-center justify-center hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        onClick={() => onStatusChange('pending')}
        aria-label="Marcar como pendiente"
        disabled={disabled}
        data-testid="pending-button"
      >
        P
      </button>
      <button
        className="w-6 h-6 bg-blue-500 rounded-full text-white font-bold text-xs flex items-center justify-center hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => onStatusChange('in_progress')}
        aria-label="Marcar como cursando"
        disabled={disabled}
        data-testid="in-progress-button"
      >
        C
      </button>
      <button
        className="w-6 h-6 bg-green-500 rounded-full text-white font-bold text-xs flex items-center justify-center hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        onClick={() => onStatusChange('approved')}
        aria-label="Marcar como aprobada"
        disabled={disabled}
        data-testid="approved-button"
      >
        A
      </button>
    </div>
  );
};

export default StatusButtons; 