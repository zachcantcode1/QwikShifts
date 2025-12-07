import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableCellProps {
  areaId: string;
  date: string;
  children: React.ReactNode;
  className?: string;
}

export function DroppableCell({ areaId, date, children, className }: DroppableCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${areaId}-${date}`,
    data: { 
      type: 'cell', 
      areaId, 
      date 
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] border rounded-md p-2 space-y-2 transition-colors",
        isOver ? "bg-accent/50 border-primary" : "bg-accent/20",
        className
      )}
    >
      {children}
    </div>
  );
}
