import { Edit, GripVertical } from 'lucide-react';
import { useState } from 'react';
import { SECTION_BG, SECTION_COLORS } from './constants';
import type { MemberData, SectionType } from './types';
import { imgUrl, initials } from './utils';

interface CardProps {
  member: MemberData;
  sectionKey: SectionType;
  index: number;
  onEdit: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
}

const MemberCard = ({
  member,
  sectionKey,
  onEdit,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
  isDragOver,
}: CardProps) => {
  const color = SECTION_COLORS[sectionKey];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      draggable
      onClick={onEdit}
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e);
      }}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2.5 p-2.5 rounded-lg cursor-grab transition-colors duration-150 select-none border-l-[3px]"
      style={{
        borderLeftColor: color,
        background: hovered ? SECTION_BG[sectionKey] : '#fff',
        opacity: isDragOver ? 0.5 : 1,
        outline: isDragOver ? `2px dashed ${color}` : 'none',
      }}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {member.imageFilename ? (
          <img
            src={imgUrl(member.imageFilename)}
            alt={member.name}
            className="w-9.5 h-9.5 rounded-full object-cover block"
            style={{ boxShadow: `0 0 0 2px ${color}` }}
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              const next = el.nextElementSibling as HTMLElement;
              if (next) next.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="w-9.5 h-9.5 rounded-full items-center justify-center font-bold text-sm flex"
          style={{
            background: SECTION_BG[sectionKey],
            color,
            display: member.imageFilename ? 'none' : 'flex',
            boxShadow: `0 0 0 2px ${color}`,
          }}
        >
          {initials(member.name)}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
          {member.name}
        </div>
        <div
          className="text-xs mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ color }}
        >
          {member.role || '—'}
        </div>
      </div>

      {/* Drag handle */}
      <div className="flex gap-1 shrink-0">
        <span
          className="text-gray-400 cursor-grab text-base py-0 px-0.5"
          title="Trascina"
        >
          <GripVertical size={16} />
        </span>
        <span
          className="text-gray-400 cursor-pointer text-base py-0 px-0.5"
          title="Modifica"
        >
          <Edit size={16} />
        </span>
      </div>
    </div>
  );
};

export default MemberCard;
