import bytebeatLogo from '../assets/bytebeat_logo.png'
import elevenLabsLogo from '../assets/elevenlabs-logo-white.png'
import cloudflareLogo from '../assets/CF Logo 2.jpg'

export function Toolbar() {
  return (
    <header
      className="flex items-center justify-between px-6 py-3 shrink-0"
      style={{
        background: '#0c0c12',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div className="flex items-center gap-3">
        <img src={bytebeatLogo} alt="ByteBeat" className="h-10 w-auto" />
        <span className="text-lg font-bold tracking-tight" style={{ color: 'rgba(255,255,255,0.9)' }}>
          ByteBeat
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
          powered by
        </span>
        <div className="flex items-center gap-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 16 }}>
          <img src={elevenLabsLogo} alt="ElevenLabs" className="h-4 w-auto opacity-70 hover:opacity-100 transition-opacity" />
          <img src={cloudflareLogo} alt="Cloudflare" className="h-9 w-auto hover:opacity-90 transition-opacity rounded-md" style={{ padding: '4px 8px', background: '#ffffff' }} />
        </div>
      </div>
    </header>
  )
}
