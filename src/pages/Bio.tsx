import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Instagram, 
  Share2, 
  Save, 
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { googleSheetsService } from '../services/dataService';
import { BioConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Bio() {
  const [config, setConfig] = useState<BioConfig>({
    companyName: '',
    logoUrl: '',
    address: '',
    phone: '',
    instagram: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadBio() {
      const data = await googleSheetsService.fetchData('Bio');
      if (data && data.length > 0) {
        setConfig(data[0]);
      }
      setLoading(false);
    }
    loadBio();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await googleSheetsService.updateData('Bio', config);
    setSaving(false);
    // Show success message or toast
  };

  const handleShare = async () => {
    const shareData = {
      title: config.companyName,
      text: `${config.companyName}\n${config.description}\n📍 ${config.address}\n📞 ${config.phone}\n📸 Instagram: @${config.instagram}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Configuração de Bio</h1>
          <p className="text-slate-500 dark:text-slate-400">Personalize sua presença digital e compartilhe com seus clientes.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            {copied ? <Check size={20} className="text-emerald-500" /> : <Share2 size={20} />}
            {copied ? 'Copiado!' : 'Compartilhar'}
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
            Salvar Alterações
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Section */}
        <div className="space-y-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Building2 className="text-indigo-600" size={24} />
            Dados da Empresa
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nome da Empresa</label>
              <input 
                type="text"
                value={config.companyName}
                onChange={e => setConfig({...config, companyName: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Ex: OrganizaPro Soluções"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">URL da Logo (Imagem)</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text"
                    value={config.logoUrl}
                    onChange={e => setConfig({...config, logoUrl: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Descrição Curta</label>
              <textarea 
                value={config.description}
                onChange={e => setConfig({...config, description: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[100px]"
                placeholder="Uma breve descrição do seu negócio..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Celular / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    value={config.phone}
                    onChange={e => setConfig({...config, phone: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Instagram (Usuário)</label>
                <div className="relative">
                  <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    value={config.instagram}
                    onChange={e => setConfig({...config, instagram: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="seu.perfil"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Endereço Completo</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  value={config.address}
                  onChange={e => setConfig({...config, address: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="flex flex-col items-center">
          <div className="sticky top-8 w-full max-w-[380px]">
            <div className="text-center mb-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Visualização em Tempo Real</span>
            </div>
            
            {/* Elegant Phone-like Preview */}
            <div className="relative aspect-[9/19] w-full bg-slate-50 dark:bg-slate-950 rounded-[3rem] border-[8px] border-slate-900 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 dark:bg-slate-800 rounded-b-2xl z-20" />
              
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {/* Header/Banner */}
                <div className="h-32 bg-gradient-to-br from-indigo-600 to-purple-600 relative">
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                    <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-950 bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex items-center justify-center">
                      {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Building2 size={40} className="text-slate-200" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-16 px-6 text-center space-y-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{config.companyName || 'Nome da Empresa'}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">{config.description || 'Sua descrição aparecerá aqui...'}</p>
                </div>

                <div className="mt-8 px-6 space-y-3 pb-8">
                  <BioLink 
                    icon={Phone} 
                    label="WhatsApp" 
                    value={config.phone || 'Não configurado'} 
                    color="emerald"
                    href={config.phone ? `https://wa.me/${config.phone.replace(/\D/g, '')}` : '#'}
                  />
                  <BioLink 
                    icon={Instagram} 
                    label="Instagram" 
                    value={config.instagram ? `@${config.instagram}` : 'Não configurado'} 
                    color="pink"
                    href={config.instagram ? `https://instagram.com/${config.instagram}` : '#'}
                  />
                  <BioLink 
                    icon={MapPin} 
                    label="Endereço" 
                    value={config.address || 'Não configurado'} 
                    color="indigo"
                    href={config.address ? `https://maps.google.com/?q=${encodeURIComponent(config.address)}` : '#'}
                  />
                  
                  <div className="pt-6">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nossos Serviços</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="aspect-square rounded-xl bg-slate-50 dark:bg-slate-800 animate-pulse" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 text-center border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                <p className="text-[10px] font-bold text-slate-400">Criado com OrganizaPro</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BioLink({ icon: Icon, label, value, color, href }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    pink: "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
  };

  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-[1.02] transition-all group"
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", colors[color])}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{value}</p>
      </div>
      <ExternalLink size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
    </a>
  );
}
