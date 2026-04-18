import React, { useState, useMemo, useEffect, useRef, forwardRef } from 'react';
import { Room, Product, Sale, ProductCategory } from '../types';
import AnimateIn from './AnimateIn';
import { 
  CircleDollarSign, 
  Edit3, 
  Bot, 
  Star, 
  ChevronDown, 
  ChevronsDown,
  Calendar,
  Plus,
  Trash2,
  Check,
  X,
  Minus,
  Search,
  UserPlus,
  Save,
  MapPin,
  Phone,
  Sparkles,
  Loader2
} from 'lucide-react';

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  isMono?: boolean;
  error?: boolean;
  type?: string;
  inputMode?: "search" | "text" | "none" | "tel" | "url" | "email" | "numeric" | "decimal";
  autoComplete?: string;
  placeholder?: string;
  rightElement?: React.ReactNode;
  disabled?: boolean;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(({ 
  label, value, onChange, onBlur, isMono, error, type = "text", 
  inputMode, autoComplete, 
  rightElement, disabled 
}, ref) => {
  return (
    <div className="relative group w-full">
      <input
        ref={ref}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={label}
        disabled={disabled}
        className={`w-full h-10 md:h-9 rounded-xl px-3 bg-brand-input dark:text-white border outline-none transition-all focus:ring-4 focus:ring-brand-accent/10 
          ${isMono ? 'font-mono text-xs' : 'font-bold text-[13px] md:text-sm'} 
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'border-red-500' : 'border-brand-input-border focus:border-brand-accent'}
          placeholder:text-brand-text-muted placeholder:uppercase placeholder:tracking-widest placeholder:font-black placeholder:text-[9px] md:placeholder:text-[10px]`}
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
  );
});

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
  error?: boolean;
  disabled?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, value, onChange, options, error, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="relative group w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-10 md:h-9 rounded-xl px-3 bg-brand-input dark:text-white border outline-none transition-all focus:ring-4 focus:ring-brand-accent/10 flex items-center justify-between text-sm
          ${value === '' 
            ? 'text-brand-text-muted' 
            : 'text-brand-text'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-brand-accent/50'}
          ${error ? 'border-red-500' : 'border-brand-input-border focus:border-brand-accent shadow-sm'}`}
      >
        <span className="truncate">{selectedOption ? (selectedOption.name === 'captacao' ? 'Captação' : selectedOption.name) : label}</span>
        <ChevronDown 
          size={16} 
          strokeWidth={3} 
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-brand-text-muted`} 
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-2 py-2 bg-brand-card border border-brand-border rounded-3xl shadow-2xl z-[100] animate-in zoom-in-95 duration-200 overflow-hidden">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm font-bold transition-all flex items-center justify-between
                  ${value === opt.id 
                    ? 'bg-brand-accent text-white shadow-lg' 
                    : 'text-brand-text hover:bg-white/5'}`}
              >
                <span>{opt.name}</span>
                {value === opt.id && <Check size={14} strokeWidth={4} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface QuantityStepperProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

const QuantityStepper: React.FC<QuantityStepperProps> = ({ 
  value, onChange, min = 1, max = 999, placeholder = "Qtd.", error, disabled 
}) => {
  const numValue = parseInt(value) || 0;

  const handleDecrement = () => {
    if (disabled) return;
    const nextValue = Math.max(min, numValue - 1);
    onChange(String(nextValue));
  };

  const handleIncrement = () => {
    if (disabled) return;
    const nextValue = Math.min(max, numValue + 1);
    onChange(String(nextValue));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val !== '' && parseInt(val) > max) {
      onChange(String(max));
    } else {
      onChange(val);
    }
  };

  const handleBlur = () => {
    const val = parseInt(value);
    if (!value || isNaN(val) || val < min) {
      onChange(String(min));
    } else if (val > max) {
      onChange(String(max));
    }
  };

  return (
    <div className={`w-full h-10 md:h-9 rounded-xl bg-brand-input border transition-all flex items-stretch overflow-hidden
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${error ? 'border-red-500' : 'border-brand-input-border focus-within:border-brand-accent focus-within:ring-4 focus-within:ring-brand-accent/10 shadow-sm'}`}
    >
      <button
        type="button"
        disabled={disabled || numValue <= min}
        onClick={handleDecrement}
        className="w-10 md:w-12 flex items-center justify-center text-brand-text-muted hover:text-brand-accent hover:bg-brand-accent/5 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Minus size={16} strokeWidth={3} />
      </button>
      
      <div className="flex-1 flex items-center justify-center border-x border-brand-input-border/50">
        <input
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
          className="w-full h-full bg-transparent text-center font-black text-xs md:text-sm text-brand-text outline-none"
          placeholder={placeholder}
        />
      </div>

      <button
        type="button"
        disabled={disabled || numValue >= max}
        onClick={handleIncrement}
        className="w-10 md:w-12 flex items-center justify-center text-brand-text-muted hover:text-brand-accent hover:bg-brand-accent/5 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Plus size={16} strokeWidth={3} />
      </button>
    </div>
  );
};

interface SalesFormProps {
  rooms: Room[];
  products: Product[];
  sales: Sale[];
  onSubmit: (sales: Sale[]) => void;
  saleToEdit?: Sale | null;
  onCancelEdit?: () => void;
  saleDate: string;
}

const SalesForm: React.FC<SalesFormProps> = ({ 
  rooms, products, sales, onSubmit, saleToEdit, onCancelEdit, saleDate 
}) => {
  const today = new Date().toISOString().split('T')[0];
  const cpfRef = useRef<HTMLInputElement>(null);
  const whatsappRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExtracting, setIsExtracting] = useState(false);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    // TODO: Processamento real via Google Gemini aguardando as regras exatas do próximo passo.
    // Lógica provisória de preenchimento automático para validar o fluxo visual e navegação.
    setTimeout(() => {
        setFormData(p => ({
            ...p,
            titular: "COMPRADOR EXTRAÍDO",
            entryValue1: 1500,
            method1: "Pix"
        }));
        setIsExtracting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, 2000);
  };
  
  const initialFormState = {
    titular: '',
    cpf: '',
    uf: '',
    cidade: '',
    cep: '',
    unidade: '',
    telefoneCliente: '',
    roomId: '',
    productId: '',
    category: '' as ProductCategory | '',
    quotaQuantity: '1',
    entryValue1: '',
    sinal1Installments: '1',
    method1: '',
    entryValue2: '',
    method2: '',
    installments: '',
    installmentMethod: '',
    saleDate: today,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [submitted, setSubmitted] = useState(false);
  const [showSinal2, setShowSinal2] = useState(false); 
  const [cepError, setCepError] = useState<string | null>(null);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const [showOpcionais, setShowOpcionais] = useState(false);
  const [unidadesList, setUnidadesList] = useState<string[]>([]);

  const [applyToGroup, setApplyToGroup] = useState(true);
  
  const groupMembers = useMemo(() => {
    if (!saleToEdit || !sales) return [];
    const getRootName = (name: string) => name.split(' (')[0];
    const rootName = getRootName(saleToEdit.titular);
    
    return sales.filter(s => {
      if (s.inTrash) return false;
      
      const sameCpf = saleToEdit.cpf && s.cpf && s.cpf === saleToEdit.cpf;
      const sameDetails = getRootName(s.titular) === rootName &&
                          s.roomId === saleToEdit.roomId &&
                          s.productId === saleToEdit.productId &&
                          s.saleDate === saleToEdit.saleDate;
      
      return sameCpf || sameDetails;
    }).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }, [saleToEdit, sales]);

  const isGroupDetected = groupMembers.length > 1;
  const isCorrectionMode = saleToEdit?.statusCadastro === 'COMPLETO';

  // Foco automático ao ativar toggles
  useEffect(() => {
    if (showOpcionais && cpfRef.current) {
      cpfRef.current.focus();
    }
  }, [showOpcionais]);

  useEffect(() => {
    if (showOpcionais && whatsappRef.current) {
      whatsappRef.current.focus();
    }
  }, [showOpcionais]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, saleDate: saleDate }));
  }, [saleDate]);

  useEffect(() => {
    if (saleToEdit) {
      const editDate = new Date(saleToEdit.saleDate);
      const saleDateStr = !isNaN(editDate.getTime()) 
        ? editDate.toISOString().split('T')[0] 
        : today;

      const isGroupMode = isGroupDetected && applyToGroup;
      setShowOpcionais(isGroupMode || !!saleToEdit.unidade || !!saleToEdit.cpf || !!saleToEdit.cep || !!saleToEdit.telefoneCliente);

      setFormData({
        titular: saleToEdit.titular.split(' (')[0], 
        cpf: saleToEdit.cpf ? maskCPF(saleToEdit.cpf) : '',
        uf: saleToEdit.uf || '',
        cidade: saleToEdit.cidade || '',
        cep: saleToEdit.cep ? maskCEP(saleToEdit.cep) : '',
        unidade: saleToEdit.unidade || '',
        telefoneCliente: saleToEdit.telefoneCliente || '',
        roomId: saleToEdit.roomId,
        productId: saleToEdit.productId,
        category: saleToEdit.category,
        quotaQuantity: isGroupDetected && applyToGroup ? groupMembers.length.toString() : '1',
        entryValue1: (saleToEdit.entryValue1 * 100).toFixed(0),
        sinal1Installments: (saleToEdit.sinal1InstallmentCount || 1).toString(),
        method1: saleToEdit.method1,
        entryValue2: saleToEdit.entryValue2 ? (saleToEdit.entryValue2 * 100).toFixed(0) : '',
        method2: saleToEdit.method2 || '',
        installments: saleToEdit.installmentCount > 0 ? `${saleToEdit.installmentCount}x` : '',
        installmentMethod: saleToEdit.installmentMethod || '',
        saleDate: saleDateStr,
      });
      setShowSinal2(saleToEdit.entryValue2 > 0);
      
      if (isGroupMode) {
        setUnidadesList(groupMembers.map(m => m.unidade || ''));
      } else {
        setUnidadesList([saleToEdit.unidade || '']);
      }
    } else {
        setFormData(initialFormState);
        setApplyToGroup(true);
        setShowOpcionais(false);
    }
  }, [saleToEdit, isGroupDetected, applyToGroup]);

  useEffect(() => {
    if (showOpcionais) {
      const count = isGroupDetected && applyToGroup ? groupMembers.length : Math.max(1, parseInt(formData.quotaQuantity) || 0);
      setUnidadesList(prev => {
        const newList = [...prev];
        if (newList.length < count) {
          return [...newList, ...Array(count - newList.length).fill('')];
        } else {
          return newList.slice(0, count);
        }
      });
    }
  }, [showOpcionais, formData.quotaQuantity, applyToGroup, isGroupDetected, groupMembers.length]);

  const handleUnidadeItemChange = (index: number, value: string) => {
    const newList = [...unidadesList];
    newList[index] = value;
    setUnidadesList(newList);
  };

  const maskPhone = (value: string) => {
    if (!value) return '';
    let x = value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
    if (!x) return '';
    return !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
  };

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
  };

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const masked = maskCEP(e.target.value);
    setFormData(p => ({ ...p, cep: masked }));
    setCepError(null);

    if (rawValue.length === 8) {
      setIsFetchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${rawValue}/json/`);
        const data = await response.json();
        
        if (data.erro) {
          setCepError("CEP não encontrado.");
          setFormData(p => ({ ...p, cidade: '', uf: '' }));
        } else {
          setFormData(p => ({ 
            ...p, 
            cidade: data.localidade, 
            uf: data.uf,
          }));
        }
      } catch (err) {
        setCepError("Erro ao buscar CEP.");
      } finally {
        setIsFetchingCep(false);
      }
    } else {
      setFormData(p => ({ ...p, cidade: '', uf: '' }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw.length <= 11) {
      setFormData(prev => ({ ...prev, telefoneCliente: raw }));
    }
  };
  
  const handleSinalInstallmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
        setFormData(p => ({ ...p, sinal1Installments: '' }));
        return;
    }
    let value = parseInt(rawValue, 10);
    if (value > 24) value = 24;
    if (value < 1) value = 1;
    setFormData(p => ({ ...p, sinal1Installments: String(value) }));
  };

  const handleSinalInstallmentsBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (e.target.value.trim() === '' || parseInt(e.target.value) < 1) {
          setFormData(p => ({...p, sinal1Installments: '1'}));
      }
  };

  const handleImportContact = async () => {
    if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
      try {
        const props = ['name', 'tel'];
        const contacts = await (navigator as any).contacts.select(props, { multiple: false });
        if (contacts.length > 0) {
          const contact = contacts[0];
          const name = contact.name?.[0] || '';
          const rawTel = contact.tel?.[0]?.replace(/\D/g, '') || '';
          
          setFormData(prev => ({
            ...prev,
            titular: name || prev.titular,
            telefoneCliente: rawTel.slice(-11)
          }));
        }
      } catch (err) {
        console.error("Erro ao selecionar contato:", err);
      }
    }
  };

  const handleSaveToAgenda = () => {
    if (!formData.titular || !formData.telefoneCliente) {
      alert("Preencha o Nome e o Telefone para gerar o contato.");
      return;
    }
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${formData.titular}\nTEL;TYPE=CELL:${formData.telefoneCliente}\nEND:VCARD`;
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${formData.titular.replace(/\s+/g, '_')}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCategoryChange = (newCat: ProductCategory) => {
    setFormData(prev => ({ ...prev, category: newCat, productId: '' }));
  };

  const selectedProduct = useMemo(() => products.find(p => p.id === formData.productId), [products, formData.productId]);
  const selectedRoom = useMemo(() => rooms.find(r => r.id === formData.roomId), [rooms, formData.roomId]);

  const filteredRooms = useMemo(() => {
    let list = rooms.filter(r => r.isActive !== false);
    list.sort((a, b) => (a.isFavorite === b.isFavorite ? a.name.localeCompare(b.name) : (a.isFavorite ? -1 : 1)));
    return list;
  }, [rooms]);

  const filteredProducts = useMemo(() => {
    if (!formData.category) return [];
    let list = products.filter(p => p.isActive !== false && (
        formData.category === 'liner' ? (p.category === 'liner' || (p.category as string) === 'liner_closer') :
        formData.category === 'captacao' ? (p.category === 'captacao' || !p.category) :
        p.category === formData.category
    ));
    list.sort((a, b) => (a.isFavorite === b.isFavorite ? a.name.localeCompare(b.name) : (a.isFavorite ? -1 : 1)));
    return list;
  }, [products, formData.category]);

  const v1Numeric = useMemo(() => Number(formData.entryValue1.replace(/\D/g, '')) / 100, [formData.entryValue1]);
  const v2Numeric = useMemo(() => showSinal2 ? (Number(formData.entryValue2.replace(/\D/g, '')) / 100) : 0, [formData.entryValue2, showSinal2]);

  const financialError = useMemo(() => {
    if (!selectedProduct) return null;
    if (selectedProduct.entryValue === 0) return "Produto sem entrada padrão.";
    if (v1Numeric > selectedProduct.entryValue) return "Sinal 1 maior que entrada padrão.";
    return null;
  }, [selectedProduct, v1Numeric]);

  const isPaidInFull = useMemo(() => {
    if (!selectedProduct) return false;
    return (v1Numeric + v2Numeric) >= selectedProduct.entryValue && !financialError;
  }, [v1Numeric, v2Numeric, selectedProduct, financialError]);
  
  const shouldHideSaldoParcelado = useMemo(() => {
    if (!selectedProduct) return false;
    // Retorna true (ocultar) se o Sinal 1 for >= à entrada total
    return v1Numeric >= selectedProduct.entryValue && !financialError;
  }, [selectedProduct, v1Numeric, financialError]);

  const saldoParcelado = useMemo(() => {
    if (!selectedProduct || financialError) return null;
    const saldo = selectedProduct.entryValue - v1Numeric - v2Numeric;
    return Math.max(0, saldo);
  }, [selectedProduct, v1Numeric, v2Numeric, financialError]);

  const isValidMinimal = useMemo(() => {
    return (
      formData.titular.trim() !== '' &&
      formData.roomId !== '' &&
      formData.category !== '' &&
      formData.productId !== '' &&
      formData.method1 !== '' &&
      formData.entryValue1 !== '' &&
      formData.saleDate !== '' &&
      !financialError &&
      new Date(formData.saleDate) <= new Date(today)
    );
  }, [formData, today, financialError]);

  const showUnidadesIdentificacao = (isGroupDetected && applyToGroup) || (parseInt(formData.quotaQuantity) >= 1);

  const isValidFull = useMemo(() => {
    if (!isValidMinimal) return false;

    const cleanCpf = (formData.cpf ?? '').replace(/\D/g, '');
    const cleanCep = (formData.cep ?? '').replace(/\D/g, '');

    // CPF: só valida se preenchido (11 dígitos)
    const cpfValid = cleanCpf.length === 0 || cleanCpf.length === 11;
    // CEP: só valida se preenchido (8 dígitos + cidade + sem erro)
    const cepValid = cleanCep.length === 0 || (cleanCep.length === 8 && (formData.cidade ?? '') !== '' && !cepError);
    const identValid = cpfValid && cepValid;

    // Unidades: agora são opcionais
    const unitsValid = true;

    // Financeiro: quitado OU parcelas + método preenchidos
    const finValid = isPaidInFull || ((formData.installments ?? '') !== '' && (formData.installmentMethod ?? '') !== '');

    return identValid && unitsValid && finValid;
  }, [isValidMinimal, formData, unidadesList, isPaidInFull, cepError, showUnidadesIdentificacao]);

  const formatCurrency = (value: string | number) => {
    let amount = typeof value === 'string' ? Number(value.replace(/\D/g, '')) / 100 : value;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };
  
  const signalInstallmentCommission = useMemo(() => {
    const installments = parseInt(formData.sinal1Installments, 10);
    if (!selectedProduct || !v1Numeric || installments <= 1 || financialError) {
        return null;
    }

    const baseComm = selectedProduct.commission || 0;
    const baseEntry = selectedProduct.entryValue || 1;
    const totalSignalComm = (v1Numeric * baseComm) / baseEntry;
    
    if (totalSignalComm <= 0) {
        return null;
    }

    const singleInstallmentComm = totalSignalComm / installments;

    return {
        count: installments,
        value: singleInstallmentComm,
    };
  }, [formData.sinal1Installments, selectedProduct, v1Numeric, financialError]);

  const getPayDate = (method: string, baseDateStr: string, isInstallment: boolean) => {
    const baseDate = new Date(baseDateStr + 'T12:00:00'); 
    if (isNaN(baseDate.getTime())) return Date.now();

    if ((method === 'Cred' || method === 'Crédito') && isInstallment) {
        const firstPaymentDate = new Date(baseDate);
        firstPaymentDate.setDate(firstPaymentDate.getDate() + 60);
        return firstPaymentDate.getTime();
    }

    const monthsToAdd = (method === 'Cred' || method === 'Crédito') ? 2 : 1;
    let targetMonth = baseDate.getMonth() + monthsToAdd;
    let targetYear = baseDate.getFullYear();
    if (targetMonth > 11) { targetYear += Math.floor(targetMonth / 12); targetMonth = targetMonth % 12; }
    return new Date(targetYear, targetMonth, 25).getTime();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    
    // Validação de Sala Obrigatória
    if (!formData.roomId) {
      alert("Selecione a Sala antes de finalizar o grupo.");
      return;
    }

    const cleanCpf = formData.cpf.replace(/\D/g, '');
    const cleanCep = formData.cep.replace(/\D/g, '');
    const cleanWhatsApp = formData.telefoneCliente.replace(/\D/g, '');

    // Validações Manuais CONDICIONAIS aos toggles ativos
    if (showOpcionais && cleanCpf.length > 0 && cleanCpf.length !== 11) {
      alert("CPF inválido.");
      return;
    }
    if (showOpcionais && cleanWhatsApp.length > 0 && (cleanWhatsApp.length < 10 || cleanWhatsApp.length > 11)) {
      alert("WhatsApp inválido. Informe DDD + número.");
      return;
    }
    if (showOpcionais && cleanCep.length > 0 && cleanCep.length !== 8) {
      alert("CEP inválido.");
      return;
    }
    
    if (formData.entryValue1 && isNaN(v1Numeric)) {
      alert("Valor do sinal 1 inválido.");
      return;
    }
    if (showSinal2 && formData.entryValue2 && isNaN(v2Numeric)) {
      alert("Valor do sinal 2 inválido.");
      return;
    }
    
    if (!formData.category || financialError || (!isValidMinimal && !isCorrectionMode)) return;

    const saleDateObj = new Date(formData.saleDate + 'T12:00:00');
    const saleDateTimestamp = !isNaN(saleDateObj.getTime()) ? saleDateObj.getTime() : Date.now();

    if (!saleToEdit) {
      const isDuplicate = sales.some(s => s.cpf === cleanCpf && showOpcionais && !!formData.cpf && s.saleDate === saleDateTimestamp && s.productId === formData.productId && !s.inTrash && s.status === 'Ativa');
      if (isDuplicate) { alert("Venda duplicada detectada para este CPF, Produto e Data."); return; }
    }

    const statusCadastro = isValidFull ? 'COMPLETO' : 'INCOMPLETO';
    const registroRapido = !isValidFull;

    const generateSaleObject = (orig: any, idx?: number, total?: number): Sale => {
        const v1 = v1Numeric;
        const v2 = showSinal2 ? v2Numeric : 0;
        const instCount = isPaidInFull ? 0 : (parseInt(formData.installments) || 0);
        const baseComm = selectedProduct?.commission || 0;
        const baseEntry = selectedProduct?.entryValue || 1;
        const unitImmComm1 = (v1 * baseComm) / baseEntry;
        const unitImmComm2 = showSinal2 ? ((v2 * baseComm) / baseEntry) : 0;
        const unitRemainingComm = isPaidInFull ? 0 : Math.max(0, baseComm - (unitImmComm1 + unitImmComm2));
        const isGroupUpdate = isGroupDetected && applyToGroup;

        return {
            ...orig,
            titular: (total && total > 1) ? `${formData.titular} (${(idx || 0) + 1}/${total})` : formData.titular,
            cpf: showOpcionais ? cleanCpf : undefined,
            telefoneCliente: showOpcionais ? cleanWhatsApp : undefined,
            cep: showOpcionais ? cleanCep : undefined,
            cidade: showOpcionais ? formData.cidade : undefined,
            uf: showOpcionais ? formData.uf : undefined,
            unidade: unidadesList[idx!] || '',
            statusCadastro: (isCorrectionMode && orig.statusCadastro === 'COMPLETO') ? 'COMPLETO' : statusCadastro,
            registroRapido: (isCorrectionMode && orig.statusCadastro === 'COMPLETO') ? false : registroRapido,
            
            roomId: formData.roomId,
            productId: formData.productId,
            roomName: selectedRoom?.name || orig.roomName,
            productName: selectedProduct?.name || orig.productName,
            saleDate: saleDateTimestamp,
            category: formData.category as ProductCategory,

            ...(!isCorrectionMode ? {
                entryValue1: v1,
                method1: formData.method1,
                sinal1InstallmentCount: parseInt(formData.sinal1Installments) || 1,
                immComm1: unitImmComm1,
                date1: getPayDate(formData.method1, formData.saleDate, (parseInt(formData.sinal1Installments) || 1) > 1),
                entryValue2: v2,
                method2: showSinal2 ? formData.method2 : '',
                immComm2: unitImmComm2,
                date2: (showSinal2 && formData.method2) ? getPayDate(formData.method2, formData.saleDate, false) : 0,
                remainingCommission: unitRemainingComm,
                installmentCommission: instCount > 0 ? (unitRemainingComm / instCount) : 0,
                installmentCount: instCount,
                installmentMethod: isPaidInFull ? 'N/A' : formData.installmentMethod,
            } : {})
        };
    };

    if (saleToEdit) {
        if (applyToGroup && isGroupDetected) {
            const updatedSales = groupMembers.map((orig, idx) => generateSaleObject(orig, idx, groupMembers.length));
            onSubmit(updatedSales);
        } else {
            onSubmit([generateSaleObject(saleToEdit)]);
        }
    } else {
        const quotaCount = parseInt(formData.quotaQuantity) || 1;
        const newSales: Sale[] = [];

        for (let i = 0; i < quotaCount; i++) {
            const v1 = v1Numeric;
            const v2 = showSinal2 ? v2Numeric : 0;
            const sinalInstallments = parseInt(formData.sinal1Installments) || 1;
            const isPaidInFullBySignals = (v1 + v2) >= (selectedProduct?.entryValue ?? Infinity);
            const instCount = isPaidInFullBySignals ? 0 : (parseInt(formData.installments) || 0);

            const baseComm = selectedProduct?.commission || 0;
            const baseEntry = selectedProduct?.entryValue || 1;

            const unitImmComm1 = baseEntry > 0 ? (v1 * baseComm) / baseEntry : 0;
            const unitImmComm2 = showSinal2 && baseEntry > 0 ? (v2 * baseComm) / baseEntry : 0;
            const unitRemainingComm = isPaidInFullBySignals ? 0 : Math.max(0, baseComm - (unitImmComm1 + unitImmComm2));

            const sale: Sale = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                titular: (quotaCount > 1) ? `${formData.titular} (${i + 1}/${quotaCount})` : formData.titular,
                cpf: showOpcionais ? cleanCpf : undefined,
                telefoneCliente: showOpcionais ? cleanWhatsApp : undefined,
                cep: showOpcionais ? cleanCep : undefined,
                cidade: showOpcionais ? formData.cidade : undefined,
                uf: showOpcionais ? formData.uf : undefined,
                unidade: unidadesList[i] || '',
                statusCadastro: statusCadastro,
                registroRapido: registroRapido,
                roomId: formData.roomId,
                productId: formData.productId,
                roomName: selectedRoom?.name || '',
                productName: selectedProduct?.name || '',
                saleDate: saleDateTimestamp,
                category: formData.category as ProductCategory,
                quotaQuantity: 1,
                
                entryValue1: v1,
                method1: formData.method1,
                sinal1InstallmentCount: sinalInstallments,
                immComm1: unitImmComm1,
                date1: getPayDate(formData.method1, formData.saleDate, sinalInstallments > 1),

                entryValue2: v2,
                method2: showSinal2 ? formData.method2 : '',
                immComm2: unitImmComm2,
                date2: (showSinal2 && formData.method2) ? getPayDate(formData.method2, formData.saleDate, false) : 0,

                remainingCommission: unitRemainingComm,
                installmentCommission: instCount > 0 ? (unitRemainingComm / instCount) : 0,
                installmentCount: instCount,
                installmentMethod: isPaidInFullBySignals ? '' : formData.installmentMethod,

                status: 'Ativa',
                auditLogs: [{ timestamp: Date.now(), action: 'CRIAÇÃO', user: 'Sistema', details: `Cota ${i + 1}/${quotaCount} criada.` }]
            };
            newSales.push(sale);
        }
        onSubmit(newSales);
    }

    setFormData({ ...initialFormState, roomId: formData.roomId, category: formData.category });
    setSubmitted(false);
    setShowOpcionais(false);
    setUnidadesList([]);
  };

  const isInvalid = (field: keyof typeof formData) => submitted && !formData[field];

  const StandardToggle = ({ label, shortLabel, active, onToggle, icon: Icon }: { label: string, shortLabel: string, active: boolean, onToggle: () => void, icon?: any }) => (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center space-x-1 md:space-x-2 px-1.5 md:px-3 py-1 md:py-1.5 rounded-full border transition-all active:scale-95 flex-1 min-w-0 max-w-[20%] md:w-fit md:max-w-none h-9 shrink-0 ${active ? 'border-brand-accent bg-brand-accent/10 text-brand-accent' : 'border-brand-border bg-brand-bg text-brand-text-muted'}`}
    >
      {Icon && <Icon size={14} strokeWidth={2.5} />}
      <span className="text-[9px] md:text-[11px] font-black uppercase tracking-tight truncate">
        <span className="hidden md:inline">{label}</span>
        <span className="md:hidden">{shortLabel}</span>
      </span>
    </button>
  );

  return (
    <div className="p-4 md:p-12 pt-0 md:pt-0 pb-32 md:pb-12 text-brand-text">
      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4" noValidate>
        {!isCorrectionMode && (
          <div className="mb-4">
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isExtracting}
              className="w-full h-12 md:h-14 bg-gradient-to-r from-brand-accent to-brand-accent-hover text-white rounded-2xl font-black uppercase tracking-widest text-[11px] md:text-sm shadow-xl shadow-brand-accent/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isExtracting ? (
                <><Loader2 size={20} className="animate-spin" /> Extraindo Dados...</>
              ) : (
                <><Sparkles size={20} /> Extrair Contrato</>
              )}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-1.5 md:gap-2">
          {/* Grid unificado de 10 colunas para manter layout horizontal (lado a lado) em qualquer tela */}
          <div className="grid grid-cols-10 gap-1.5 md:gap-2 items-start">
            {/* Linha 1: Função (60%) + Sala (40%) */}
            <div className="col-span-6">
              <SelectField 
                label="Selecione a função" 
                value={formData.category} 
                onChange={val => handleCategoryChange(val as ProductCategory)} 
                options={[
                  { id: 'liner', name: 'Liner' },
                  { id: 'closer', name: 'Closer' },
                  { id: 'ftb', name: 'FTB' },
                  { id: 'captacao', name: 'Captação' }
                ]} 
                error={isInvalid('category')} 
              />
            </div>
            <div className="col-span-4">
              <SelectField label="Sala" value={formData.roomId} onChange={val => setFormData(p => ({ ...p, roomId: val }))} options={filteredRooms} error={isInvalid('roomId')} disabled={false} />
            </div>

            {/* Linha 2: Produto (70%) + Quantidade (30%) */}
            <div className="col-span-7">
              <SelectField label="Produto" value={formData.productId} onChange={val => setFormData(p => ({ ...p, productId: val }))} options={filteredProducts} error={isInvalid('productId')} disabled={!formData.category} />
            </div>
            <div className="col-span-3">
              <QuantityStepper 
                value={formData.quotaQuantity} 
                onChange={val => setFormData(p => ({ ...p, quotaQuantity: val }))} 
                error={isInvalid('quotaQuantity')} 
                disabled={isCorrectionMode} 
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2 md:space-y-3">
          <div className="grid grid-cols-1 gap-1.5 md:gap-2">
            <InputField label="Nome do titular *" value={formData.titular} onChange={e => setFormData(p => ({ ...p, titular: e.target.value }))} error={submitted && !formData.titular} rightElement={<button type="button" onClick={handleImportContact} className="p-2 text-brand-accent hover:bg-brand-accent/10 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-90" title="Importar da agenda"><UserPlus size={20} strokeWidth={2.5} /></button>} />
          </div>
          {/* Botão Opcional - logo abaixo do Nome do titular */}
          <div className="flex items-center justify-center w-full">
            <button
              type="button"
              onClick={() => setShowOpcionais(!showOpcionais)}
              className={`group flex items-center justify-center py-1.5 px-4 transition-all active:scale-95 ${showOpcionais ? 'text-brand-accent' : 'text-brand-text-muted hover:text-brand-accent'}`}
            >
              <ChevronsDown 
                size={18} 
                strokeWidth={3} 
                className={`transition-transform duration-500 ease-in-out ${showOpcionais ? 'rotate-180' : ''}`} 
              />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] ml-2">
                Opcional
              </span>
            </button>
          </div>
        </div>

        {showOpcionais && (
          <AnimateIn from="slide-in-from-top-4" duration="duration-500">
            <div className="space-y-4 p-4 md:p-6 bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl border border-brand-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-brand-accent rounded-full"></div>
                <h4 className="text-[10px] font-black text-brand-text-muted uppercase tracking-[0.2em]">Campos Opcionais</h4>
              </div>

              {showUnidadesIdentificacao && (
                <div className="p-4 bg-brand-accent/5 rounded-2xl border border-brand-accent/10 space-y-4">
                  <h4 className="text-[10px] font-black text-brand-accent uppercase tracking-[0.2em]">Identificação das Unidades</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {unidadesList.map((val, idx) => (
                        <InputField key={idx} label={`Unidade ${idx + 1}`} value={val} onChange={e => handleUnidadeItemChange(idx, e.target.value)} />
                      ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  ref={cpfRef}
                  label="CPF" 
                  type="tel" 
                  inputMode="numeric" 
                  value={formData.cpf} 
                  onChange={e => setFormData(p => ({ ...p, cpf: maskCPF(e.target.value) }))} 
                  isMono 
                />
                <InputField 
                  ref={whatsappRef}
                  label="Whatsapp" 
                  type="tel" 
                  inputMode="numeric" 
                  autoComplete="tel" 
                  value={maskPhone(formData.telefoneCliente)} 
                  onChange={handlePhoneChange} 
                  isMono 
                  rightElement={<button type="button" onClick={handleSaveToAgenda} className="p-2 text-brand-accent hover:bg-brand-accent/10 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-90" title="Salvar na agenda"><Save size={20} strokeWidth={2.5} /></button>} 
                />
              </div>

              <div className="space-y-2">
                <InputField label="CEP" type="tel" inputMode="numeric" autoComplete="postal-code" value={formData.cep} onChange={handleCepChange} placeholder="00000-000" isMono error={submitted && formData.cep.length > 0 && formData.cep.length < 9} rightElement={isFetchingCep ? <div className="w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div> : null} />
                {(isFetchingCep || formData.cidade) && !cepError && (
                  <AnimateIn>
                    <div className="mt-1.5 px-3 py-1.5 bg-brand-accent/10 rounded-xl border border-brand-accent/20">
                      <p className="text-[9px] md:text-[10px] font-black text-brand-accent uppercase tracking-widest leading-tight">
                        {isFetchingCep ? "🔄 Buscando Cidade/UF..." : `✅ ${formData.cidade} - ${formData.uf}`}
                      </p>
                    </div>
                  </AnimateIn>
                )}
                {cepError && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest px-2">{cepError}</p>}
              </div>
            </div>
          </AnimateIn>
        )}

        {!isCorrectionMode && (
          <AnimateIn from="slide-in-from-bottom-4" duration="duration-500">
            <div className={`grid grid-cols-2 gap-2 md:gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 items-stretch`}>
              <div className="flex flex-col h-full space-y-2 md:space-y-3">
                <div className="flex items-center h-8 mb-2">
                  <div className="flex flex-row items-center justify-between gap-1 flex-nowrap w-full">
                    <h3 className="text-[9px] md:text-xs font-black text-brand-accent uppercase tracking-widest whitespace-nowrap shrink">Sinais de Entrada</h3>
                    <button 
                      type="button" 
                      onClick={() => setShowSinal2(!showSinal2)} 
                      title="Sinal 2"
                      className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${showSinal2 ? 'bg-brand-accent' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <span className="sr-only">Sinal 2</span>
                      <span 
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${showSinal2 ? 'translate-x-3' : 'translate-x-0'}`} 
                      />
                    </button>
                  </div>
                </div>
                <div className={`flex flex-col flex-1 justify-start p-3 md:p-4 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border transition-all space-y-3 md:space-y-4 ${isInvalid('method1') || (submitted && !formData.entryValue1) || financialError ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`}>
                    <div className="grid grid-cols-1 gap-2">
                        <InputField label="Valor Sinal 1 *" type="tel" inputMode="numeric" value={formData.entryValue1 ? formatCurrency(formData.entryValue1) : ''} onChange={e => setFormData(p => ({ ...p, entryValue1: e.target.value.replace(/\D/g, '').slice(0, 6) }))} isMono error={financialError !== null} />
                        <div title="Quantidade de vezes que o sinal foi parcelado">
                            <QuantityStepper value={formData.sinal1Installments} onChange={val => setFormData(p => ({ ...p, sinal1Installments: val }))} placeholder="Parcelas" disabled={!!saleToEdit} />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {['Pix', 'Din', 'Deb', 'Cred'].map(m => (
                        <button type="button" key={m} onClick={() => setFormData(p => ({ ...p, method1: m }))} className={`h-8 md:h-9 text-[8px] md:text-[9px] font-black rounded-lg border transition-all ${formData.method1 === m ? 'bg-brand-accent border-brand-accent text-white shadow-md' : 'bg-brand-bg text-brand-text-muted border-brand-border'}`}>{m}</button>
                      ))}
                    </div>
                     {signalInstallmentCommission && (
                        <AnimateIn from="slide-in-from-top-2">
                            <div className="mt-2 p-3 bg-brand-accent/10 rounded-xl border border-brand-accent/20 text-center">
                                <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest">
                                    Comissão Parcelada: {signalInstallmentCommission.count}x de {formatCurrency(signalInstallmentCommission.value)}
                                </p>
                            </div>
                        </AnimateIn>
                    )}
                  {showSinal2 && (
                    <AnimateIn>
                      <div className="pt-3 md:pt-4 border-t border-slate-200 dark:border-slate-700">
                        <InputField label="Sinal 2" type="tel" inputMode="numeric" value={formData.entryValue2 ? formatCurrency(formData.entryValue2) : ''} onChange={e => setFormData(p => ({ ...p, entryValue2: e.target.value.replace(/\D/g, '').slice(0, 6) }))} isMono />
                        <div className="grid grid-cols-4 gap-1 mt-3 md:mt-4">
                          {['Pix', 'Din', 'Deb', 'Cred'].map(m => (
                            <button type="button" key={m} onClick={() => setFormData(p => ({ ...p, method2: m }))} className={`h-8 md:h-9 text-[8px] md:text-[9px] font-black rounded-lg border transition-all ${formData.method2 === m ? 'bg-brand-accent border-brand-accent text-white shadow-md' : 'bg-brand-bg text-brand-text-muted border-brand-border'}`}>{m}</button>
                          ))}
                        </div>
                      </div>
                    </AnimateIn>
                  )}
                </div>
              </div>

              {!shouldHideSaldoParcelado && (
                <AnimateIn from="slide-in-from-right-4">
                    <div className="flex flex-col h-full space-y-2 md:space-y-3">
                        <div className="flex items-center h-8 mb-2">
                            <h3 className="text-[9px] md:text-xs font-black text-brand-accent uppercase tracking-widest whitespace-nowrap shrink h-auto">Saldo Parcelado</h3>
                        </div>
                        <div className={`flex flex-col flex-1 justify-start p-3 md:p-4 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border transition-all space-y-3 md:space-y-4 ${isInvalid('installments') || isInvalid('installmentMethod') ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`}>
                        {isPaidInFull ? (
                            <AnimateIn from="zoom-in" className="flex-1 flex flex-col items-center justify-center">
                            <div className="text-center space-y-2"><div className="w-10 h-10 bg-brand-accent text-white rounded-full flex items-center justify-center mx-auto shadow-lg"><Check size={24} strokeWidth={4} /></div><p className="text-[10px] font-black text-brand-accent uppercase tracking-widest">Quitada Integralmente</p></div>
                            </AnimateIn>
                        ) : (
                            <AnimateIn from="slide-in-from-right-4">
                            <div className="space-y-3 md:space-y-4">
                                <div className="grid grid-cols-1 gap-2">
                                  {/* Campo de valor automático do saldo - somente leitura */}
                                  <div className="relative group w-full">
                                    <input
                                      type="text"
                                      readOnly
                                      value={saldoParcelado !== null ? formatCurrency(saldoParcelado) : ''}
                                      placeholder="VALOR SALDO"
                                      className="w-full h-10 md:h-9 rounded-xl px-3 bg-brand-input dark:text-white border border-brand-input-border outline-none font-mono text-xs cursor-default opacity-80
                                        placeholder:text-brand-text-muted placeholder:uppercase placeholder:tracking-widest placeholder:font-black placeholder:text-[9px] md:placeholder:text-[10px]"
                                    />
                                  </div>
                                  <div title="Quantidade de parcelas do saldo">
                                      <QuantityStepper 
                                          value={formData.installments.replace('x', '')} 
                                          onChange={val => setFormData(p => ({ ...p, installments: `${val}x` }))} 
                                          min={1} 
                                          max={6} 
                                          placeholder="Parcelas" 
                                      />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                {['Boleto', 'Crédito'].map(m => (
                                    <button type="button" key={m} onClick={() => setFormData(p => ({ ...p, installmentMethod: m }))} className={`h-8 md:h-9 text-[8px] md:text-[9px] font-black rounded-lg border transition-all ${formData.installmentMethod === m ? 'bg-brand-accent border-brand-accent text-white shadow-md' : 'bg-brand-bg text-brand-text-muted border-brand-border'}`}>{m}</button>
                                ))}
                                </div>
                            </div>
                            </AnimateIn>
                        )}
                        </div>
                    </div>
                </AnimateIn>
              )}
            </div>
          </AnimateIn>
        )}

        {isCorrectionMode && (
          <AnimateIn from="zoom-in" duration="duration-500">
            <div className="p-6 bg-brand-accent/10 border border-brand-accent/20 rounded-3xl text-center space-y-2">
              <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.2em]">🔒 Campos Financeiros Bloqueados</p>
            </div>
          </AnimateIn>
        )}

        <div className="pt-8 flex gap-3">
          {saleToEdit && <button type="button" onClick={onCancelEdit} className="w-1/3 h-14 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-2xl uppercase tracking-widest text-[11px] active:scale-95 transition-all flex items-center justify-center gap-2"><X size={18} strokeWidth={3} /> Cancelar</button>}
          <button type="submit" disabled={(submitted && !isValidMinimal && !isCorrectionMode)} className={`flex-1 h-14 md:h-16 text-white font-black rounded-2xl transition-all shadow-xl active:scale-95 text-sm md:text-lg uppercase tracking-widest flex items-center justify-center gap-3 relative group ${(isValidMinimal || isCorrectionMode) ? (isValidFull || isCorrectionMode ? 'bg-brand-accent' : 'bg-amber-500') : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-50'}`}>
            <Check size={24} strokeWidth={3} />
            <span>{saleToEdit ? (isCorrectionMode ? 'Salvar Correção' : 'Finalizar Cadastro') : (isValidFull ? 'Confirmar Venda' : 'Registro Rápido')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalesForm;