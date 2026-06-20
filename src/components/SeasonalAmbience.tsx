import React, { useEffect, useRef, useState } from 'react';
import { Sun, Wind, CloudSnow, Flower } from 'lucide-react';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
}

export function SeasonalAmbience() {
  // Auto-detect season based on user's current month
  const getInitialSeason = (): Season => {
    const month = new Date().getMonth(); // 0 is January, 11 is December
    if (month >= 2 && month <= 4) return 'spring'; // Mar, Apr, May
    if (month >= 5 && month <= 7) return 'summer'; // Jun, Jul, Aug
    if (month >= 8 && month <= 10) return 'autumn'; // Sep, Oct, Nov
    return 'winter'; // Dec, Jan, Feb
  };

  const [season, setSeason] = useState<Season>(getInitialSeason());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Define styling and color definitions per season
  const seasonConfig = {
    spring: {
      label: 'Spring Blossom',
      icon: Flower,
      bgClass: 'bg-[#f7fcf3] before:from-pink-100/10 before:to-[#8B9474]/5',
      particleColors: ['rgba(217, 197, 178, 0.45)', 'rgba(139, 148, 116, 0.35)', 'rgba(244, 212, 219, 0.5)'],
      description: 'Gentle cherry blossoms and wild sage greens drifting on a warming morning breeze.',
    },
    summer: {
      label: 'Warm Summer',
      icon: Sun,
      bgClass: 'bg-[#faf7f0] before:from-amber-100/15 before:to-[#D9C5B2]/10',
      particleColors: ['rgba(217, 197, 178, 0.4)', 'rgba(90, 90, 64, 0.25)', 'rgba(230, 210, 180, 0.4)'],
      description: 'Glistening heat shimmer and golden solar specks ascending in the high midday sky.',
    },
    autumn: {
      label: 'Amber Autumn',
      icon: Wind,
      bgClass: 'bg-[#faf4ed] before:from-[#C18C74]/15 before:to-[#5A5A40]/10',
      particleColors: ['rgba(193, 140, 116, 0.55)', 'rgba(90, 90, 64, 0.45)', 'rgba(217, 197, 178, 0.5)'],
      description: 'Rustic copper leaves and dry mountain pinene needles blowing through autumn woodlands.',
    },
    winter: {
      label: 'Frosty Winter',
      icon: CloudSnow,
      bgClass: 'bg-[#f5f6f8] before:from-[#5A5A40]/10 before:to-[#b4bfc7]/10',
      particleColors: ['rgba(255, 255, 255, 0.85)', 'rgba(217, 197, 178, 0.35)', 'rgba(180, 195, 205, 0.45)'],
      description: 'Quiet geometric crystalline snow and ice dust falling under slow twilight shadows.',
    },
  };

  const currentConfig = seasonConfig[season];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize particles array
    const particles: Particle[] = [];
    const maxParticles = 40;

    const createParticle = (initTop = false): Particle => {
      const colors = currentConfig.particleColors;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const sizeMultiplier = season === 'autumn' ? Math.random() * 8 + 6 : Math.random() * 5 + 3;

      return {
        x: Math.random() * width,
        y: initTop ? Math.random() * height : -(Math.random() * 30 + 10),
        size: sizeMultiplier,
        speedY: season === 'summer' 
          ? -(Math.random() * 0.5 + 0.2) // summer rises
          : Math.random() * 0.8 + 0.4,   // others descend
        speedX: season === 'spring'
          ? Math.random() * 0.9 + 0.3    // wind vector to the right
          : season === 'autumn'
          ? Math.random() * 1.2 - 0.2    // heavy gust
          : Math.random() * 0.6 - 0.3,   // gentle drift
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() * 0.02 - 0.01) * (season === 'autumn' ? 3 : 1),
        opacity: Math.random() * 0.5 + 0.3,
        color,
      };
    };

    // Populate initial batch of particles scattered across the screen
    for (let i = 0; i < maxParticles; i++) {
      particles.push(createParticle(true));
    }

    const drawLeaf = (context: CanvasRenderingContext2D, p: Particle) => {
      context.save();
      context.translate(p.x, p.y);
      context.rotate(p.rotation);
      context.beginPath();
      // Draw simple elegant leaf/petal shape
      context.moveTo(0, -p.size);
      context.quadraticCurveTo(p.size / 1.5, -p.size / 2, p.size / 2, 0);
      context.quadraticCurveTo(p.size / 2, p.size / 2, 0, p.size);
      context.quadraticCurveTo(-p.size / 2, p.size / 2, -p.size / 2, 0);
      context.quadraticCurveTo(-p.size / 1.5, -p.size / 2, 0, -p.size);
      context.fillStyle = p.color;
      context.fill();
      context.restore();
    };

    const drawSnowflake = (context: CanvasRenderingContext2D, p: Particle) => {
      context.save();
      context.translate(p.x, p.y);
      context.rotate(p.rotation);
      context.strokeStyle = p.color;
      context.lineWidth = 1;
      context.beginPath();
      for (let i = 0; i < 6; i++) {
        context.moveTo(0, 0);
        context.lineTo(0, p.size);
        // Draw tiny arms
        context.moveTo(0, p.size * 0.5);
        context.lineTo(p.size * 0.2, p.size * 0.7);
        context.moveTo(0, p.size * 0.5);
        context.lineTo(-p.size * 0.2, p.size * 0.7);
        context.rotate(Math.PI / 3);
      }
      context.stroke();
      context.restore();
    };

    const drawOrb = (context: CanvasRenderingContext2D, p: Particle) => {
      context.save();
      context.beginPath();
      // Draw smooth radiating solar particle with gradient
      const grad = context.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
      grad.addColorStop(0, p.color);
      grad.addColorStop(1, 'rgba(250, 247, 240, 0)');
      context.fillStyle = grad;
      context.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      context.fill();
      context.restore();
    };

    // Draw Loop
    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Update movement
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        // Draw particle based on season
        if (season === 'spring' || season === 'autumn') {
          drawLeaf(ctx, p);
        } else if (season === 'winter') {
          drawSnowflake(ctx, p);
        } else {
          drawOrb(ctx, p);
        }

        // Recycle if out of bounds
        const isPastBottom = season === 'summer' ? p.y < -30 : p.y > height + 35;
        const isLeftOrRight = p.x < -30 || p.x > width + 30;

        if (isPastBottom || isLeftOrRight) {
          particles[i] = createParticle(false);
          // Distribute on other side for summer
          if (season === 'summer') {
            particles[i].y = height + (Math.random() * 30 + 10);
          }
        }
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [season, currentConfig]);

  const IconComponent = currentConfig.icon;

  return (
    <div className="relative">
      {/* Absolute canvas behind everything */}
      <div className={`fixed inset-0 pointer-events-none transition-colors duration-[1500ms] -z-10 ${currentConfig.bgClass} before:absolute before:inset-0 before:bg-gradient-to-tr before:pointer-events-none`}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-[0.92]" />
      </div>

      {/* Exquisite control widget at the top margin in header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 relative z-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#fbfbf8]/95 backdrop-blur-md border border-[#e5e5d1] p-3 rounded-2xl shadow-[0_4px_24px_rgba(139,148,116,0.06)]">
          <div className="flex items-center space-x-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-white bg-[#5A5A40] shadow-xs transition-transform duration-500 hover:rotate-180`}>
              <IconComponent className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif italic font-bold text-sm text-[#4A4A3A]">Chronos Seasonal Ambience</span>
                <span className="text-[10px] bg-[#efefdf] text-[#5A5A40] px-2 py-0.5 rounded-full font-bold">Active</span>
              </div>
              <p className="text-[10px] text-[#6b6b5a] font-medium leading-relaxed mt-0.5 max-w-md sm:max-w-xl">
                {currentConfig.description} Palette synched to the <span className="font-semibold text-[#4A4A3A]">{currentConfig.label}</span> phase.
              </p>
            </div>
          </div>

          {/* Clean cycle selector tabs */}
          <div className="flex items-center space-x-1 bg-[#f4f4ec] p-1 rounded-xl border border-[#e5e5d1] w-full sm:w-auto overflow-x-auto">
            {(['spring', 'summer', 'autumn', 'winter'] as Season[]).map((s) => {
              const active = season === s;
              const meta = seasonConfig[s];
              const Icon = meta.icon;
              return (
                <button
                  key={s}
                  id={`season-toggle-${s}`}
                  aria-label={`Switch to ${meta.label} visual ambience`}
                  onClick={() => setSeason(s)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer whitespace-nowrap ${
                    active 
                      ? 'bg-[#5A5A40] text-[#fbfbf8] shadow-xs transform scale-[1.03]' 
                      : 'text-[#6b6b5a] hover:bg-[#efefdf] hover:text-[#4A4A3A]'
                  }`}
                  title={`Switch to ${meta.label}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="capitalize">{s}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
