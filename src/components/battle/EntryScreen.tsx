import { useState } from 'react';
import { motion } from 'framer-motion';

interface EntryScreenProps {
  title: string;
  description: string;
  onStart: (name: string) => void;
}

export function EntryScreen({ title, description, onStart }: EntryScreenProps) {
  const [name, setName] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStart(name.trim());
    }
  };

  return (
    <div className="arena-container flex items-center justify-center min-h-screen px-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-block mb-6"
          >
            <span className="arena-badge">Tournament</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="arena-title text-4xl md:text-5xl font-bold mb-4"
          >
            {title || "Battle Arena"}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-muted-foreground text-lg"
          >
            {description || "Rate ideas head-to-head. Your judgment decides the winner."}
          </motion.p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="space-y-6"
        >
          <div className="relative">
            <motion.div
              className="absolute -inset-1 rounded-lg opacity-0 blur-xl transition-opacity duration-300"
              style={{
                background: 'hsl(var(--primary) / 0.2)',
                opacity: isFocused ? 1 : 0
              }}
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Enter your name"
              className="arena-input w-full text-center text-lg relative z-10"
              autoFocus
            />
          </div>

          <motion.button
            type="submit"
            disabled={!name.trim()}
            className="arena-button w-full text-lg font-display"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Enter the Arena
          </motion.button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-arena-text-dim text-sm">
            Multiple rounds await. Each decision shapes the outcome.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
