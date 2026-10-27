import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface LoginBackgroundProps {
  chakraSpeedSeconds?: number;
  isTransitioning?: boolean;
}

export const LoginBackground: React.FC<LoginBackgroundProps> = ({
  chakraSpeedSeconds = 120,
  isTransitioning = false
}) => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mouse Parallax coordinates: range -1 to 1
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (theme === 'high-contrast') return;

    let animationFrameId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      targetX = (e.clientX / innerWidth - 0.5) * 2;
      targetY = (e.clientY / innerHeight - 0.5) * 2;
    };

    const updateParallax = () => {
      // Smooth lerp for buttery parallax
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
      setMousePos({ x: currentX, y: currentY });
      animationFrameId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationFrameId = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  // Floating Tricolour Particles Canvas
  useEffect(() => {
    if (theme === 'high-contrast') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let isTabVisible = true;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastTime = performance.now();
        animationId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle definition
    interface Particle {
      x: number;
      y: number;
      radius: number;
      color: string;
      speedY: number;
      swaySpeed: number;
      swayOffset: number;
      opacity: number;
    }

    const colors = [
      '#FF9933', // Saffron
      '#FFFFFF', // White
      '#138808', // India Green
      '#FFB366'  // Warm Gold Saffron
    ];

    const particleCount = 36;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 2.2 + 1.0,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 0.4 + 0.15,
        swaySpeed: Math.random() * 0.02 + 0.008,
        swayOffset: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.5 + 0.25
      });
    }

    let lastTime = performance.now();

    const render = (time: number) => {
      if (!isTabVisible) return;

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y -= p.speedY * 60 * dt;
        p.swayOffset += p.swaySpeed;
        const swayX = Math.sin(p.swayOffset) * 0.6;

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x + swayX, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      });

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationId);
    };
  }, [theme]);

  // High contrast mode: Plain solid background, no motion layers
  if (theme === 'high-contrast') {
    return (
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-black"
        aria-hidden="true"
      />
    );
  }

  const isDark = theme === 'dark';

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Base Gradient: Soft warm-white gradient (#FFF8EE to #FFFFFF to #EEF7EE) */}
      <div 
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #0A1226 0%, #0F1C3F 50%, #121C38 100%)'
            : 'linear-gradient(135deg, #FFF8EE 0%, #FFFFFF 50%, #EEF7EE 100%)'
        }}
      />

      {/* 2. Mesh Blobs: 3 blurred shapes drifting on 25-35s loops (transform only) */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{
          transform: `translate3d(${mousePos.x * 6}px, ${mousePos.y * 6}px, 0)`
        }}
      >
        {/* Blob 1: Saffron Top-Left */}
        <div 
          className="absolute -top-[10%] -left-[10%] w-[540px] h-[540px] rounded-full blur-[100px] animate-blob-slow"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(255, 153, 51, 0.22) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(255, 153, 51, 0.32) 0%, transparent 70%)',
            animationDuration: '28s'
          }}
        />

        {/* Blob 2: India Green Bottom-Right */}
        <div 
          className="absolute -bottom-[10%] -right-[10%] w-[560px] h-[560px] rounded-full blur-[110px] animate-blob-reverse"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(19, 136, 8, 0.18) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(19, 136, 8, 0.26) 0%, transparent 70%)',
            animationDuration: '34s'
          }}
        />

        {/* Blob 3: Navy Tint Centre */}
        <div 
          className="absolute top-[35%] left-[25%] w-[480px] h-[480px] rounded-full blur-[120px] animate-blob-pulse"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(31, 58, 147, 0.45) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(31, 58, 147, 0.12) 0%, transparent 70%)',
            animationDuration: '30s'
          }}
        />
      </div>

      {/* 3. Fine Dot-Grid Pattern, masked with a radial gradient so it fades at edges */}
      <div 
        className="absolute inset-0 opacity-[0.22] dark:opacity-[0.14]"
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(rgba(232, 236, 247, 0.6) 1.2px, transparent 1.2px)'
            : 'radial-gradient(rgba(27, 36, 55, 0.6) 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 75%)',
          transform: `translate3d(${mousePos.x * 4}px, ${mousePos.y * 4}px, 0)`
        }}
      />

      {/* 4. Very large Ashoka Chakra Line-Art (24 Spokes), rotating once per 120s (or 6s in transition) */}
      <div 
        className="absolute left-[5%] sm:left-[10%] lg:left-[14%] top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-transform duration-1000"
        style={{
          transform: `translate3d(calc(-50% + ${mousePos.x * 10}px), calc(-50% + ${mousePos.y * 10}px), 0)`
        }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-[480px] h-[480px] sm:w-[560px] sm:h-[560px] lg:w-[640px] lg:h-[640px]"
          style={{
            color: isDark ? '#4B6DD8' : '#000080',
            opacity: isTransitioning ? 0.18 : 0.06,
            animation: `spin ${chakraSpeedSeconds}s linear infinite`,
            transition: 'opacity 0.8s ease'
          }}
        >
          {/* Outer Ring & Inner Ring */}
          <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="22" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="100" cy="100" r="8" fill="currentColor" />

          {/* 24 Exact Spokes */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = i * 15;
            return (
              <g key={i} transform={`rotate(${angle} 100 100)`}>
                {/* Spoke Line */}
                <line
                  x1="100"
                  y1="22"
                  x2="100"
                  y2="92"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                {/* Spoke Tip Pip */}
                <circle cx="100" cy="90" r="1.5" fill="currentColor" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* 5. Soft Conic Light Rays Rotating Slowly behind the emblem */}
      <div 
        className="absolute left-[5%] sm:left-[10%] lg:left-[14%] top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          transform: `translate3d(calc(-50% + ${mousePos.x * 12}px), calc(-50% + ${mousePos.y * 12}px), 0)`
        }}
      >
        <div 
          className="w-[620px] h-[620px] sm:w-[720px] sm:h-[720px] rounded-full animate-spin-slow opacity-40 dark:opacity-30"
          style={{
            animationDuration: isTransitioning ? '12s' : '75s',
            background: isDark
              ? 'conic-gradient(from 0deg at 50% 50%, rgba(255, 168, 77, 0.12) 0deg, transparent 25deg, rgba(75, 109, 216, 0.10) 60deg, transparent 90deg, rgba(255, 168, 77, 0.12) 140deg, transparent 180deg, rgba(25, 164, 11, 0.10) 220deg, transparent 270deg, rgba(255, 168, 77, 0.12) 360deg)'
              : 'conic-gradient(from 0deg at 50% 50%, rgba(255, 153, 51, 0.10) 0deg, transparent 25deg, rgba(31, 58, 147, 0.08) 60deg, transparent 90deg, rgba(255, 153, 51, 0.10) 140deg, transparent 180deg, rgba(19, 136, 8, 0.08) 220deg, transparent 270deg, rgba(255, 153, 51, 0.10) 360deg)',
            maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 65%)',
            WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 65%)'
          }}
        />
      </div>

      {/* 6. Floating Tricolour Particles Canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
};
