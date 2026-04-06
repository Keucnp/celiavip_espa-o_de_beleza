import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Instagram, 
  Save, 
  Image as ImageIcon,
  Loader2,
  Check,
  AlertCircle,
  Share2,
  X,
  Copy,
  ExternalLink
} from 'lucide-react';
import { googleSheetsService } from '../services/dataService';
import { BioConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const INITIAL_CONFIG: BioConfig = {
  companyName: '',
  logoUrl: '',
  address: '',
  phone: '',
  instagram: '',
  description: '',
  cnpj: ''
};

export default function Bio() {
  const [config, setConfig] = useState<BioConfig>(INITIAL_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shared, setShared] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadBio() {
      try {
        const data = await googleSheetsService.fetchData('Bio');
        if (data && data.length > 0) {
          setConfig({ ...INITIAL_CONFIG, ...data[0] });
        }
      } catch (err) {
        console.error('Bio: Load error', err);
      } finally {
        setLoading(false);
      }
    }
    loadBio();
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Target 64x64 for ultra-portable URLs
        const TARGET_SIZE = 64;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          height *= TARGET_SIZE / width;
          width = TARGET_SIZE;
        } else {
          width *= TARGET_SIZE / height;
          height = TARGET_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.3);
        setConfig(prev => ({ ...prev, logoUrl: resizedBase64 }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await googleSheetsService.updateData('Bio', config);
      setMessage({ type: 'success', text: 'Configurações salvas!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const shareToWhatsApp = () => {
    const url = generatePortableLink();
    const text = encodeURIComponent(`Confira minha Bio: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const shareToTelegram = () => {
    const url = generatePortableLink();
    const text = encodeURIComponent(`Confira minha Bio`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`, '_blank');
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const shareToFacebook = () => {
    const url = generatePortableLink();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const copyToClipboard = async () => {
    const url = generatePortableLink();
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const generatePortableLink = useCallback(() => {
    try {
      const json = JSON.stringify(config);
      const bytes = new TextEncoder().encode(json);
      const base64 = btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      const baseUrl = window.location.origin + '/p';
      return `${baseUrl}?d=${base64}`;
    } catch (e) {
      console.error('Link generation failed', e);
      return '';
    }
  }, [config]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 p-4 scrollbar-hide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Bio Link</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Crie seu cartão de visitas digital interativo</p>
        </div>
        <div className="flex flex-col gap-3 w-full md:w-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "flex items-center justify-center gap-2 px-10 py-4 text-white rounded-2xl font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-xl active:scale-95 w-full",
              message?.type === 'success' ? "bg-emerald-500 shadow-emerald-500/20" : "bg-indigo-600 shadow-indigo-500/20 hover:bg-indigo-700"
            )}
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : message?.type === 'success' ? <Check size={20} /> : <Save size={20} />}
            {saving ? 'Salvando...' : message?.type === 'success' ? 'Salvo!' : 'Salvar'}
          </button>
          <button
            onClick={handleShare}
            className={cn(
              "flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm w-full border",
              shared 
                ? "bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/20" 
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            {shared ? <Check size={20} /> : <Share2 size={20} />}
            {shared ? 'Compartilhado!' : 'Compartilhar'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "p-4 rounded-2xl flex items-center gap-3 font-bold border",
              message.type === 'success' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
            )}
          >
            {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor */}
        <div className="space-y-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Empresa</label>
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                placeholder="Ex: Minha Loja"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CNPJ / PIX</label>
              <input
                type="text"
                value={config.cnpj || ''}
                onChange={(e) => setConfig({ ...config, cnpj: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo da Empresa</label>
            <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-slate-800">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group">
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-slate-300 dark:text-slate-600" size={32} />
                )}
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-3">Clique no ícone para enviar sua logo.</p>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => logoInputRef.current?.click()}
                    className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline"
                  >
                    Alterar Logo
                  </button>
                  {config.logoUrl && (
                    <button 
                      onClick={() => setConfig({ ...config, logoUrl: '' })}
                      className="text-xs font-black text-red-500 uppercase tracking-widest hover:underline"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição curta</label>
            <textarea
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none min-h-[100px] font-medium"
              placeholder="Uma breve frase sobre seu negócio..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={config.phone}
                  onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instagram (usuário)</label>
              <div className="relative">
                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={config.instagram}
                  onChange={(e) => setConfig({ ...config, instagram: e.target.value })}
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                  placeholder="seu.perfil"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço Completo</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={config.address}
                onChange={(e) => setConfig({ ...config, address: e.target.value })}
                className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                placeholder="Rua, Número, Bairro, Cidade - UF"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center">
          <div className="sticky top-8 w-full max-w-[360px]">
            <div className="text-center mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Pré-visualização em Tempo Real</p>
            </div>
            
            <div className="aspect-[9/19] bg-slate-950 rounded-[3.5rem] border-[12px] border-slate-900 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col relative">
              <div className="flex-1 overflow-y-auto scrollbar-hide pb-8">
                <div className="h-36 bg-gradient-to-br from-indigo-600 to-purple-800 relative">
                  <div className="absolute -bottom-14 left-1/2 -translate-x-1/2">
                    <div className="w-28 h-28 rounded-[2rem] border-4 border-slate-950 bg-white shadow-2xl overflow-hidden flex items-center justify-center">
                      {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 size={48} className="text-slate-200" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-20 px-8 text-center space-y-4">
                  <h3 className="text-2xl font-black text-white tracking-tight truncate leading-tight">{config.companyName || 'Nome da Empresa'}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 font-medium">
                    {config.description || 'Sua descrição aparecerá aqui...'}
                  </p>
                </div>

                <div className="mt-10 px-6 space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <Phone size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">WhatsApp</p>
                      <p className="text-sm font-bold text-white truncate">{config.phone || '(00) 00000-0000'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                    <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center border border-pink-500/20">
                      <Instagram size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Instagram</p>
                      <p className="text-sm font-bold text-white truncate">{config.instagram ? `@${config.instagram}` : '@seu.perfil'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 px-6">
                  <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 text-center">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                      <MapPin size={20} />
                    </div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Localização</p>
                    <p className="text-xs font-bold text-white leading-relaxed line-clamp-2">
                      {config.address || 'Endereço não informado'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 text-center border-t border-slate-900 bg-slate-950/80 backdrop-blur-md">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">©LocalHost_keu</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] border border-slate-200 dark:border-slate-800 p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowShareModal(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Compartilhar Bio</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">O link foi gerado com sucesso!</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 break-all">
                  <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-relaxed">
                    {generatePortableLink()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => window.open(generatePortableLink(), '_blank')}
                    className="flex flex-col items-center gap-2 p-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 hover:scale-105 transition-transform"
                  >
                    <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <ExternalLink size={24} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Ver Bio</span>
                  </button>

                  <button
                    onClick={shareToWhatsApp}
                    className="flex flex-col items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-3xl border border-emerald-100 dark:border-emerald-500/20 hover:scale-105 transition-transform"
                  >
                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <Phone size={24} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">WhatsApp</span>
                  </button>

                  <button
                    onClick={shareToTelegram}
                    className="flex flex-col items-center gap-2 p-4 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-3xl border border-sky-100 dark:border-sky-500/20 hover:scale-105 transition-transform"
                  >
                    <div className="w-12 h-12 bg-sky-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
                      <Share2 size={24} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Telegram</span>
                  </button>

                  <button
                    onClick={copyToClipboard}
                    className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-3xl border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform"
                  >
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center">
                      <Copy size={24} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Copiar</span>
                  </button>
                </div>

                {navigator.share && (
                  <button
                    onClick={async () => {
                      const url = generatePortableLink();
                      try {
                        await navigator.share({
                          title: config.companyName || 'Minha Bio',
                          text: `Confira minha Bio: ${url}`,
                          url: url
                        });
                        setShared(true);
                        setTimeout(() => setShared(false), 2000);
                      } catch (e) {}
                    }}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                  >
                    <Share2 size={20} /> Outras Opções
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
