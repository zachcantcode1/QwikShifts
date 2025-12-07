import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import type { Area, EmployeeWithRoles, ShiftWithAssignment, StaffingRequirement, Role, TimeOffRequestWithEmployee, Location } from '@qwikshifts/core';
import { format, startOfWeek, endOfWeek, addDays, subDays, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Filter, Calendar as CalendarIcon, LayoutGrid, List, MapPin } from 'lucide-react';
import { DndContext, type DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { DraggableEmployee } from '@/components/DraggableEmployee';
import { DroppableShift } from '@/components/DroppableShift';
import { DroppableCell } from '@/components/DroppableCell';
import { CreateShiftModal } from '@/components/CreateShiftModal';
import { EditShiftModal } from '@/components/EditShiftModal';
import { MonthView } from '@/components/schedule/MonthView';
import { DayView } from '@/components/schedule/DayView';
import { AreaHourlyView } from '@/components/schedule/AreaHourlyView';
import { RoleSelectionModal } from '@/components/RoleSelectionModal';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

const calculateDuration = (start: string, end: string) => {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  return (endH + endM / 60) - (startH + startM / 60);
};

export function ScheduleBoard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [areas, setAreas] = useState<Area[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithRoles[]>([]);
  const [shifts, setShifts] = useState<ShiftWithAssignment[]>([]);
  const [requirements, setRequirements] = useState<StaffingRequirement[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequestWithEmployee[]>([]);
  const [activeEmployee, setActiveEmployee] = useState<EmployeeWithRoles | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [roles, setRoles] = useState<Role[]>([]);
  const [hourlyViewAreaId, setHourlyViewAreaId] = useState<string | null>(null);
  
  // Modal State
  
  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRoleSelectionModalOpen, setIsRoleSelectionModalOpen] = useState(false);
  const [pendingRoleAssignment, setPendingRoleAssignment] = useState<{
    employee: EmployeeWithRoles;
    shiftId: string;
  } | null>(null);
  const [pendingAssignment, setPendingAssignment] = useState<{
    employee: EmployeeWithRoles;
    areaId: string;
    date: string;
  } | null>(null);
  const [editingShift, setEditingShift] = useState<{
    shift: ShiftWithAssignment;
    assignedEmployee?: EmployeeWithRoles;
  } | null>(null);

  useEffect(() => {
    if (!isLoading && user && user.role !== 'manager') {
      navigate('/my-schedule');
    }
  }, [user, isLoading, navigate]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const fetchSchedule = () => {
    if (!selectedLocationId) return;

    let from, to;
    
    if (viewMode === 'month') {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      // Fetch a bit more to cover leading/trailing days in grid
      from = format(startOfWeek(start, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      to = format(endOfWeek(end, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    } else if (viewMode === 'week') {
      from = format(weekStart, 'yyyy-MM-dd');
      to = format(weekEnd, 'yyyy-MM-dd');
    } else {
      // Day view
      from = format(currentDate, 'yyyy-MM-dd');
      to = format(currentDate, 'yyyy-MM-dd');
    }
    
    api.getSchedule(from, to, selectedLocationId).then(setShifts);
  };

  useEffect(() => {
    api.getLocations().then((locs) => {
      setLocations(locs);
      if (locs.length > 0) {
        setSelectedLocationId(locs[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedLocationId) {
      api.getAreas(selectedLocationId).then(setAreas);
      api.getEmployees(selectedLocationId).then(setEmployees);
      api.getRequirements(undefined, selectedLocationId).then(setRequirements);
      api.getRoles().then(setRoles);
      api.getTimeOffRequests().then(setTimeOffRequests);
    }
  }, [selectedLocationId]);

  useEffect(() => {
    fetchSchedule();
  }, [currentDate, viewMode, selectedLocationId]);

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(direction === 'prev' ? subDays(currentDate, 7) : addDays(currentDate, 7));
    } else {
      setCurrentDate(direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1));
    }
  };

  const getDateLabel = () => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy');
    if (viewMode === 'week') return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    return format(currentDate, 'MMMM do, yyyy');
  };

  const handleDragStart = (event: any) => {
    if (event.active.data.current?.type === 'employee') {
      setActiveEmployee(event.active.data.current.employee);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEmployee(null);

    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'employee' && overType === 'shift') {
      const employee = active.data.current?.employee as EmployeeWithRoles;
      const shift = over.data.current?.shift as ShiftWithAssignment;

      // If employee has multiple roles, ask which one
      if (employee.roleIds.length > 1) {
        setPendingRoleAssignment({ employee, shiftId: shift.id });
        setIsRoleSelectionModalOpen(true);
        return;
      }

      // Otherwise assign default (first) role
      try {
        const roleId = employee.roleIds[0];
        await api.assignEmployee(shift.id, employee.id, roleId);
        fetchSchedule();
      } catch (error) {
        console.error('Failed to assign employee', error);
      }
    } else if (activeType === 'employee' && overType === 'cell') {
      const employee = active.data.current?.employee as EmployeeWithRoles;
      const { areaId, date } = over.data.current as { areaId: string; date: string };
      
      setPendingAssignment({ employee, areaId, date });
      setIsCreateModalOpen(true);
    }
  };

  const handleCreateShift = async (startTime: string, endTime: string, roleId?: string) => {
    if (!pendingAssignment) return;

    // Check for time off conflicts
    const conflict = timeOffRequests.find(req => 
      req.employeeId === pendingAssignment.employee.id && 
      req.date === pendingAssignment.date && 
      req.status === 'approved'
    );

    if (conflict) {
      const isFullDay = conflict.isFullDay;
      const conflictTime = isFullDay ? 'Full Day' : `${conflict.startTime}-${conflict.endTime}`;
      const confirmed = window.confirm(
        `Warning: ${pendingAssignment.employee.user.name} has approved time off on this day (${conflictTime}).\nReason: ${conflict.reason}\n\nDo you still want to schedule this shift?`
      );
      if (!confirmed) {
        setIsCreateModalOpen(false);
        setPendingAssignment(null);
        return;
      }
    }

    try {
      await api.createShift({
        areaId: pendingAssignment.areaId,
        date: pendingAssignment.date,
        startTime,
        endTime,
        employeeId: pendingAssignment.employee.id,
        roleId,
        locationId: selectedLocationId,
      });
      fetchSchedule();
    } catch (error) {
      console.error('Failed to create shift', error);
    } finally {
      setIsCreateModalOpen(false);
      setPendingAssignment(null);
    }
  };

  const handleEditShift = async (shiftId: string, startTime: string, endTime: string, roleId?: string) => {
    try {
      await api.updateShift(shiftId, { startTime, endTime });
      if (roleId && editingShift?.assignedEmployee) {
        await api.assignEmployee(shiftId, editingShift.assignedEmployee.id, roleId);
      }
      fetchSchedule();
    } catch (error) {
      console.error('Failed to update shift', error);
    } finally {
      setIsEditModalOpen(false);
      setEditingShift(null);
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      await api.deleteShift(shiftId);
      fetchSchedule();
    } catch (error) {
      console.error('Failed to delete shift', error);
    } finally {
      setIsEditModalOpen(false);
      setEditingShift(null);
    }
  };

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const filteredAreas = selectedAreaId === 'all' 
    ? areas 
    : areas.filter(a => a.id === selectedAreaId);

  const employeeHours = useMemo(() => {
    const hours: Record<string, number> = {};
    shifts.forEach(shift => {
      if (shift.assignment?.employeeId) {
        const duration = calculateDuration(shift.startTime, shift.endTime);
        hours[shift.assignment.employeeId] = (hours[shift.assignment.employeeId] || 0) + duration;
      }
    });
    return hours;
  }, [shifts]);

  const employeeAvailability = useMemo(() => {
    const availability: Record<string, { unavailable: boolean; reason?: string }> = {};
    
    if (viewMode === 'day') {
       const dateStr = format(currentDate, 'yyyy-MM-dd');
       employees.forEach(emp => {
         const req = timeOffRequests.find(r => 
           r.employeeId === emp.id && 
           r.status === 'approved' && 
           r.date === dateStr
         );
         if (req) {
           availability[emp.id] = {
             unavailable: true,
             reason: req.isFullDay ? 'Full Day Off' : `Off: ${req.startTime}-${req.endTime}`
           };
         }
       });
    }
    
    return availability;
  }, [viewMode, currentDate, timeOffRequests, employees]);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold tracking-tight">Schedule</h2>

            {/* Location Selector */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <select
                  className="bg-background border border-input rounded-md pl-8 pr-3 py-1.5 text-sm min-w-[180px] focus:ring-2 focus:ring-ring focus:outline-none transition-shadow"
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                >
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="h-6 w-px bg-border mx-2" />

            {/* View Switcher */}
            <div className="flex bg-secondary/50 p-1 rounded-lg border border-border/50">
              <button 
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'month' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
              >
                <CalendarIcon size={14} /> Month
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'week' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
              >
                <LayoutGrid size={14} /> Week
              </button>
              <button 
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'day' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
              >
                <List size={14} /> Day
              </button>
            </div>

            <div className="flex items-center gap-1 bg-background border border-input rounded-md p-0.5 shadow-sm ml-4">
              <button
                onClick={() => handleNavigate('prev')}
                className="p-1.5 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 font-medium min-w-[140px] text-center text-sm">
                {getDateLabel()}
              </span>
              <button
                onClick={() => handleNavigate('next')}
                className="p-1.5 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <div className="relative">
                <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <select 
                  className="bg-background border border-input rounded-md pl-8 pr-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none transition-shadow"
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                >
                  <option value="all">All Areas</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          {/* Board */}
          {hourlyViewAreaId ? (
             (() => {
               const area = areas.find(a => a.id === hourlyViewAreaId);
               if (!area) return null;
               const dateStr = format(currentDate, 'yyyy-MM-dd');
               const areaShifts = shifts.filter(s => s.areaId === area.id && s.date === dateStr);
               
               return (
                 <div className="flex-1 overflow-hidden">
                   <AreaHourlyView
                     date={currentDate}
                     area={area}
                     shifts={areaShifts}
                     employees={employees}
                     onClose={() => setHourlyViewAreaId(null)}
                   />
                 </div>
               );
             })()
          ) : (
            <>
          {viewMode === 'month' && (
            <div className="flex-1 p-4 overflow-hidden">
              <MonthView 
                currentDate={currentDate} 
                shifts={shifts}
                areas={filteredAreas}
                requirements={requirements}
                employees={employees}
                onDayClick={(date) => {
                  setCurrentDate(date);
                  setViewMode('day');
                }}
                onWeekClick={(date) => {
                  setCurrentDate(date);
                  setViewMode('week');
                }}
              />
            </div>
          )}

          {viewMode === 'day' && (
            <DayView 
              currentDate={currentDate}
              areas={filteredAreas}
              shifts={shifts}
              employees={employees}
              requirements={requirements}
              roles={roles}
              onEditShift={(shift, emp) => {
                setEditingShift({ shift, assignedEmployee: emp });
                setIsEditModalOpen(true);
              }}
              onAreaClick={(areaId) => setHourlyViewAreaId(areaId)}
            />
          )}

          {viewMode === 'week' && (
          <div className="flex-1 overflow-auto p-4">
            {filteredAreas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p className="text-lg font-medium">No areas found</p>
                <p className="text-sm">Create areas in the Settings or Onboarding to start scheduling.</p>
              </div>
            ) : (
            <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-4 min-w-[1000px]">
              {/* Header Row */}
              <div className="sticky top-0 bg-background z-10"></div>
              {days.map((day) => (
                <div key={day.toString()} className="text-center font-medium p-2 border-b sticky top-0 bg-background z-10">
                  <div>{format(day, 'EEE')}</div>
                  <div className="text-sm text-muted-foreground">{format(day, 'd')}</div>
                </div>
              ))}

              {/* Area Rows */}
              {filteredAreas.map((area) => (
                <>
                  <div key={area.id} className="font-medium py-4 sticky left-0 bg-background z-10 flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: area.color }} />
                    {area.name}
                  </div>
                  {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayName = format(day, 'EEEE').toLowerCase();
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

                    const allMet = status.every(s => s.met);
                    const hasReqs = status.length > 0;

                    return (
                      <DroppableCell key={`${area.id}-${dateStr}`} areaId={area.id} date={dateStr}>
                        {hasReqs && (
                          <div className={`mb-2 text-xs p-1 rounded border flex flex-wrap gap-1 ${allMet ? 'bg-green-500/10 border-green-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
                            {status.map((s, i) => (
                              <span key={i} className={`px-1 rounded ${s.met ? 'text-green-600 dark:text-green-400' : 'text-destructive font-bold'}`}>
                                {s.roleName}: {s.assigned}/{s.required}
                              </span>
                            ))}
                          </div>
                        )}
                        {dayShifts.map((shift) => {
                          const assignedEmp = employees.find(e => e.id === shift.assignment?.employeeId);
                          return (
                            <DroppableShift 
                              key={shift.id} 
                              shift={shift} 
                              assignedEmployee={assignedEmp}
                              onClick={() => {
                                setEditingShift({ shift, assignedEmployee: assignedEmp });
                                setIsEditModalOpen(true);
                              }}
                            />
                          );
                        })}
                      </DroppableCell>
                    );
                  })}
                </>
              ))}
            </div>
            )}
          </div>
          )}
            </>
          )}

          {/* Employee Sidebar */}
          {!hourlyViewAreaId && viewMode !== 'month' && (
          <div className="w-64 border-l bg-card p-4 overflow-auto">
            <h3 className="font-semibold mb-4">Employees</h3>
            <div className="space-y-2">
              {employees.map((emp) => (
                <DraggableEmployee 
                  key={emp.id} 
                  employee={emp} 
                  currentHours={employeeHours[emp.id]}
                  maxHours={emp.weeklyHoursLimit}
                  unavailable={employeeAvailability[emp.id]?.unavailable}
                  unavailableReason={employeeAvailability[emp.id]?.reason}
                />
              ))}
            </div>
          </div>
          )}
        </div>
      </div>
      <DragOverlay>
        {activeEmployee ? (
           <div className="p-2 border rounded-md bg-background shadow-lg opacity-80 w-48">
             <div className="font-medium">{activeEmployee.user.name}</div>
           </div>
        ) : null}
      </DragOverlay>
      <CreateShiftModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setPendingAssignment(null);
        }}
        onConfirm={handleCreateShift}
        employeeName={pendingAssignment?.employee.user.name}
        dateStr={pendingAssignment?.date}
        roles={pendingAssignment?.employee.roles || []}
      />

      <EditShiftModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingShift(null);
        }}
        onSave={handleEditShift}
        onDelete={handleDeleteShift}
        shift={editingShift?.shift || null}
        assignedEmployee={editingShift?.assignedEmployee}
        roles={roles}
      />

      <RoleSelectionModal
        isOpen={isRoleSelectionModalOpen}
        onClose={() => {
          setIsRoleSelectionModalOpen(false);
          setPendingRoleAssignment(null);
        }}
        onConfirm={async (roleId) => {
          if (pendingRoleAssignment) {
            try {
              await api.assignEmployee(pendingRoleAssignment.shiftId, pendingRoleAssignment.employee.id, roleId);
              fetchSchedule();
              setIsRoleSelectionModalOpen(false);
              setPendingRoleAssignment(null);
            } catch (error) {
              console.error('Failed to assign employee with role', error);
            }
          }
        }}
        employee={pendingRoleAssignment?.employee || null}
        roles={roles}
      />
    </DndContext>
  );
}
