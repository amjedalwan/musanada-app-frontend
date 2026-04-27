import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

/**
 * تحديث الكاميرا (فقط عند التحميل الأول أو تغيير يدوي خارجي)
 */
function MapUpdater({ center, isEditing }) {
    const map = useMap();
    const [hasCentered, setHasCentered] = useState(false);

    useEffect(() => {
        if (!center || isNaN(center[0]) || isNaN(center[1])) return;

        // إذا كنا نعدل وسبق أن حددنا المركز، لا تلاحق الدبوس
        if (isEditing && hasCentered) return;

        const timer = setTimeout(() => {
            map.flyTo(center, map.getZoom(), { duration: 0.8 });
            setHasCentered(true);
        }, 100);

        return () => clearTimeout(timer);
    }, [center, map, isEditing]);

    return null;
}

function LocationMarker({ isEditing, onLocationSelect, position }) {
    useMapEvents({
        click(e) {
            if (isEditing && onLocationSelect) {
                onLocationSelect(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return position && !isNaN(position[0]) ? <Marker position={position} /> : null;
}

const InteractiveMap = ({ lat, lng, onLocationSelect, isEditing }) => {
    const defaultLat = 24.3694;
    const defaultLng = 46.1910;

    const safeLat = parseFloat(lat);
    const safeLng = parseFloat(lng);

    // التحقق هل الإحداثيات القادمة من الـ Props صالحة؟
    const hasValidProps = !isNaN(safeLat) && !isNaN(safeLng);

    // نستخدم الإحداثيات القادمة أو الافتراضية
    const currentPosition = hasValidProps ? [safeLat, safeLng] : [defaultLat, defaultLng];
    return (
        <div className="h-full w-full bg-[#0b0f1a] overflow-hidden relative z-0">
            <MapContainer
                // إزالة الـ key الديناميكي لمنع إعادة بناء الخريطة عند كل نقرة
                center={currentPosition}
                zoom={14}
                minZoom={3}
                maxZoom={19}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                zoomControl={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                />

                <MapUpdater center={currentPosition} isEditing={isEditing} />

                <LocationMarker
                    isEditing={isEditing}
                    onLocationSelect={onLocationSelect}
                    position={currentPosition}
                />
            </MapContainer>

            <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-3xl shadow-[inset_0_0_40px_rgba(0,0,0,0.3)]"></div>
        </div>
    );
};

export default InteractiveMap;