import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Sale } from '../types';
import { Package, MapPin, Home, DollarSign } from 'lucide-react';

// Fix for default marker icon in Leaflet + Webpack/Vite
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to auto-fit bounds
const AutoFitBounds: React.FC<{ markers: Sale[] }> = ({ markers }) => {
  const map = useMap();
  
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat!, m.lng!]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 });
    }
  }, [markers, map]);
  
  return null;
};

// Custom red icon for sales
const RedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface CustomerMapProps {
  sales: Sale[];
  height?: string;
  className?: string;
}

const CustomerMap: React.FC<CustomerMapProps> = ({ sales, height = '600px', className = '' }) => {
  const salesWithCoords = sales.filter(s => s.lat && s.lng && s.status === 'Ativa' && !s.inTrash);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const calculateBruto = (sale: Sale) => {
    return (sale.immComm1 || 0) + (sale.immComm2 || 0) + ((sale.installmentCommission || 0) * (sale.installmentCount || 0));
  };

  // South America bounds
  const southAmericaBounds: L.LatLngBoundsExpression = [
    [-56, -92], // Southwest
    [15, -30]   // Northeast
  ];

  return (
    <div className={`w-full rounded-[40px] overflow-hidden border border-brand-border shadow-2xl ${className}`} style={{ height }}>
      <MapContainer 
        center={[-15.0, -60.0]} 
        zoom={4} 
        minZoom={3}
        maxZoom={10}
        maxBounds={southAmericaBounds}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AutoFitBounds markers={salesWithCoords} />
        {salesWithCoords.map(sale => (
          <Marker 
            key={sale.id} 
            position={[sale.lat!, sale.lng!]} 
            icon={RedIcon}
          >
            <Popup className="custom-popup">
              <div className="p-2 min-w-[180px] bg-brand-card">
                <h3 className="font-black text-brand-accent text-sm uppercase tracking-tighter mb-1">{sale.titular}</h3>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-300 m-0 flex items-center">
                    <Package size={12} className="mr-1 text-brand-accent" /> {sale.productName}
                  </p>
                  <p className="text-[10px] text-slate-400 m-0 flex items-center">
                    <Home size={12} className="mr-1 text-brand-accent" /> {sale.roomName}
                  </p>
                  <p className="text-[10px] text-slate-500 m-0 flex items-center">
                    <MapPin size={12} className="mr-1 text-brand-accent" /> {sale.cidade} - {sale.uf}
                  </p>
                  <div className="mt-2 flex items-center justify-between border-t border-brand-border pt-2">
                    <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest">Valor</p>
                    <p className="text-[11px] font-black text-brand-text font-mono">{formatCurrency(calculateBruto(sale))}</p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default CustomerMap;
