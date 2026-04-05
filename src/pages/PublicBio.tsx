import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Instagram, 
  ExternalLink,
  Share2,
  Check,
  Copy
} from 'lucide-react';
import { googleSheetsService } from '../services/dataService';
import { BioConfig } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function PublicBio() {
  const [config, setConfig] = useState<BioConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cnpjCopied, setCnpjCopied] = useState(false);

  useEffect(() => {
    console.log('PublicBio: Initializing...');
    
    async function loadBio() {
      try {
        const params = new URLSearchParams(window.location.search);
        const portableData = params.get('d');
        
        if (portableData) {
          try {
            // Fix potential space issues in base64 from URL params
            const normalizedBase64 = portableData.replace(/ /g, '+');
            
            // Add padding if missing
            const paddedBase64 = normalizedBase64.padEnd(normalizedBase64.length + (4 - normalizedBase64.length % 4) % 4, '=');
            
            try {
              const binary = atob(paddedBase64);
              const decodedStr = decodeURIComponent(Array.prototype.map.call(binary, (c: string) => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              
              const decoded = JSON.parse(decodedStr);
              setConfig(decoded);
              setLoading(false);
              return;
            } catch (decodeErr) {
              console.error('PublicBio: Decoding error:', decodeErr);
              // Fallback to sheet loading if decoding fails
            }
          } catch (e) {
            console.error('PublicBio: Failed to process portable data:', e);
          }
        }

        const data = await googleSheetsService.fetchData('Bio');
        if (data && data.length > 0) {
          setConfig(data[0]);
        } else if (!portableData) {
          setError('Nenhuma configuração de Bio encontrada.');
        } else {
          setError('O link compartilhado parece estar corrompido ou incompleto.');
        }
      } catch (err) {
        console.error('PublicBio: Error loading bio:', err);
        setError('Erro ao carregar as informações.');
      }
      setLoading(false);
    }
    loadBio();
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-indigo-600/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-400 text-sm font-bold tracking-widest uppercase animate-pulse">Carregando...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mb-8 border border-slate-800 shadow-2xl">
          <Building2 size={40} className="text-slate-600" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Ops! Bio não encontrada.</h1>
        <p className="text-slate-400 max-w-xs leading-relaxed">{error || 'Esta página ainda não foi configurada.'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-10 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 md:p-8 selection:bg-indigo-500/30 overflow-x-hidden scrollbar-hide">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[450px] sm:bg-slate-900 sm:rounded-[3.5rem] sm:border-[12px] sm:border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col min-h-screen sm:min-h-[85vh] sm:max-h-[90vh] relative scrollbar-hide"
      >
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Header/Banner */}
          <div className="h-44 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]"></div>
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
              <motion.div 
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                className="w-32 h-32 rounded-[2.5rem] border-4 border-slate-900 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex items-center justify-center"
              >
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Building2 size={56} className="text-slate-200" />
                )}
              </motion.div>
            </div>
          </div>

          <div className="mt-24 px-8 text-center space-y-4">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-black text-white tracking-tight"
            >
              {config.companyName || 'Nome da Empresa'}
            </motion.h2>
            
            {config.cnpj && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="flex flex-col items-center gap-2"
              >
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">CNPJ / Chave PIX</p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(config.cnpj || '');
                    setCnpjCopied(true);
                    setTimeout(() => setCnpjCopied(false), 2000);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl transition-all group"
                >
                  <span className="text-sm font-mono text-slate-300 group-hover:text-white">{config.cnpj}</span>
                  {cnpjCopied ? (
                    <Check size={14} className="text-emerald-500" />
                  ) : (
                    <Copy size={14} className="text-slate-500 group-hover:text-indigo-400" />
                  )}
                </button>
              </motion.div>
            )}

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-slate-400 leading-relaxed font-medium"
            >
              {config.description || 'Bem-vindo! Explore nossos canais de atendimento.'}
            </motion.p>
          </div>

          <div className="mt-12 px-8 space-y-4 pb-16">
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
              className="pt-10"
            >
              <div className="p-8 rounded-[2.5rem] bg-gradient-to-b from-slate-800/50 to-slate-800/20 border border-slate-700/50 text-center backdrop-blur-xl shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-5 border border-indigo-500/20">
                  <MapPin size={28} />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Localização</p>
                <p className="text-lg font-bold text-white leading-relaxed px-2">
                  {config.address || 'Endereço não informado'}
                </p>
                {config.address && (
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(config.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
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
              className="w-full mt-12 py-4 flex items-center justify-center gap-3 text-slate-500 hover:text-indigo-400 transition-colors font-bold text-sm uppercase tracking-widest"
            >
              {copied ? (
                <><Check size={18} className="text-emerald-500" /> Link Copiado!</>
              ) : (
                <><Share2 size={18} /> Compartilhar esta Bio</>
              )}
            </motion.button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 text-center border-t border-slate-800/50 bg-slate-900/90 backdrop-blur-xl">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Criado por ©LocalHost_keu</p>
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
        "flex items-center gap-5 p-6 rounded-[2rem] bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-all group active:scale-[0.98] shadow-lg",
      )}
    >
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border-2", colors[color])}>
        <Icon size={28} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-2">{label}</p>
        <p className="text-lg font-bold text-white truncate tracking-tight">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-700/30 text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-400/10 transition-all">
        <ExternalLink size={18} />
      </div>
    </motion.a>
  );
}
