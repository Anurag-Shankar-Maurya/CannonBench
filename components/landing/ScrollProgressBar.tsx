'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'motion/react';
import { ArrowUp, ArrowRight, Zap } from 'lucide-react';

export default function ScrollProgressBar() {
  const { scrollYProgress, scrollY } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  const [showFloatingBar, setShowFloatingBar] = useState(false);

  useEffect(() => {
    return scrollY.on('change', (latest) => {
      setShowFloatingBar(latest > 350);
    });
  }, [scrollY]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const progressStyle = { scaleX };

  return (
    <>
      {/* Top Sticky Reading Progress Bar */}
      <motion.div
        style={progressStyle}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 origin-left z-50 pointer-events-none shadow-sm"
      />

      {/* Floating Scroll Navigation Bar (Reveals on Scroll) */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={
          showFloatingBar
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 20, scale: 0.95 }
        }
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 p-1.5 rounded-full bg-slate-900/90 text-white backdrop-blur-md border border-slate-800 shadow-xl ${
          showFloatingBar ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={scrollToTop}
          className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Scroll to top"
          aria-label="Scroll back to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-800" />

        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-sm"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Open Workbench</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </motion.div>
    </>
  );
}
