import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { TimeOffRequest } from '@qwikshifts/core';
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
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { RequestTimeOffModal } from '@/components/RequestTimeOffModal';

export function TimeOff() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchRequests = () => {
    api.getMyTimeOffRequests().then(setRequests);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequestSubmit = async (data: { date: string; isFullDay: boolean; startTime?: string; endTime?: string; reason: string }) => {
    try {
      await api.createTimeOffRequest(data);
      fetchRequests();
      setSelectedDate(null);
    } catch (error) {
      console.error('Failed to create request', error);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'rejected': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Request Time Off</h2>
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
          const dayRequests = requests.filter((r) => r.date === dateStr);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          
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
              <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                {format(day, 'd')}
              </span>
              
              <div className="flex flex-col gap-1 mt-1">
                {dayRequests.map((req) => (
                  <div 
                    key={req.id}
                    className={`text-[10px] px-1.5 py-1 rounded border truncate ${getStatusColor(req.status)}`}
                  >
                    <div className="font-medium capitalize">{req.status}</div>
                    <div className="flex items-center gap-1 opacity-80">
                      <Clock size={10} />
                      {req.isFullDay ? 'Full Day' : `${req.startTime}-${req.endTime}`}
                    </div>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <RequestTimeOffModal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        date={selectedDate}
        onConfirm={handleRequestSubmit}
      />
    </div>
  );
}
