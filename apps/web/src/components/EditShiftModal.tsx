import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ShiftWithAssignment, EmployeeWithRoles, Role } from '@qwikshifts/core';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EditShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shiftId: string, startTime: string, endTime: string, roleId?: string) => void;
  onDelete: (shiftId: string) => void;
  shift: ShiftWithAssignment | null;
  assignedEmployee?: EmployeeWithRoles;
  roles?: Role[];
}

export function EditShiftModal({ isOpen, onClose, onSave, onDelete, shift, assignedEmployee, roles = [] }: EditShiftModalProps) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  useEffect(() => {
    if (shift) {
      setStartTime(shift.startTime);
      setEndTime(shift.endTime);
      if (shift.assignment?.roleId) {
        setSelectedRoleId(shift.assignment.roleId);
      } else if (assignedEmployee && assignedEmployee.roleIds.length > 0) {
        setSelectedRoleId(assignedEmployee.roleIds[0]);
      }
    }
  }, [shift, assignedEmployee]);

  if (!isOpen || !shift) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(shift.id, startTime, endTime, selectedRoleId);
  };

  const employeeRoles = assignedEmployee ? roles.filter(r => assignedEmployee.roleIds.includes(r.id)) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-lg border shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Edit Shift</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4 text-sm text-muted-foreground">
          {assignedEmployee ? (
            <>Assigned to <span className="font-medium text-foreground">{assignedEmployee.user.name}</span></>
          ) : (
            <span className="italic">Unassigned</span>
          )}
          {' '}on <span className="font-medium text-foreground">{shift.date}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {assignedEmployee && employeeRoles.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Assigned Role</label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full p-2 rounded-md border bg-background"
              >
                {employeeRoles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 rounded-md border bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2 rounded-md border bg-background"
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  Delete Shift
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the shift.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(shift.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
