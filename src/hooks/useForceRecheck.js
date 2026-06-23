import { useEffect, useState } from 'react'

export function useForceRecheck(intervalMs) {
  const [, forceRecheck] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => forceRecheck((tick) => tick + 1), intervalMs)
    return () => clearInterval(interval)
  }, [intervalMs])
}
