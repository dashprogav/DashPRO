
import React from 'react';
import AnimateIn from './AnimateIn';
import { Settings, Info, ShieldCheck, Github } from 'lucide-react';

interface SettingsPageProps {
  onToast: (msg: string, type: 'success' | 'info') => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onToast }) => {
  return (
    <div className="flex flex-col h-full bg-brand-bg">
      <div className="p-8 md:p-12 border-b border-brand-border bg-brand-bg-alt/40">
        <div className="max-w-5xl mx-auto flex items-center gap-6">
          <div className="p-4 bg-brand-accent/20 rounded-[32px] text-brand-accent shadow-lg shadow-brand-accent/10">
            <Settings size={40} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Ajustes do Sistema</h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">Configurações Gerais e Segurança da Aplicação</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <AnimateIn from="fade-in" duration="duration-700">
            <div className="bg-brand-card p-8 rounded-[40px] border border-brand-border h-full relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-brand-accent group-hover:opacity-10 transition-opacity">
                <ShieldCheck size={120} />
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-bg rounded-2xl flex items-center justify-center text-brand-accent">
                  <ShieldCheck size={20} strokeWidth={3} />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Segurança & Backup</h3>
              </div>
              
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                Todos os seus dados estão sendo armazenados localmente de forma criptografada. Lembre-se de realizar backups regulares exportando os dados da Base de Dados.
              </p>
              
              <button 
                onClick={() => onToast("Sincronização iniciada...", "success")}
                className="w-full py-4 bg-brand-bg hover:bg-white/5 border border-brand-border text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95"
              >
                Sincronizar Agora
              </button>
            </div>
          </AnimateIn>

          <AnimateIn from="fade-in" duration="duration-1000">
            <div className="bg-brand-card p-8 rounded-[40px] border border-brand-border h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-bg rounded-2xl flex items-center justify-center text-brand-accent">
                    <Info size={20} strokeWidth={3} />
                  </div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">DashPRO v2.5</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Versão Atual</span>
                    <span className="text-[10px] font-black text-brand-accent">2.5.0-beta.4</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ambiente</span>
                    <span className="text-[10px] font-black text-emerald-500">PRODUÇÃO</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Última atualização</span>
                    <span className="text-[10px] font-black text-slate-300">Hoje</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer opacity-50 hover:opacity-100">
                  <Github size={16} />
                  <span className="text-[9px] font-black uppercase tracking-widest">DashPRO Open</span>
                </div>
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Enterprise Edition</span>
              </div>
            </div>
          </AnimateIn>

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
