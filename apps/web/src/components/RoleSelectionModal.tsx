import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { EmployeeWithRoles, Role } from '@qwikshifts/core';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (roleId: string) => void;
  employee: EmployeeWithRoles | null;
  roles: Role[];
}

export function RoleSelectionModal({ isOpen, onClose, onConfirm, employee, roles }: RoleSelectionModalProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  useEffect(() => {
    if (isOpen && employee) {
      // Default to first role if available
      if (employee.roleIds.length > 0) {
        setSelectedRoleId(employee.roleIds[0]);
      }
    }
  }, [isOpen, employee]);

  if (!isOpen || !employee) return null;

  const employeeRoles = roles.filter(r => employee.roleIds.includes(r.id));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Select Role for {employee.user.name}</h2>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This employee has multiple roles. Please select the role they will be performing for this shift.
          </p>

          <div className="space-y-2">
            {employeeRoles.map(role => (
              <label 
                key={role.id} 
                className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                  selectedRoleId === role.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.id}
                  checked={selectedRoleId === role.id}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="mr-3"
                />
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                  <span className="font-medium">{role.name}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selectedRoleId)}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
              disabled={!selectedRoleId}
            >
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
