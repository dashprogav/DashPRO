
import React, { useState, useMemo } from 'react';
import { Product, Room, ConfigSubTab, ProductCategory, Sale } from '../types';
import { 
  Trash2, 
  RotateCcw, 
  Star, 
  Edit3, 
  Zap, 
  Package, 
  Building2, 
  Wrench, 
  Plus, 
  X, 
  RefreshCw 
} from 'lucide-react';

interface FloatingInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isMono?: boolean;
  error?: boolean;
  type?: string;
  inputMode?: "search" | "text" | "none" | "tel" | "url" | "email" | "numeric" | "decimal";
  pattern?: string;
}

const FloatingInput: React.FC<FloatingInputProps> = ({ 
  label, value, onChange, isMono, error, type = "text",
  inputMode, pattern
}) => {
  return (
    <div className="relative group w-full">
      <input
        type={type}
        inputMode={inputMode}
        pattern={pattern}
        value={value}
        onChange={onChange}
        placeholder=" "
        className={`peer w-full h-14 rounded-2xl px-4 pt-5 bg-brand-bg text-white border outline-none transition-all focus:ring-4 focus:ring-brand-accent/10 placeholder-transparent 
          ${isMono ? 'font-mono text-sm' : 'font-bold text-sm'} 
          ${error ? 'border-red-500' : 'border-brand-border focus:border-brand-accent'}`}
      />
      <label 
        className={`absolute left-4 pointer-events-none transition-all duration-200 uppercase tracking-widest font-black
          ${value 
            ? 'top-2 text-[9px] text-brand-accent' 
            : 'top-[18px] text-xs text-slate-500 peer-focus:top-2 peer-focus:text-[9px] peer-focus:text-brand-accent'
          }`}
      >
        {label}
      </label>
    </div>
  );
};

interface ConfigPanelProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  sales: Sale[];
  onToast?: (msg: string, type: 'success' | 'info') => void;
  onRestoreDefaults?: (category: ProductCategory, overwrite: boolean) => void;
  onRestoreRooms?: (overwrite: boolean) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ 
  products, setProducts, 
  rooms, setRooms, 
  sales,
  onToast,
  onRestoreDefaults,
  onRestoreRooms
}) => {
  const [subTab, setSubTab] = useState<ConfigSubTab>('sala');
  const [activeServiceTab, setActiveServiceTab] = useState<ProductCategory>('liner');
  
  // Single product form
  const [productForm, setProductForm] = useState({ name: '', entry: '', commission: '' });
  const [productSubmitted, setProductSubmitted] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  // Smart registration form
  const [smartForm, setSmartForm] = useState({
    name: '',
    entry: '',
    commCaptacao: '',
    commLiner: '',
    commCloser: '',
    commFTB: ''
  });
  const [smartSubmitted, setSmartSubmitted] = useState(false);

  const [roomForm, setRoomForm] = useState({ name: '' });
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  // Modal State
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [overwriteValues, setOverwriteValues] = useState(false);
  
  // Deletion Modals State
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const formatCurrencyDisplay = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatCurrencyInput = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const amount = Number(numericValue) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const currentCategory = useMemo((): ProductCategory | null => {
    if (subTab === 'servicos') return activeServiceTab;
    return null;
  }, [subTab, activeServiceTab]);

  const handleAddProductIndividual = () => {
    setProductSubmitted(true);
    if (!productForm.name || !productForm.entry || !productForm.commission || !currentCategory) return;
    
    const entryVal = Number(productForm.entry) / 100;
    const commVal = Number(productForm.commission) / 100;

    if (entryVal <= 0 || commVal <= 0) {
        alert("Valores de entrada e comissão devem ser maiores que zero.");
        return;
    }

    const isDuplicate = products.some(p => 
        p.name.toLowerCase() === productForm.name.toLowerCase() && 
        p.category === currentCategory && 
        p.id !== editingProductId &&
        p.isActive !== false
    );

    if (isDuplicate) {
        alert(`Este produto já está cadastrado na categoria ${currentCategory.toUpperCase()}.`);
        return;
    }

    const productData = {
      name: productForm.name,
      entryValue: entryVal,
      commission: commVal,
      category: currentCategory,
      isActive: true
    };

    if (editingProductId) {
      setProducts(prev => prev.map(p => p.id === editingProductId ? { ...p, ...productData } : p));
      setEditingProductId(null);
      if (onToast) onToast("Produto atualizado com sucesso.", "success");
    } else {
      setProducts(prev => [...prev, { id: crypto.randomUUID(), ...productData, isFavorite: false }]);
      if (onToast) onToast(`Produto cadastrado em ${currentCategory.toUpperCase()}.`, "success");
    }
    
    setProductForm({ name: '', entry: '', commission: '' });
    setProductSubmitted(false);
  };

  const handleAddRoom = () => {
    if(!roomForm.name) return;
    
    if (editingRoomId) {
      setRooms(prev => prev.map(r => r.id === editingRoomId ? { ...r, name: roomForm.name } : r));
      setEditingRoomId(null);
      if (onToast) onToast("Sala atualizada.", "success");
    } else {
      setRooms(p => [...p, { id: crypto.randomUUID(), name: roomForm.name, isFavorite: false, isActive: true }]);
      if (onToast) onToast("Sala cadastrada.", "success");
    }
    setRoomForm({ name: '' });
  };

  const handleSmartRegistration = () => {
    setSmartSubmitted(true);
    const { name, entry, commCaptacao, commLiner, commCloser, commFTB } = smartForm;
    
    if (!name || !entry || !commCaptacao || !commLiner || !commCloser || !commFTB) return;

    const entryVal = Number(entry) / 100;
    const roles = [
      { cat: 'liner' as ProductCategory, comm: Number(commLiner) / 100 },
      { cat: 'closer' as ProductCategory, comm: Number(commCloser) / 100 },
      { cat: 'ftb' as ProductCategory, comm: Number(commFTB) / 100 },
      { cat: 'captacao' as ProductCategory, comm: Number(commCaptacao) / 100 },
    ];

    if (entryVal <= 0 || roles.some(r => r.comm <= 0)) {
        alert("Todos os valores devem ser maiores que zero.");
        return;
    }

    const newProducts: Product[] = [];
    roles.forEach(role => {
      const exists = products.some(p => p.name.toLowerCase() === name.toLowerCase() && p.category === role.cat && p.isActive !== false);
      if (!exists) {
        newProducts.push({
          id: crypto.randomUUID(),
          name,
          entryValue: entryVal,
          commission: role.comm,
          category: role.cat,
          isFavorite: false,
          isActive: true
        });
      }
    });

    if (newProducts.length === 0) {
      alert("Este produto já possui cadastros ativos em todas as categorias informadas.");
      return;
    }

    setProducts(prev => [...prev, ...newProducts]);
    if (onToast) onToast(`Cadastro Inteligente finalizado: ${newProducts.length} registros criados.`, "success");
    
    setSmartForm({ name: '', entry: '', commCaptacao: '', commLiner: '', commCloser: '', commFTB: '' });
    setSmartSubmitted(false);
    setSubTab('servicos');
    setActiveServiceTab('liner');
  };

  const toggleProductFavorite = (productId: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newState = !p.isFavorite;
        if (onToast) onToast(newState ? "Produto favoritado ⭐" : "Favorito removido", "info");
        return { ...p, isFavorite: newState };
      }
      return p;
    }));
  };

  const toggleRoomFavorite = (roomId: string) => {
    setRooms(prev => {
      const newRooms = prev.map(r => {
        if (r.id === roomId) {
          const newState = !r.isFavorite;
          if (onToast) onToast(newState ? "Sala favoritada ⭐" : "Favorito removido", "info");
          return { ...r, isFavorite: newState };
        }
        return r;
      });
      return newRooms;
    });
  };

  const handleInitiateProductDeletion = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmProductDeletion = () => {
    if (!productToDelete) return;
    try {
      const hasLinkedSales = sales.some(s => s.productId === productToDelete.id);
      
      if (hasLinkedSales) {
        // Soft Delete
        setProducts(prev => prev.map(p => p.id === productToDelete.id ? { ...p, isActive: false } : p));
        if (onToast) onToast("Registro arquivado devido a vendas vinculadas.", "info");
      } else {
        // Hard Delete
        setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
        if (onToast) onToast("Registro excluído com sucesso.", "success");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      if (onToast) onToast("Erro ao excluir. Tente novamente.", "info");
    } finally {
      setProductToDelete(null);
    }
  };

  const reactivateProduct = (productId: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, isActive: true } : p));
    if (onToast) onToast("Registro reativado com sucesso.", "success");
  };

  const handleInitiateRoomDeletion = (room: Room) => {
    setRoomToDelete(room);
  };

  const confirmRoomDeletion = () => {
    if (!roomToDelete) return;
    try {
      const hasLinkedSales = sales.some(s => s.roomId === roomToDelete.id);
      
      if (hasLinkedSales) {
        // Soft Delete
        setRooms(prev => prev.map(r => r.id === roomToDelete.id ? { ...r, isActive: false } : r));
        if (onToast) onToast("Sala arquivada devido a vendas vinculadas.", "info");
      } else {
        // Hard Delete
        setRooms(prev => prev.filter(r => r.id !== roomToDelete.id));
        if (onToast) onToast("Sala excluída com sucesso.", "success");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      if (onToast) onToast("Erro ao excluir sala. Tente novamente.", "info");
    } finally {
      setRoomToDelete(null);
    }
  };

  const reactivateRoom = (roomId: string) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, isActive: true } : r));
    if (onToast) onToast("Sala reativada com sucesso.", "success");
  };

  const startEditProduct = (product: Product) => {
    setSubTab('servicos');
    setActiveServiceTab(product.category);
    setEditingProductId(product.id);
    setProductSubmitted(false);
    setProductForm({
      name: product.name,
      entry: (product.entryValue * 100).toFixed(0),
      commission: (product.commission * 100).toFixed(0)
    });
  };

  const startEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setRoomForm({ name: room.name });
  };

  const handleOpenRestoreModal = () => {
    if (editingProductId || editingRoomId) {
        if (onToast) onToast("Finalize ou cancele a edição antes de restaurar padrões.", "info");
        return;
    }
    setShowRestoreModal(true);
  };

  const handleConfirmRestore = () => {
    try {
        if (subTab === 'sala') {
            if (onRestoreRooms) onRestoreRooms(overwriteValues);
        } else if (currentCategory) {
            if (onRestoreDefaults) onRestoreDefaults(currentCategory, overwriteValues);
        }
    } catch (error) {
        console.error("Restoration Error:", error);
        if (onToast) onToast("Não foi possível restaurar os padrões. Tente novamente.", "info");
    } finally {
        setShowRestoreModal(false);
        setOverwriteValues(false);
    }
  };

  const topTabs = [
    { id: 'sala', label: 'Salas', icon: Building2 },
    { id: 'servicos', label: 'Funções', icon: Wrench },
    { id: 'cadastro_inteligente', label: 'C. Inteligente', icon: Zap },
  ];

  const serviceCategories: { id: ProductCategory; label: string }[] = [
    { id: 'liner', label: 'Liner' },
    { id: 'closer', label: 'Closer' },
    { id: 'ftb', label: 'FTB' },
    { id: 'captacao', label: 'Captação' },
  ];

  const filteredCategoryProducts = useMemo(() => {
    return products.filter(p => p.category === currentCategory);
  }, [products, currentCategory]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-brand-bg">
      
      {/* RESTORE MODAL */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowRestoreModal(false)}></div>
          <div className="relative bg-brand-card w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-brand-border animate-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-brand-accent/20 text-brand-accent rounded-2xl flex items-center justify-center"><RefreshCw size={24} /></div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Restaurar Padrões</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Aba: {subTab === 'servicos' ? `Funções (${currentCategory?.toUpperCase()})` : subTab.toUpperCase()}
                  </p>
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">
                Deseja restaurar os registros padrão desta aba? Isso recriará itens do sistema que foram removidos ou arquivados.
              </p>
              
              <label className="flex items-center space-x-3 p-4 bg-brand-bg rounded-2xl border border-brand-border cursor-pointer group transition-all hover:border-brand-accent">
                <input 
                  type="checkbox" 
                  checked={overwriteValues} 
                  onChange={e => setOverwriteValues(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 bg-brand-bg text-brand-accent focus:ring-brand-accent"
                />
                <span className="text-xs font-bold text-slate-300 group-hover:text-brand-accent">Sobrescrever valores para o padrão original</span>
              </label>
            </div>
            <div className="p-4 bg-brand-bg/50 flex space-x-3">
              <button onClick={() => setShowRestoreModal(false)} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300">Cancelar</button>
              <button onClick={handleConfirmRestore} className="flex-2 px-8 py-4 rounded-2xl bg-brand-accent hover:bg-brand-accent-hover text-white font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Confirmar Restauração</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODALS (ROOM / PRODUCT) */}
      {roomToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setRoomToDelete(null)}></div>
          <div className="relative bg-brand-card w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-brand-border animate-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-red-900/30 text-red-400 rounded-2xl flex items-center justify-center"><Trash2 size={24} /></div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Excluir/Arquivar Sala</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ação de Segurança</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Deseja excluir ou arquivar a sala <span className="text-red-400 font-black uppercase">"{roomToDelete.name}"</span>? 
                {sales.some(s => s.roomId === roomToDelete.id) ? " Como esta sala possui vendas, ela será arquivada preservando o histórico." : " Como não há vendas vinculadas, ela será removida definitivamente."}
              </p>
            </div>
            <div className="p-4 bg-brand-bg/50 flex space-x-3">
              <button onClick={() => setRoomToDelete(null)} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300">Cancelar</button>
              <button onClick={confirmRoomDeletion} className="flex-2 px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {productToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setProductToDelete(null)}></div>
          <div className="relative bg-brand-card w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-brand-border animate-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-red-900/30 text-red-400 rounded-2xl flex items-center justify-center"><Trash2 size={24} /></div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Excluir/Arquivar Registro</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ação de Segurança</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Deseja excluir ou arquivar o registro <span className="text-red-400 font-black uppercase">"{productToDelete.name}"</span>?
                {sales.some(s => s.productId === productToDelete.id) ? " Como este registro possui vendas, ele será arquivado preservando o histórico." : " Como não há vendas vinculadas, ele será removido definitivamente."}
              </p>
            </div>
            <div className="p-4 bg-brand-bg/50 flex space-x-3">
              <button onClick={() => setProductToDelete(null)} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300">Cancelar</button>
              <button onClick={confirmProductDeletion} className="flex-2 px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* NAVEGAÇÃO NÍVEL 1: PRINCIPAL */}
      <div className="bg-brand-bg-alt/40 p-3 md:p-6 border-b border-brand-border">
        <div className="flex items-center justify-center gap-2 max-w-5xl mx-auto">
          {topTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                  setSubTab(tab.id as ConfigSubTab);
                  setEditingProductId(null);
                  setEditingRoomId(null);
                  setProductSubmitted(false);
                  setProductForm({ name: '', entry: '', commission: '' });
                  setRoomForm({ name: '' });
              }}
              className={`flex-1 max-w-[200px] py-4 px-2 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all rounded-2xl border flex flex-col md:flex-row items-center justify-center text-center gap-2 ${
                subTab === tab.id 
                  ? 'bg-brand-accent border-brand-accent text-white shadow-lg scale-[1.02] z-10' 
                  : 'bg-brand-card text-slate-500 border-brand-border hover:border-brand-accent'
              }`}
            >
              <tab.icon size={20} strokeWidth={2.5} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* NAVEGAÇÃO NÍVEL 2: SUB-FUNÇÕES (Aninhada) */}
        {subTab === 'servicos' && (
          <div className="mt-6 flex justify-center animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="inline-flex bg-brand-bg p-1 rounded-2xl shadow-sm border border-brand-border">
              {serviceCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveServiceTab(cat.id);
                    setEditingProductId(null);
                    setProductSubmitted(false);
                    setProductForm({ name: '', entry: '', commission: '' });
                  }}
                  className={`px-5 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeServiceTab === cat.id
                      ? 'bg-brand-accent/20 text-brand-accent'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-10 flex-1 overflow-y-auto custom-scrollbar">
        {subTab === 'sala' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className={`p-5 md:p-8 rounded-3xl border transition-all shadow-sm ${editingRoomId ? 'border-amber-500 bg-amber-900/10' : 'border-brand-border bg-brand-card'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">{editingRoomId ? 'Editar Sala' : 'Nova Sala'}</h3>
                {onRestoreRooms && (
                  <button onClick={handleOpenRestoreModal} className="text-[9px] font-black uppercase text-brand-accent hover:text-brand-accent-hover flex items-center gap-1 transition-all hover:scale-105 active:scale-95">
                    <RotateCcw size={12} strokeWidth={3} />
                    Restaurar Padrões
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <FloatingInput 
                  label="Nome da Sala"
                  value={roomForm.name}
                  onChange={e => setRoomForm({name: e.target.value})}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleAddRoom} 
                    className="flex-1 h-[52px] bg-brand-accent hover:bg-brand-accent-hover text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all"
                  >
                    {editingRoomId ? 'Salvar Alteração' : 'Gerar Sala'}
                  </button>
                  {editingRoomId && (
                    <button onClick={() => {setEditingRoomId(null); setRoomForm({name:''})}} className="px-6 h-[52px] bg-brand-bg text-slate-500 rounded-xl font-black text-[10px] uppercase border border-brand-border">Cancelar</button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rooms.map(r => (
                <div key={r.id} className={`p-4 rounded-2xl border flex justify-between items-center group shadow-sm transition-all ${r.isActive === false ? 'opacity-50 grayscale border-dashed bg-brand-bg-alt/20' : (r.isFavorite ? 'border-brand-accent bg-brand-accent/5' : 'bg-brand-card border-brand-border')}`}>
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-sm truncate uppercase">{r.name}</span>
                      {r.isActive === false && <span className="text-[7px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">Arquivado</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {r.isActive === false ? (
                      <button onClick={() => reactivateRoom(r.id)} className="w-10 h-10 flex items-center justify-center text-brand-accent bg-brand-accent/10 rounded-xl transition-all active:scale-95" title="Reativar">
                        <RotateCcw size={18} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <>
                        <button onClick={() => toggleRoomFavorite(r.id)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 ${r.isFavorite ? 'text-amber-500 bg-amber-900/20 shadow-inner' : 'text-slate-600 bg-brand-bg hover:text-amber-400'}`} title="Favoritar">
                          <Star size={18} fill={r.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2.5} />
                        </button>
                        <button onClick={() => startEditRoom(r)} className="w-10 h-10 flex items-center justify-center text-amber-500 hover:bg-amber-900/20 rounded-xl transition-all active:scale-95" title="Editar">
                          <Edit3 size={18} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => handleInitiateRoomDeletion(r)} className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-900/20 transition-all rounded-xl active:scale-95" title="Excluir/Arquivar">
                          <Trash2 size={18} strokeWidth={2.5} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {subTab === 'servicos' && currentCategory && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            <div className={`p-6 md:p-10 rounded-[40px] border-2 transition-all shadow-xl space-y-6 ${editingProductId ? 'border-amber-500 bg-amber-900/10' : 'border-brand-border bg-brand-card'}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  {editingProductId ? 'Modificar Registro Individual' : 'Cadastro Manual'}
                </h4>
                <span className="text-[10px] bg-brand-accent text-white px-4 py-1.5 rounded-full font-black uppercase tracking-widest shadow-md">
                  {currentCategory.toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FloatingInput label="Nome do Produto" value={productForm.name} onChange={e => setProductForm(p => ({...p, name: e.target.value}))} error={productSubmitted && !productForm.name} />
                <FloatingInput label="Entrada Padrão (R$)" inputMode="decimal" pattern="^[0-9]+([,.][0-9]{0,2})?$" value={productForm.entry ? formatCurrencyInput(productForm.entry) : ''} onChange={e => setProductForm(p => ({...p, entry: e.target.value.replace(/\D/g, '')}))} isMono error={productSubmitted && !productForm.entry} />
                <FloatingInput label="Comissão Fixa (R$)" inputMode="decimal" pattern="^[0-9]+([,.][0-9]{0,2})?$" value={productForm.commission ? formatCurrencyInput(productForm.commission) : ''} onChange={e => setProductForm(p => ({...p, commission: e.target.value.replace(/\D/g, '')}))} isMono error={productSubmitted && !productForm.commission} />
              </div>

              <div className="flex gap-3">
                <button onClick={handleAddProductIndividual} className="flex-1 h-14 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all">
                  {editingProductId ? 'Salvar Registro' : 'Cadastrar Registro'}
                </button>
                {editingProductId && (
                  <button onClick={() => {setEditingProductId(null); setProductSubmitted(false); setProductForm({name:'', entry:'', commission:''})}} className="px-8 h-14 bg-brand-bg text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all border border-brand-border">Cancelar</button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-3">
                  <div className="w-1.5 h-4 bg-brand-accent rounded-full"></div>
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Registros em {currentCategory.toUpperCase()}</h3>
                </div>
                {onRestoreDefaults && (
                  <button onClick={handleOpenRestoreModal} className="text-[9px] font-black uppercase tracking-widest text-brand-accent hover:text-brand-accent-hover transition-all flex items-center space-x-1 hover:scale-105 active:scale-95">
                    <RotateCcw size={12} strokeWidth={3} />
                    <span>Restaurar Padrões</span>
                  </button>
                )}
              </div>
              
              {filteredCategoryProducts.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-brand-border rounded-[40px] bg-brand-bg-alt/20">
                  <div className="flex justify-center mb-3 opacity-20 text-white"><Package size={48} /></div>
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Nenhum produto configurado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCategoryProducts.map(p => (
                    <div key={p.id} className={`p-5 rounded-3xl border transition-all flex items-center justify-between gap-4 group shadow-sm ${p.isActive === false ? 'opacity-50 grayscale border-dashed bg-brand-bg-alt/20' : (p.isFavorite ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-border bg-brand-card hover:border-brand-accent/50')}`}>
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-black text-white text-sm truncate uppercase tracking-tighter leading-tight">{p.name}</span>
                        </div>
                        {p.isActive !== false && (
                          <div className="flex items-center space-x-3 mt-1">
                            <div className="bg-brand-accent/10 px-2 py-1 rounded-lg border border-brand-accent/20">
                              <span className="text-[7px] text-brand-accent uppercase font-black block tracking-tighter">Entrada</span>
                              <span className="text-[11px] font-black text-brand-accent font-mono">{formatCurrencyDisplay(p.entryValue)}</span>
                            </div>
                            <div className="bg-brand-accent/10 px-2 py-1 rounded-lg border border-brand-accent/20">
                              <span className="text-[7px] text-brand-accent uppercase font-black block tracking-tighter">Comissão</span>
                              <span className="text-[11px] font-black text-brand-accent font-mono">{formatCurrencyDisplay(p.commission)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {p.isActive === false ? (
                          <button onClick={() => reactivateProduct(p.id)} className="w-10 h-10 flex items-center justify-center text-brand-accent bg-brand-accent/10 rounded-xl transition-all active:scale-95"><RotateCcw size={18} strokeWidth={2.5} /></button>
                        ) : (
                          <>
                            <button onClick={() => toggleProductFavorite(p.id)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 ${p.isFavorite ? 'text-amber-500 bg-amber-900/20 shadow-inner' : 'text-slate-600 bg-brand-bg hover:text-amber-400'}`}><Star size={18} fill={p.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2.5} /></button>
                            <button onClick={() => startEditProduct(p)} className="w-10 h-10 flex items-center justify-center text-amber-500 bg-amber-900/20 rounded-xl transition-all active:scale-95"><Edit3 size={18} strokeWidth={2.5} /></button>
                            <button onClick={() => handleInitiateProductDeletion(p)} className="w-10 h-10 flex items-center justify-center text-red-500 bg-red-900/20 rounded-xl transition-all active:scale-95"><Trash2 size={18} strokeWidth={2.5} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {subTab === 'cadastro_inteligente' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="bg-brand-card p-6 md:p-10 rounded-[40px] border border-brand-border shadow-xl space-y-8">
              <div className="flex items-center space-x-4 border-b border-brand-border pb-6">
                <div className="w-14 h-14 bg-brand-accent text-white rounded-2xl flex items-center justify-center shadow-lg"><Zap size={28} /></div>
                <div>
                  <h4 className="font-black text-white uppercase tracking-tight text-xl">Cadastro Inteligente</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Preencha uma vez para todas as funções comerciais</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FloatingInput label="Nome do Produto" value={smartForm.name} onChange={e => setSmartForm(p => ({...p, name: e.target.value}))} error={smartSubmitted && !smartForm.name} />
                <FloatingInput label="Entrada Padrão (R$)" inputMode="decimal" pattern="^[0-9]+([,.][0-9]{0,2})?$" value={smartForm.entry ? formatCurrencyInput(smartForm.entry) : ''} onChange={e => setSmartForm(p => ({...p, entry: e.target.value.replace(/\D/g, '')}))} isMono error={smartSubmitted && !smartForm.entry} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-brand-border">
                <FloatingInput label="Comissão Liner" inputMode="decimal" pattern="^[0-9]+([,.][0-9]{0,2})?$" value={smartForm.commLiner ? formatCurrencyInput(smartForm.commLiner) : ''} onChange={e => setSmartForm(p => ({...p, commLiner: e.target.value.replace(/\D/g, '')}))} isMono error={smartSubmitted && !smartForm.commLiner} />
                <FloatingInput label="Comissão Closer" inputMode="decimal" pattern="^[0-9]+([,.][0-9]{0,2})?$" value={smartForm.commCloser ? formatCurrencyInput(smartForm.commCloser) : ''} onChange={e => setSmartForm(p => ({...p, commCloser: e.target.value.replace(/\D/g, '')}))} isMono error={smartSubmitted && !smartForm.commCloser} />
                <FloatingInput label="Comissão FTB" inputMode="decimal" pattern="^[0-9]+([,.][0-9]{0,2})?$" value={smartForm.commFTB ? formatCurrencyInput(smartForm.commFTB) : ''} onChange={e => setSmartForm(p => ({...p, commFTB: e.target.value.replace(/\D/g, '')}))} isMono error={smartSubmitted && !smartForm.commFTB} />
                <FloatingInput label="Comissão Captação" inputMode="decimal" pattern="^[0-9]+([,.][0-9]{0,2})?$" value={smartForm.commCaptacao ? formatCurrencyInput(smartForm.commCaptacao) : ''} onChange={e => setSmartForm(p => ({...p, commCaptacao: e.target.value.replace(/\D/g, '')}))} isMono error={smartSubmitted && !smartForm.commCaptacao} />
              </div>
              <button onClick={handleSmartRegistration} className="w-full h-16 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-[24px] font-black uppercase tracking-widest text-[12px] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center space-x-3">
                <Zap size={20} strokeWidth={3} />
                <span>Gerar Todos os Registros</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigPanel;
