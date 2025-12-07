import { format } from 'date-fns';
import type { ShiftWithAssignment, Area, EmployeeWithRoles } from '@qwikshifts/core';
import { calculateDuration } from '@/lib/utils';
import { X, User } from 'lucide-react';

interface AreaHourlyViewProps {
  date: Date;
  area: Area;
  shifts: ShiftWithAssignment[];
  employees: EmployeeWithRoles[];
  onClose: () => void;
}

export function AreaHourlyView({ date, area, shifts, employees, onClose }: AreaHourlyViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourHeight = 60; // px per hour

  const getTop = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return (h + m / 60) * hourHeight;
  };

  const getHeight = (start: string, end: string) => {
    const duration = calculateDuration(start, end);
    return duration * hourHeight;
  };

  // Simple overlap detection to offset shifts
  // This is a naive implementation, for a robust one we'd need a proper layout algorithm
  const shiftsWithLayout = shifts.map(shift => {
    const overlapping = shifts.filter(s => s.id !== shift.id && 
      ((s.startTime >= shift.startTime && s.startTime < shift.endTime) ||
       (s.endTime > shift.startTime && s.endTime <= shift.endTime) ||
       (s.startTime <= shift.startTime && s.endTime >= shift.endTime))
    );
    
    // Determine column index based on start time order among overlapping
    const index = overlapping.filter(s => s.startTime < shift.startTime || (s.startTime === shift.startTime && s.id < shift.id)).length;
    const total = overlapping.length + 1;
    
    return { ...shift, layoutIndex: index, layoutTotal: total };
  });

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: area.color }} />
            {area.name} - Hourly View
          </h2>
          <p className="text-muted-foreground">{format(date, 'EEEE, MMMM do, yyyy')}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-accent rounded-full">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-auto relative">
        <div className="relative min-h-[1440px]" style={{ height: 24 * hourHeight }}>
          {/* Grid Lines */}
          {hours.map(hour => (
            <div 
              key={hour} 
              className="absolute w-full border-t border-dashed border-muted-foreground/20 flex items-center"
              style={{ top: hour * hourHeight, height: hourHeight }}
            >
              <span className="absolute -top-3 left-2 text-xs text-muted-foreground bg-background px-1">
                {format(new Date().setHours(hour, 0), 'h a')}
              </span>
            </div>
          ))}

          {/* Shifts */}
          {shiftsWithLayout.map(shift => {
            const assignedEmp = employees.find(e => e.id === shift.assignment?.employeeId);
            const width = `calc((100% - 60px) / ${shift.layoutTotal})`;
            const left = `calc(50px + (${width} * ${shift.layoutIndex}))`;

            return (
              <div
                key={shift.id}
                className="absolute rounded border bg-card p-2 shadow-sm hover:z-10 hover:shadow-md transition-all overflow-hidden"
                style={{
                  top: getTop(shift.startTime),
                  height: getHeight(shift.startTime, shift.endTime),
                  left,
                  width: `calc(${width} - 8px)`, // Gap
                  borderColor: area.color
                }}
              >
                <div className="font-medium text-sm">
                  {shift.startTime} - {shift.endTime}
                </div>
                {assignedEmp ? (
                  <div className="mt-1">
                    <div className="flex items-center gap-1 text-xs">
                      <User size={12} />
                      {assignedEmp.user.name}
                    </div>
                    {shift.assignment?.roleId && assignedEmp.roles && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {assignedEmp.roles.find(r => r.id === shift.assignment?.roleId)?.name}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic mt-1">Unassigned</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
