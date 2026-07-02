'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './providers';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Lock, User, Key, Cpu, AlertCircle } from 'lucide-react';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let user;
      if (isLogin) {
        user = await api.login({ email, password });
      } else {
        user = await api.register({ email, password, name });
      }
      
      // Explicitly set localStorage to prevent race condition before navigation
      if (user && user.token) {
        localStorage.setItem('token', user.token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      setUser(user);
      router.push('/companies');
    } catch (err: any) {
      setError(err.message || 'SYS_ERR: AUTH_FAILURE');
    } finally {
      setLoading(false);
    }
  };

  const hudVariants = {
    hidden: { scaleY: 0.01, opacity: 0 },
    visible: { 
      scaleY: 1, opacity: 1, 
      transition: { duration: 0.4, ease: "circOut", staggerChildren: 0.1, delayChildren: 0.2 } 
    }
  };

  const lineVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.2, ease: "linear" } }
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* HUD Crosshairs */}
      <div className="absolute top-10 left-10 w-8 h-8 border-t-2 border-l-2 border-[#00f3ff] opacity-50" />
      <div className="absolute top-10 right-10 w-8 h-8 border-t-2 border-r-2 border-[#00f3ff] opacity-50" />
      <div className="absolute bottom-10 left-10 w-8 h-8 border-b-2 border-l-2 border-[#00f3ff] opacity-50" />
      <div className="absolute bottom-10 right-10 w-8 h-8 border-b-2 border-r-2 border-[#00f3ff] opacity-50" />

      <motion.div 
        variants={hudVariants}
        initial="hidden"
        animate="visible"
        className="glass-panel p-8 w-full max-w-[400px] flex flex-col items-stretch relative z-10 font-mono"
      >
        <motion.div variants={lineVariants} className="flex justify-between items-end mb-8 border-b border-[#00f3ff]/30 pb-2">
          <div className="flex items-center gap-2 text-[#00f3ff]">
            <Cpu className="w-6 h-6 animate-pulse" />
            <span className="font-rajdhani text-2xl font-bold tracking-widest">NEXUS_ERP</span>
          </div>
          <span className="text-xs text-[#00f3ff]/50">v4.0.9</span>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.form 
            key={isLogin ? 'login' : 'register'}
            initial={{ opacity: 0, filter: 'blur(5px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(5px)' }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit} 
            className="space-y-5 flex-grow"
          >
            <div className="flex items-center gap-2 mb-6">
              <Terminal className="w-4 h-4 text-[#ff4d00]" />
              <h2 className="text-sm text-[#ff4d00] uppercase tracking-wider font-bold">
                {isLogin ? '> INIT_AUTH_SEQ' : '> NEW_USER_REGISTRATION'}
              </h2>
            </div>
            
            {error && (
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-red-900/40 border-l-2 border-red-500 text-red-400 px-4 py-3 flex items-start gap-3"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-xs font-mono">{error}</span>
              </motion.div>
            )}

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] text-[#00f3ff]/70 tracking-widest uppercase ml-1">IDENTIFIER</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00f3ff]/50" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input w-full pl-10 pr-4 py-3 text-sm placeholder-[#00f3ff]/30"
                    placeholder="ENTER_NAME"
                    required
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-[10px] text-[#00f3ff]/70 tracking-widest uppercase ml-1">COMM_LINK</label>
              <div className="relative">
                <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00f3ff]/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-3 text-sm placeholder-[#00f3ff]/30"
                  placeholder="USER@NETWORK.COM"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#00f3ff]/70 tracking-widest uppercase ml-1">SECURITY_KEY</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00f3ff]/50" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-3 text-sm placeholder-[#00f3ff]/30"
                  placeholder="********"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-cinematic w-full py-3 mt-6 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <span className="font-mono text-sm tracking-widest animate-pulse">PROCESSING...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span className="font-rajdhani text-lg font-bold tracking-widest">
                    {isLogin ? 'ACCESS_SYSTEM' : 'CREATE_NODE'}
                  </span>
                </>
              )}
            </motion.button>
          </motion.form>
        </AnimatePresence>

        <motion.div variants={lineVariants} className="mt-6 pt-4 border-t border-[#00f3ff]/20 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-[11px] text-[#709099] hover:text-[#00ffaa] font-mono tracking-widest transition-colors uppercase"
          >
            [{isLogin ? 'INITIATE_NEW_REGISTRATION' : 'RETURN_TO_AUTH'}]
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
