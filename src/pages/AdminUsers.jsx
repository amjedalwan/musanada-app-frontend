import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Users, Search, Filter, Shield, ShieldOff, Trash2,
    UserCheck, UserX, Loader2, ChevronLeft, ChevronRight,
    UserPlus, Mail, Calendar, Activity, CheckCircle,
    AlertCircle, Download, RefreshCcw, MoreVertical,
    UserCircle, Building2, GraduationCap, HardDrive,
    Settings, Eye, Lock, Unlock, Hash, Smartphone,
    ExternalLink, MapPin, Check, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import AdminSidebar from '../components/AdminSidebar';
import Swal from 'sweetalert2';
/**
 * @component AdminUsers
 * @version 3.0.0
 * @description نظام إدارة المستخدمين المطور بنظام الكروت الذكية - توبا سوفت
 */

// --- SweetAlert2 Toast Config ---
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#1a1a2e',
    color: '#fff',
    customClass: { popup: 'rounded-2xl border border-white/10 shadow-2xl' }
});
const AdminUsers = () => {
    // --- States Management ---
    const [users, setUsers] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [role, setRole] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({});

    const API_URL = import.meta.env.VITE_API_URL;
    // --- داخل مكون AdminUsers ---
    const [globalStats, setGlobalStats] = useState({ total: 0, active: 0, students: 0, orgs: 0 });
    const [isFirstLoadDone, setIsFirstLoadDone] = useState(false); // للتأكد من تخزين البيانات مرة واحدة فقط


    const [isFirstLoading, setIsFirstLoading] = useState(true); // للتحميل لأول مرة فقط
    const fetchUsers = useCallback(async () => {
        setLoadingSearch(true);
        try {
            const response = await api.get('/admin/users', {
                params: {
                    search: search,
                    role: role === 'all' ? '' : role,
                    status: statusFilter === 'all' ? '' : statusFilter,
                    page: page
                }
            });

            const fetchedData = response.data.data || [];
            setUsers(fetchedData);
            setMeta({
                total: response.data.total,
                last_page: response.data.last_page,
                current_page: response.data.current_page,
                per_page: response.data.per_page
            });

            // --- التعديل هنا: تخزين الإحصائيات الثابتة فقط في أول مرة ---
            if (!isFirstLoadDone && search === '' && role === 'all' && statusFilter === 'all') {
                setGlobalStats({
                    total: response.data.total || 0,
                    active: response.data.total_active || fetchedData.filter(u => u.is_active).length,
                    students: response.data.total_students || fetchedData.filter(u => u.role === 'student').length,
                    orgs: response.data.total_orgs || fetchedData.filter(u => u.role === 'organization').length

                });

                setIsFirstLoadDone(true); // نضع علامة بأننا جلبنا الإحصائيات العامة بنجاح
            }

        } catch (error) {
            console.log(error);
            Toast.fire({ icon: 'error', title: 'عذراً، تعذر جلب البيانات' });
        } finally {
            setLoadingSearch(false);
            setIsFirstLoading(false);
        }
    }, [search, role, statusFilter, page, isFirstLoadDone]);
    useEffect(() => {
        // تصفير الصفحة عند تغيير الفلاتر أو البحث
        if (page !== 1 && (search !== '' || role !== 'all' || statusFilter !== 'all')) {
            setPage(1);
        }
        fetchUsers();
    }, [search, role, statusFilter, page, fetchUsers]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setSearch(searchInput);
        }, 500);

        return () => clearTimeout(handler);
    }, [searchInput]);
    // --- تصحيح مشكلة الـ Toggle Status ---
    const handleToggleStatus = async (user) => {
        const originalStatus = !!user.is_active;
        const newStatus = originalStatus ? 0 : 1; // إرسال أرقام أفضل للتوافق مع DB

        setActionLoading(user.id);

        // التحديث في الواجهة أولاً (Optimistic)
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));

        try {
            // نستخدم PATCH أو POST حسب الـ Route لديك
            const res = await api.post(`/admin/users/${user.id}/toggle-status`, {
                status: newStatus
            });

            // إذا رجع السيرفر استجابة ناجحة (حتى لو كانت خالية) نعتبرها نجاح
            if (res.status === 200 || res.status === 201) {
                Toast.fire({
                    icon: 'success',
                    title: `تم تحديث حالة ${user.full_name}`
                });
            }
        } catch (error) {
            // التراجع عن التحديث في حالة الفشل الفعلي
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: originalStatus ? 1 : 0 } : u));

            // تحقق مما إذا كان الخطأ فعلياً أم مجرد مشكلة في استلام الاستجابة
            if (error.response) {
                Toast.fire({ icon: 'error', title: 'فشل التحديث من جهة السيرفر' });
            }
        } finally {
            setActionLoading(null);
        }
    };

    const handleViewDetails = (user) => {
        const isStudent = user.role === 'student';
        const data = isStudent ? user.profile : user.organization;

        // تصحيح منطق الصورة: إذا كانت القيمة الافتراضية أو نل، نستخدم مكتبة UI-Avatars
        const profileImg = (user.profile_image)
            ? `${API_URL}/storage/${user.profile_image}` // تأكد من مطابقة هذا الرابط لعنوان السيرفر لديك
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=${isStudent ? '4f46e5' : 'f59e0b'}&color=fff&size=256&bold=true`;

        Swal.fire({
            background: 'rgba(29, 14, 35, 0.63)',
            showConfirmButton: false,
            showCloseButton: true,
            width: '650px',
          
            customClass: {
                container: 'backdrop-blur-sm',
                popup: 'rounded-[2rem] border border-white/5 p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]',
                closeButton: 'text-white/30 hover:text-white transition-all focus:outline-none'
            },
            html: `
            <div class="text-right dir-rtl select-none" dir="rtl" style="font-family: 'Tajawal', sans-serif;">
                
                <div class="h-24 bg-gradient-to-l mr-3 rounded-md ${isStudent ? 'from-indigo-900/40' : 'from-amber-900/30'} to-transparent relative">
                    <div class="absolute -bottom-10 right-5 flex items-end gap-5">
                        <div class="relative">
                            <img src="${profileImg}" 
                                 onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=333&color=fff'"
                                 class="w-24 h-24 rounded-3xl object-cover border-[3px]  ${user.is_active ? 'border-emerald-300' : 'border-red-400'}"shadow-xl">
                            <div class="absolute bottom-2 -left-1 w-5 h-5 rounded-full ${user.is_active ? 'bg-green-600' : 'bg-red-500'}"></div>
                        </div>
                        <div class="pb-2">
                            <h2 class="text-xl font-black text-white mb-1">${isStudent ? user.full_name : (data?.org_name || user.full_name)}</h2>
                            <span class="text-[10px] px-3 py-1 rounded-lg font-bold tracking-widest uppercase ${isStudent ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'}">
                                ${isStudent ? 'متطوع معتمد' : 'مؤسسة شريكة'}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="px-8 pt-16 pb-10 space-y-8">
                    
                    <div class="grid grid-cols-3 gap-4 border-y border-white/5 py-6">
                        <div class="text-center">
                            <p class="text-[9px] text-gray-500 font-bold mb-1 uppercase tracking-tighter">نوع الحساب</p>
                            <p class="text-xs font-black text-gray-200">${isStudent ? 'متطوع' : 'مؤسسة'}</p>
                        </div>
                        <div class="text-center border-x border-white/5">
                            <p class="text-[9px] text-gray-500 font-bold mb-1 uppercase tracking-tighter">تاريخ الانضمام</p>
                            <p class="text-xs font-black text-gray-200">${new Date(user.created_at).toLocaleDateString('ar-YE')}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-[9px] text-gray-500 font-bold mb-1 uppercase tracking-tighter">${isStudent ? 'ساعات التطوع' : 'التوثيق'}</p>
                            <p class="text-xs font-black ${isStudent ? 'text-indigo-400' : (data?.is_verified ? 'text-emerald-400' : 'text-amber-400')}">
                                ${isStudent ? (data?.total_volunteer_hours || 0) : (data?.is_verified ? 'موثق' : 'تحت المراجعة')}
                            </p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div class="group">
                                <p class="text-[10px] text-gray-600 font-bold mb-2 pr-1">البريد الإلكتروني</p>
                                <div class="bg-white/[0.03] p-3 rounded-xl border border-white/5 text-sm text-gray-300 font-medium group-hover:border-indigo-500/30 transition-all">${user.email}</div>
                            </div>
                            
                            ${isStudent ? `
                                <div class="group">
                                    <p class="text-[10px] text-gray-600 font-bold mb-2 pr-1">الجامعة</p>
                                    <div class="bg-white/[0.03] p-3 rounded-xl border border-white/5 text-sm text-gray-300 font-medium transition-all">${data?.university || 'غير محدد'}</div>
                                </div>
                            ` : `
                                <div class="group">
                                    <p class="text-[10px] text-gray-600 font-bold mb-2 pr-1">مسؤول التواصل</p>
                                    <div class="bg-white/[0.03] p-3 rounded-xl border border-white/5 text-sm text-gray-300 font-medium transition-all">${data?.contact_person || 'غير متوفر'}</div>
                                </div>
                            `}
                        </div>

                        <div class="space-y-4">
                            <div class="group">
                                <p class="text-[10px] text-gray-600 font-bold mb-2 pr-1">رقم الهاتف / المعرف</p>
                                <div class="bg-white/[0.03] p-3 rounded-xl border border-white/5 text-sm text-gray-300 font-medium transition-all">#ID-${user.id}</div>
                            </div>

                            ${isStudent ? `
                                <div class="group">
                                    <p class="text-[10px] text-gray-600 font-bold mb-2 pr-1">التخصص</p>
                                    <div class="bg-white/[0.03] p-3 rounded-xl border border-white/5 text-sm text-gray-300 font-medium transition-all">${data?.major || 'غير محدد'}</div>
                                </div>
                            ` : `
                                <div class="group">
                                    <p class="text-[10px] text-gray-600 font-bold mb-2 pr-1">نوع النشاط</p>
                                    <div class="bg-white/[0.03] p-3 rounded-xl border border-white/5 text-sm text-gray-300 font-medium transition-all">${data?.org_type || 'مؤسسة'}</div>
                                </div>
                            `}
                        </div>
                    </div>

                    <div class="relative group pt-4">
                        <p class="text-[10px] text-gray-600 font-bold mb-3 pr-1">${isStudent ? 'النبذة الشخصية' : 'وصف المؤسسة'}</p>
                        <div class="bg-gradient-to-br from-white/[0.04] to-transparent p-5 rounded-2xl border border-white/5 text-sm text-gray-400 leading-relaxed min-h-[80px]">
                            ${(isStudent ? data?.bio : data?.description) || 'لا يوجد وصف متاح لهذا الحساب.'}
                        </div>
                    </div>
                </div>


                    <button onclick="Swal.close()" class="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold transition-all border border-white/10">إغلاق</button>
                
            </div>
        `
        });
    };
    // --- UI Components ---
    const UserCard = ({ user }) => (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`group relative ${user.is_active ? "bg-[#0f0f1a]/60 hover:bg-[#161625]" : "bg-[#3f0f1a]/30 hover:bg-[#3f0f1a]/70"} border border-white/5 rounded-[2.5rem] p-6  transition-all duration-500 shadow-xl`}
        >
            <div className="absolute top-6 left-6 flex gap-2">
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${user.role === 'student' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                    {user.role === 'student' ? 'متطوع' : 'مؤسسة'}
                </div>
            </div>

            <div className="flex flex-col items-center text-center mt-4">
                {/* User Image Section */}
                <div className="relative group/avatar mb-4">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[2rem] blur opacity-20 group-hover/avatar:opacity-50 transition duration-500"></div>
                    <div className={`relative w-24 h-24 rounded-[1.8rem] border-2 ${user.is_active ? 'border-green-500 ' : 'border-red-500'}  bg-[#0c0c14] overflow-hidden"`}>
                        <img
                            src={user.profile_image ? `${API_URL}/storage/${user.profile_image}` : `https://ui-avatars.com/api/?name=${user.full_name}&background=6366f1&color=fff`}
                            alt={user.full_name}
                            className="w-full h-full object-cover rounded-[1.4rem]"

                        />

                    </div>
                    <div className={`absolute -bottom-1 left-0 w-5 h-5  rounded-full shadow-lg ${user.is_active ? 'bg-green-600 ' : 'bg-red-500'}`}></div>
                </div>

                <h3 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors mb-1 truncate w-full px-2">

                    {user.role === 'student' ? user.full_name : user.org_name}
                </h3>
                <p className="text-gray-500 text-[11px] font-bold mb-4 flex items-center gap-2">
                    <Mail size={12} /> {user.email}
                </p>

                <div className="grid grid-cols-2 gap-3 w-full mb-6">
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <p className="text-[9px] text-gray-500 font-black uppercase mb-1">المعرف</p>
                        <p className="text-xs font-bold text-indigo-300">#{user.id}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <p className="text-[9px] text-gray-500 font-black uppercase mb-1">منذ</p>
                        <p className="text-xs font-bold text-gray-300">{new Date(user.created_at).toLocaleDateString('ar-YE', { year: 'numeric', month: 'short' })}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full">
                    <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={actionLoading === user.id}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[11px] font-black transition-all ${user.is_active
                            ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                            }`}
                    >
                        {actionLoading === user.id ? <Loader2 size={16} className="animate-spin" /> : (user.is_active ? <Lock size={16} /> : <Unlock size={16} />)}
                        {user.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                    </button>

                    <button
                        onClick={() => handleViewDetails(user)} // إضافة هذا السطر
                        className="p-3.5 bg-white/5 text-gray-400 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all border border-white/10"
                        title="عرض الملف الشخصي"
                    >
                        <Eye size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );

    if (isFirstLoading) return <LoadingScreen />;
    return (
        <div className="flex min-h-screen bg-[#050508] text-white dir-rtl" dir="rtl">
            <AdminSidebar />

            <main className="flex-1 p-4 lg:p-10 max-w-[1600px] mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600/20 rounded-[1.5rem] flex items-center justify-center border border-indigo-500/30">
                            <Users className="text-indigo-500" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">إدارة الكوادر</h1>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">التحكم في مستخدمي منصة توبا سوفت</p>
                        </div>
                    </div>

                    
                </div>

                {/* Search & Filters */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
                    <div className="lg:col-span-2 relative group">
                        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="ابحث عن اسم، بريد، أو معرف..."
                            className="w-full bg-[#0f0f1a]/60 border border-white/5 pr-14 pl-6 py-4.5 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-500/50 transition-all"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="bg-[#0f0f1a]/60 border border-white/5 px-6 py-4.5 rounded-2xl text-sm font-black focus:outline-none focus:border-indigo-500/50 appearance-none"
                    >
                        <option value="all">كل الأدوار</option>
                        <option value="student">المتطوعين</option>
                        <option value="organization">المؤسسات</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-[#0f0f1a]/60 border border-white/5 px-6 py-4.5 rounded-2xl text-sm font-black focus:outline-none focus:border-indigo-500/50 appearance-none"
                    >
                        <option value="all">كل الحالات</option>
                        <option value="active">نشط فقط</option>
                        <option value="inactive">معطل فقط</option>
                    </select>
                </div>


                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: 'الإجمالي', val: globalStats.total, icon: Users, color: 'text-indigo-500' },
                        { label: 'المتطوعين', val: globalStats.students, icon: GraduationCap, color: 'text-blue-500' },
                        { label: 'الشركاء', val: globalStats.orgs, icon: Building2, color: 'text-amber-500' },
                        { label: 'النشطين', val: globalStats.active, icon: Activity, color: 'text-emerald-500' },
                    ].map((st, i) => (
                        <div key={i} className="bg-[#0f0f1a]/40 border border-white/5 p-4 rounded-3xl flex items-center gap-4">
                            <div className={`p-3 rounded-2xl bg-white/5 ${st.color}`}>
                                <st.icon size={20} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-500 uppercase">{st.label}</p>
                                <p className="text-xl font-black">{st.val}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content Area - Cards Grid */}
                <div key={`${search}-${page}`} className="relative min-h-[500px]">
                    <div className={`grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity duration-300 ${loadingSearch ? 'opacity-50' : 'opacity-100'}`}>
                        {loadingSearch ? (
                            Array.from({ length: 8 }).map((_, i) => <UserCardSkeleton key={i} />)
                        ) : users.length > 0 ? (
                            users.map(user => <UserCard key={user.id} user={user} />)
                        ) : !loadingSearch && (
                            <div className="col-span-full py-20 text-center">
                                <h3 className="text-xl font-black text-gray-500">لا يوجد نتائج تطابق بحثك</h3>
                            </div>
                        )}
                    </div>

                </div>

                {/* Pagination */}
                {meta.last_page > 1 && (
                    <div className="mt-12 flex flex-wrap items-center justify-between gap-6 bg-[#0f0f1a]/60 p-6 rounded-[2rem] border border-white/5">
                        <p className="text-[11px] font-black text-gray-500 uppercase italic">
                            عرض {users.length} من أصل {meta.total} مستخدم
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 hover:bg-indigo-600 disabled:opacity-20 transition-all"
                            >
                                <ChevronRight size={20} />
                            </button>

                            <div className="flex gap-1">
                                {[...Array(meta.last_page)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setPage(i + 1)}
                                        className={`w-11 h-11 rounded-xl text-xs font-black transition-all ${page === i + 1 ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-white/10'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                                disabled={page === meta.last_page}
                                className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 hover:bg-indigo-600 disabled:opacity-20 transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
            `}</style>
        </div>
    );
};
const UserCardSkeleton = () => (
    <div className="bg-[#0f0f1a]/40 border border-white/5 rounded-[2.5rem] p-6 animate-pulse">
        <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-[1.8rem] bg-white/5 mb-4" />
            <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
            <div className="h-3 w-1/2 bg-white/5 rounded mb-6" />
            <div className="grid grid-cols-2 gap-3 w-full mb-6">
                <div className="h-10 bg-white/5 rounded-2xl" />
                <div className="h-10 bg-white/5 rounded-2xl" />
            </div>
            <div className="h-12 w-full bg-white/5 rounded-2xl" />
        </div>
    </div>
);
const LoadingScreen = () => (
    <div className="h-screen bg-[#05050a] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="relative">
            <div className="w-32 h-32 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-4 border-4 border-purple-500/10 border-b-purple-500 rounded-full animate-spin-slow " />
        </div>
        <div className="mt-12 text-center relative z-10">
            <h2 className="text-2xl font-black text-white tracking-[0.3em] uppercase">Musanada Intelligence</h2>
            <p className="text-xs text-blue-400 mt-4 font-bold animate-pulse">جاري تجميع البيانات من بحيرة البيانات المركزية...</p>
        </div>
    </div>
);
export default AdminUsers;