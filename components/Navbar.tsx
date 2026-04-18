
import React from 'react';
import { AppTab } from '../types';
import { 
  LayoutDashboard, 
  CircleDollarSign, 
  Map, 
  Database, 
  Settings, 
  PieChart,
  Sun, 
  Moon,
  BarChart3,
  Folder
} from 'lucide-react';

interface NavbarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  onTabChange, 
  darkMode, 
  toggleDarkMode,
}) => {
  const tabs = [
    { id: 'analise', label: 'Análise', icon: BarChart3 },
    { id: 'vender', label: 'Vender', icon: CircleDollarSign },
    { id: 'cadastro', label: 'Cadastro', icon: Folder },
    { id: 'historico', label: 'Base Dados', icon: Database },
  ];

  return (
    <>
      {/* Top Header - Always visible */}
      <header className="bg-brand-bg text-brand-text shadow-xl sticky top-0 z-[9999] transition-colors border-b border-brand-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center group" onClick={() => onTabChange('analise')}>
              <div className="cursor-pointer">
                <h1 className="text-xl md:text-2xl font-black tracking-tighter leading-none flex items-baseline">
                  Dash<span className="text-brand-accent italic">PRO</span>
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-6">
              {/* Desktop Navigation - Hidden on Mobile */}
              <nav className="hidden md:flex items-center space-x-1 bg-brand-bg-alt/50 p-1.5 rounded-2xl border border-white/5">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id as AppTab)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 text-xs font-bold ${
                        activeTab === tab.id
                          ? 'bg-brand-accent text-white shadow-lg scale-105'
                          : 'text-brand-text-muted hover:text-brand-text hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} strokeWidth={2.5} />
                      <span className="hidden lg:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-3 bg-brand-bg-alt rounded-2xl hover:bg-brand-card transition-all shadow-md group border border-white/5"
                title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-amber-400 transition-transform group-active:rotate-90" strokeWidth={2.5} />
                ) : (
                  <Moon className="w-5 h-5 text-brand-accent transition-transform group-active:-rotate-45" strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-bg border-t border-brand-border z-[9999] flex justify-around items-center h-20 shadow-[0_-4px_10px_rgba(0,0,0,0.2)] transition-colors">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as AppTab)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
                isActive ? 'text-brand-accent' : 'text-brand-text-muted'
              }`}
            >
              {/* Active Indicator Line */}
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-brand-accent rounded-b-full shadow-[0_0_10px_rgba(79,140,255,0.5)]"></div>
              )}
              
              <div className={`transition-transform ${isActive ? 'scale-110 -translate-y-1' : ''}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-wider mt-1 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default Navbar;
