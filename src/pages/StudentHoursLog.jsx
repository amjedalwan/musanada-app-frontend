import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Clock, CheckCircle2, Timer, FileSpreadsheet, Calendar,
    Search, Filter, ArrowUpRight, Hourglass, AlertCircle,
    ChevronLeft, ChevronRight, DownloadCloud, MoreVertical,
    FileText, Hash, MapPin, Trash2, RefreshCcw, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import Swal from 'sweetalert2';

/**
 * مكون سجل ساعات المتطوع - مشروع مساندة
 * صمم بواسطة: أمجد علوان (بناءً على الهوية البصرية المعتمدة)
 */
const StudentHoursLog = () => {
    // --- States ---
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [stats, setStats] = useState({
        total_hours: 0,
        approved_hours: 0,
        pending_hours: 0,
        rejected_hours: 0
    });

    // --- Fetch Data ---
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            // استدعاء البيانات من المسار المعتمد في الباك إند
            const res = await api.get('/student/my-logs');

            // الهيكلية المتوقعة: { success: true, logs: [...], stats: {...} }
            const dataLogs = res.data.logs || [];
            setLogs(dataLogs);

            // حساب الإحصائيات ديناميكياً من البيانات أو استقبالها جاهزة
            const calculatedStats = dataLogs.reduce((acc, curr) => {
                const h = parseFloat(curr.hours) || 0;
                if (curr.status === 'approved') acc.approved_hours += h;
                else if (curr.status === 'pending') acc.pending_hours += h;
                else if (curr.status === 'rejected') acc.rejected_hours += h;
                acc.total_hours += h;
                return acc;
            }, { total_hours: 0, approved_hours: 0, pending_hours: 0, rejected_hours: 0 });

            setStats(calculatedStats);

        } catch (err) {
            console.error("Error fetching logs:", err);
            Swal.fire({
                icon: 'error',
                title: 'عذراً.. تعذر جلب السجل',
                text: 'تأكد من اتصالك بالإنترنت أو حاول تسجيل الدخول مرة أخرى',
                background: '#0a0a0f',
                color: '#fff',
                confirmButtonColor: '#6366f1'
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);



    // --- Filtering Logic ---
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const title = log.opportunity?.title || '';
            const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterStatus === 'all' || log.status === filterStatus;
            return matchesSearch && matchesFilter;
        });
    }, [logs, searchTerm, filterStatus]);

    return (
        <div className="flex min-h-screen bg-[#050508] text-right font-['Tajawal'] overflow-hidden" dir="rtl">
            {/* الخلفية المشوشة (Blur Background) */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full"></div>
            </div>

            <Sidebar />
            {/* Grid Container */}
            {loading ? (
                <LoadingSpinner />
            ) : (
                <main className="flex-1  p-6 lg:p-10 relative z-10 overflow-y-auto max-h-screen custom-scrollbar">

                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* --- Header Section --- */}
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-2"
                            >
                                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                                    سجل <span className="text-indigo-500 italic">النشاط الزمني</span>
                                </h1>
                                <div className="flex items-center gap-3 text-slate-500 text-xs lg:text-sm bg-white/5 w-fit px-4 py-1.5 rounded-full border border-white/5">
                                    <Calendar size={14} className="text-indigo-400" />
                                    <span>تاريخ اليوم: {new Date().toLocaleDateString('ar-YE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                    <span className="text-indigo-300"><span className='mx-1'>{filteredLogs.length} </span>سجل  </span>
                                </div>
                            </motion.div>

                            <div className="flex gap-3 w-full md:w-auto">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={fetchLogs}
                                    className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                                >
                                    <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
                                </motion.button>

                            </div>
                        </header>

                        {/* --- Quick Stats Grid --- */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            <QuickStat
                                label="إجمالي الساعات"
                                value={stats.total_hours}
                                sub="كافة السجلات"
                                icon={<Clock />}
                                color="indigo"
                            />
                            <QuickStat
                                label="ساعات معتمدة"
                                value={stats.approved_hours}
                                sub="موثقة رسمياً"
                                icon={<CheckCircle2 />}
                                color="emerald"
                            />
                            <QuickStat
                                label="قيد المراجعة"
                                value={stats.pending_hours}
                                sub="بانتظار المؤسسة"
                                icon={<Hourglass />}
                                color="orange"
                            />
                            <QuickStat
                                label="ساعات مرفوضة"
                                value={stats.rejected_hours}
                                sub="تحتاج مراجعة"
                                icon={<AlertCircle />}
                                color="rose"
                            />
                        </section>

                        {/* --- Controls Bar --- */}
                        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 p-4 rounded-[2rem] flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1 group">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="البحث حسب اسم الفرصة..."
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pr-12 pl-4 outline-none focus:border-indigo-500/30 transition-all text-sm placeholder:text-slate-600"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                {['all', 'approved', 'pending', 'rejected'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${filterStatus === status
                                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-inner'
                                            : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                                            }`}
                                    >
                                        {status === 'all' ? 'الكل' : status === 'approved' ? 'المعتمدة' : status === 'pending' ? 'المعلقة' : 'المرفوضة'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* --- Main Table Container --- */}
                        <div className="bg-[#0a0a0f] border border-white/5 rounded-[2.5rem] shadow-3xl overflow-hidden relative">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead>
                                        <tr className="bg-white/[0.01] border-b border-white/5">
                                            <th className="p-6 text-slate-500 font-bold text-[10px] lg:text-xs uppercase tracking-[0.15em]">تفاصيل الفرصة</th>
                                            <th className="p-6 text-slate-500 font-bold text-[10px] lg:text-xs uppercase tracking-[0.15em]">التاريخ</th>
                                            <th className="p-6 text-slate-500 font-bold text-[10px] lg:text-xs uppercase tracking-[0.15em] text-center">المدة</th>
                                            <th className="p-6 text-slate-500 font-bold text-[10px] lg:text-xs uppercase tracking-[0.15em]">حالة الاعتماد</th>

                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        <AnimatePresence mode="popLayout">
                                            {loading ? (
                                                <TableRowLoader />
                                            ) : filteredLogs.length > 0 ? (
                                                filteredLogs.map((log, index) => (
                                                    <motion.tr
                                                        key={log.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="hover:bg-white/[0.01] transition-all group border-transparent border-r-2 hover:border-r-indigo-500"
                                                    >
                                                        <td className="p-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center text-indigo-400 border border-white/5 group-hover:scale-105 transition-transform">
                                                                    <FileText size={20} />
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-white group-hover:text-indigo-400 transition-colors text-sm lg:text-base">
                                                                        {log.opportunity?.title || 'فرصة تطوعية'}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <Hash size={12} className="text-slate-600" />
                                                                        <span className="text-[10px] text-slate-500 font-mono">LOG-{log.id}</span>
                                                                        <span className="w-1 h-1 rounded-full bg-slate-800"></span>
                                                                        <span className="text-[10px] text-slate-500">{log.opportunity?.type || 'ميداني'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="text-slate-300 font-mono text-sm flex items-center gap-2">
                                                                    <Calendar size={14} className="text-slate-600" />
                                                                    {new Date(log.date_logged).toLocaleDateString('en-EG')}
                                                                </div>

                                                            </div>
                                                        </td>
                                                        <td className="p-6 text-center">
                                                            <div className="inline-flex flex-col items-center">
                                                                <span className="text-xl font-black text-white font-mono leading-none">{log.hours}</span>
                                                                <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-tighter">ساعة</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            <StatusChip status={log.status} />
                                                        </td>

                                                    </motion.tr>
                                                ))
                                            ) : (
                                                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                    <td colSpan="5" className="p-24 text-center">
                                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                                                                <Search size={40} />
                                                            </div>
                                                            <p className="text-xl font-bold italic tracking-wider">لا توجد سجلات مطابقة لمعايير البحث</p>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            )}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* --- Footer Pagination (Dummy for UI) --- */}
                        <footer className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                            <div className="text-xs text-slate-500 font-bold px-4">
                                عرض {filteredLogs.length} من أصل {logs.length} سجل
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-500 hover:text-white disabled:opacity-30 cursor-pointer transition-all">
                                    <ChevronRight size={20} />
                                </button>
                                <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-500 hover:text-white disabled:opacity-30 cursor-pointer transition-all">
                                    <ChevronLeft size={20} />
                                </button>
                            </div>
                        </footer>
                    </div>
                </main>)}
        </div>
    );
};

// --- Sub-Components ---

const QuickStat = ({ label, value, sub, icon, color }) => {
    const themes = {
        indigo: "text-indigo-400 bg-indigo-500/5 border-indigo-500/10 shadow-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/30",
        emerald: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10 shadow-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30",
        orange: "text-orange-400 bg-orange-500/5 border-orange-500/10 shadow-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500/30",
        rose: "text-rose-400 bg-rose-500/5 border-rose-500/10 shadow-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/30",
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`p-6 rounded-[2rem] border backdrop-blur-md transition-all duration-500 shadow-2xl relative overflow-hidden group ${themes[color]}`}
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20"></div>
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-black/30 rounded-2xl ring-1 ring-white/10 group-hover:scale-110 transition-transform">{icon}</div>
            </div>
            <div className="space-y-1">
                <div className="text-4xl font-black text-white tabular-nums tracking-tighter flex items-baseline gap-1">
                    {value}
                    <span className="text-xs font-bold text-slate-500">h</span>
                </div>
                <div className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60 text-current">{label}</div>
                <div className="text-[10px] font-bold opacity-30 italic group-hover:opacity-50 transition-opacity">{sub}</div>
            </div>
        </motion.div>
    );
};

const StatusChip = ({ status }) => {
    const config = {
        approved: { label: "معتمد رسمي", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500" },
        pending: { label: "بانتظار المراجعة", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-500" },
        rejected: { label: "تم الرفض", color: "bg-rose-500/10 text-rose-400 border-rose-500/20", dot: "bg-rose-500" },
    };
    const s = config[status] || config.pending;
    return (
        <span className={`${s.color} border px-4 py-2 rounded-2xl text-[10px] font-black flex items-center gap-2.5 w-fit shadow-lg shadow-black/20`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shadow-[0_0_8px_currentcolor]`}></span>
            {s.label}
        </span>
    );
};
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-40 w-full">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/10 border-t-purple-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-emerald-500 rounded-full animate-spin animate-pulse" />
        </div>
        <h2 className="mt-8 text-xl font-black text-white tracking-widest animate-pulse uppercase">Syncing Database...</h2>
        <p className="text-gray-600 mt-2 font-bold">يرجى الانتظار، جاري تحضير البيانات</p>
    </div>
);
const TableRowLoader = () => (
    Array(5).fill(0).map((_, i) => (
        <tr key={i} className="animate-pulse">
            <td className="p-6"><div className="flex gap-4 items-center"><div className="w-12 h-12 bg-white/5 rounded-2xl"></div><div className="space-y-2"><div className="h-4 w-32 bg-white/5 rounded"></div><div className="h-2 w-20 bg-white/5 rounded"></div></div></div></td>
            <td className="p-6"><div className="h-4 w-24 bg-white/5 rounded"></div></td>
            <td className="p-6"><div className="h-8 w-12 mx-auto bg-white/5 rounded-full"></div></td>
            <td className="p-6"><div className="h-8 w-24 bg-white/5 rounded-2xl"></div></td>
            <td className="p-6"><div className="h-4 w-4 bg-white/5 rounded ml-auto"></div></td>
        </tr>
    ))
);

export default StudentHoursLog;