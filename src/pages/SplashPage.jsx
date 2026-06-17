import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import port0Logo from '../assets/Port0-logo.png'
import chatSvg from '../assets/Mobile chat dialog application interface.svg'

export default function SplashPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/login'), 4000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="bg-[#0a0a1a] min-h-screen flex flex-col items-center justify-center gap-8">
      <img
        src={port0Logo}
        alt="Port0"
        className="w-68 filter brightness-0 invert"
      />
      <img
        src={chatSvg}
        alt="chat animation"
        style={{ height: 500, width: 500 }}
      />
    </div>
  )
}
