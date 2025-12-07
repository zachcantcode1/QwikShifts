import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ScheduleBoard } from '@/pages/ScheduleBoard';
import { MySchedule } from '@/pages/MySchedule';
import { TimeOff } from '@/pages/TimeOff';
import { TimeOffRequests } from '@/pages/TimeOffRequests';
import { Employees } from '@/pages/Employees';
import { Settings } from '@/pages/Settings';
import Onboarding from '@/pages/Onboarding';
import { AuthProvider, useAuth } from '@/lib/auth';
import './App.css';

function AppContent() {
  const { user, isLoading, isOnboarded } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-background text-foreground">Loading...</div>;
  }

  if (!isOnboarded) {
    return <Onboarding />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background text-foreground">
        <h1 className="text-2xl font-bold">QwikShifts</h1>
        <p className="text-muted-foreground">Session expired or not logged in.</p>
        <button 
          onClick={() => {
             const id = prompt("Enter User ID");
             if(id) {
               localStorage.setItem('demo-user-id', id);
               window.location.reload();
             }
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ScheduleBoard />} />
        <Route path="/my-schedule" element={<MySchedule />} />
        <Route path="/time-off" element={<TimeOff />} />
        <Route path="/time-off-requests" element={<TimeOffRequests />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
