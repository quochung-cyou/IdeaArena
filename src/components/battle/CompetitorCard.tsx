import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Competitor } from '@/types/battle';

interface CompetitorCardProps {
  competitor: Competitor;
  side: 'left' | 'right';
  isActive?: boolean;
  showResult?: boolean;
  isWinner?: boolean;
}

export function CompetitorCard({
  competitor,
  side,
  isActive = true,
  showResult = false,
  isWinner = false,
}: CompetitorCardProps) {
  const slideDirection = side === 'left' ? -60 : 60;

  return (
    <motion.div
      initial={{ opacity: 0, x: slideDirection }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: slideDirection }}
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 20,
        delay: side === 'right' ? 0.1 : 0,
      }}
      className={`
        relative flex-1 min-w-0 p-4 md:p-6 flex flex-col
        ${isActive ? 'arena-card-active' : 'arena-card'}
        ${showResult && isWinner ? 'ring-2 ring-arena-winner' : ''}
        ${showResult && !isWinner ? 'opacity-50' : ''}
      `}
    >
      {/* Result Badge */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`absolute top-3 ${side === 'left' ? 'left-3' : 'right-3'} z-10`}
        >
          <span className={isWinner ? 'arena-badge-winner' : 'arena-badge-loser'}>
            {isWinner ? 'Winner' : 'Defeated'}
          </span>
        </motion.div>
      )}

      {/* Position Badge (LEFT/RIGHT) - Only show when result is NOT shown */}
      {!showResult && (
        <div className={`absolute top-3 ${side === 'left' ? 'left-3' : 'right-3'} z-10 pointer-events-none`}>
          <div className="bg-background/80 backdrop-blur-sm border border-border px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase shadow-sm text-muted-foreground">
            {side === 'left' ? 'Left Side' : 'Right Side'}
          </div>
        </div>
      )}

      {/* Image */}
      <div className="relative mb-4 aspect-[16/10] rounded-md overflow-hidden bg-secondary flex-shrink-0">
        {competitor.imageUrl ? (
          <img
            src={competitor.imageUrl}
            alt={competitor.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
            <span className="text-3xl md:text-4xl font-display font-bold text-muted-foreground/40">
              {competitor.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <h2 className="arena-title text-lg md:text-xl lg:text-2xl font-bold mb-2 flex-shrink-0">
          {competitor.title}
        </h2>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            {competitor.description}
          </p>
        </div>

        {/* Video Reference Link */}
        {competitor.videoUrl && (
          <div className="mt-3 flex justify-start">
            <a
              href={competitor.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
            >
              Watch reference here
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      {/* Side accent */}
      <motion.div
        className={`
          absolute bottom-0 ${side === 'left' ? 'left-0' : 'right-0'}
          w-0.5 h-12 rounded-full bg-primary/40
        `}
        animate={{
          opacity: isActive ? [0.4, 0.8, 0.4] : 0.2,
        }}
        transition={{
          repeat: isActive ? Infinity : 0,
          duration: 2,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}
