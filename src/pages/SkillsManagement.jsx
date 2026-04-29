import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Plus, Search, Edit3, Trash2, Code, Zap, 
    TrendingUp, BarChart3, Loader2, Target,
    MoreVertical, ShieldCheck, LayoutGrid, List,
    Filter, ArrowUpRight, Award, Layers,
    ChevronDown, Globe, Cpu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, AreaChart, Area } from 'recharts';
import api from '../api/axios';
import AdminSidebar from '../components/AdminSidebar';
import Swal from 'sweetalert2';

const SkillsManagement = () => {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); 
    const [sortBy, setSortBy] = useState('users_count'); // 'name', 'users_count'
    const [formData, setFormData] = useState({ id: null, name: '' });

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        background: '#ffffff',
        color: '#1e293b',
        customClass: { popup: 'border border-slate-100 rounded-2xl shadow-xl' }
    });

    const fetchSkills = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/skills');
            setSkills(response.data || []);
        } catch (error) {
            Toast.fire({ icon: 'error', title: 'فشل مزامنة البيانات من الخادم' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSkills(); }, [fetchSkills]);

    // معالجة البيانات المتقدمة (البحث والفرز)
    const processedSkills = useMemo(() => {
        return skills
            .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                if (sortBy === 'users_count') return b.users_count - a.users_count;
                return a.name.localeCompare(b.name);
            });
    }, [skills, searchTerm, sortBy]);

    const chartData = useMemo(() => {
        return [...skills]
            .sort((a, b) => b.users_count - a.users_count)
            .slice(0, 8)
            .map(s => ({
                name: s.name,
                val: s.users_count || 0
            }));
    }, [skills]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const action = formData.id ? api.put(`/admin/skills/${formData.id}`, formData) : api.post('/admin/skills', formData);
        
        try {
            await action;
            Toast.fire({ icon: 'success', title: formData.id ? 'تم تحديث الكفاءة' : 'تم تسجيل الكفاءة بنجاح' });
            setIsModalOpen(false);
            setFormData({ id: null, name: '' });
            fetchSkills();
        } catch (error) {
            Toast.fire({ icon: 'error', title: 'حدث خطأ أثناء المعالجة' });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "لا يمكن التراجع عن حذف هذه المهارة من النظام",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، احذفها',
            cancelButtonText: 'إلغاء',
            background: '#ffffff',
            color: '#1e293b',
            confirmButtonColor: '#ef4444',
            borderRadius: '24px'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/admin/skills/${id}`);
                fetchSkills();
                Toast.fire({ icon: 'success', title: 'تم الحذف بنجاح' });
            } catch (error) {
                Toast.fire({ icon: 'error', title: 'المهارة مرتبطة ببيانات أخرى' });
            }
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-['Cairo'] selection:bg-emerald-500/30" dir="rtl">
            <AdminSidebar />
            
            <main className="flex-1 p-4 lg:p-10 w-full max-w-[1700px] mx-auto max-h-screen overflow-y-auto custom-scrollbar">
                
                {/* --- Top Navbar/Header --- */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-600/20">
                                <Layers className="text-slate-900" size={28} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">إدارة الكفاءات</h1>
                                <p className="text-slate-400 text-sm font-medium mt-1">المحرك الذكي لتحليل وتصنيف مهارات "مساندة"</p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <motion.button 
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { setFormData({ id: null, name: '' }); setIsModalOpen(true); }}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-slate-900 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm transition-all hover:bg-slate-800 shadow-lg shadow-slate-900/10"
                        >
                            <Plus size={20} strokeWidth={3} />
                            إضافة مهارة
                        </motion.button>
                    </div>
                </header>

                {/* --- Analytics Section --- */}
                <div className="grid grid-cols-12 gap-6 mb-12">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="col-span-12 xl:col-span-8 bg-white border border-slate-100 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-sm"
                    >
                        <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                            <BarChart3 size={200} />
                        </div>
                        
                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                    <TrendingUp className="text-emerald-600" size={22} />
                                    المهارات الأكثر طلباً
                                </h3>
                                <p className="text-slate-400 text-xs mt-1 font-bold">توزيع الـ 8 مهارات الأعلى تسجيلاً</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black border border-emerald-100">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                    مباشر
                                </span>
                            </div>
                        </div>

                        <div className="h-[320px] w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" />
                                            <stop offset="100%" stopColor="#059669" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                                        dy={10}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 10 }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-2xl">
                                                        <p className="text-emerald-600 font-black text-xs mb-1">{payload[0].payload.name}</p>
                                                        <p className="text-slate-900 font-bold text-lg">{payload[0].value} <span className="text-[10px] text-slate-400">متطوع</span></p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="val" radius={[8, 8, 8, 8]} barSize={32}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="url(#barGradient)" fillOpacity={1 - (index * 0.1)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            className="flex-1 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-[2.5rem] p-8 text-slate-900 relative overflow-hidden shadow-2xl shadow-emerald-900/20"
                        >
                            <div className="relative z-10">
                                <p className="text-emerald-50 font-black text-sm uppercase tracking-widest mb-2 opacity-80">إجمالي قاعدة الكفاءات</p>
                                <h4 className="text-7xl font-black mb-6 tracking-tighter">{skills.length}</h4>
                                <div className="flex items-center gap-4">
                                    <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl flex items-center gap-2 border border-slate-200">
                                        <Award size={16} className="text-amber-400" />
                                        <span className="text-xs font-bold">نمو 12% هذا الشهر</span>
                                    </div>
                                </div>
                            </div>
                            <Cpu className="absolute -left-10 -bottom-10 text-slate-900/10" size={240} />
                        </motion.div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 hover:border-emerald-500/30 transition-colors shadow-sm">
                                <p className="text-slate-400 font-bold text-[10px] uppercase mb-2">الأعلى نشاطاً</p>
                                <h5 className="text-lg font-black text-slate-900 truncate">{chartData[0]?.name || '---'}</h5>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 hover:border-emerald-500/30 transition-colors shadow-sm">
                                <p className="text-slate-400 font-bold text-[10px] uppercase mb-2">حالة الخادم</p>
                                <h5 className="text-lg font-black text-emerald-500 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                    مستقر
                                </h5>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Filters & Search --- */}
                <div className="sticky top-4 z-40 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/80 backdrop-blur-xl p-4 border border-slate-100 rounded-3xl mb-8 shadow-sm">
                    <div className="relative w-full md:w-[450px]">
                        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="ابحث في أكثر من 100 مهارة..."
                            className="w-full bg-slate-50 border border-slate-100 pr-14 pl-6 py-4 rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="flex-1 md:flex-none bg-slate-50 border border-slate-100 text-slate-600 text-xs font-black px-6 py-4 rounded-2xl focus:outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                            <option value="users_count">الأكثر انتشاراً</option>
                            <option value="name">ترتيب أبجدي</option>
                        </select>
                        <div className="h-10 w-[1px] bg-slate-100 hidden md:block" />
                        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                            <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={20}/></button>
                            <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}><List size={20}/></button>
                        </div>
                    </div>
                </div>

                {/* --- Main Content Area --- */}
                <div className="min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="relative">
                                <Loader2 className="animate-spin text-emerald-600" size={60} strokeWidth={1} />
                            </div>
                            <p className="mt-6 text-slate-400 font-black text-xs uppercase tracking-[0.3em]">تحليل البيانات الضخمة...</p>
                        </div>
                    ) : (
                        <motion.div 
                            layout
                            className={viewMode === 'grid' 
                                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6" 
                                : "flex flex-col gap-4"
                            }
                        >
                            <AnimatePresence mode='popLayout'>
                                {processedSkills.map((skill, index) => (
                                    <motion.div
                                        key={skill.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.02 }}
                                        className={`group relative bg-white border border-slate-100 rounded-[2.2rem] transition-all hover:translate-y-[-5px] hover:border-emerald-500/40 hover:shadow-xl ${viewMode === 'list' ? 'flex items-center p-4' : 'p-8'}`}
                                    >
                                        <div className={`flex items-center gap-5 ${viewMode === 'list' ? 'flex-1' : 'mb-8'}`}>
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform duration-500 relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                                                <Code className="text-emerald-600 relative z-10" size={28} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 text-xl group-hover:text-emerald-600 transition-colors tracking-tight">{skill.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        {skill.users_count || 0} خبير مسجل
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`flex items-center gap-3 ${viewMode === 'grid' ? 'border-t border-slate-50 pt-6' : 'mr-auto px-4'}`}>
                                            <button 
                                                onClick={() => { setFormData(skill); setIsModalOpen(true); }}
                                                className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-emerald-600 hover:text-slate-900 text-slate-400 transition-all shadow-sm"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(skill.id)}
                                                className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-red-500 hover:text-slate-900 text-slate-400 transition-all shadow-sm"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            {viewMode === 'grid' && (
                                                <div className="mr-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ArrowUpRight className="text-emerald-500" size={24} />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>

                {/* --- Advanced Modal --- */}
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setIsModalOpen(false)}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                            />
                            <motion.div 
                                initial={{ y: 100, opacity: 0, scale: 0.95 }} 
                                animate={{ y: 0, opacity: 1, scale: 1 }} 
                                exit={{ y: 100, opacity: 0, scale: 0.95 }}
                                className="relative bg-white border border-slate-100 w-full max-w-lg overflow-hidden rounded-[3.5rem] shadow-2xl"
                            >
                                <div className="bg-emerald-600 p-8 text-slate-900 relative">
                                    <button onClick={() => setIsModalOpen(false)} className="absolute top-8 left-8 text-slate-900/50 hover:text-slate-900 transition-colors">
                                        <X size={24} />
                                    </button>
                                    <Target size={40} className="mb-4 opacity-50" />
                                    <h2 className="text-3xl font-black">{formData.id ? 'تعديل الكفاءة' : 'إضافة كفاءة جديدة'}</h2>
                                    <p className="text-emerald-50 text-sm mt-2 font-bold opacity-70">سيتم تحديث قاعدة البيانات المرتبطة بجميع المتطوعين</p>
                                </div>
                                
                                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">اسم المهارة البرمجية</label>
                                        <input 
                                            required autoFocus
                                            className="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl focus:outline-none focus:border-emerald-500 transition-all text-slate-900 font-black text-lg placeholder:text-slate-600"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            placeholder="مثلاً: Flutter Expert"
                                        />
                                    </div>
                                    
                                    <button 
                                        type="submit"
                                        className="w-full bg-emerald-600 py-6 rounded-3xl font-black text-slate-900 text-lg hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                                    >
                                        {formData.id ? 'حفظ التغييرات' : 'تأكيد الإضافة'}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 20px; }
            `}</style>
        </div>
    );
};

const LoadingScreen = () => (
    <div className="h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="relative">
            <div className="w-32 h-32 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-4 border-4 border-emerald-100 border-b-purple-500 rounded-full animate-spin-slow" />
        </div>
        <div className="mt-12 text-center relative z-10">
            <h2 className="text-2xl font-black text-slate-900 tracking-[0.3em] uppercase">Musanada Intelligence</h2>
            <p className="text-xs text-blue-400 mt-4 font-bold animate-pulse">جاري تجميع البيانات من بحيرة البيانات المركزية...</p>
        </div>
    </div>
);
export default SkillsManagement;