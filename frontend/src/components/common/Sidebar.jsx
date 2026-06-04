import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Leaf,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Video,
  Upload,
  Activity,
  History,
  FileText,
  Radio,
  Map
} from 'lucide-react';

const Sidebar = ({ userRole = 'user', onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const userMenuItems = [
    { label: 'Analytics Overview', icon: BarChart3, path: '/dashboard/analytics' },
    { label: 'Live Camera Detection', icon: Video, path: '/dashboard/live-detection' },
    { label: 'Upload Image', icon: Upload, path: '/dashboard/upload-detection' },
    { label: 'Symptoms Based Recommendation', icon: Activity, path: '/dashboard/symptoms-recommendation' },
    { label: 'History Scans Record', icon: History, path: '/dashboard/history' },
    { label: 'Drone Control System', icon: Radio, path: '/dashboard/drone-control-system' },
    { label: 'Mission Planner', icon: Map, path: '/dashboard/mission-planner' },
  ];

  const adminMenuItems = [
    { label: 'Analytics Overview', icon: BarChart3, path: '/admin/analytics' },
    { label: 'Live Camera Detection', icon: Video, path: '/admin/live-detection' },
    { label: 'Upload Image', icon: Upload, path: '/admin/upload-detection' },
    { label: 'Symptoms Based Recommendation', icon: Activity, path: '/admin/symptoms-recommendation' },
    { label: 'History Scans Record', icon: History, path: '/admin/history' },
    { label: 'Drone Control System', icon: Radio, path: '/admin/drone-control-system' },
    { label: 'Mission Planner', icon: Map, path: '/admin/mission-planner' },
    { label: 'Login Logs', icon: FileText, path: '/admin/login-logs' },
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : userMenuItems;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-3 rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 text-white shadow-lg hover:shadow-xl transition"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <motion.aside
        animate={{ x: isDesktop ? 0 : (isOpen ? 0 : -280) }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-16 bottom-0 w-64 bg-slate-950 border-r border-slate-800 overflow-y-auto z-40 lg:translate-x-0"
      >
        <div className="p-6 flex flex-col h-full">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-lime-400 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-lime-300 bg-clip-text text-transparent">
              PlantAI
            </span>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (!isDesktop) {
                      setIsOpen(false);
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-gradient-to-r from-emerald-500/20 to-lime-400/20 text-emerald-400 border-l-2 border-emerald-500'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={() => {
              onLogout();
              navigate('/login');
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
