import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MapPin, Search, Filter, Loader2, Award, Building2, Clock, 
    CalendarDays, ArrowRight, Zap, Target, Star, ExternalLink, 
    ShieldCheck, Navigation, LocateFixed, Info, Layers, 
    Compass, Activity, MousePointer2, Share2, Heart,
    X, CheckCircle2, Map as MapIcon, TrendingUp, Menu,
    ChevronLeft, ListFilter, Gauge
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, ZoomControl, Tooltip as LeafletTooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import { toast, Toaster } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';

const MySwal = withReactContent(Swal);

// --- 1. الصيغ الرياضية والجغرافية المتقدمة ---
/**
 * حساب المسافة باستخدام Haversine Formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
};

// --- 2. تعريف الأيقونات المخصصة (بأسلوب عصري) ---
const userIcon = L.divIcon({
    className: 'user-location-marker',
    html: `
        <div class="relative">
            <div class="absolute inset-[-8px] rounded-full bg-indigo-500/30 animate-ping"></div>
            <div class="relative w-7 h-7 bg-white rounded-full shadow-[0_0_20px_rgba(99,102,241,0.8)] flex items-center justify-center border-2 border-indigo-600">
                <div class="w-3 h-3 bg-indigo-600 rounded-full"></div>
            </div>
        </div>`,
    iconSize: [28, 28],
});

const getOppIcon = (type, isSelected) => L.divIcon({
    className: 'custom-marker',
    html: `
        <div class="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-500 ${
            isSelected ? 'bg-white scale-125 shadow-indigo-500/50' : (type === 'voluntary' ? 'bg-emerald-500' : 'bg-violet-500')
        } shadow-lg border-2 border-white/20">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="${isSelected ? '#4f46e5' : 'white'}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
        </div>`,
    iconSize: [40, 40],
});

// --- 3. مكونات المساعدة المخصصة للخريطة ---
const MapEventsHandler = ({ onUserLocationFound }) => {
    const map = useMap();
    useEffect(() => {
        map.locate({ setView: false, enableHighAccuracy: true });
        map.on('locationfound', (e) => {
            onUserLocationFound([e.latlng.lat, e.latlng.lng]);
        });
    }, [map, onUserLocationFound]);
    return null;
};

const FlyToLocation = ({ center, zoom = 14 }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, zoom, { duration: 1.8, easeLinearity: 0.25 });
    }, [center, zoom, map]);
    return null;
};

// --- 4. المكون الرئيسي ---
const OpportunitiesMap = () => {
    const navigate = useNavigate();
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [userLocation, setUserLocation] = useState(null);
    const [mapCenter, setMapCenter] = useState([24.74896138, 46.57748130]); 
    const [selectedOpp, setSelectedOpp] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [viewMode, setViewMode] = useState('standard');
    const [showPaths, setShowPaths] = useState(true);

  
    const fetchOpportunities = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/opportunities', {
                params: { status: 'open', search: searchTerm, type: filterType === 'all' ? null : filterType }
            });
            
            let data = (response.data.data || response.data).filter(o => o.lat && o.lng);

            // حساب المسافة لكل فرصة
            if (userLocation) {
                data = data.map(opp => ({
                    ...opp,
                    distance: calculateDistance(userLocation[0], userLocation[1], parseFloat(opp.lat), parseFloat(opp.lng))
                })).sort((a, b) => a.distance - b.distance); // الترتيب من الأقرب
            }

            setOpportunities(data);
        } catch (error) {
            console.log(error);
            toast.error('حدث خطأ أثناء تحديث البيانات');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, filterType, userLocation]);

    useEffect(() => {
        fetchOpportunities();
    }, [fetchOpportunities]);

    // مراقبة حجم الشاشة للتجاوب
    useEffect(() => {
        const handleResize = () => setIsSidebarOpen(window.innerWidth > 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // دالة العرض المنبثق الاحترافي
    const handleShowDetails = (opp) => {
        MySwal.fire({
            html: (
                <div className="flex flex-col text-right font-['Tajawal']" dir="rtl">
                    <div className="relative w-full h-48 rounded-3xl overflow-hidden mb-5 group shadow-lg">
                        <img 
                            src={opp.cover_image} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-4 right-4 text-white">
                            <span className="text-[10px] bg-indigo-600 px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg">
                                {opp.type === 'voluntary' ? 'تطوعي' : 'تدريبي'}
                            </span>
                        </div>
                    </div>

                    <h2 className="text-xl font-black text-white mb-2 leading-tight">{opp.title}</h2>
                    <div className="flex items-center gap-2 mb-4 text-gray-400">
                        <Building2 size={16} className="text-indigo-400" />
                        <span className="text-xs font-bold">{opp.user?.organization?.org_name || 'جهة معتمدة'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <StatItem icon={Navigation} label="المسافة" value={opp.distance ? `${opp.distance} كم` : 'جاري الحساب'} color="#6366f1" />
                        <StatItem icon={Clock} label="المدة" value={opp.duration || 'غير محدد'} color="#8b5cf6" />
                    </div>

                    <button 
                        onClick={() => { Swal.close(); navigate(`/opportunities/${opp.id}`); }}
                        className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-xl"
                    >
                        استعراض التفاصيل الكاملة <ArrowRight size={18} />
                    </button>
                </div>
            ),
            background: '#0a0a10',
            showConfirmButton: false,
            width: '400px',
            customClass: { popup: 'rounded-[2.5rem] border border-white/10 p-2' }
        });
    };

    return (
        <div className="flex h-screen bg-[#050508] text-white font-['Tajawal'] overflow-hidden selection:bg-indigo-500/30" dir="rtl">
            <Toaster position="bottom-right" />
            <Sidebar active="opportunities" />

            <main className="flex-1 flex flex-col relative">
                
                {/* 1. رأس الصفحة الذكي (Search Bar) */}
                <div className="absolute top-6 inset-x-6 z-[1000] flex flex-col lg:flex-row gap-4 pointer-events-none">
                    <motion.div 
                        initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        className="flex-1 pointer-events-auto max-w-2xl"
                    >
                        <div className="bg-[#11111a]/90 backdrop-blur-2xl border border-white/10 p-2 rounded-[2rem] shadow-2xl flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input 
                                    type="text"
                                    placeholder="ابحث عن الفرص في منطقتك..."
                                    className="w-full bg-black/40 border border-white/5 pr-12 pl-4 py-3.5 rounded-[1.5rem] outline-none text-sm font-bold focus:ring-2 ring-indigo-500/20 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="hidden sm:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                                {['all', 'voluntary', 'training'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setFilterType(t)}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${filterType === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        {t === 'all' ? 'الكل' : t === 'voluntary' ? 'تطوع' : 'تدريب'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <div className="flex gap-2 pointer-events-auto">
                        <ControlBtn onClick={() => userLocation && setMapCenter(userLocation)} icon={LocateFixed} />
                        <ControlBtn onClick={() => setShowPaths(!showPaths)} icon={Compass} active={showPaths} />
                        <ControlBtn onClick={() => setIsSidebarOpen(!isSidebarOpen)} icon={Menu} />
                    </div>
                </div>

                {/* 2. حاوية الخريطة */}
                <div className="flex-1 relative z-10 group">
                    <MapContainer 
                        center={mapCenter} 
                        zoom={13} 
                        className="h-full w-full"
                        zoomControl={false}
                    >
                        <TileLayer
                            url={viewMode === 'standard' 
                                ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            }
                        />

                        <ZoomControl position="bottomleft" />
                        <MapEventsHandler onUserLocationFound={setUserLocation} />
                        <FlyToLocation center={mapCenter} />

                        {/* موقع المستخدم */}
                        {userLocation && (
                            <Marker position={userLocation} icon={userIcon}>
                                <Popup>أنت هنا</Popup>
                            </Marker>
                        )}

                        {/* الفرص والخطوط الرابطة */}
                        {opportunities.map(opp => (
                            <React.Fragment key={opp.id}>
                                <Marker 
                                    position={[parseFloat(opp.lat), parseFloat(opp.lng)]}
                                    icon={getOppIcon(opp.type, selectedOpp?.id === opp.id)}
                                    eventHandlers={{ click: () => setSelectedOpp(opp) }}
                                >
                                    <Popup className="custom-popup" closeButton={false}>
                                        <div className="text-right p-1 font-['Tajawal']">
                                            <p className="font-black text-indigo-400 text-sm mb-1">{opp.title}</p>
                                            <p className="text-[10px] text-gray-400 mb-2">{opp.distance} كم من موقعك</p>
                                            <button 
                                                onClick={() => handleShowDetails(opp)}
                                                className="w-full bg-indigo-600 py-1.5 rounded-lg text-[10px] font-black text-white"
                                            >
                                                التفاصيل السريعة
                                            </button>
                                        </div>
                                    </Popup>
                                    <LeafletTooltip direction="top" offset={[0, -20]} opacity={1}>
                                        <span className="font-bold text-[10px]">{opp.title}</span>
                                    </LeafletTooltip>
                                </Marker>

                                {/* رسم المسار */}
                                {showPaths && userLocation && (
                                    <Polyline 
                                        positions={[userLocation, [parseFloat(opp.lat), parseFloat(opp.lng)]]}
                                        pathOptions={{ 
                                            color: selectedOpp?.id === opp.id ? '#6366f1' : '#ffffff', 
                                            weight: selectedOpp?.id === opp.id ? 3 : 1,
                                            dashArray: '10, 10',
                                            opacity: selectedOpp?.id === opp.id ? 0.8 : 0.2
                                        }}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </MapContainer>

                    {/* 3. القائمة الجانبية المستجيبة */}
                    <AnimatePresence>
                        {isSidebarOpen && (
                            <motion.aside 
                                initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
                                className="absolute right-6 top-28 bottom-24 w-[350px] bg-[#0d0d14]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] z-[1001] shadow-2xl p-6 flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="font-black text-lg">الأقرب إليك</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">مرتبة جغرافياً حسب موقعك الحالي</p>
                                    </div>
                                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hover:bg-red-400/50  p-3 bg-white/5 rounded-full cursor-pointer">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center h-40 opacity-30">
                                            <Loader2 className="animate-spin mb-3" size={24} />
                                            <span className="text-xs font-bold uppercase tracking-tighter">جاري المسح...</span>
                                        </div>
                                    ) : (
                                        opportunities.map(opp => (
                                            <div 
                                                key={opp.id}
                                                onClick={() => {
                                                    setSelectedOpp(opp);
                                                    setMapCenter([parseFloat(opp.lat), parseFloat(opp.lng)]);
                                                }}
                                                className={`p-4 rounded-md border transition-all cursor-pointer group ${
                                                    selectedOpp?.id === opp.id ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05]'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className={`w-2 h-2 rounded-full mt-1 ${opp.type === 'voluntary' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-violet-500'}`} />
                                                    <span className="text-[10px] font-black text-indigo-400 flex items-center gap-1">
                                                        <Navigation size={10} /> {opp.distance} كم
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-sm text-gray-200 group-hover:text-white transition-colors mb-2 line-clamp-1">{opp.title}</h4>
                                                <div className="flex items-center justify-between text-[10px] text-gray-500">
                                                    <span className="truncate max-w-[150px]">{opp.user?.organization?.org_name}</span>
                                                    <span className="flex items-center gap-1"><Star size={10} className="text-amber-500 fill-amber-500" /> 4.8</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-6 bg-indigo-600 p-5 rounded-md relative overflow-hidden group">
                                    <MapIcon size={60} className="absolute -left-2 -bottom-2 text-white/10 rotate-12 transition-transform group-hover:scale-125" />
                                    <p className="text-[10px] font-black text-white/60 mb-1">الفرص المكتشفة</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black">{opportunities.length}</span>
                                        <span className="text-xs font-bold text-white/80 uppercase">فرصة نشطة</span>
                                    </div>
                                </div>
                            </motion.aside>
                        )}
                    </AnimatePresence>

                    {/* 4. مبدل وضع الخريطة (الأسفل) */}
                    <div className="absolute left-6 bottom-10 z-[1000] flex gap-2">
                        <button 
                            onClick={() => setViewMode(viewMode === 'standard' ? 'satellite' : 'standard')}
                            className="bg-[#0f0f1a] border border-white/10 px-5 py-3.5 rounded-2xl shadow-2xl hover:bg-indigo-600 transition-all text-[11px] font-black uppercase flex items-center gap-3"
                        >
                            <Layers size={18} /> {viewMode === 'standard' ? 'قمر صناعي' : 'خريطة افتراضية'}
                        </button>
                    </div>

                </div>

                {/* 5. لوحة التحكم بالفرصة المختارة (Floating Panel) */}
                <AnimatePresence>
                    {selectedOpp && (
                        <motion.div 
                            initial={{ y: 100, x: '-50%', opacity: 0 }} animate={{ y: 0, x: '-50%', opacity: 1 }} exit={{ y: 100, x: '-50%', opacity: 0 }}
                            className="absolute bottom-8 left-1/2 z-[1002] w-[90%] max-w-lg bg-[#0d0d14]/98 backdrop-blur-3xl border border-indigo-500/30 p-4 rounded-[2.5rem] shadow-2xl flex items-center gap-4"
                        >
                            <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                                <img 
                                    src={selectedOpp.cover_image } 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-black text-white truncate mb-0.5">{selectedOpp.title}</h4>
                                <p className="text-[11px] text-gray-500 font-bold truncate">{selectedOpp.user?.organization?.org_name}</p>
                                <div className="flex items-center gap-3 mt-1 text-[10px]">
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                        <Navigation size={10} /> {selectedOpp.distance} كم
                                    </span>
                                    <span className="text-indigo-400 font-bold flex items-center gap-1">
                                        <Clock size={10} /> {selectedOpp.duration}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-1.5">
                                <button onClick={() => handleShowDetails(selectedOpp)} className="p-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors"><Info size={18} /></button>
                                <button onClick={() => setSelectedOpp(null)} className="p-3 bg-white/5 rounded-xl hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors"><X size={18} /></button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* تخصيص أنماط Leaflet بالـ CSS */}
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-popup .leaflet-popup-content-wrapper {
                    background: #0d0d14 !important;
                    color: white !important;
                    border-radius: 1.5rem !important;
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 4px;
                }
                .custom-popup .leaflet-popup-tip { background: #0d0d14 !important; }
                .leaflet-container { background: #050508 !important; }
                .leaflet-control-zoom { border: none !important; margin: 24px !important; }
                .leaflet-control-zoom-in, .leaflet-control-zoom-out {
                    background: #11111a !important;
                    color: #6366f1 !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    border-radius: 12px !important;
                    margin-bottom: 5px !important;
                    width: 44px !important;
                    height: 44px !important;
                    line-height: 44px !important;
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
                @media (max-width: 640px) {
                    .leaflet-control-zoom { display: none !important; }
                }
            `}} />
        </div>
    );
};

// --- المكونات الفرعية الصغيرة ---
const ControlBtn = ({ icon: Icon, onClick, active, className = "" }) => (
    <button 
        onClick={onClick}
        className={`p-4 rounded-2xl shadow-2xl transition-all active:scale-90 border border-white/10 ${
            active ? 'bg-indigo-600 text-white' : 'bg-[#11111a]/90 text-gray-400 hover:text-white'
        } ${className}`}
    >
        <Icon size={22} />
    </button>
);

const StatItem = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col items-center text-center">
        <Icon size={16} style={{ color }} className="mb-1" />
        <span className="text-[9px] text-gray-500 font-bold uppercase">{label}</span>
        <span className="text-xs font-black text-white">{value}</span>
    </div>
);

export default OpportunitiesMap;