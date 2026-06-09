'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Application {
  id: string;
  company: string;
  position: string;
  status: string;
  appliedDate: string;
  location: string | null;
  remote: boolean;
  notes: string | null;
}

const statusColumns = [
  { id: 'WISHLIST', title: '📝 Wishlist', color: 'bg-gray-100', borderColor: 'border-gray-400' },
  { id: 'APPLIED', title: '📤 Applied', color: 'bg-blue-100', borderColor: 'border-blue-400' },
  { id: 'SCREENING', title: '📞 Screening', color: 'bg-purple-100', borderColor: 'border-purple-400' },
  { id: 'INTERVIEW', title: '🎯 Interview', color: 'bg-yellow-100', borderColor: 'border-yellow-400' },
  { id: 'TECHNICAL', title: '💻 Technical', color: 'bg-orange-100', borderColor: 'border-orange-400' },
  { id: 'OFFER', title: '🎉 Offer', color: 'bg-green-100', borderColor: 'border-green-400' },
  { id: 'REJECTED', title: '❌ Rejected', color: 'bg-red-100', borderColor: 'border-red-400' },
  { id: 'GHOSTED', title: '👻 Ghosted', color: 'bg-pink-100', borderColor: 'border-pink-400' },
];

export default function KanbanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [draggedItem, setDraggedItem] = useState<Application | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setApplications(data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const app = applications.find(a => a.id === id);
      if (!app) return;
      
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...app,
          status: newStatus
        })
      });
      
      if (res.ok) {
        toast.success(`Moved to ${newStatus}`);
        fetchApplications();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleDragStart = (app: Application) => {
    setDraggedItem(app);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (statusId: string) => {
    if (draggedItem && draggedItem.status !== statusId) {
      updateStatus(draggedItem.id, statusId);
    }
    setDraggedItem(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading your pipeline...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                📋 List View
              </Link>
              <Link href="/dashboard/kanban" className="text-blue-600 font-semibold">
                🎯 Kanban View
              </Link>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800 transition-colors font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Application Pipeline</h1>
          <p className="text-gray-600 mt-1">Drag and drop cards to update status</p>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {statusColumns.map((column) => {
              const columnApps = applications.filter(app => app.status === column.id);
              
              return (
                <div
                  key={column.id}
                  className={`w-80 ${column.color} rounded-lg p-4 min-h-[500px]`}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.id)}
                >
                  <div className={`flex justify-between items-center mb-4 pb-2 border-b-2 ${column.borderColor}`}>
                    <h3 className="font-semibold text-gray-800">{column.title}</h3>
                    <span className="bg-white px-2 py-1 rounded-full text-sm text-gray-600">
                      {columnApps.length}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {columnApps.map((app) => (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={() => handleDragStart(app)}
                        className="bg-white rounded-lg shadow-md p-4 cursor-move hover:shadow-lg transition-all"
                      >
                        <h4 className="font-bold text-gray-900">{app.company}</h4>
                        <p className="text-sm text-gray-600 mt-1">{app.position}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span>📍 {app.remote ? 'Remote' : app.location || 'N/A'}</span>
                          <span>📅 {new Date(app.appliedDate).toLocaleDateString()}</span>
                        </div>
                        {app.notes && (
                          <p className="text-xs text-gray-500 mt-2 truncate">{app.notes}</p>
                        )}
                      </div>
                    ))}
                    
                    {columnApps.length === 0 && (
                      <div className="text-center text-gray-400 text-sm py-8">
                        Drop applications here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}