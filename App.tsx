
import React, { useState, useEffect } from 'react';
import { AppTab, VendaSubTab, Product, Room, Sale, AuditLog, DefaultSaleConfig, ProductCategory, CancelType } from './types';
import Navbar from './components/Navbar';
import SalesForm from './components/SalesForm';
import SalesLog from './components/SalesLog';
import Dashboard from './components/Dashboard';
import AnimateIn from './components/AnimateIn';
import ConfigPanel from './components/ConfigPanel';
import CustomerMap from './components/CustomerMap';
import { getCoordinatesFromCEP } from './geocoding';
import { CheckCircle2, Info, PenLine, Bot, Map, Star, BarChart3, LayoutDashboard } from 'lucide-react';

// Novos Dados Oficiais de Fábrica - Produtos
const OFFICIAL_PRODUCT_DATA = [
  { name: 'Garden 1Q', entry: 4490.00, cap: 1083.85, lin: 977.45, clo: 977.45, ftb: 1954.90 },
  { name: 'Garden 2Q', entry: 4490.00, cap: 1449.64, lin: 1288.48, clo: 1288.48, ftb: 2576.96 },
  { name: 'Valley F1', entry: 4490.00, cap: 896.05, lin: 817.76, clo: 817.76, ftb: 1635.52 },
  { name: 'Valley F2', entry: 4490.00, cap: 1312.51, lin: 1171.89, clo: 1171.89, ftb: 2343.78 },
  { name: 'Valley F3', entry: 4490.00, cap: 1503.25, lin: 1334.08, clo: 1334.08, ftb: 2668.16 },
  { name: 'Valley F4', entry: 4490.00, cap: 1803.55, lin: 1589.44, clo: 1589.44, ftb: 3178.88 },
  { name: 'Areya F1', entry: 3990.00, cap: 406.98, lin: 339.15, clo: 339.15, ftb: 678.30 },
  { name: 'Areya F2', entry: 3990.00, cap: 768.35, lin: 640.29, clo: 640.29, ftb: 1280.58 },
  { name: 'Areya F3', entry: 3990.00, cap: 843.87, lin: 703.23, clo: 703.23, ftb: 1406.46 },
  { name: 'Jeriquiá L. F1', entry: 3990.00, cap: 383.02, lin: 319.18, clo: 319.18, ftb: 638.36 },
  { name: 'Jeriquiá L. F2', entry: 3990.00, cap: 657.72, lin: 548.11, clo: 548.11, ftb: 1096.22 },
  { name: 'Jeriquiá L. F3', entry: 3990.00, cap: 890.33, lin: 741.94, clo: 741.94, ftb: 1483.88 },
  { name: '2 Life F1', entry: 3990.00, cap: 753.09, lin: 626.52, clo: 626.52, ftb: 1253.04 },
  { name: '3 Life F1', entry: 3990.00, cap: 999.90, lin: 835.36, clo: 835.36, ftb: 1670.72 },
  { name: '4 Life F1', entry: 3990.00, cap: 1285.14, lin: 1069.51, clo: 1069.51, ftb: 2139.02 },
  { name: 'Exclusive 1Q-2S', entry: 3990.00, cap: 479.43, lin: 479.43, clo: 479.43, ftb: 958.86 },
  { name: 'Exclusive 1Q-4S', entry: 3990.00, cap: 1118.67, lin: 1118.67, clo: 1118.67, ftb: 2237.34 },
  { name: 'Exclusive 2Q-2S', entry: 3990.00, cap: 692.51, lin: 692.51, clo: 692.51, ftb: 1385.02 },
  { name: 'Exclusive 2Q-4S', entry: 3990.00, cap: 1438.29, lin: 1438.29, clo: 1438.29, ftb: 2876.58 },
  { name: 'Park 1Q', entry: 3990.00, cap: 1171.94, lin: 1171.94, clo: 1171.94, ftb: 2343.88 },
  { name: 'Park 2Q', entry: 3990.00, cap: 1544.83, lin: 1544.83, clo: 1544.83, ftb: 3089.66 },
  { name: 'Premium 1Q', entry: 3990.00, cap: 1039.83, lin: 1039.83, clo: 1039.83, ftb: 2079.66 },
  { name: 'Premium 2Q', entry: 3990.00, cap: 1507.54, lin: 1507.54, clo: 1507.54, ftb: 3015.08 },
  { name: 'Smart', entry: 3990.00, cap: 839.54, lin: 839.54, clo: 839.54, ftb: 1679.08 },
  { name: 'Beach', entry: 3990.00, cap: 585.97, lin: 452.80, clo: 452.80, ftb: 905.60 },
  { name: 'Pyrenéus', entry: 3990.00, cap: 639.24, lin: 532.70, clo: 532.70, ftb: 1065.40 },
];

const generateDefaultProducts = (): Product[] => {
  const products: Product[] = [];
  OFFICIAL_PRODUCT_DATA.forEach((item) => {
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const categories: ProductCategory[] = ['liner', 'closer', 'ftb', 'captacao'];
    
    categories.forEach(cat => {
      let commission = 0;
      if (cat === 'captacao') commission = item.cap;
      if (cat === 'liner') commission = item.lin;
      if (cat === 'closer') commission = item.clo;
      if (cat === 'ftb') commission = item.ftb;

      products.push({
        id: `official-${slug}-${cat}`,
        defaultId: `official_${slug}_${cat}`,
        name: item.name,
        entryValue: item.entry,
        commission: commission,
        category: cat,
        isDefault: true,
        isFavorite: false,
        isActive: true
      });
    });
  });
  return products;
};

const DEFAULT_PRODUCTS: Product[] = generateDefaultProducts();

// Salas Padrão Oficiais
const DEFAULT_ROOMS: Room[] = [
  { id: 'room-official-hortensias', defaultId: 'sala_hortensias', name: 'Hortensias', isDefault: true, isFavorite: false, isActive: true },
  { id: 'room-official-matriz-diurno', defaultId: 'sala_matriz_diurno', name: 'Matriz Diurno', isDefault: true, isFavorite: false, isActive: true },
  { id: 'room-official-matriz-noturna', defaultId: 'sala_matriz_noturna', name: 'Matriz Noturna', isDefault: true, isFavorite: false, isActive: true },
  { id: 'room-official-luguito', defaultId: 'sala_luguito', name: 'Luguito', isDefault: true, isFavorite: false, isActive: true },
  { id: 'room-official-casa-lugano', defaultId: 'sala_casa_lugano', name: 'Casa Lugano', isDefault: true, isFavorite: false, isActive: true },
  { id: 'room-official-nasa', defaultId: 'sala_nasa', name: 'Nasa', isDefault: true, isFavorite: false, isActive: true }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('analise');
  const [analiseSubTab, setAnaliseSubTab] = useState<AnaliseSubTab>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [showToast, setShowToast] = useState<{show: boolean, msg: string, type?: 'success' | 'info'}>({show: false, msg: '', type: 'success'});
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [globalSaleDate, setGlobalSaleDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const savedProducts = localStorage.getItem('products');
    const savedRooms = localStorage.getItem('rooms');
    const savedSales = localStorage.getItem('sales');

    // Inicialização de Vendas (com valor padrão para teste)
    if (savedSales) {
      setSales(JSON.parse(savedSales));
    } else {
      const defaultSales: Sale[] = [];
      const baseSale = {
        quotaQuantity: 1,
        roomId: 'room-official-hortensias',
        productId: 'official-garden2q-liner',
        category: 'liner' as ProductCategory,
        roomName: 'Hortensias',
        productName: 'Garden 2Q',
        saleDate: new Date('2025-12-10T12:00:00Z').getTime(),
        entryValue1: 1000,
        method1: 'Pix',
        sinal1InstallmentCount: 1,
        immComm1: 287.19,
        date1: new Date(2026, 0, 25).getTime(),
        entryValue2: 0,
        method2: '',
        immComm2: 0,
        date2: 0,
        remainingCommission: 1001.29,
        installmentCommission: 200.26,
        installmentCount: 5,
        installmentMethod: 'Boleto',
        status: 'Ativa' as 'Ativa' | 'Cancelada',
        statusCadastro: 'INCOMPLETO' as 'INCOMPLETO' | 'COMPLETO',
        registroRapido: true,
        cep: '95670-000',
        cidade: 'Gramado',
        uf: 'RS',
        lat: -29.3746,
        lng: -50.8764
      };

      const sampleCoords = [
        { lat: -23.5505, lng: -46.6333, city: 'São Paulo', uf: 'SP', cep: '01001-000' },
        { lat: -22.9068, lng: -43.1729, city: 'Rio de Janeiro', uf: 'RJ', cep: '20010-000' },
        { lat: -15.7942, lng: -47.8822, city: 'Brasília', uf: 'DF', cep: '70040-000' },
        { lat: -12.9714, lng: -38.5014, city: 'Salvador', uf: 'BA', cep: '40010-000' },
        { lat: -3.7172, lng: -38.5433, city: 'Fortaleza', uf: 'CE', cep: '60010-000' },
        { lat: -25.4284, lng: -49.2733, city: 'Curitiba', uf: 'PR', cep: '80010-000' },
        { lat: -30.0346, lng: -51.2177, city: 'Porto Alegre', uf: 'RS', cep: '90010-000' },
        { lat: -19.9167, lng: -43.9345, city: 'Belo Horizonte', uf: 'MG', cep: '30110-000' },
        { lat: -1.4558, lng: -48.4902, city: 'Belém', uf: 'PA', cep: '66010-000' },
        { lat: -8.0578, lng: -34.8829, city: 'Recife', uf: 'PE', cep: '50010-000' },
        { lat: -16.6869, lng: -49.2648, city: 'Goiânia', uf: 'GO', cep: '74010-000' },
        { lat: -29.3746, lng: -50.8764, city: 'Gramado', uf: 'RS', cep: '95670-000' }
      ];

      for (let i = 0; i < 12; i++) {
        const coord = sampleCoords[i % sampleCoords.length];
        defaultSales.push({
          ...baseSale,
          id: crypto.randomUUID(),
          titular: `bruce marques (${i + 1}/12)`,
          timestamp: Date.now() + i,
          cep: coord.cep,
          cidade: coord.city,
          uf: coord.uf,
          lat: coord.lat,
          lng: coord.lng,
          auditLogs: [{
            timestamp: Date.now(),
            action: 'CRIAÇÃO PADRÃO',
            user: 'Sistema',
            details: 'Venda de teste padrão adicionada na inicialização.'
          }],
        });
      }
      setSales(defaultSales);
    }

    // Inicialização de Produtos
    if (savedProducts) {
      let loadedProducts: Product[] = JSON.parse(savedProducts);
      const officialIds = DEFAULT_PRODUCTS.map(p => p.defaultId);
      loadedProducts = loadedProducts.map(p => {
        if (p.defaultId && !officialIds.includes(p.defaultId) && (p.defaultId.startsWith('prod_') || p.id.startsWith('default-'))) {
          return { ...p, isActive: false };
        }
        return { ...p, isActive: p.isActive !== undefined ? p.isActive : true };
      });
      DEFAULT_PRODUCTS.forEach(def => {
        if (!loadedProducts.some(p => p.defaultId === def.defaultId)) {
          loadedProducts.push(def);
        }
      });
      setProducts(loadedProducts);
    } else {
      setProducts(DEFAULT_PRODUCTS);
    }

    // Inicialização de Salas
    if (savedRooms) {
      let loadedRooms: Room[] = JSON.parse(savedRooms);
      const officialRoomIds = DEFAULT_ROOMS.map(r => r.defaultId);
      loadedRooms = loadedRooms.map(r => {
        if (r.defaultId && !officialRoomIds.includes(r.defaultId) && (r.defaultId.startsWith('room_') || r.id.startsWith('room-'))) {
          return { ...r, isActive: false };
        }
        return { ...r, isActive: r.isActive !== undefined ? r.isActive : true };
      });
      DEFAULT_ROOMS.forEach(def => {
        if (!loadedRooms.some(r => r.defaultId === def.defaultId)) {
          loadedRooms.push(def);
        }
      });
      setRooms(loadedRooms);
    } else {
      setRooms(DEFAULT_ROOMS);
    }

    // Final da inicialização
  }, []);

  useEffect(() => localStorage.setItem('products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('rooms', JSON.stringify(rooms)), [rooms]);
  useEffect(() => localStorage.setItem('sales', JSON.stringify(sales)), [sales]);

  const triggerToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setShowToast({ show: true, msg, type });
    setTimeout(() => setShowToast({ show: false, msg: '', type: 'success' }), 3000);
  };



  useEffect(() => {
    if (editingSale) {
      const editDate = new Date(editingSale.saleDate);
      if (!isNaN(editDate.getTime())) {
        setGlobalSaleDate(editDate.toISOString().split('T')[0]);
      }
    }
  }, [editingSale]);

  const handleAddSales = async (newSales: Sale[]) => {
    // Enriquecer com coordenadas se tiver CEP (com cache para evitar múltiplas chamadas para o mesmo CEP)
    const cepCache: Record<string, { lat: number, lng: number } | null> = {};
    const enrichedSales: Sale[] = [];

    for (const sale of newSales) {
      if (sale.cep && (!sale.lat || !sale.lng)) {
        const cleanCep = sale.cep.replace(/\D/g, '');
        if (cepCache[cleanCep] === undefined) {
          const coords = await getCoordinatesFromCEP(cleanCep);
          cepCache[cleanCep] = coords ? { lat: coords.lat, lng: coords.lng } : null;
          // Pequeno delay para respeitar rate limit da API Nominatim se houver mais de um CEP diferente
          if (newSales.some(s => s.cep?.replace(/\D/g, '') !== cleanCep)) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        const coords = cepCache[cleanCep];
        if (coords) {
          enrichedSales.push({ ...sale, lat: coords.lat, lng: coords.lng });
          continue;
        }
      }
      enrichedSales.push(sale);
    }

    if (editingSale) {
        const exists = sales.some(s => s.id === editingSale.id);
        if (!exists) {
            alert("Erro: Registro original não encontrado.");
            setEditingSale(null);
            return;
        }

        setSales(prev => {
            const updatedIds = enrichedSales.map(s => s.id);
            const otherSales = prev.filter(s => !updatedIds.includes(s.id));
            return [...enrichedSales, ...otherSales];
        });
        triggerToast("Cadastro finalizado com sucesso!");
        setEditingSale(null);
    } else {
        setSales(prev => [...enrichedSales, ...prev]);
        triggerToast(`Venda registrada com sucesso! ${enrichedSales.length} item(s) adicionado(s).`);
    }
    setActiveTab('analise');
    setAnaliseSubTab('dashboard');
  };

  const handleEditSaleInitiate = (sale: Sale) => {
    if (!sale.id) {
        alert("ID da venda não encontrado para edição.");
        return;
    }
    setEditingSale(sale);
    setActiveTab('vender');
  };

  const handleCancelEdit = () => {
    setEditingSale(null);
    setActiveTab('historico');
  };

  const handleMoveToTrash = (saleId: string) => {
    setSales(prev => prev.map(s => {
      if (s.id === saleId) {
        const log: AuditLog = {
          timestamp: Date.now(),
          action: 'MOVER PARA LIXEIRA',
          user: 'Admin',
          details: 'Venda enviada para a lixeira para exclusão temporária'
        };
        return { 
          ...s, 
          inTrash: true,
          trashedAt: Date.now(),
          auditLogs: [...(s.auditLogs || []), log]
        };
      }
      return s;
    }));
    triggerToast("Venda movida para a Lixeira.", "info");
  };

  const handleBulkMoveToTrash = (saleIds: string[]) => {
    setSales(prev => prev.map(s => {
      if (saleIds.includes(s.id)) {
        const log: AuditLog = {
          timestamp: Date.now(),
          action: 'EXCLUSÃO EM MASSA',
          user: 'Admin',
          details: `Lote de ${saleIds.length} vendas movido para lixeira`
        };
        return { 
          ...s, 
          inTrash: true,
          trashedAt: Date.now(),
          auditLogs: [...(s.auditLogs || []), log]
        };
      }
      return s;
    }));
    triggerToast(`${saleIds.length} vendas movidas para a Lixeira com sucesso.`, "success");
  };

  const handleEmptyTrash = () => {
    const trashCount = sales.filter(s => s.inTrash).length;
    setSales(prev => prev.filter(s => !s.inTrash));
    triggerToast(`Lixeira esvaziada com sucesso. ${trashCount} registros removidos.`, "success");
  };

  const handleRestoreSale = (saleId: string) => {
    setSales(prev => prev.map(s => {
      if (s.id === saleId) {
        const log: AuditLog = {
          timestamp: Date.now(),
          action: 'RESTAURAÇÃO LIXEIRA',
          user: 'Admin',
          details: 'Venda restaurada da lixeira'
        };
        return { 
          ...s, 
          inTrash: false,
          trashedAt: undefined,
          auditLogs: [...(s.auditLogs || []), log]
        };
      }
      return s;
    }));
    triggerToast("Venda restaurada com sucesso.", "success");
  };

  const handlePermanentDeleteSale = (saleId: string) => {
    setSales(prev => prev.filter(s => s.id !== saleId));
    triggerToast("Venda excluída permanentemente.", "info");
  };

  const handleCancelSale = (saleId: string, cancellationData: { month: number, year: number, label: string, type: CancelType }) => {
    setSales(prev => prev.map(s => {
      if (s.id === saleId) {
        const log: AuditLog = {
          timestamp: Date.now(),
          action: 'CANCELAMENTO',
          user: 'Admin',
          details: `Cancelado (${cancellationData.type}) a partir de ${cancellationData.label}`
        };
        return { 
          ...s, 
          status: 'Cancelada', 
          cancelledAt: cancellationData,
          auditLogs: [...(s.auditLogs || []), log]
        };
      }
      return s;
    }));
    triggerToast(`Venda cancelada em ${cancellationData.label}.`, 'info');
  };

  const handleBulkCancelSale = (saleIds: string[], cancellationData: { month: number, year: number, label: string, type: CancelType }) => {
    setSales(prev => prev.map(s => {
      if (saleIds.includes(s.id)) {
        const log: AuditLog = {
          timestamp: Date.now(),
          action: 'CANCELAMENTO EM LOTE',
          user: 'Admin',
          details: `Cancelado em lote (${cancellationData.type}) a partir de ${cancellationData.label}`
        };
        return { 
          ...s, 
          status: 'Cancelada', 
          cancelledAt: cancellationData,
          auditLogs: [...(s.auditLogs || []), log]
        };
      }
      return s;
    }));
    triggerToast(`${saleIds.length} vendas canceladas em lote.`, 'info');
  };

  const handleReactivateSale = (saleId: string) => {
    setSales(prev => prev.map(s => {
      if (s.id === saleId) {
        const log: AuditLog = {
          timestamp: Date.now(),
          action: 'REATIVAÇÃO',
          user: 'Admin',
          details: 'Cota reativada manualmente'
        };
        const { cancelledAt, ...rest } = s; 
        return { 
          ...rest, 
          status: 'Ativa',
          auditLogs: [...(s.auditLogs || []), log]
        } as Sale;
      }
      return s;
    }));
    triggerToast(`Cota reativada com sucesso!`, 'success');
  };

  const handleBulkReactivateSale = (saleIds: string[]) => {
    setSales(prev => prev.map(s => {
      if (saleIds.includes(s.id)) {
        const log: AuditLog = {
          timestamp: Date.now(),
          action: 'REATIVAÇÃO EM LOTE',
          user: 'Admin',
          details: 'Cotas reativadas em lote'
        };
        const { cancelledAt, ...rest } = s; 
        return { 
          ...rest, 
          status: 'Ativa',
          auditLogs: [...(s.auditLogs || []), log]
        } as Sale;
      }
      return s;
    }));
    triggerToast(`${saleIds.length} cotas reativadas em lote.`, 'success');
  };

  const restoreDefaultProducts = (category: ProductCategory, overwrite: boolean) => {
    setProducts(prev => {
      let updated = [...prev];
      const categoryDefaults = DEFAULT_PRODUCTS.filter(d => d.category === category);
      
      let recreated = 0;
      let renamed = 0;
      let resetValues = 0;
      let alreadyCorrect = 0;

      categoryDefaults.forEach(def => {
        const existingIndex = updated.findIndex(p => p.defaultId === def.defaultId);
        
        if (existingIndex > -1) {
          const current = updated[existingIndex];
          if (overwrite) {
            let changed = false;
            if (current.name !== def.name) {
              renamed++;
              changed = true;
            }
            if (current.entryValue !== def.entryValue || current.commission !== def.commission) {
              resetValues++;
              changed = true;
            }
            if (!current.isActive) {
              changed = true;
            }
            if (!changed) alreadyCorrect++;

            updated[existingIndex] = { 
              ...current, 
              name: def.name,
              entryValue: def.entryValue, 
              commission: def.commission,
              isDefault: true,
              isActive: true
            };
          } else {
            if (!current.isActive) {
               updated[existingIndex] = { ...current, isActive: true };
               recreated++; 
            } else {
               alreadyCorrect++;
            }
          }
        } else {
          updated.push({ ...def });
          recreated++;
        }
      });
      
      const summary = `Restauração concluída:\n- ${recreated} itens recriados/reativados\n- ${renamed} itens renomeados\n- ${resetValues} valores resetados\n- ${alreadyCorrect} itens já estavam corretos`;
      triggerToast("Padrões restaurados com sucesso.", "success");
      setTimeout(() => alert(summary), 500); 
      return updated;
    });
  };

  const restoreDefaultRooms = (overwrite: boolean) => {
    setRooms(prev => {
      let updated = [...prev];
      
      let recreated = 0;
      let renamed = 0;
      let alreadyCorrect = 0;

      DEFAULT_ROOMS.forEach(def => {
        const existingIndex = updated.findIndex(r => r.defaultId === def.defaultId);
        
        if (existingIndex > -1) {
          const current = updated[existingIndex];
          if (overwrite) {
            if (current.name !== def.name || !current.isActive) {
              if (current.name !== def.name) renamed++;
              updated[existingIndex] = { 
                ...current, 
                name: def.name,
                isDefault: true,
                isActive: true
              };
            } else {
              alreadyCorrect++;
            }
          } else {
            if (!current.isActive) {
              updated[existingIndex] = { ...current, isActive: true };
              recreated++;
            } else {
              alreadyCorrect++;
            }
          }
        } else {
          updated.push({ ...def });
          recreated++;
        }
      });
      
      const summary = `Restauração concluída:\n- ${recreated} salas recriadas/reativados\n- ${renamed} salas renomeadas\n- ${alreadyCorrect} salas já estavam corretos`;
      triggerToast("Padrões restaurados com sucesso.", "success");
      setTimeout(() => alert(summary), 500);
      return updated;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg transition-colors duration-300">
      <Navbar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        darkMode={darkMode} 
        toggleDarkMode={() => setDarkMode(!darkMode)} 

      />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-8 pb-24 md:pb-8 max-w-6xl">
        <div className="bg-brand-card rounded-[40px] shadow-2xl border border-brand-border overflow-hidden min-h-[700px] transition-colors relative">
          
          {showToast.show && (
            <AnimateIn from="slide-in-from-top-4" className="fixed top-24 right-8 z-[100]">
              <div className={`text-white px-8 py-4 rounded-3xl shadow-2xl font-black text-sm flex items-center space-x-3 transition-colors ${showToast.type === 'info' ? 'bg-amber-500' : 'bg-brand-accent'}`}>
                <div className="bg-white/20 p-1 rounded-full">
                  {showToast.type === 'info' ? <Info size={20} strokeWidth={3} /> : <CheckCircle2 size={20} strokeWidth={3} />}
                </div>
                <span>{showToast.msg}</span>
              </div>
            </AnimateIn>
          )}

          {activeTab === 'vender' && (
            <div className="p-6 md:p-10">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
                <div className="flex items-center gap-3 bg-brand-bg p-1.5 rounded-2xl border border-brand-border shadow-sm">
                  <div className="h-10 px-3 bg-brand-input rounded-xl border border-brand-input-border flex items-center">
                    <input 
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      disabled={editingSale?.statusCadastro === 'COMPLETO'}
                      value={globalSaleDate}
                      onChange={(e) => setGlobalSaleDate(e.target.value)}
                      className="bg-transparent text-[11px] font-black outline-none w-full text-center text-white disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <SalesForm 
                rooms={rooms} 
                products={products} 
                sales={sales}
                onSubmit={handleAddSales} 
                saleToEdit={editingSale}
                onCancelEdit={handleCancelEdit}
                saleDate={globalSaleDate}
              />
            </div>
          )}

          {activeTab === 'analise' && (
            <div className="p-6 md:p-10">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
                <div className="flex items-center gap-2 bg-brand-bg p-1.5 rounded-2xl border border-brand-border shadow-sm">
                  <button
                    onClick={() => setAnaliseSubTab('dashboard')}
                    className={`h-10 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${analiseSubTab === 'dashboard' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'bg-transparent text-slate-500 hover:text-brand-text'}`}
                  >
                    <LayoutDashboard size={18} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
                  </button>
                  <button
                    onClick={() => setAnaliseSubTab('mapa')}
                    className={`h-10 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${analiseSubTab === 'mapa' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'bg-transparent text-slate-500 hover:text-brand-text'}`}
                  >
                    <Map size={18} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Mapa de Clientes</span>
                  </button>
                </div>
              </div>

              {analiseSubTab === 'dashboard' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Dashboard sales={sales} />
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-black text-white flex items-center tracking-tighter">
                      <span className="mr-3 p-2 bg-brand-bg rounded-2xl text-brand-accent border border-brand-border">
                        <Map size={28} />
                      </span>
                      Mapa de Clientes
                    </h2>
                    <p className="text-slate-500 text-sm font-medium mt-2">Localização das vendas ativas baseada no CEP.</p>
                  </div>
                  <CustomerMap sales={sales} />
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'cadastro' && (
            <div className="p-0">
               <ConfigPanel
                  products={products}
                  setProducts={setProducts}
                  rooms={rooms}
                  setRooms={setRooms}
                  sales={sales}
                  onToast={triggerToast}
                  onRestoreDefaults={restoreDefaultProducts}
                  onRestoreRooms={restoreDefaultRooms}
                />
            </div>
          )}
          
          {activeTab === 'historico' && (
            <SalesLog 
              sales={sales} 
              onMoveToTrash={handleMoveToTrash}
              onBulkMoveToTrash={handleBulkMoveToTrash}
              onEmptyTrash={handleEmptyTrash}
              onRestore={handleRestoreSale}
              onPermanentDelete={handlePermanentDeleteSale}
              onCancel={handleCancelSale}
              onBulkCancel={handleBulkCancelSale}
              onReactivate={handleReactivateSale}
              onBulkReactivate={handleBulkReactivateSale}
              onEditInitiate={handleEditSaleInitiate}
            />
          )}
        </div>
      </main>

      <footer className="hidden md:block py-10 text-center text-brand-text-muted text-[10px] border-t border-brand-border bg-brand-bg transition-colors">
        <div className="font-black tracking-[0.3em] uppercase mb-2">DashPRO Intelligence Ecosystem</div>
        &copy; {new Date().getFullYear()} - Auditoria de Vendas e Controle de Comissões
      </footer>
    </div>
  );
};

export default App;