// Reusable edit-mode wrapper: drag-to-reorder + optional delete. Used app-wide.
import { useState, type CSSProperties, type ReactNode } from 'react';
import { T } from '../design/tokens';
import { Icon } from './Icon';
import { haptic } from './ui';

export function EditWrap({
  group,
  idx,
  onReorder,
  onDelete,
  children,
  style,
}: {
  group: string;
  idx: number;
  onReorder: (from: number, to: number) => void;
  onDelete?: () => void;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData(group, String(idx));
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        const from = e.dataTransfer.getData(group);
        if (from !== '') onReorder(parseInt(from), idx);
      }}
      style={{
        position: 'relative',
        cursor: 'grab',
        borderRadius: 18,
        outline: over ? `2px solid ${T.lime}` : 'none',
        outlineOffset: 2,
        ...style,
      }}
    >
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            haptic();
            onDelete();
          }}
          style={{
            position: 'absolute',
            top: -9,
            right: -9,
            zIndex: 5,
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: T.error,
            border: `2px solid ${T.bg}`,
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="minus" size={16} />
        </button>
      )}
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: 6,
          zIndex: 5,
          width: 24,
          height: 24,
          borderRadius: 8,
          background: 'rgba(26,26,46,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <Icon name="drag" size={15} color={T.aiViolet} />
      </div>
      <div style={{ pointerEvents: 'none' }}>{children}</div>
    </div>
  );
}
