import { useState } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface RequestTimeOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  onConfirm: (data: { date: string; isFullDay: boolean; startTime?: string; endTime?: string; reason: string }) => void;
}

export function RequestTimeOffModal({ isOpen, onClose, date, onConfirm }: RequestTimeOffModalProps) {
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [reason, setReason] = useState('');

  if (!isOpen || !date) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      date: format(date, 'yyyy-MM-dd'),
      isFullDay,
      startTime: isFullDay ? undefined : startTime,
      endTime: isFullDay ? undefined : endTime,
      reason,
    });
    // Reset form
    setIsFullDay(true);
    setStartTime('09:00');
    setEndTime('17:00');
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-lg border shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Request Time Off</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4 text-sm text-muted-foreground">
          Requesting for <span className="font-medium text-foreground">{format(date, 'EEEE, MMMM d, yyyy')}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={isFullDay}
                onChange={() => setIsFullDay(true)}
                className="accent-primary"
              />
              <span>Full Day</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!isFullDay}
                onChange={() => setIsFullDay(false)}
                className="accent-primary"
              />
              <span>Partial Day</span>
            </label>
          </div>

          {!isFullDay && (
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
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 rounded-md border bg-background min-h-[100px]"
              placeholder="Why do you need time off?"
              required
            />
          </div>

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
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
