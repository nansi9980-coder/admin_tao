import { useEffect, useMemo, useRef, useState } from 'react'
import { API_BASE } from '../services/api'

// Convertit l'URL HTTP(S) en URL Socket.io (même base, sans /api)
const toSocketBase = (httpBase) => {
  if (!httpBase) return 'http://localhost:3000'
  return httpBase.replace(/\/api\/?$/, '')
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || toSocketBase(API_BASE)

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
  } = {}
) {
  const refreshRef   = useRef(onRefresh)
  const socketRef    = useRef(null)
  const reconnectRef = useRef(null)
  const debounceRef  = useRef(null)
  const intervalRef  = useRef(null)
  const destroyedRef = useRef(false)

  const [connectionStatus, setConnectionStatus] = useState('idle')
  const [lastEventAt, setLastEventAt]           = useState(null)

  refreshRef.current = onRefresh

  const stableTopics = useMemo(() => topics, [JSON.stringify(topics)])

  useEffect(() => {
    if (!enabled) return
    destroyedRef.current = false

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

    const tryConnect = (io) => {
      try {
        if (socketRef.current) {
          socketRef.current.disconnect()
          socketRef.current = null
        }
        setConnectionStatus('connecting')
        const token = localStorage.getItem('taoman_admin_token')
        const socket = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          auth: token ? { token } : {},
          reconnection: false,
        })
        socketRef.current = socket

        socket.on('connect', () => {
          if (destroyedRef.current) return
          setConnectionStatus('connected')
          clearReconnect()
        })
        socket.on('disconnect', () => {
          if (destroyedRef.current) return
          setConnectionStatus('disconnected')
          clearReconnect()
          reconnectRef.current = setTimeout(connectSocket, 5000)
        })
        socket.on('connect_error', () => {
          if (destroyedRef.current) return
          setConnectionStatus('error')
          socket.disconnect()
          clearReconnect()
          reconnectRef.current = setTimeout(connectSocket, 8000)
        })
        socket.onAny((eventName, payload) => {
          if (destroyedRef.current) return
          if (shouldRefreshForTopic(stableTopics, { ...(payload || {}), event: eventName })) {
            setLastEventAt(Date.now())
            scheduleRefresh()
          }
        })
      } catch {
        setConnectionStatus('error')
      }
    }

    const connectSocket = () => {
      if (destroyedRef.current) return
      if (window.io) {
        tryConnect(window.io)
      } else {
        const existing = document.getElementById('socketio-cdn')
        if (existing) {
          existing.addEventListener('load', () => { if (!destroyedRef.current) tryConnect(window.io) })
          return
        }
        const script = document.createElement('script')
        script.id  = 'socketio-cdn'
        script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js'
        script.onload  = () => { if (!destroyedRef.current) tryConnect(window.io) }
        script.onerror = () => { setConnectionStatus('error') }
        document.head.appendChild(script)
      }
    }

    if (immediate) runRefresh()
    intervalRef.current = setInterval(runRefresh, interval)
    connectSocket()

    return () => {
      destroyedRef.current = true
      setConnectionStatus('idle')
      if (intervalRef.current)  clearInterval(intervalRef.current)
      if (debounceRef.current)  clearTimeout(debounceRef.current)
      clearReconnect()
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [enabled, immediate, interval, debounceMs, stableTopics])

  return { connectionStatus, lastEventAt }
}

export default useRealtimeSync
