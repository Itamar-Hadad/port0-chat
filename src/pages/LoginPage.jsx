import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import port0Logo from '../assets/Port0-logo.png'

function Field({ label, type, placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{
        color: 'rgba(255,255,255,0.45)',
        fontSize: '0.7rem',
        letterSpacing: '0.08em',
        fontWeight: 600,
        textTransform: 'uppercase',
      }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(240,140,48,0.6)' : 'rgba(255,255,255,0.1)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(240,140,48,0.08)' : 'none',
          color: '#fff',
          borderRadius: '0.625rem',
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
          outline: 'none',
          width: '100%',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}

function PasswordRequirements({ password }) {
  const checks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'At least one letter',   met: /[a-zA-Z]/.test(password) },
    { label: 'At least one number',   met: /[0-9]/.test(password) },
  ]
  const metCount = checks.filter(c => c.met).length
  const barColor = metCount === 3 ? '#22c55e' : metCount === 2 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.5rem' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            flex: 1, height: '3px', borderRadius: '2px',
            background: i < metCount ? barColor : 'rgba(255,255,255,0.1)',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {checks.map(check => (
          <div key={check.label} style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            fontSize: '0.7rem',
            color: check.met ? '#86efac' : 'rgba(255,255,255,0.3)',
            transition: 'color 0.2s',
          }}>
            <span>{check.met ? '✓' : '○'}</span>
            <span>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 14.233 17.64 11.925 17.64 9.2z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

function friendlyError(error) {
  const code = error?.code ?? ''
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found')
    return 'Incorrect email or password'
  if (code === 'auth/email-already-in-use')
    return 'An account with this email already exists'
  if (code === 'auth/invalid-email')
    return 'Please enter a valid email address'
  if (code === 'auth/weak-password')
    return 'Password is too weak'
  if (code === 'auth/too-many-requests')
    return 'Too many failed attempts — please try again later'
  if (code === 'auth/network-request-failed')
    return 'Network error — check your connection'
  if (code === 'auth/popup-closed-by-user')
    return 'Google sign-in was cancelled'
  return 'Something went wrong — please try again'
}

export default function LoginPage() {
  const { login, register, googleSignIn } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function switchTab(newTab) {
    setTab(newTab)
    setError('')
  }

  async function handleLogin(event) {
    event.preventDefault()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email')
      return
    }
    if (!password) {
      setError('Password is required')
      return
    }
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/chat')
    } catch (error) {
      setError(friendlyError(error))
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(event) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Full name is required')
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (!/[a-zA-Z]/.test(password)) {
      setError('Password must contain at least one letter')
      return
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number')
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }
    setError('')
    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/chat')
    } catch (error) {
      setError(friendlyError(error))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      await googleSignIn()
      navigate('/chat')
    } catch (error) {
      setError(friendlyError(error))
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#0d0620', fontFamily: "'Outfit', system-ui, sans-serif" }}
    >
      {/* Background glows — matching Port0's purple haze */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: [
          'radial-gradient(ellipse 70% 50% at 10% 10%, rgba(109,40,217,0.25) 0%, transparent 65%)',
          'radial-gradient(ellipse 50% 40% at 90% 90%, rgba(240,140,48,0.12) 0%, transparent 65%)',
          'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(30,10,60,0.6) 0%, transparent 80%)',
        ].join(', ')
      }} />

      {/* Subtle dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%)',
      }} />

      {/* Card */}
      <div
        className="w-full max-w-md relative"
        style={{
          background: 'linear-gradient(160deg, rgba(22,10,50,0.98) 0%, rgba(14,6,32,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '1.25rem',
          boxShadow: [
            '0 0 0 1px rgba(109,40,217,0.15)',
            '0 40px 100px rgba(0,0,0,0.7)',
            'inset 0 1px 0 rgba(255,255,255,0.06)',
          ].join(', '),
          padding: '2.5rem',
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '15%',
          right: '15%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(240,140,48,0.6), transparent)',
          borderRadius: '1px',
        }} />

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src={port0Logo}
            alt="Port0"
            style={{ height: '1.75rem', filter: 'brightness(0) invert(1)', opacity: 0.92 }}
          />
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 mb-8"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '0.75rem',
          }}
        >
          <button
            onClick={() => switchTab('login')}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.18s',
              ...(tab === 'login'
                ? {
                    background: '#F08C30',
                    color: '#fff',
                    boxShadow: '0 2px 12px rgba(240,140,48,0.35)',
                  }
                : {
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.35)',
                  }),
            }}
          >
            Login
          </button>
          <button
            onClick={() => switchTab('register')}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.18s',
              ...(tab === 'register'
                ? {
                    background: '#F08C30',
                    color: '#fff',
                    boxShadow: '0 2px 12px rgba(240,140,48,0.35)',
                  }
                : {
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.35)',
                  }),
            }}
          >
            Register
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5',
            borderRadius: '0.625rem',
            padding: '0.75rem 1rem',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
          }}>
            <span style={{ opacity: 0.7, flexShrink: 0 }}>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <Field label="Email" type="email" placeholder="Email" value={email} onChange={setEmail} />
            <Field label="Password" type="password" placeholder="Password" value={password} onChange={setPassword} />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '0.625rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#fff',
                letterSpacing: '0.03em',
                marginTop: '0.25rem',
                transition: 'all 0.18s',
                background: loading
                  ? 'rgba(240,140,48,0.4)'
                  : 'linear-gradient(135deg, #F08C30 0%, #D37B2A 100%)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(240,140,48,0.3)',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Register form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <Field label="Full Name" type="text" placeholder="Name" value={name} onChange={setName} />
            <Field label="Email" type="email" placeholder="Email" value={email} onChange={setEmail} />
            <div>
              <Field label="Password" type="password" placeholder="Password" value={password} onChange={setPassword} />
              {password && <PasswordRequirements password={password} />}
            </div>
            <Field label="Confirm Password" type="password" placeholder="Confirm password" value={confirmPassword} onChange={setConfirmPassword} />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '0.625rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#fff',
                letterSpacing: '0.03em',
                marginTop: '0.25rem',
                transition: 'all 0.18s',
                background: loading
                  ? 'rgba(240,140,48,0.4)'
                  : 'linear-gradient(135deg, #F08C30 0%, #D37B2A 100%)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(240,140,48,0.3)',
              }}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.75rem', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
        </div>

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.625rem',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.625rem',
            transition: 'all 0.18s',
            opacity: loading ? 0.5 : 1,
          }}
          onMouseEnter={(event) => { if (!loading) event.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
          onMouseLeave={(event) => { event.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
        >
          <GoogleIcon />
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
