import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, FileText, CheckSquare, Award,
    LogOut, Settings, ShieldCheck, Bell,
    PlusCircle, Users, Search, X, Calendar, Map, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { URLS } from '../config/constants';


import Swal from 'sweetalert2';
import api from '../api/axios';




const UserAvatar = ({ path, className, userName }) => {
    const imageUrl = path ? `${URLS.STORAGE}/${path}` : null;


    return (
        <div className={className}>
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={userName}
                    className="w-full h-full object-cover rounded-2xl"

                />
            ) : (
                <div className="w-full h-full bg-indigo-900 flex items-center justify-center text-white">
                    {userName?.charAt(0) || 'U'}
                </div>
            )}
        </div>
    );
};


const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    // 1. مراقبة عرض الشاشة باستخدام State لضمان استجابة Framer Motion
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const [userData, setUserData] = useState(() => {
        const userStr = localStorage.getItem('user');
        // التأكد أن النص موجود وليس مجرد كلمة "undefined" أو نص فارغ
        const storedUser = (userStr && userStr !== "undefined") ? JSON.parse(userStr) : null;
        const storedRole = localStorage.getItem('role');

        // إذا لم يوجد مستخدم أو لا يوجد توكن، فهو ضيف
        if (!storedUser || !localStorage.getItem('token')) {
            return {
                name: 'زائر',
                avatar: null,
                role: 'guest'
            };
        }

        return {
            name: storedUser?.full_name || storedUser?.name || 'مستخدم مساندة',
            avatar: storedUser?.profile_image || storedUser?.image || null,
            role: storedRole || 'student'
        };
    });
    const API_URL = import.meta.env.VITE_API_URL;
    useEffect(() => {
        const handleUserUpdate = () => {
            const updatedUser = JSON.parse(localStorage.getItem('user'));
            const updatedRole = localStorage.getItem('role');
            if (updatedUser) {
                setUserData({
                    name: updatedUser.full_name || updatedUser.name || 'مستخدم مساندة',
                    avatar: updatedUser.profile_image || updatedUser.image || null,
                    role: updatedRole || 'student'
                });
            }
        };

        // الاستماع لحدث مخصص - هذا هو السر في سرعة الأداء
        window.addEventListener('userProfileUpdated', handleUserUpdate);

        return () => window.removeEventListener('userProfileUpdated', handleUserUpdate);
    }, []);
    const [isCollapsed, setIsCollapsed] = useState(false);

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




    const menuItems = {
        guest: [
            { name: 'الرئيسية', path: '/', icon: LayoutDashboard },
            { name: 'استكشف الفرص', path: '/opportunities', icon: Search }
        ],
        student: [
            { name: 'الرئيسية', path: '/dashboard', icon: LayoutDashboard },
            { name: 'الأقرب ', path: '/opportunities-map', icon: Map },
            { name: 'استكشف الفرص', path: '/opportunities', icon: Search },
            { name: 'طلباتي', path: '/my-applications', icon: FileText },
            { name: 'سجل الساعات', path: '/logs', icon: CheckSquare },
            { name: 'الشهادات', path: '/certificates', icon: Award },
            { name: 'الإشعارات', path: '/notifications', icon: Bell },
        ],
        organization: [
            { name: 'لوحة التحكم', path: '/dashboard', icon: LayoutDashboard },
            { name: ' إدارة المتطوعين', path: '/manage-volunteers', icon: Calendar },
            { name: 'فرصة جديدة', path: '/opportunities/create', icon: PlusCircle },
            { name: 'إدارة الفرص', path: '/manage-opportunities', icon: Users },
            { name: ' إدارة المتقدمين', path: '/pending-applicants', icon: CheckSquare },
            { name: 'إدارة الشهائد', path: '/certificates-management', icon: CheckSquare },
            { name: 'الإشعارات', path: '/notifications', icon: Bell },
        ]
    };
    const handleLogout = async () => {

        setIsOpen(false);
        const result = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "سيتعين عليك تسجيل الدخول مرة أخرى للوصول إلى حسابك",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5', // Indigo-600 متناسق مع تصميمك
            cancelButtonColor: '#ef4444', // Red-500
            confirmButtonText: 'نعم، سجل الخروج',
            cancelButtonText: 'إلغاء',
            background: '#070710', // متناسق مع خلفية السايدبار المظلمة
            color: '#fff',
            customClass: {
                popup: 'rounded-3xl border border-white/10 shadow-2xl'
            }
        });

        // 2. إذا وافق المستخدم
        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token'); // تأكد من مسمى المفتاح لديك


                if (token) {
                    await api.post(`/logout`, {}, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                }
            } catch (error) {
                console.error("Logout Error:", error);
            } finally {
                // 4. حذف جميع البيانات من LocalStorage (المتصفح)
                localStorage.clear();

                // 5. التوجيه إلى صفحة تسجيل الدخول
                navigate('/login');

                // إظهار تنبيه نجاح سريع (اختياري)
                Swal.fire({
                    title: 'تم تسجيل الخروج',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#070710',
                    color: '#fff'
                });
            }
        }
    };
    const currentMenu = menuItems[userData.role] || menuItems.guest;
    const isActive = (path) => location.pathname === path;

    return (
        <>
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

            {/* السايدبار الرئيسي */}
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
                {/* 1. Header */}
                <div className="p-6 flex items-center justify-between min-h-[80px]">
                    {!isCollapsed && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <span className="text-white font-black text-sm">M</span>
                            </div>
                            <span className="font-black text-white text-lg tracking-tight">مساندة</span>
                        </motion.div>
                    )}

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`hidden lg:block p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all ${isCollapsed ? 'mx-auto' : ''}`}
                    >
                        {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* 2. Profile Section */}
                <div className="px-4 mb-2 transition-all">
                    <div
                        onClick={() => navigate('/profile')}
                        className={`relative cursor-pointer group rounded-[2rem] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 overflow-hidden transition-all hover:border-white/10 ${isCollapsed && windowWidth >= 1024 ? 'p-2' : 'p-5'}`}
                    >
                        <div className="relative z-10 flex flex-col items-center">
                            <div className={`relative transition-all duration-300 ${isCollapsed && windowWidth >= 1024 ? 'mb-0' : 'mb-3'}`}>
                                <div className="absolute inset-0 bg-indigo-500 blur-md opacity-0 group-hover:opacity-30 transition-opacity"></div>

                                {userData.role === 'guest' ? (
                                    <div className={`${isCollapsed && windowWidth >= 1024 ? 'w-10 h-10' : 'w-16 h-16'} rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 border border-white/10 flex items-center justify-center text-white font-black relative z-10 group-hover:scale-105 transition-transform shadow-lg shadow-purple-500/20`}>
                                        <ShieldCheck size={isCollapsed && windowWidth >= 1024 ? 20 : 32} />
                                    </div>
                                ) : userData.avatar ? (

                                    <UserAvatar
                                        path={userData.avatar}
                                        userName={userData.name}
                                        className={`${isCollapsed && windowWidth >= 1024 ? 'w-10 h-10' : 'w-16 h-16'} relative z-10 group-hover:scale-105 transition-transform`}
                                    />

                                ) : (
                                    <div className={`${isCollapsed && windowWidth >= 1024 ? 'w-10 h-10' : 'w-16 h-16'} rounded-2xl bg-[#111122] border border-white/10 flex items-center justify-center text-indigo-400 font-black relative z-10 group-hover:scale-105 transition-transform`}>
                                        {userData.name.charAt(0)}
                                    </div>
                                )}
                            </div>

                            {(!isCollapsed || windowWidth < 1024) && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                                    <div className="flex items-center justify-center gap-3 mt-2">
                                        {userData.role !== 'guest' && <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>}
                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-purple-500/80">{userData.role === 'guest' ? 'زائر' : userData.name}</span>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Navigation */}
                <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar space-y-1 mt-2">
                    {currentMenu.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all group relative ${isActive(item.path) ? 'bg-indigo-600/10 text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/[0.03]'} ${isCollapsed && windowWidth >= 1024 ? 'justify-center px-0' : ''}`}
                        >
                            <div className={`transition-all duration-300 ${isActive(item.path) ? 'text-indigo-500 scale-110' : 'group-hover:scale-110 group-hover:text-gray-300'}`}>
                                <item.icon size={isCollapsed && windowWidth >= 1024 ? 22 : 19} strokeWidth={isActive(item.path) ? 2.5 : 2} />
                            </div>

                            {(!isCollapsed || windowWidth < 1024) && (
                                <span className={`text-[13px] font-bold tracking-wide transition-all ${isActive(item.path) ? 'translate-x-[-2px]' : ''}`}>
                                    {item.name}
                                </span>
                            )}

                            {isActive(item.path) && (!isCollapsed || windowWidth < 1024) && (
                                <motion.div layoutId="activeInd" className="mr-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                            )}

                            {isCollapsed && windowWidth >= 1024 && (
                                <div className="absolute right-full mr-4 px-3 py-2 bg-gray-900 border border-white/10 text-white text-[11px] font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-[100] shadow-2xl">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* 4. Footer Actions */}
                <div className="p-4 border-t border-white/5 space-y-2">
                    {userData.role !== 'guest' ? (
                        <button
                            onClick={handleLogout}
                            className={`flex items-center gap-3 w-full p-3 rounded-2xl mb-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/5 transition-all ${isCollapsed && windowWidth >= 1024 ? 'justify-center' : ''}`}
                        >
                            <LogOut size={20} />
                            {(!isCollapsed || windowWidth < 1024) && <span className="text-xs font-bold">تسجيل الخروج</span>}
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className={`flex items-center gap-3 w-full p-3 rounded-2xl text-indigo-400 hover:text-white hover:bg-indigo-600 transition-all ${isCollapsed && windowWidth >= 1024 ? 'justify-center' : ''}`}
                        >
                            <LogOut size={20} className="rotate-180" />
                            {(!isCollapsed || windowWidth < 1024) && <span className="text-xs font-bold">تسجيل الدخول</span>}
                        </button>
                    )}
                </div>


            </motion.aside>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 0px; }
                .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </>
    );
};

export default Sidebar;
