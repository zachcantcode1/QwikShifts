import { useDraggable } from '@dnd-kit/core';
import type { EmployeeWithRoles } from '@qwikshifts/core';

interface DraggableEmployeeProps {
  employee: EmployeeWithRoles;
  currentHours?: number;
  maxHours?: number;
  unavailable?: boolean;
  unavailableReason?: string;
}

export function DraggableEmployee({ employee, currentHours = 0, maxHours = 40, unavailable, unavailableReason }: DraggableEmployeeProps) {
  const limit = maxHours ?? 40;
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `emp-${employee.id}`,
    data: { type: 'employee', employee },
    disabled: unavailable,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const isOverLimit = currentHours > limit;
  const isNearLimit = currentHours > limit * 0.9; // 90% of limit

  let hoursColor = "text-muted-foreground";
  if (isOverLimit) hoursColor = "text-destructive font-bold";
  else if (isNearLimit) hoursColor = "text-yellow-600 dark:text-yellow-400 font-medium";

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes} 
      className={`p-2 border rounded-md bg-background hover:border-primary cursor-grab active:cursor-grabbing touch-none ${unavailable ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
      title={unavailable ? unavailableReason : undefined}
    >
      <div className="flex justify-between items-start">
        <div className="font-medium">{employee.user.name}</div>
        <div className={`text-xs ${hoursColor}`}>
          {currentHours.toFixed(1)} / {limit} hrs
        </div>
      </div>
      
      {unavailable ? (
        <div className="mt-1 text-xs text-destructive font-medium flex items-center gap-1">
          <span className="uppercase text-[10px] border border-destructive px-1 rounded">Off</span>
          <span className="truncate">{unavailableReason}</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1 mt-1">
          {employee.roles.map((role) => (
            <span key={role.id} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
              {role.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

