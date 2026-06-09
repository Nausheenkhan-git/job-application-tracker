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
  jobUrl: string | null;
  notes: string | null;
}

interface Reminder {
  id: string;
  applicationId: string;
  reminderDate: string;
  message: string;
  isSent: boolean;
  application: {
    company: string;
    position: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedAppForReminder, setSelectedAppForReminder] = useState<Application | null>(null);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    status: 'APPLIED',
    location: '',
    remote: false,
    jobUrl: '',
    notes: ''
  });

  useEffect(() => {
    fetchApplications();
    fetchReminders();
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

  const fetchReminders = async () => {
    try {
      const res = await fetch('/api/reminders');
      if (res.ok) {
        const data = await res.json();
        setUpcomingReminders(data);
      }
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingApp 
        ? `/api/applications/${editingApp.id}`
        : '/api/applications';
      const method = editingApp ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success(editingApp ? 'Application updated!' : 'Application added!');
        setShowForm(false);
        setEditingApp(null);
        setFormData({
          company: '',
          position: '',
          status: 'APPLIED',
          location: '',
          remote: false,
          jobUrl: '',
          notes: ''
        });
        fetchApplications();
      } else {
        toast.error(editingApp ? 'Failed to update' : 'Failed to add');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleEdit = (app: Application) => {
    setEditingApp(app);
    setFormData({
      company: app.company,
      position: app.position,
      status: app.status,
      location: app.location || '',
      remote: app.remote,
      jobUrl: app.jobUrl || '',
      notes: app.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        toast.success('Application deleted');
        setDeleteConfirm(null);
        fetchApplications();
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      toast.error('Something went wrong');
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
        toast.success(`Status updated to ${newStatus}`);
        fetchApplications();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const createReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForReminder) return;
    
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedAppForReminder.id,
          reminderDate: reminderDate,
          message: reminderMessage
        })
      });
      
      if (res.ok) {
        toast.success('Reminder set successfully!');
        setShowReminderModal(false);
        setSelectedAppForReminder(null);
        setReminderDate('');
        setReminderMessage('');
        fetchReminders();
      } else {
        toast.error('Failed to set reminder');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      WISHLIST: 'bg-gray-200 text-gray-800',
      APPLIED: 'bg-blue-200 text-blue-800',
      SCREENING: 'bg-purple-200 text-purple-800',
      INTERVIEW: 'bg-yellow-200 text-yellow-800',
      TECHNICAL: 'bg-orange-200 text-orange-800',
      OFFER: 'bg-green-200 text-green-800',
      REJECTED: 'bg-red-200 text-red-800',
      GHOSTED: 'bg-pink-200 text-pink-800'
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalApplications = applications.length;
  const inProgress = applications.filter(a => a.status === 'INTERVIEW' || a.status === 'TECHNICAL' || a.status === 'SCREENING').length;
  const offers = applications.filter(a => a.status === 'OFFER').length;
  const wishlist = applications.filter(a => a.status === 'WISHLIST').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading your applications...</div>
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
              <Link href="/dashboard" className="text-blue-600 font-semibold">
                📋 List View
              </Link>
              <Link href="/dashboard/kanban" className="text-gray-600 hover:text-gray-900">
                🎯 Kanban View
              </Link>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with stats */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">My Applications</h2>
              <p className="text-gray-600 mt-1">Track and manage your job search journey</p>
            </div>
            <button
              onClick={() => {
                setEditingApp(null);
                setFormData({
                  company: '',
                  position: '',
                  status: 'APPLIED',
                  location: '',
                  remote: false,
                  jobUrl: '',
                  notes: ''
                });
                setShowForm(!showForm);
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              + Add Application
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-600">{totalApplications}</div>
                  <div className="text-gray-600 mt-1">Total Applications</div>
                </div>
                <div className="text-4xl">📋</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-purple-600">{inProgress}</div>
                  <div className="text-gray-600 mt-1">In Progress</div>
                </div>
                <div className="text-4xl">⚡</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-600">{offers}</div>
                  <div className="text-gray-600 mt-1">Offers Received</div>
                </div>
                <div className="text-4xl">🎉</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-yellow-600">{wishlist}</div>
                  <div className="text-gray-600 mt-1">Wishlist</div>
                </div>
                <div className="text-4xl">⭐</div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Reminders Section */}
        {upcomingReminders.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⏰ Upcoming Reminders</h3>
            <div className="space-y-2">
              {upcomingReminders.map((reminder) => (
                <div key={reminder.id} className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {reminder.application.company} - {reminder.application.position}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{reminder.message || 'Follow up on your application'}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        📅 {new Date(reminder.reminderDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Search by company or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="WISHLIST">📝 Wishlist</option>
              <option value="APPLIED">📤 Applied</option>
              <option value="SCREENING">📞 Screening</option>
              <option value="INTERVIEW">🎯 Interview</option>
              <option value="TECHNICAL">💻 Technical</option>
              <option value="OFFER">🎉 Offer</option>
              <option value="REJECTED">❌ Rejected</option>
              <option value="GHOSTED">👻 Ghosted</option>
            </select>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">{editingApp ? 'Edit Application' : 'New Application'}</h3>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingApp(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Google, Microsoft, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                      <input
                        type="text"
                        required
                        value={formData.position}
                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Frontend Developer, UX Designer, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="WISHLIST">📝 Wishlist</option>
                        <option value="APPLIED">📤 Applied</option>
                        <option value="SCREENING">📞 Screening</option>
                        <option value="INTERVIEW">🎯 Interview</option>
                        <option value="TECHNICAL">💻 Technical</option>
                        <option value="OFFER">🎉 Offer</option>
                        <option value="REJECTED">❌ Rejected</option>
                        <option value="GHOSTED">👻 Ghosted</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="New York, Remote, etc."
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.remote}
                        onChange={(e) => setFormData({...formData, remote: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">Remote Position</label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job URL</label>
                    <input
                      type="url"
                      value={formData.jobUrl}
                      onChange={(e) => setFormData({...formData, jobUrl: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Interview notes, contact info, etc."
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      {editingApp ? 'Update' : 'Save'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowForm(false);
                        setEditingApp(null);
                      }} 
                      className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this application? This action cannot be undone.</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reminder Modal */}
        {showReminderModal && selectedAppForReminder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold mb-4">Set Follow-up Reminder</h3>
              <p className="text-gray-600 mb-4">
                Set a reminder for <strong>{selectedAppForReminder.company}</strong> - {selectedAppForReminder.position}
              </p>
              <form onSubmit={createReminder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
                  <textarea
                    rows={3}
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    placeholder="Add any specific notes for this reminder..."
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReminderModal(false);
                      setSelectedAppForReminder(null);
                    }}
                    className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Set Reminder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📧</div>
            <p className="text-gray-500 text-lg mb-2">No applications found.</p>
            <p className="text-gray-400">
              {searchTerm || statusFilter !== 'ALL' ? 'Try adjusting your search or filter' : 'Click "Add Application" to get started!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredApplications.map((app) => (
              <div key={app.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6 border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-900">{app.company}</h3>
                      <select
                        value={app.status}
                        onChange={(e) => updateStatus(app.id, e.target.value)}
                        className={`px-2 py-1 text-xs rounded-full font-medium cursor-pointer transition-colors ${getStatusColor(app.status)}`}
                      >
                        <option value="WISHLIST">📝 Wishlist</option>
                        <option value="APPLIED">📤 Applied</option>
                        <option value="SCREENING">📞 Screening</option>
                        <option value="INTERVIEW">🎯 Interview</option>
                        <option value="TECHNICAL">💻 Technical</option>
                        <option value="OFFER">🎉 Offer</option>
                        <option value="REJECTED">❌ Rejected</option>
                        <option value="GHOSTED">👻 Ghosted</option>
                      </select>
                    </div>
                    <p className="text-gray-600 mb-2">{app.position}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>📍 {app.remote ? 'Remote' : app.location || 'Not specified'}</span>
                      <span>📅 Applied: {new Date(app.appliedDate).toLocaleDateString()}</span>
                      {app.jobUrl && (
                        <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          🔗 Job Posting
                        </a>
                      )}
                    </div>
                    {app.notes && (
                      <p className="text-gray-600 text-sm mt-2 border-l-2 border-gray-300 pl-3">{app.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedAppForReminder(app);
                        setShowReminderModal(true);
                      }}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      📅 Reminder
                    </button>
                    <button
                      onClick={() => handleEdit(app)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(app.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}