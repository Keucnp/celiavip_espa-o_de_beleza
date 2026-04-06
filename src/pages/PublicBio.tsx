import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Instagram, 
  ExternalLink,
  Share2,
  Check,
  Copy,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { googleSheetsService } from '../services/dataService';
import { BioConfig } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Robust Base64 UTF-8 Decoding
const decodePortableData = (data: string): BioConfig | null => {
  if (!data) return null;
  
  try {
    // Normalize Base64 (handle URL-safe chars and common sharing artifacts)
    const normalized = data
      .replace(/ /g, '+')
      .replace(/_/g, '/')
      .replace(/-/g, '+')
      .replace(/[\r\n]/g, '');
    
    // Add padding
    const padded = normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, '=');
    
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    let decodedStr = '';
    if (typeof TextDecoder !== 'undefined') {
      decodedStr = new TextDecoder('utf-8').decode(bytes);
    } else {
      decodedStr = decodeURIComponent(
        Array.from(bytes)
          .map(b => '%' + b.toString(16).padStart(2, '0'))
          .join('')
      );
    }
    
    const parsed = JSON.parse(decodedStr);
    return (parsed && typeof parsed === 'object') ? parsed : null;
  } catch (e) {
    console.error('PublicBio: Decoding failed', e);
    return null;
  }
};

export default function PublicBio() {
  const [config, setConfig] = useState<BioConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cnpjCopied, setCnpjCopied] = useState(false);

  // Get portable data from URL with multiple fallbacks
  const portableDataRaw = useMemo(() => {
    try {
      // Primary: URLSearchParams
      const params = new URLSearchParams(window.location.search);
      const d = params.get('d');
      if (d) return d;

      // Secondary: Regex fallback for older WebViews
      const match = window.location.search.match(/[?&]d=([^&]*)/);
      return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      setLoading(true);
      setError(null);

      try {
        // 1. Try decoding portable data first
        if (portableDataRaw) {
          const decoded = decodePortableData(portableDataRaw);
          if (decoded && isMounted) {
            setConfig(decoded);
            setLoading(false);
            return;
          }
        }

        // 2. Fallback to Google Sheets
        const data = await googleSheetsService.fetchData('Bio');
        if (isMounted) {
          if (data && data.length > 0) {
            setConfig(data[0]);
          } else if (!portableDataRaw) {
            setError('Nenhuma configuração encontrada.');
          } else {
            setError('O link parece inválido ou expirado.');
          }
        }
      } catch (err) {
        console.error('PublicBio: Init error', err);
        if (isMounted) setError('Erro ao carregar informações.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();
    return () => { isMounted = false; };
  }, [portableDataRaw]);

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-6 z-50">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Carregando Bio...</p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-8 border border-slate-800 shadow-2xl text-slate-600"
        >
          <AlertCircle size={48} />
        </motion.div>
        <h1 className="text-2xl font-black text-white mb-4 tracking-tight">Ops! Algo deu errado.</h1>
        <p className="text-slate-400 max-w-xs leading-relaxed mb-10 font-medium">
          {error || 'Não conseguimos encontrar as informações desta Bio.'}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
        >
          <RefreshCw size={20} /> Recarregar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 md:p-8 selection:bg-indigo-500/30 overflow-x-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[450px] flex flex-col min-h-screen sm:min-h-0 sm:h-[85vh] sm:max-h-[900px] bg-slate-900 sm:rounded-[3.5rem] sm:border-[12px] sm:border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative"
      >
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-10">
          {/* Header/Banner */}
          <div className="h-48 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]"></div>
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
              <motion.div 
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                className="w-32 h-32 rounded-[2.5rem] border-4 border-slate-900 bg-white shadow-2xl overflow-hidden flex items-center justify-center"
              >
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Building2 size={56} className="text-slate-200" />
                )}
              </motion.div>
            </div>
          </div>

          <div className="mt-24 px-8 text-center space-y-6">
            <div className="space-y-2">
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-black text-white tracking-tight leading-tight"
              >
                {config.companyName || 'Nome da Empresa'}
              </motion.h2>
              
              {config.cnpj && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">CNPJ / Chave PIX</p>
                  <button 
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(config.cnpj || '');
                        setCnpjCopied(true);
                        setTimeout(() => setCnpjCopied(false), 2000);
                      } catch (e) {}
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl transition-all group active:scale-95"
                  >
                    <span className="text-xs font-mono text-slate-300 group-hover:text-white">{config.cnpj}</span>
                    {cnpjCopied ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} className="text-slate-500 group-hover:text-indigo-400" />
                    )}
                  </button>
                </motion.div>
              )}
            </div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-slate-400 leading-relaxed font-medium text-sm"
            >
              {config.description || 'Bem-vindo! Explore nossos canais de atendimento.'}
            </motion.p>
          </div>

          <div className="mt-12 px-6 space-y-4">
            <BioLink 
              icon={Phone} 
              label="WhatsApp" 
              value={config.phone || 'Fale Conosco'} 
              color="emerald"
              delay={0.6}
              href={config.phone ? `https://wa.me/${config.phone.replace(/\D/g, '')}` : '#'}
            />
            <BioLink 
              icon={Instagram} 
              label="Instagram" 
              value={config.instagram ? `@${config.instagram}` : 'Siga-nos'} 
              color="pink"
              delay={0.7}
              href={config.instagram ? `https://instagram.com/${config.instagram}` : '#'}
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="pt-8"
            >
              <div className="p-8 rounded-[2.5rem] bg-gradient-to-b from-slate-800/50 to-slate-800/20 border border-slate-700/50 text-center backdrop-blur-xl shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-5 border border-indigo-500/20">
                  <MapPin size={28} />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Localização</p>
                <p className="text-lg font-bold text-white leading-relaxed px-2 mb-8">
                  {config.address || 'Endereço não informado'}
                </p>
                {config.address && (
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(config.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                  >
                    Abrir no Mapa <ExternalLink size={18} />
                  </a>
                )}
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={handleCopyLink}
              className="w-full mt-12 py-4 flex items-center justify-center gap-3 text-slate-500 hover:text-indigo-400 transition-colors font-black text-[10px] uppercase tracking-[0.3em]"
            >
              {copied ? (
                <><Check size={16} className="text-emerald-500" /> Link Copiado!</>
              ) : (
                <><Share2 size={16} /> Compartilhar Bio</>
              )}
            </motion.button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center border-t border-slate-800/50 bg-slate-900/90 backdrop-blur-xl shrink-0">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Criado por ©LocalHost_keu</p>
        </div>
      </motion.div>
    </div>
  );
}

function BioLink({ icon: Icon, label, value, color, href, delay }: any) {
  const colors: any = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };

  return (
    <motion.a 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-5 p-5 rounded-[2.2rem] bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-all group active:scale-[0.98] shadow-lg",
      )}
    >
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border-2", colors[color])}>
        <Icon size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1.5">{label}</p>
        <p className="text-base font-bold text-white truncate tracking-tight">{value}</p>
      </div>
      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-700/30 text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-400/10 transition-all">
        <ExternalLink size={16} />
      </div>
    </motion.a>
  );
}
