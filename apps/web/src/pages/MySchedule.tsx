import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ShiftWithAssignment, Area, Role } from '@qwikshifts/core';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { X } from 'lucide-react';

function calculateHours(start: string, end: string) {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let diff = (endH * 60 + endM) - (startH * 60 + startM);
  if (diff < 0) diff += 24 * 60;
  return (diff / 60).toFixed(1);
}

interface ShiftDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  shifts: ShiftWithAssignment[];
  areas: Area[];
  roles: Role[];
}

function ShiftDetailsModal({ isOpen, onClose, date, shifts, areas, roles }: ShiftDetailsModalProps) {
  if (!isOpen || !date) return null;

  const dateStr = format(date, 'yyyy-MM-dd');
  const dayShifts = shifts.filter((s) => s.date === dateStr);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-lg border shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {format(date, 'EEEE, MMMM d, yyyy')}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {dayShifts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No shifts scheduled for this day.
            </div>
          ) : (
            dayShifts.map((shift) => {
              const area = areas.find((a) => a.id === shift.areaId);
              const roleId = shift.assignment?.roleId;
              const role = roles.find((r) => r.id === roleId);
              const hours = calculateHours(shift.startTime, shift.endTime);

              return (
                <div key={shift.id} className="border rounded-lg p-4 bg-accent/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-medium">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: area?.color || 'gray' }} 
                      />
                      {area?.name || 'Unknown Area'}
                    </div>
                    <div className="text-sm font-medium bg-background px-2 py-1 rounded border">
                      {hours} hrs
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{shift.startTime} - {shift.endTime}</span>
                    </div>
                    {role && (
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <span className="px-2 py-0.5 rounded-full text-xs border" style={{ 
                          borderColor: role.color,
                          color: role.color,
                          backgroundColor: `${role.color}10`
                        }}>
                          {role.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function MySchedule() {
  const [shifts, setShifts] = useState<ShiftWithAssignment[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    api.getAreas().then(setAreas);
    api.getRoles().then(setRoles);
  }, []);

  useEffect(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    
    const from = format(start, 'yyyy-MM-dd');
    const to = format(end, 'yyyy-MM-dd');
    
    api.getMySchedule(from, to).then(setShifts);
  }, [currentDate]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">My Schedule</h2>
        <div className="flex items-center gap-2 border rounded-md bg-background">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-accent"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="px-4 font-medium min-w-[140px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-accent"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border border rounded-lg overflow-hidden">
        {weekDays.map((day) => (
          <div key={day} className="bg-muted/50 p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayShifts = shifts.filter((s) => s.date === dateStr);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          
          const totalHours = dayShifts.reduce((acc, shift) => {
            return acc + parseFloat(calculateHours(shift.startTime, shift.endTime));
          }, 0);

          let timeRange = null;
          if (dayShifts.length > 0) {
            const startTimes = dayShifts.map(s => s.startTime).sort();
            const endTimes = dayShifts.map(s => s.endTime).sort();
            timeRange = `${startTimes[0]} - ${endTimes[endTimes.length - 1]}`;
          }

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(day)}
              className={`
                min-h-[100px] p-2 text-left transition-colors hover:bg-accent/50 flex flex-col gap-1
                ${isCurrentMonth ? 'bg-card' : 'bg-muted/20 text-muted-foreground'}
                ${isToday ? 'ring-2 ring-primary ring-inset z-10' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </span>
                {dayShifts.length > 0 && (
                  <span className="text-xs font-medium text-muted-foreground">
                    {totalHours}h
                  </span>
                )}
              </div>
              
              {timeRange && (
                <div className="flex-1 flex items-center justify-center p-2 rounded-md bg-primary/10 border border-primary/20">
                  <span className="text-sm font-semibold text-primary">
                    {timeRange}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <ShiftDetailsModal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        date={selectedDate}
        shifts={shifts}
        areas={areas}
        roles={roles}
      />
    </div>
  );
}
