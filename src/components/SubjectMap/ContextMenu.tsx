import React from 'react';
import { Theme } from '../../types/theme';

interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  actions: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }>;
  theme: Theme;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ 
  position, 
  onClose, 
  actions,
  theme
}) => {
  const handleClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    onClose();
  };

  return (
    <>
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          zIndex: 998 
        }} 
        onClick={onClose}
      />
      <div 
        style={{
          position: 'absolute',
          top: position.y,
          left: position.x,
          backgroundColor: theme.cardBg,
          border: `1px solid #ccc`,
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          padding: '8px 0',
          zIndex: 999,
          minWidth: '160px'
        }}
      >
        {actions.map((action, index) => (
          <div
            key={index}
            onClick={(e) => !action.disabled && handleClick(e, action.onClick)}
            style={{
              padding: '8px 16px',
              cursor: action.disabled ? 'not-allowed' : 'pointer',
              opacity: action.disabled ? 0.5 : 1,
              color: theme.textColor,
              backgroundColor: theme.cardBg
            }}
            onMouseOver={(e) => {
              if (!action.disabled) {
                e.currentTarget.style.backgroundColor = theme.bgColor;
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = theme.cardBg;
            }}
          >
            {action.label}
          </div>
        ))}
      </div>
    </>
  );
};

export default ContextMenu; 