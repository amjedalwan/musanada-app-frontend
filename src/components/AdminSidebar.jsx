import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Building2, BarChart3, X,
    ShieldCheck, Settings, LogOut, Bell,
    Layers, AlertOctagon, FileSpreadsheet, PlusCircle,
    ChevronLeft, PanelLeftClose, PanelLeftOpen, Terminal
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isOpen, setIsOpen] = useState(false);


    // التحقق من الحماية (Protection)
    const userData = JSON.parse(localStorage.getItem('user'));
    const userRole = localStorage.getItem('role');

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);

        // إعادة التوجيه في حال حاول مستخدم عادي الدخول
        if (userRole !== 'admin') {
            navigate('/dashboard');
        }

        return () => window.removeEventListener('resize', handleResize);
    }, [userRole, navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // 3. مراقبة حجم الشاشة وتحديث الحالة
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
            if (window.innerWidth >= 1024) {
                setIsOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    // تقسيم الروابط إلى مجموعات منطقية حسب متطلبات FR-A
    const menuGroups = [
        {
            groupName: "الرقابة العامة",
            items: [
                { name: 'لوحة التحكم', path: '/admin/dashboard', icon: LayoutDashboard },
                { name: 'إدارة المستخدمين', path: '/admin/users', icon: Users },
                { name: 'توثيق المؤسسات', path: '/admin/verify-orgs', icon: ShieldCheck, badge: 'جديد' },
            ]
        },
        {
            groupName: "المحتوى والجودة",
            items: [
                { name: 'رقابة الفرص', path: '/admin/opportunities', icon: AlertOctagon },
                { name: 'إدارة المهارات', path: '/admin/skills', icon: Layers },
            ]
        },
        {
            groupName: "التقارير والنظام",
            items: [
                { name: 'الإحصائيات المتقدمة', path: '/admin/analytics', icon: BarChart3 },
              
                { name: 'إعدادات المنصة', path: '/', icon: Settings  },
            ]
        }
    ];

    return (<>
        {/* لسان الفتح للجوال */}
        <AnimatePresence>
            {!isOpen && (
                <motion.button
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 50, opacity: 0 }}
                    onClick={() => setIsOpen(true)}
                    className="lg:hidden fixed top-1/2 -translate-y-1/2 right-0 z-[9995] flex items-center justify-center w-6 h-16 bg-indigo-600 text-white rounded-l-xl shadow-[0_0_15px_rgba(79,70,229,0.4)] border-y border-l border-white/20"
                >
                    <motion.div animate={{ x: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </motion.div>
                </motion.button>
            )}
        </AnimatePresence>

        {/* القناع الخلفي */}
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] lg:hidden"
                />
            )}
        </AnimatePresence>


        {/* القناع الخلفي */}
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] lg:hidden"
                />
            )}
        </AnimatePresence>
        <motion.aside
            initial={false}
            animate={{
                // استخدام windowWidth بدلاً من window.innerWidth المباشر
                x: windowWidth >= 1024 ? 0 : (isOpen ? 0 : 320),
                width: windowWidth < 1024 ? 280 : (isCollapsed ? 90 : 280)
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ zIndex: 9999 }}
            className="fixed lg:sticky top-0 right-0 bottom-0 h-screen bg-[#070710] border-l border-white/5 flex flex-col shadow-2xl"
            dir="rtl"
        >
            {/* 1. Admin Identity Header */}
             <div className="p-5 flex items-center justify-between min-h-[80px] gap-1">
                <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/20">
                            <ShieldCheck size={26} strokeWidth={2.5} />
                        </div>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#0a0a12] rounded-full animate-pulse"></span>
                    </div>

                    {!isCollapsed && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h2 className="text-white font-black text-sm tracking-tight leading-none">مدير النظام</h2>
                            <p className="text-amber-500/70 text-[10px] font-bold uppercase mt-1 tracking-widest">Root Access</p>
                        </motion.div>
                    )}
                </div>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden lg:flex   w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform"
                >
                    {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
                </button>
                <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-white">
                    <X size={24} />
                </button>
                {/* Toggle Button */}

            </div>

            {/* 2. Navigation Content */}
            <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-6">
                {menuGroups.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-2">
                        {!isCollapsed && (
                            <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-4 mb-2">
                                {group.groupName}
                            </h3>
                        )}

                        {group.items.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`
                                        relative group flex items-center gap-4 p-3 rounded-2xl transition-all duration-300
                                        ${isActive
                                            ? 'bg-gradient-to-l from-amber-500/10 to-transparent text-amber-500'
                                            : 'text-gray-500 hover:text-white hover:bg-white/5'}
                                        ${isCollapsed ? 'justify-center' : ''}
                                    `}
                                >
                                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />

                                    {!isCollapsed && (
                                        <span className="text-[13px] font-bold flex-1">{item.name}</span>
                                    )}

                                    {item.badge && !isCollapsed && (
                                        <span className="bg-red-600 text-[9px] font-black px-2 py-0.5 rounded-full text-white animate-bounce">
                                            {item.badge}
                                        </span>
                                    )}

                                    {/* Tooltip for Collapsed State */}
                                    {isCollapsed && (
                                        <div className="absolute left-full ml-4 px-3 py-2 bg-amber-500 text-black text-[11px] font-black rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-[200]">
                                            {item.name}
                                        </div>
                                    )}

                                    {isActive && (
                                        <motion.div
                                            layoutId="activePill"
                                            className="absolute right-0 w-1 h-8 bg-amber-500 rounded-l-full"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>


            {/* 4. Logout Action */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-3 w-full p-3 rounded-2xl text-red-500/70 hover:text-red-500 hover:bg-red-500/5 transition-all ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <LogOut size={20} />
                    {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">إنهاء الجلسة</span>}
                </button>
            </div>
        </motion.aside>
    </>
    );
};

export default AdminSidebar;