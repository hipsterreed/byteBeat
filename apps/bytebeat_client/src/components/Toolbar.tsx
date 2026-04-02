import bytebeatLogo from '../assets/bytebeat_logo.png'

export function Toolbar() {
  return (
    <header
      className="flex items-center px-6 py-3 shrink-0"
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
    </header>
  )
}
