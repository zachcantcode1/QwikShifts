import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Role } from '@qwikshifts/core';

interface CreateShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startTime: string, endTime: string, roleId?: string) => void;
  employeeName?: string;
  dateStr?: string;
  roles?: Role[];
}

export function CreateShiftModal({ isOpen, onClose, onConfirm, employeeName, dateStr, roles = [] }: CreateShiftModalProps) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  useEffect(() => {
    if (isOpen && roles.length > 0) {
      setSelectedRoleId(roles[0].id);
    }
  }, [isOpen, roles]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(startTime, endTime, selectedRoleId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-lg border shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Create Shift</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4 text-sm text-muted-foreground">
          Assigning <span className="font-medium text-foreground">{employeeName}</span> to <span className="font-medium text-foreground">{dateStr}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {roles.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full p-2 rounded-md border bg-background"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
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
              Create Shift
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
