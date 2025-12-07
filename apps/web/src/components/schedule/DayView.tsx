import { format } from 'date-fns';
import type { ShiftWithAssignment, Area, EmployeeWithRoles, StaffingRequirement, Role } from '@qwikshifts/core';
import { DroppableCell } from '@/components/DroppableCell';
import { DroppableShift } from '@/components/DroppableShift';

interface DayViewProps {
  currentDate: Date;
  areas: Area[];
  shifts: ShiftWithAssignment[];
  employees: EmployeeWithRoles[];
  requirements: StaffingRequirement[];
  roles: Role[];
  onEditShift: (shift: ShiftWithAssignment, employee?: EmployeeWithRoles) => void;
  onAreaClick: (areaId: string) => void;
}

export function DayView({ 
  currentDate, 
  areas, 
  shifts, 
  employees, 
  requirements, 
  roles,
  onEditShift,
  onAreaClick
}: DayViewProps) {
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const dayName = format(currentDate, 'EEEE').toLowerCase();

  return (
    <div className="flex-1 overflow-auto p-4">
      {areas.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <p className="text-lg font-medium">No areas found</p>
          <p className="text-sm">Create areas in the Settings or Onboarding to start scheduling.</p>
        </div>
      ) : (
      <div className="grid grid-cols-[200px_1fr] gap-4 min-w-[600px]">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 p-2 font-semibold text-lg border-b col-span-2">
          {format(currentDate, 'EEEE, MMMM do, yyyy')}
        </div>

        {/* Area Rows */}
        {areas.map((area) => {
          const dayShifts = shifts.filter(
            (s) => s.areaId === area.id && s.date === dateStr
          );

          // Calculate staffing status
          const areaReqs = requirements.filter(r => r.areaId === area.id && r.dayOfWeek === dayName);
          const status = areaReqs.map(req => {
            const role = roles.find(r => r.id === req.roleId);
            const assignedCount = dayShifts.filter(s => {
              const emp = employees.find(e => e.id === s.assignment?.employeeId);
              return emp?.roleIds.includes(req.roleId);
            }).length;
            return {
              roleName: role?.name || 'Unknown',
              roleColor: role?.color,
              required: req.count,
              assigned: assignedCount,
              met: assignedCount >= req.count
            };
          });

          const hasReqs = status.length > 0;

          return (
            <div key={area.id} className="contents">
              <div 
                className="font-medium py-4 border-b flex flex-col justify-center cursor-pointer hover:bg-accent/50 transition-colors px-2"
                onClick={() => onAreaClick(area.id)}
                title="View Hourly Timeline"
              >
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: area.color }} />
                  {area.name}
                </div>
                {hasReqs && (
                  <div className="text-xs space-y-1">
                    {status.map((s, i) => (
                      <div key={i} className={`flex items-center gap-1 ${s.met ? 'text-green-600 dark:text-green-400' : 'text-destructive font-medium'}`}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.roleColor }} />
                        <span>{s.roleName}: {s.assigned}/{s.required}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="border-b py-2">
                <DroppableCell areaId={area.id} date={dateStr} className="min-h-[120px] flex flex-wrap gap-2 content-start">
                  {dayShifts.map((shift) => {
                    const assignedEmp = employees.find(e => e.id === shift.assignment?.employeeId);
                    return (
                      <DroppableShift 
                        key={shift.id} 
                        shift={shift} 
                        assignedEmployee={assignedEmp}
                        onClick={() => onEditShift(shift, assignedEmp)}
                        className="w-48"
                      />
                    );
                  })}
                  {dayShifts.length === 0 && (
                    <div className="text-muted-foreground text-sm italic p-4 w-full text-center border-2 border-dashed rounded-lg">
                      Drop employees here to assign shifts
                    </div>
                  )}
                </DroppableCell>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
