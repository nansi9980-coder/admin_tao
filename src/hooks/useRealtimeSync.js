import { useEffect, useMemo, useRef, useState } from 'react'
import { API_BASE } from '../services/api'

/** URL Socket.IO (racine du backend, sans /v1) */
const toSocketBase = (httpBase) => {
  if (!httpBase) return 'http://localhost:3000'
  return httpBase
    .replace(/\/v1\/?$/, '')
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '')
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || toSocketBase(API_BASE)

/**
 * Socket.IO : activer après déploiement backend avec EventsModule.
 * Sur Vercel : VITE_ENABLE_SOCKET=true
 * Sans cette variable, seul le polling HTTP est utilisé (pas d'erreur WebSocket).
 */
const SOCKET_ENABLED = import.meta.env.VITE_ENABLE_SOCKET === 'true'

const MAX_SOCKET_ATTEMPTS = 3

const shouldRefreshForTopic = (topics, payload) => {
  if (!topics?.length || topics.includes('*')) return true
  const event = String(payload?.event || '').toLowerCase()
  const topic = String(
    payload?.topic || payload?.type || payload?.resource || payload?.channel || ''
  ).toLowerCase()
  return topics.some((t) => {
    const key = String(t).toLowerCase()
    if (!key || key === '*') return true
    return (
      event === key ||
      event.startsWith(`${key}:`) ||
      topic === key ||
      topic.startsWith(key)
    )
  })
}

export function useRealtimeSync(
  onRefresh,
  {
    interval = 15000,
    topics = ['*'],
    enabled = true,
    immediate = true,
    debounceMs = 400,
    enableSocket = SOCKET_ENABLED,
  } = {}
) {
  const refreshRef = useRef(onRefresh)
  const socketRef = useRef(null)
  const reconnectRef = useRef(null)
  const debounceRef = useRef(null)
  const intervalRef = useRef(null)
  const destroyedRef = useRef(false)
  const socketAttemptsRef = useRef(0)
  const socketDisabledRef = useRef(false)

  const [connectionStatus, setConnectionStatus] = useState('idle')
  const [lastEventAt, setLastEventAt] = useState(null)

  refreshRef.current = onRefresh

  const stableTopics = useMemo(() => topics, [JSON.stringify(topics)])

  useEffect(() => {
    if (!enabled) return
    destroyedRef.current = false
    socketAttemptsRef.current = 0
    socketDisabledRef.current = false

    const runRefresh = () => refreshRef.current?.()

    const scheduleRefresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(runRefresh, debounceMs)
    }

    const clearReconnect = () => {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current)
        reconnectRef.current = null
      }
    }

    const disableSocket = () => {
      socketDisabledRef.current = true
      if (socketRef.current) {
        socketRef.current.removeAllListeners()
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setConnectionStatus('polling')
      clearReconnect()
    }

    const scheduleReconnect = () => {
      if (socketDisabledRef.current || destroyedRef.current) return
      if (socketAttemptsRef.current >= MAX_SOCKET_ATTEMPTS) {
        disableSocket()
        return
      }
      clearReconnect()
      const delay = Math.min(8000, 2000 + socketAttemptsRef.current * 2000)
      reconnectRef.current = setTimeout(connectSocket, delay)
    }

    const tryConnect = (io) => {
      if (socketDisabledRef.current || destroyedRef.current) return
      try {
        if (socketRef.current) {
          socketRef.current.removeAllListeners()
          socketRef.current.disconnect()
          socketRef.current = null
        }
        setConnectionStatus('connecting')
        const token = localStorage.getItem('taoman_admin_token')
        const socket = io(SOCKET_URL, {
          // Render : polling d'abord (WebSocket pur souvent bloqué)
          transports: ['polling', 'websocket'],
          upgrade: true,
          path: '/socket.io',
          auth: token ? { token } : {},
          reconnection: false,
          timeout: 12000,
        })
        socketRef.current = socket

        socket.on('connect', () => {
          if (destroyedRef.current) return
          socketAttemptsRef.current = 0
          setConnectionStatus('connected')
          clearReconnect()
        })
        socket.on('disconnect', () => {
          if (destroyedRef.current) return
          setConnectionStatus('disconnected')
          scheduleReconnect()
        })
        socket.on('connect_error', () => {
          if (destroyedRef.current) return
          socketAttemptsRef.current += 1
          setConnectionStatus('error')
          socket.disconnect()
          scheduleReconnect()
        })
        socket.on('admin:event', (payload) => {
          if (destroyedRef.current) return
          if (shouldRefreshForTopic(stableTopics, payload)) {
            setLastEventAt(Date.now())
            scheduleRefresh()
          }
        })
        socket.onAny((eventName, payload) => {
          if (destroyedRef.current || eventName === 'admin:event') return
          if (shouldRefreshForTopic(stableTopics, { ...(payload || {}), event: eventName })) {
            setLastEventAt(Date.now())
            scheduleRefresh()
          }
        })
      } catch {
        socketAttemptsRef.current += 1
        scheduleReconnect()
      }
    }

    const connectSocket = () => {
      if (!enableSocket || socketDisabledRef.current || destroyedRef.current) return
      if (socketAttemptsRef.current >= MAX_SOCKET_ATTEMPTS) {
        disableSocket()
        return
      }
      if (window.io) {
        tryConnect(window.io)
      } else {
        const existing = document.getElementById('socketio-cdn')
        if (existing) {
          existing.addEventListener('load', () => {
            if (!destroyedRef.current) tryConnect(window.io)
          }, { once: true })
          return
        }
        const script = document.createElement('script')
        script.id = 'socketio-cdn'
        script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js'
        script.onload = () => {
          if (!destroyedRef.current) tryConnect(window.io)
        }
        script.onerror = () => {
          socketAttemptsRef.current = MAX_SOCKET_ATTEMPTS
          disableSocket()
        }
        document.head.appendChild(script)
      }
    }

    if (immediate) runRefresh()
    intervalRef.current = setInterval(runRefresh, interval)

    if (enableSocket) {
      connectSocket()
    } else {
      setConnectionStatus('polling')
    }

    return () => {
      destroyedRef.current = true
      setConnectionStatus('idle')
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      clearReconnect()
      if (socketRef.current) {
        socketRef.current.removeAllListeners()
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [enabled, immediate, interval, debounceMs, stableTopics, enableSocket])

  return { connectionStatus, lastEventAt, socketUrl: SOCKET_URL }
}

export default useRealtimeSync
