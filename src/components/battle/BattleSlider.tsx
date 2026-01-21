import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface BattleSliderProps {
  onComplete: (scoreA: number, scoreB: number) => void;
  disabled?: boolean;
  competitorAName: string;
  competitorBName: string;
}

export function BattleSlider({ onComplete, disabled, competitorAName, competitorBName }: BattleSliderProps) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const sliderValue = useMotionValue(50);
  const leftGlow = useTransform(sliderValue, [0, 50, 100], [0.8, 0.2, 0]);
  const rightGlow = useTransform(sliderValue, [0, 50, 100], [0, 0.2, 0.8]);
  const thumbPosition = useTransform(sliderValue, [0, 100], ['0%', '100%']);

  const updateValue = (clientX: number) => {
    if (!trackRef.current || disabled) return;

    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    sliderValue.set(percent);

    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    updateValue(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || disabled) return;
    updateValue(e.clientX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleConfirm = () => {
    if (!hasInteracted || disabled) return;

    const value = sliderValue.get();
    const scoreA = Math.round(100 - value);
    const scoreB = Math.round(value);

    onComplete(scoreA, scoreB);

    // Reset for next round
    sliderValue.set(50);
    setHasInteracted(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <div className="relative py-6">
        {/* Left glow */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full blur-2xl pointer-events-none"
          style={{
            background: 'hsl(var(--primary))',
            opacity: leftGlow,
          }}
        />

        {/* Right glow */}
        <motion.div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full blur-2xl pointer-events-none"
          style={{
            background: 'hsl(var(--primary))',
            opacity: rightGlow,
          }}
        />

        {/* Track */}
        <div
          ref={trackRef}
          className="relative h-12 flex items-center cursor-pointer touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Base Track Line */}
          <div className="absolute left-0 right-0 h-1 rounded-full bg-border overflow-hidden">
            {/* Center marker */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-muted-foreground/30 -translate-x-1/2" />
          </div>

          {/* Dynamic Favor Text - Left */}
          <motion.div
            className="absolute left-0 top-full mt-2 text-sm font-medium text-primary flex items-center gap-1"
            style={{ opacity: useTransform(sliderValue, [45, 20], [0, 1]) }}
          >
            ← Favor Left
          </motion.div>

          {/* Dynamic Favor Text - Right */}
          <motion.div
            className="absolute right-0 top-full mt-2 text-sm font-medium text-primary flex items-center gap-1"
            style={{ opacity: useTransform(sliderValue, [55, 80], [0, 1]) }}
          >
            Favor Right →
          </motion.div>

          {/* Dynamic Neutral Text */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 text-xs text-muted-foreground uppercase tracking-widest"
            style={{ opacity: useTransform(sliderValue, [40, 50, 60], [0, 1, 0]) }}
          >
            Neutral
          </motion.div>

          {/* Thumb */}
          <motion.div
            className="absolute left-0 w-8 h-8 -ml-4 rounded-full cursor-grab active:cursor-grabbing shadow-lg border-2 border-primary bg-background flex items-center justify-center z-10"
            style={{
              left: thumbPosition,
            }}
            animate={{
              scale: isDragging ? 1.1 : 1,
              borderColor: 'hsl(var(--primary))'
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </motion.div>
        </div>
      </div>

      {/* Confirm Button */}
      <motion.button
        onClick={handleConfirm}
        disabled={!hasInteracted || disabled}
        className="arena-button w-full truncate"
        animate={{
          opacity: hasInteracted && !disabled ? 1 : 0.4,
        }}
        whileHover={hasInteracted && !disabled ? { scale: 1.02 } : {}}
        whileTap={hasInteracted && !disabled ? { scale: 0.98 } : {}}
      >
        {disabled ? (
          'Processing...'
        ) : !hasInteracted ? (
          'Confirm Decision'
        ) : sliderValue.get() < 45 ? (
          `Favor ${competitorAName}`
        ) : sliderValue.get() > 55 ? (
          `Favor ${competitorBName}`
        ) : (
          'Confirm: Neutral'
        )}
      </motion.button>
    </div>
  );
}
