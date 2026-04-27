import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Check, Save, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

const ManageSkills = () => {
    const [allSkills, setAllSkills] = useState([]); // المهارات المتاحة في النظام
    const [mySkills, setMySkills] = useState([]);   // المهارات التي يمتلكها الطالب
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // جلب كل المهارات من الباك إند
                const resAll = await api.get('/skills');
                setAllSkills(resAll.data.data || []);

                // جلب مهارات المستخدم الحالي من البروفايل
                const resUser = await api.get('/profile');
                setMySkills(resUser.data.profile.skills || []);
            } catch (err) {
                console.error("خطأ في جلب المهارات", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleSkill = (skill) => {
        if (mySkills.find(s => s.id === skill.id)) {
            setMySkills(mySkills.filter(s => s.id !== skill.id));
        } else {
            setMySkills([...mySkills, skill]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/skills/attach', {
                skill_ids: mySkills.map(s => s.id)
            });
            alert("تم تحديث مهاراتك بنجاح");
        } catch (err) {
            alert("فشل الحفظ، حاول مرة أخرى");
        } finally {
            setSaving(false);
        }
    };

    const filteredSkills = allSkills.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <LoadingScreen />;

    return (
        <div className="flex min-h-screen bg-[#050508] text-white font-['Tajawal']" dir="rtl">
            <Sidebar role="student" />
            <main className="flex-1 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-purple-400">مهاراتي الشخصية</h1>
                            <p className="text-gray-400 mt-2">اختر المهارات التي تتقنها لتظهر في ملفك الشخصي وتزيد فرص قبولك.</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-2xl font-bold transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            حفظ التغييرات
                        </button>
                    </div>

                    {/* المهارات المختارة حالياً */}
                    <div className="bg-[#0a0a16] border border-white/5 p-6 rounded-3xl mb-8">
                        <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">المهارات المضافة ({mySkills.length})</h2>
                        <div className="flex flex-wrap gap-3">
                            {mySkills.length > 0 ? mySkills.map(skill => (
                                <span key={skill.id} className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-4 py-2 rounded-xl text-sm">
                                    {skill.name}
                                    <X size={14} className="cursor-pointer hover:text-white" onClick={() => toggleSkill(skill)} />
                                </span>
                            )) : <p className="text-gray-600 italic">لم تقم بإضافة أي مهارة بعد...</p>}
                        </div>
                    </div>

                    {/* البحث واختيار مهارات جديدة */}
                    <div className="relative mb-6">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="ابحث عن مهارة (مثلاً: تصميم، برمجة، إدارة...)"
                            className="w-full bg-[#0a0a16] border border-white/10 rounded-2xl py-4 pr-12 pl-4 outline-none focus:border-purple-500/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {loading ? <p>جاري التحميل...</p> : filteredSkills.map(skill => {
                            const isSelected = mySkills.find(s => s.id === skill.id);
                            return (
                                <div
                                    key={skill.id}
                                    onClick={() => toggleSkill(skill)}
                                    className={`cursor-pointer p-4 rounded-2xl border transition-all text-center ${isSelected
                                        ? 'bg-purple-600 border-purple-400 text-white'
                                        : 'bg-[#0a0a16] border-white/5 text-gray-400 hover:border-white/20'
                                        }`}
                                >
                                    {skill.name}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
};

const LoadingScreen = () => (
    <div className="h-screen bg-[#05050a] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="relative">
            <div className="w-32 h-32 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-4 border-4 border-purple-500/10 border-b-purple-500 rounded-full animate-spin-slow" />
        </div>
        <div className="mt-12 text-center relative z-10">
            <h2 className="text-2xl font-black text-white tracking-[0.3em] uppercase">Musanada Intelligence</h2>
            <p className="text-xs text-blue-400 mt-4 font-bold animate-pulse">جاري تجميع البيانات من بحيرة البيانات المركزية...</p>
        </div>
    </div>
);

export default ManageSkills;