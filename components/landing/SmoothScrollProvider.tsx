'use client';

import React, { useEffect } from 'react';

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Respect user accessibility preference
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Only apply momentum smoothing on non-touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    let isRunning = false;
    let targetY = window.scrollY;
    let currentY = window.scrollY;
    const ease = 0.085; // Natural momentum damping

    // Check if target is inside an internal scrollable container
    const isInsideScrollable = (target: EventTarget | null): boolean => {
      let el = target as HTMLElement | null;
      while (el && (el === document.body) === false && (el === document.documentElement) === false) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        if (
          (overflowY === 'auto' || overflowY === 'scroll') &&
          el.scrollHeight > el.clientHeight
        ) {
          return true;
        }
        el = el.parentElement;
      }
      return false;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (isInsideScrollable(e.target)) return;

      e.preventDefault();

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      targetY += e.deltaY * 0.95;
      targetY = Math.max(0, Math.min(targetY, maxScroll));

      if (isRunning === false) {
        isRunning = true;
        requestAnimationFrame(updateScroll);
      }
    };

    const updateScroll = () => {
      const diff = targetY - currentY;
      currentY += diff * ease;

      window.scrollTo(0, Math.round(currentY));

      if (Math.abs(diff) > 0.5) {
        requestAnimationFrame(updateScroll);
      } else {
        currentY = targetY;
        window.scrollTo(0, targetY);
        isRunning = false;
      }
    };

    const onNativeScroll = () => {
      if (isRunning === false) {
        currentY = window.scrollY;
        targetY = window.scrollY;
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onNativeScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onNativeScroll);
    };
  }, []);

  return <>{children}</>;
}
