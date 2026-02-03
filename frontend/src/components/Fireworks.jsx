import { useEffect, useState } from 'react'

const Fireworks = () => {
  const [fireworks, setFireworks] = useState([])

  useEffect(() => {
    const createFirework = () => {
      const id = Date.now() + Math.random()
      const x = Math.random() * 100
      const y = Math.random() * 60 + 10
      const color = ['#e50914', '#d4af37', '#ffffff', '#ffd700'][Math.floor(Math.random() * 4)]
      
      const particles = Array.from({ length: 12 }, (_, i) => ({
        angle: (i * 30) * Math.PI / 180,
        speed: Math.random() * 50 + 50,
      }))

      setFireworks(prev => [...prev, { id, x, y, color, particles }])

      setTimeout(() => {
        setFireworks(prev => prev.filter(fw => fw.id !== id))
      }, 2000)
    }

    // Create firework every 3-5 seconds
    const interval = setInterval(() => {
      if (Math.random() > 0.3) {
        createFirework()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {fireworks.map(fw => (
        <div
          key={fw.id}
          className="absolute"
          style={{
            left: `${fw.x}%`,
            top: `${fw.y}%`,
          }}
        >
          {fw.particles.map((particle, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full animate-firework"
              style={{
                backgroundColor: fw.color,
                transform: `rotate(${particle.angle}rad)`,
                animation: `fireworkExpand 1.5s ease-out forwards`,
                '--distance': `${particle.speed}px`,
              }}
            />
          ))}
        </div>
      ))}
      <style>{`
        @keyframes fireworkExpand {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--distance, 100px), 0) scale(0);
            opacity: 0;
          }
        }
        .animate-firework {
          box-shadow: 0 0 10px currentColor;
        }
      `}</style>
    </div>
  )
}

export default Fireworks
