import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  options: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    confirm?: boolean;
    color?: string; // e.g. 'red' for delete
  }[];
}

export default function ContextMenu({ x, y, onClose, options }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        minWidth: '150px',
        padding: '4px 0',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((option, index) => (
        <div
          key={index}
          className="context-menu-item"
          onClick={() => {
            if (option.confirm && !window.confirm('Вы уверены?')) return;
            option.onClick();
            onClose();
          }}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: option.color || 'inherit',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {option.icon}
          {option.label}
        </div>
      ))}
    </div>
  );
}
