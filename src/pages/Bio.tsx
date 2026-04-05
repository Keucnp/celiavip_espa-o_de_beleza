import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Instagram, 
  Share2, 
  Save, 
  Image as ImageIcon,
  ExternalLink,
  Check,
  Upload,
  X,
  QrCode
} from 'lucide-react';
import { googleSheetsService } from '../services/dataService';
import { BioConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';

export default function Bio() {
  const [config, setConfig] = useState<BioConfig>({
    companyName: '',
    logoUrl: '',
    address: '',
    phone: '',
    instagram: '',
    description: '',
    cnpj: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadBio() {
      try {
        const data = await googleSheetsService.fetchData('Bio');
        if (data && data.length > 0) {
          setConfig(data[0]);
        }
      } catch (err) {
        console.error('Bio: Error loading bio config:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBio();
  }, []);

  const getPublicUrl = () => {
    const encodeData = (obj: any) => {
      const str = JSON.stringify(obj);
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => 
        String.fromCharCode(parseInt(p1, 16))
      ));
    };
    const dataParam = encodeData(config);
    const url = window.location.href.split('/bio')[0] + '/p?d=' + dataParam;
    
    if (url.length > 2000) {
      console.warn('PublicBio: URL is very long and might fail on some mobile devices.');
    }
    
    return url;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 64; // Further reduced to 64x64 for much shorter URLs
        const MAX_HEIGHT = 64;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.3); // Reduced quality to 0.3 for shorter URLs
        if (type === 'logo') {
          setConfig(prev => ({ ...prev, logoUrl: resizedBase64 }));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (type: 'logo') => {
    if (type === 'logo') {
      setConfig(prev => ({ ...prev, logoUrl: '' }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await googleSheetsService.updateData('Bio', config);
    setSaving(false);
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    const publicUrl = getPublicUrl();
    
    const shareText = `
${config.companyName || 'Minha Bio'}
Acesse meus contatos e localização aqui:
${publicUrl}
    `.trim();

    try {
      // Tenta gerar a imagem do cartão de visita
      let files: File[] = [];
      if (shareCardRef.current) {
        // Aguarda um pouco para garantir que o QR Code e imagens estejam renderizados
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          const dataUrl = await toPng(shareCardRef.current, { 
            quality: 0.95, 
            cacheBust: true,
            backgroundColor: '#ffffff'
          });
          const blob = await (await fetch(dataUrl)).blob();
          files = [new File([blob], 'bio-card.png', { type: 'image/png' })];
        } catch (imgErr) {
          console.error('Error generating share image:', imgErr);
        }
      }

      // Tenta usar a API de compartilhamento nativa com imagem
      if (navigator.share && navigator.canShare && navigator.canShare({ files }) && files.length > 0) {
        await navigator.share({
          title: config.companyName || 'Minha Bio',
          text: shareText,
          files: files
        });
      } 
      else if (navigator.share) {
        await navigator.share({
          title: config.companyName || 'Minha Bio',
          text: shareText,
          url: publicUrl
        });
      }
      // Fallback para Copiar
      else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
      try {
        await navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (clipErr) {
        console.error('Clipboard fallback failed:', clipErr);
      }
    } finally {
      setSharing(false);
    }
  };

  const copyPublicLink = () => {
    navigator.clipboard.writeText(getPublicUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Configuração de Bio</h1>
          <p className="text-slate-500 dark:text-slate-400">Personalize sua presença digital e compartilhe com seus clientes.</p>
        </div>
        <div className="flex flex-col gap-2 min-w-[160px]">
          <button 
            onClick={handleShare}
            disabled={sharing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm text-sm"
          >
            {sharing ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            ) : copied ? (
              <Check size={16} className="text-emerald-500" />
            ) : (
              <Share2 size={16} />
            )}
            {sharing ? 'Gerando...' : copied ? 'Copiado!' : 'Compartilhar'}
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 dark:shadow-none text-sm"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Salvar
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Section */}
        <div className="space-y-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Building2 className="text-indigo-600" size={24} />
              Dados da Empresa
            </h3>
          </div>

          {/* Public Link Section */}
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900/50 dark:to-slate-900 border border-indigo-100 dark:border-slate-800 rounded-[2rem] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                  <ExternalLink size={16} />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Link da sua Bio</p>
              </div>
              <button 
                onClick={() => window.open(getPublicUrl(), '_blank')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Ver Bio Online <ExternalLink size={12} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-mono text-slate-500 dark:text-slate-400 truncate shadow-inner">
                {window.location.href.split('/bio')[0]}/p?d=...
              </div>
              <button 
                onClick={copyPublicLink}
                className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95"
                title="Copiar Link"
              >
                {copied ? <Check size={20} /> : <Share2 size={20} />}
              </button>
              <button 
                onClick={() => setShowQR(!showQR)}
                className={cn(
                  "p-3 rounded-2xl transition-all shadow-lg active:scale-95",
                  showQR ? "bg-slate-900 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-slate-100 dark:shadow-none"
                )}
                title="Mostrar QR Code"
              >
                <QrCode size={20} />
              </button>
            </div>

            <AnimatePresence>
              {showQR && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 flex flex-col items-center gap-4">
                    <div className="p-4 bg-white rounded-3xl shadow-xl border border-slate-100">
                      <QRCodeSVG 
                        value={getPublicUrl()} 
                        size={180}
                        level="H"
                        includeMargin={true}
                        imageSettings={config.logoUrl ? {
                          src: config.logoUrl,
                          height: 40,
                          width: 40,
                          excavate: true,
                        } : undefined}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-[200px]">
                      Seus clientes podem escanear este código para acessar sua Bio instantaneamente.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hidden Share Card for Image Generation */}
          <div className="fixed -left-[9999px] top-0">
            <div 
              ref={shareCardRef}
              className="w-[400px] bg-white p-8 flex flex-col items-center text-center space-y-6"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <div className="w-24 h-24 rounded-full border-4 border-slate-50 shadow-xl overflow-hidden flex items-center justify-center bg-white">
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={40} className="text-slate-200" />
                )}
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{config.companyName || 'Minha Bio'}</h2>
                {config.cnpj && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CNPJ: {config.cnpj}</p>}
                <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">{config.description}</p>
              </div>
              <div className="w-full h-px bg-slate-100" />
              <div className="p-4 bg-slate-50 rounded-3xl">
                <QRCodeSVG value={getPublicUrl()} size={120} level="H" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Acesse agora</p>
                <p className="text-xs font-bold text-slate-400">Escaneie o código acima</p>
              </div>
              <div className="pt-4">
                <p className="text-[10px] font-bold text-slate-300">Criado por ©LocalHost_keu</p>
              </div>
            </div>
          </div>
          
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
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">CNPJ (Chave PIX)</label>
              <input 
                type="text"
                value={config.cnpj}
                onChange={e => setConfig({...config, cnpj: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Logo da Empresa</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group">
                  {config.logoUrl ? (
                    <>
                      <img src={config.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImage('logo')}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <X size={20} />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="text-slate-400" size={24} />
                  )}
                </div>
                <button 
                  onClick={() => logoInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                >
                  <Upload size={16} />
                  Subir Logo
                </button>
                <input 
                  type="file" 
                  ref={logoInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logo')}
                />
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
            <div 
              ref={previewRef}
              className="relative aspect-[9/19] w-full bg-slate-50 dark:bg-slate-950 rounded-[3rem] border-[8px] border-slate-900 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
            >
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
                  {config.cnpj && (
                    <div className="flex items-center justify-center gap-1.5 py-1 px-3 bg-slate-100 dark:bg-slate-800 rounded-full w-fit mx-auto">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">CNPJ: {config.cnpj}</span>
                    </div>
                  )}
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
                  
                  <div className="pt-6">
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                        <MapPin size={20} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nosso Endereço</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                        {config.address || 'Endereço não informado'}
                      </p>
                      {config.address && (
                        <a 
                          href={`https://maps.google.com/?q=${encodeURIComponent(config.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700"
                        >
                          Ver no Mapa <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 text-center border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                <p className="text-[10px] font-bold text-slate-400">Criado por ©LocalHost_keu</p>
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
