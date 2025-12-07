import { format, startOfWeek, endOfWeek, addDays, subDays, isSameMonth, isSameDay, getWeek } from 'date-fns';
import type { ShiftWithAssignment, Area, StaffingRequirement, EmployeeWithRoles } from '@qwikshifts/core';
import { calculateDuration } from '@/lib/utils';

interface MonthViewProps {
  currentDate: Date;
  shifts: ShiftWithAssignment[];
  areas: Area[];
  requirements: StaffingRequirement[];
  employees: EmployeeWithRoles[];
  onDayClick: (date: Date) => void;
  onWeekClick: (date: Date) => void;
}

export function MonthView({ 
  currentDate, 
  shifts, 
  areas, 
  requirements, 
  employees, 
  onDayClick, 
  onWeekClick 
}: MonthViewProps) {
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = '';

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, 'd');
      const cloneDay = day;
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayShifts = shifts.filter(s => s.date === dateStr);
      
      // Calculate total hours
      const totalHours = dayShifts.reduce((acc, shift) => {
        return acc + calculateDuration(shift.startTime, shift.endTime);
      }, 0);

      // Check requirements
      const dayName = format(day, 'EEEE').toLowerCase();
      const activeAreaIds = areas.map(a => a.id);
      const dayReqs = requirements.filter(r => activeAreaIds.includes(r.areaId) && r.dayOfWeek === dayName);
      
      let isMissingRequirements = false;
      if (dayReqs.length > 0) {
          const allMet = dayReqs.every(req => {
             const relevantShifts = dayShifts.filter(s => s.areaId === req.areaId);
             const assignedCount = relevantShifts.filter(s => {
                 const emp = employees.find(e => e.id === s.assignment?.employeeId);
                 return emp?.roleIds.includes(req.roleId);
             }).length;
             return assignedCount >= req.count;
          });
          isMissingRequirements = !allMet;
      }
      
      days.push(
        <div
          key={day.toString()}
          className={`min-h-[100px] border p-2 cursor-pointer hover:bg-accent/50 transition-colors ${
            !isSameMonth(day, monthStart) ? 'text-muted-foreground bg-muted/20' : 'bg-card'
          } ${isSameDay(day, new Date()) ? 'border-primary' : ''} ${isMissingRequirements ? 'ring-2 ring-destructive ring-inset' : ''}`}
          onClick={() => onDayClick(cloneDay)}
        >
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm">{formattedDate}</span>
          </div>
          <div className="mt-2">
            {totalHours > 0 && (
              <div className="text-xs font-medium text-muted-foreground bg-accent/50 rounded px-1.5 py-0.5 inline-block">
                {totalHours.toFixed(1)} Hrs
              </div>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    
    const weekStartForRow = subDays(day, 7);
    rows.push(
      <div key={day.toString()} className="grid grid-cols-[40px_repeat(7,1fr)] gap-0">
        <div 
          className="flex items-center justify-center border-r border-b bg-muted/30 text-xs font-medium text-muted-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
          onClick={() => onWeekClick(weekStartForRow)}
          title="View Week"
        >
          W{getWeek(weekStartForRow)}
        </div>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="grid grid-cols-[40px_repeat(7,1fr)] border-b bg-muted/50">
        <div className="p-2"></div>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="p-2 text-center font-medium text-sm text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="flex-1">
        {rows}
      </div>
    </div>
  );
}
