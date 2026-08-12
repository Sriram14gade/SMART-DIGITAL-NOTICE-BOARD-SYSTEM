import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, AlertTriangle, Clock, Calendar, Volume2, PlusCircle, 
  Trash2, Radio, CheckCircle2, ShieldAlert, Monitor, LayoutDashboard 
} from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000';
const socket = io(BACKEND_URL);

export default function App() {
  const [activeTab, setActiveTab] = useState('display'); // 'display' or 'admin'

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Top Toggle Bar */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex justify-between items-center text-xs">
        <span className="font-bold text-slate-400">SMART DIGITAL NOTICE BOARD SYSTEM</span>
        <div className="flex gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveTab('display')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-2 transition ${
              activeTab === 'display' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" /> Display Screen
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-2 transition ${
              activeTab === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Admin Console
          </button>
        </div>
      </nav>

      {activeTab === 'display' ? <DisplayView /> : <AdminView />}
    </div>
  );
}

/* ==================== DISPLAY SCREEN COMPONENT ==================== */
function DisplayView() {
  const [notices, setNotices] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [emergencyNotice, setEmergencyNotice] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/notices/active`)
      .then((res) => setNotices(res.data))
      .catch((err) => console.error(err));

    socket.on('NEW_NOTICE', (newNotice) => {
      setNotices((prev) => [newNotice, ...prev]);
    });

    socket.on('NOTICE_DELETED', (id) => {
      setNotices((prev) => prev.filter((n) => n._id !== id));
    });

    socket.on('EMERGENCY_ALERT', (alertData) => setEmergencyNotice(alertData));
    socket.on('CLEAR_EMERGENCY', () => setEmergencyNotice(null));

    return () => {
      socket.off('NEW_NOTICE');
      socket.off('NOTICE_DELETED');
      socket.off('EMERGENCY_ALERT');
      socket.off('CLEAR_EMERGENCY');
    };
  }, []);

  useEffect(() => {
    if (notices.length <= 1 || emergencyNotice) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notices.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [notices, emergencyNotice]);

  const currentNotice = notices[currentIndex];

  return (
    <div className="h-[calc(100vh-53px)] flex flex-col justify-between p-6">
      {/* Header */}
      <header className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-lg">
            <Bell className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold">CAMPUS DIGITAL NOTICE BOARD</h1>
            <p className="text-xs text-blue-400">Real-Time Announcement Kiosk</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2 text-slate-100 font-mono font-bold">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>
      </header>

      {/* Main Notice Area */}
      <main className="flex-1 my-6 flex items-center justify-center relative">
        <AnimatePresence>
          {emergencyNotice && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-50 bg-red-950/95 border-4 border-red-600 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl"
            >
              <div className="p-4 bg-red-600 rounded-full mb-4 animate-bounce">
                <AlertTriangle className="w-12 h-12 text-white" />
              </div>
              <span className="px-3 py-1 bg-red-600 text-white font-black text-xs uppercase rounded-full mb-3">
                Emergency Alert
              </span>
              <h2 className="text-4xl font-extrabold text-white mb-4">{emergencyNotice.title}</h2>
              <p className="text-xl text-red-100 max-w-3xl">{emergencyNotice.content}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!emergencyNotice && (
          <AnimatePresence mode="wait">
            {notices.length > 0 && currentNotice ? (
              <motion.div
                key={currentNotice._id || currentIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full max-w-5xl bg-slate-900/80 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between shadow-2xl"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold text-xs rounded-full uppercase">
                      {currentNotice.category}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {currentIndex + 1} of {notices.length}
                    </span>
                  </div>
                  <h2 className="text-3xl font-extrabold mb-4">{currentNotice.title}</h2>
                  <p className="text-lg text-slate-300 leading-relaxed whitespace-pre-line">{currentNotice.content}</p>
                </div>
                <div className="pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                  <span>Target: <strong className="text-slate-200">{currentNotice.department}</strong></span>
                  <span>System Active</span>
                </div>
              </motion.div>
            ) : (
              <div className="text-center text-slate-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No active notices to display.</p>
              </div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Footer Ticker */}
      <footer className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3 text-xs">
        <span className="bg-blue-600 px-2 py-0.5 rounded font-bold uppercase shrink-0 flex items-center gap-1">
          <Volume2 className="w-3 h-3" /> Live
        </span>
        <div className="overflow-hidden whitespace-nowrap text-slate-300 font-medium">
          📢 Smart Digital Notice Board Connected • Updates automatically in real time without refreshing.
        </div>
      </footer>
    </div>
  );
}

/* ==================== ADMIN CONSOLE COMPONENT ==================== */
function AdminView() {
  const [notices, setNotices] = useState([]);
  const [formData, setFormData] = useState({ title: '', content: '', category: 'General', department: 'All Departments' });
  const [emergency, setEmergency] = useState({ title: 'EMERGENCY WARNING', content: '' });
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/notices/active`).then((res) => setNotices(res.data));
  }, []);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    const res = await axios.post(`${BACKEND_URL}/api/notices`, formData);
    socket.emit('CREATE_NOTICE', res.data);
    setNotices([res.data, ...notices]);
    setFormData({ title: '', content: '', category: 'General', department: 'All Departments' });
  };

  const handleDelete = async (id) => {
    await axios.delete(`${BACKEND_URL}/api/notices/${id}`);
    socket.emit('DELETE_NOTICE', id);
    setNotices(notices.filter((n) => n._id !== id));
  };

  const triggerEmergency = () => {
    if (!emergency.content) return;
    socket.emit('EMERGENCY_ALERT', emergency);
    setIsEmergencyActive(true);
  };

  const clearEmergency = () => {
    socket.emit('CLEAR_EMERGENCY');
    setIsEmergencyActive(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Controls Column */}
      <div className="space-y-6">
        {/* Emergency Card */}
        <div className={`p-5 rounded-2xl border ${isEmergencyActive ? 'bg-red-950/60 border-red-600' : 'bg-slate-900 border-slate-800'}`}>
          <h2 className="text-red-400 font-bold flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5" /> Emergency Override
          </h2>
          {!isEmergencyActive ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Emergency Title"
                value={emergency.title}
                onChange={(e) => setEmergency({ ...emergency, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
              />
              <textarea
                placeholder="Alert text..."
                rows="2"
                value={emergency.content}
                onChange={(e) => setEmergency({ ...emergency, content: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
              />
              <button
                onClick={triggerEmergency}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1"
              >
                <AlertTriangle className="w-4 h-4" /> Broadcast Emergency
              </button>
            </div>
          ) : (
            <button
              onClick={clearEmergency}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded text-xs"
            >
              Clear Emergency Alert
            </button>
          )}
        </div>

        {/* Create Notice Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-400" /> Post Notice
          </h2>
          <form onSubmit={handleCreateNotice} className="space-y-3 text-xs">
            <input
              type="text"
              placeholder="Title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-white"
              >
                <option value="General">General</option>
                <option value="Exams">Exams</option>
                <option value="Events">Events</option>
              </select>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-white"
              >
                <option value="All Departments">All Depts</option>
                <option value="CSE/IT">CSE/IT</option>
                <option value="ECE">ECE</option>
              </select>
            </div>
            <textarea
              placeholder="Notice description..."
              rows="4"
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded flex items-center justify-center gap-1"
            >
              <CheckCircle2 className="w-4 h-4" /> Publish Notice
            </button>
          </form>
        </div>
      </div>

      {/* Active List Column */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="font-bold mb-4">Manage Active Notices ({notices.length})</h2>
        <div className="space-y-3">
          {notices.map((n) => (
            <div key={n._id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-start">
              <div>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold uppercase mr-2">
                  {n.category}
                </span>
                <h3 className="font-bold text-sm mt-1">{n.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{n.content}</p>
              </div>
              <button onClick={() => handleDelete(n._id)} className="text-slate-500 hover:text-red-400 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}