'use client';

import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle } from 'lucide-react';
import { FAQ_DATA } from '@/lib/faq-data';

export default function FaqGrid() {
  return (
    <section id="faq" className="py-20 lg:py-28 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Scroll Entrance */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-14"
        >
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Questions</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Common questions.
          </h2>
          <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
            Everything you need to know about CannonBench architecture, dual-engine socket parity, and local data privacy.
          </p>
        </motion.div>

        {/* 2-Column Grid with Staggered Scroll Entrance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FAQ_DATA.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.5,
                delay: (index % 2) * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="p-6 sm:p-8 rounded-3xl bg-[#FBFBFB] border border-slate-200/90 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-3">
                  {item.q}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.a}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>QUESTION {index + 1} OF {FAQ_DATA.length}</span>
                <span className="text-orange-600 font-semibold">VERIFIED</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
