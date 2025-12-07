import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { TimeOffRequestWithEmployee } from '@qwikshifts/core';
import { format } from 'date-fns';
import { Check, X, Clock, Calendar } from 'lucide-react';

export function TimeOffRequests() {
  const [requests, setRequests] = useState<TimeOffRequestWithEmployee[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequestWithEmployee | null>(null);

  const fetchRequests = () => {
    api.getTimeOffRequests().then(setRequests);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.updateTimeOffStatus(id, status);
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'rejected': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <h2 className="text-2xl font-bold mb-6">Time Off Requests</h2>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No time off requests found.
          </div>
        ) : (
          requests.map((req) => (
            <div 
              key={req.id} 
              className="border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => setSelectedRequest(req)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-lg">{req.employee.user.name}</div>
                <div className={`px-2 py-1 rounded text-xs font-medium border capitalize ${getStatusColor(req.status)}`}>
                  {req.status}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  {format(new Date(req.date), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  {req.isFullDay ? 'Full Day' : `${req.startTime} - ${req.endTime}`}
                </div>
              </div>

              <div className="text-sm bg-muted/50 p-2 rounded">
                {req.reason}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card text-card-foreground w-full max-w-md rounded-lg border shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Review Request</h2>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employee</label>
                <div className="text-lg font-medium">{selectedRequest.employee.user.name}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <div>{format(new Date(selectedRequest.date), 'MMM d, yyyy')}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Time</label>
                  <div>{selectedRequest.isFullDay ? 'Full Day' : `${selectedRequest.startTime} - ${selectedRequest.endTime}`}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason</label>
                <div className="bg-muted/50 p-3 rounded-md mt-1">
                  {selectedRequest.reason}
                </div>
              </div>
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                >
                  <X size={18} />
                  Deny
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedRequest.id, 'approved')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Check size={18} />
                  Accept
                </button>
              </div>
            )}
            
            {selectedRequest.status !== 'pending' && (
              <div className="text-center text-muted-foreground text-sm">
                This request has already been {selectedRequest.status}.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
