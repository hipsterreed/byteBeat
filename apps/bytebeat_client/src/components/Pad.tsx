import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Pad as PadType } from '../types'

interface PadProps {
  pad: PadType
  isActive: boolean
  isSelecting: boolean
  onTrigger: () => void
  onEdit: () => void
  onSelect: () => void
}

export function Pad({ pad, isActive, isSelecting, onTrigger, onEdit, onSelect }: PadProps) {
  const [hovered, setHovered] = useState(false)
  const c = pad.color
  const hasSound = !!pad.soundId

  // Lit pads: vibrant color on near-white base. Unlit: dark/off.
  const litBase = '#ebebf4'
  const bg = isActive
    ? `color-mix(in srgb, ${c} 72%, ${litBase})`
    : hasSound
      ? hovered
        ? `color-mix(in srgb, ${c} 58%, ${litBase})`
        : `color-mix(in srgb, ${c} 42%, ${litBase})`
      : hovered
        ? '#f0f0f6'
        : '#d0d0dc'

  // Lit pads: dark tinted text. Unlit: dark gray.
  const textColor = hasSound
    ? `color-mix(in srgb, ${c} 60%, #060610)`
    : 'rgba(0,0,0,0.55)'

  const shadow = isActive
    ? `0 0 0 1px ${c}cc, 0 0 22px ${c}ee, 0 0 50px ${c}99, 0 0 90px ${c}55, inset 0 1px 1px rgba(255,255,255,0.7), inset 0 0 22px ${c}44`
    : hovered && hasSound
      ? `0 5px 16px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4), 0 0 28px ${c}99, 0 0 50px ${c}55, inset 0 1px 1px rgba(255,255,255,0.95), inset 0 -2px 4px rgba(0,0,0,0.06)`
      : hovered
        ? `0 5px 16px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.9), inset 0 -2px 6px rgba(0,0,0,0.08)`
        : hasSound
          ? `0 0 0 1px ${c}66, 0 6px 18px rgba(0,0,0,0.55), 0 0 18px ${c}77, 0 0 38px ${c}44, inset 0 1px 1px rgba(255,255,255,0.95), inset 0 -2px 7px rgba(0,0,0,0.08)`
          : `inset 0 1px 1px rgba(255,255,255,0.7), inset 0 -2px 6px rgba(0,0,0,0.12)`

  return (
    <div
      className="relative aspect-[4/3] rounded-[16px] p-[7px]"
      style={{
        background: '#020207',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.9), inset 0 5px 14px rgba(0,0,0,1), inset 0 0 0 1px rgba(0,0,0,0.9)',
      }}
    >
      {/* Aura spills onto the deck */}
      <AnimatePresence>
        {(isActive || hovered || hasSound) && (
          <motion.div
            className="absolute pointer-events-none"
            style={{
              inset: isActive ? '-16px' : hasSound ? '-10px' : '-6px',
              borderRadius: '24px',
              background: `radial-gradient(circle at center, ${c}${isActive ? '77' : hasSound ? '44' : '28'} 0%, transparent 70%)`,
              filter: `blur(${isActive ? 14 : hasSound ? 12 : 10}px)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
        )}
      </AnimatePresence>

      {/* Pad surface */}
      <motion.div
        className={`relative w-full h-full rounded-[10px] cursor-pointer select-none flex flex-col p-2.5 overflow-hidden ${hasSound ? 'justify-between' : 'items-center justify-center'}`}
        style={{ background: bg, boxShadow: isSelecting ? `${shadow}, 0 0 0 2px ${c}99` : shadow, transition: 'background 0.12s ease, box-shadow 0.12s ease' }}
        animate={isSelecting ? { rotate: [-1.5, 1.5, -1.5] } : { rotate: 0 }}
        transition={isSelecting
          ? { duration: 0.35, repeat: Infinity, ease: 'easeInOut', repeatDelay: Math.random() * 0.15 }
          : { type: 'spring', stiffness: 600, damping: 22 }
        }
        whileTap={{ scale: 0.89, y: 3 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onPointerDown={isSelecting ? onSelect : pad.soundId ? onTrigger : onEdit}
      >
        {/* ── Active animations ── */}
        <AnimatePresence>
          {isActive && (
            <>
              {/* 1. Instant bright flash that bleaches out then fades */}
              <motion.div
                key="flash"
                className="absolute inset-0 rounded-[10px] pointer-events-none"
                style={{ background: `color-mix(in srgb, ${c} 40%, white)` }}
                initial={{ opacity: 0.75 }}
                animate={{ opacity: 0 }}
                exit={{}}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              />

              {/* 2. Radial bloom from center */}
              <motion.div
                key="bloom"
                className="absolute inset-0 rounded-[10px] pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 58%, ${c}bb 0%, ${c}44 45%, transparent 68%)` }}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              />

              {/* 3. Shimmer sweep — a bright streak slides across the surface */}
              <motion.div
                key="shimmer-clip"
                className="absolute inset-0 rounded-[10px] pointer-events-none overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(108deg, transparent 20%, rgba(255,255,255,0.7) 50%, transparent 80%)`,
                    width: '200%',
                    left: '-100%',
                  }}
                  initial={{ x: '0%' }}
                  animate={{ x: '100%' }}
                  exit={{}}
                  transition={{ duration: 0.42, ease: 'easeOut' }}
                />
              </motion.div>

              {/* 4. Pulse ring expands and fades */}
              <motion.div
                key="ring"
                className="absolute inset-0 rounded-[10px] pointer-events-none"
                style={{ border: `2px solid ${c}` }}
                initial={{ opacity: 0.9, scale: 1 }}
                animate={{ opacity: 0, scale: 1.15 }}
                exit={{}}
                transition={{ duration: 0.32, ease: 'easeOut' }}
              />
            </>
          )}
        </AnimatePresence>

        {hasSound ? (
          <>
            {/* Top row: pad number + edit button */}
            <div className="relative flex items-start justify-between z-10">
              <span className="text-[13px] font-bold leading-none" style={{ color: textColor }}>
                {pad.label}
              </span>
              <motion.button
                className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center text-[10px] leading-none"
                style={{
                  color: 'white',
                  background: `${c}cc`,
                  opacity: hovered ? 1 : 0,
                  boxShadow: `0 0 8px ${c}99`,
                  transition: 'opacity 0.12s',
                }}
                whileTap={{ scale: 0.82 }}
                onClick={e => { e.stopPropagation(); onEdit() }}
              >
                +
              </motion.button>
            </div>

            {/* Animated waveform bars while active */}
            {isActive && (
              <div className="relative flex items-end justify-center gap-[2.5px] h-[18px] z-10">
                {[0.5, 0.75, 1, 0.6, 0.85, 0.5, 0.7].map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-[2.5px] rounded-full"
                    style={{ background: textColor }}
                    animate={{ scaleY: [h, h * 0.4, h * 1.2, h * 0.55, h] }}
                    transition={{ duration: 0.44, repeat: Infinity, delay: i * 0.06, ease: 'easeInOut' }}
                  />
                ))}
              </div>
            )}

            {/* Bottom: sound name */}
            <div className="relative z-10">
              <p className="text-[11px] font-mono leading-tight truncate" style={{ color: textColor }}>
                {pad.soundName}
              </p>
            </div>
          </>
        ) : (
          /* Empty: centered label */
          <div className="flex flex-col items-center gap-1 z-10">
            <span className="text-[15px] font-bold leading-none" style={{ color: textColor }}>
              {pad.label}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: textColor, opacity: 0.6 }}>
              empty
            </span>
          </div>
        )}
      </motion.div>
    </div>
  )
}
