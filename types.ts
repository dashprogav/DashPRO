export type ProductCategory = 'liner' | 'closer' | 'ftb' | 'captacao';
export type CancelType = 'DENTRO_7' | 'FORA_7' | 'CORTE';

export interface Product {
  id: string;
  defaultId?: string; // ID fixo para restauração
  name: string;
  entryValue: number;
  commission: number;
  category: ProductCategory;
  isFavorite?: boolean;
  isDefault?: boolean;
  isActive?: boolean; // Campo para exclusão lógica
}

export interface Room {
  id: string;
  defaultId?: string; // ID fixo para restauração
  name: string;
  isDefault?: boolean;
  isFavorite?: boolean;
  isActive?: boolean; // Campo para exclusão lógica
}

export interface DefaultSaleConfig {
  roomId: string;
  productId: string;
  category: ProductCategory;
}

export interface AuditLog {
  timestamp: number;
  action: string;
  user: string;
  details?: string;
}

export interface Sale {
  id: string;
  titular: string;
  cpf?: string;
  telefoneCliente?: string; 
  uf?: string; 
  cidade?: string; 
  cep?: string; 
  unidade?: string; 
  quotaQuantity: number;
  
  // IDs para referência
  roomId: string;
  productId: string;
  category: ProductCategory; 

  // Nomes "Registrados"
  roomName: string;
  productName: string;
  serviceName?: string; 
  
  saleDate: number; 
  


  // Entry 1
  entryValue1: number;
  method1: string;
  sinal1InstallmentCount?: number;
  immComm1: number;
  date1: number;
  
  // Entry 2
  entryValue2: number;
  method2: string;
  sinal2InstallmentCount?: number;
  immComm2: number;
  date2: number;

  remainingCommission: number;
  installmentCommission: number;
  installmentCount: number;
  installmentMethod: string;
  timestamp: number;

  // Coordenadas para o mapa
  lat?: number;
  lng?: number;

  // Status e Auditoria
  status: 'Ativa' | 'Cancelada';
  inTrash?: boolean;
  trashedAt?: number;
  cancelledAt?: {
    month: number;
    year: number,
    label: string;
    type?: CancelType;
  };
  auditLogs?: AuditLog[];

  // Conferência de Borderô
  checkedInConference?: boolean;
  markedAsCanceledInConference?: boolean;

  // Registro Rápido e Edição
  registroRapido?: boolean;
  statusCadastro?: 'INCOMPLETO' | 'COMPLETO';
}

export type AppTab = 'vender' | 'analise' | 'historico' | 'cadastro';
export type AnaliseSubTab = 'dashboard' | 'mapa';
export type VendaSubTab = 'manual' | 'ia';
export type ConfigSubTab = 'sala' | 'servicos' | 'cadastro_inteligente';
export type LogSubTab = 'geral';