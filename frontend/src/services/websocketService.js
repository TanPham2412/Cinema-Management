import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

class WebSocketService {
  constructor() {
    this.client = null
    this.connected = false
    this.subscription = null
    this.pendingScreeningId = null
    this.pendingCallback = null
  }

  connect(screeningId, onSeatUpdate) {
    this.pendingScreeningId = screeningId
    this.pendingCallback = onSeatUpdate

    if (this.client) {
      // Already connecting/connected — just re-subscribe
      if (this.connected) this._subscribe(screeningId, onSeatUpdate)
      return
    }

    // Production (HTTPS): use native WebSocket through nginx → backend
    // Local dev (HTTP):   use SockJS directly to backend on port 8081
    const isHttps = window.location.protocol === 'https:'
    const clientConfig = isHttps
      ? { brokerURL: `wss://${window.location.hostname}/api/ws` }
      : { webSocketFactory: () => new SockJS('http://localhost:8081/api/ws-sockjs') }

    this.client = new Client({
      ...clientConfig,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.connected = true
        if (this.pendingScreeningId) {
          this._subscribe(this.pendingScreeningId, this.pendingCallback)
        }
      },
      onDisconnect: () => {
        this.connected = false
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame)
      },
    })

    this.client.activate()
  }

  _subscribe(screeningId, onSeatUpdate) {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
    this.subscription = this.client.subscribe(
      `/topic/seats/${screeningId}`,
      (message) => {
        if (onSeatUpdate) onSeatUpdate(JSON.parse(message.body))
      }
    )
  }

  disconnect() {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
    if (this.client) {
      this.client.deactivate()
      this.client = null
    }
    this.connected = false
    this.pendingScreeningId = null
    this.pendingCallback = null
  }

  sendSeatSelection(screeningId, seatId, action, userId) {
    if (this.client && this.connected) {
      this.client.publish({
        destination: '/app/seat-selection',
        body: JSON.stringify({ screeningId, seatId, action, userId }),
      })
    }
  }
}

export default new WebSocketService()
