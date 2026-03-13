import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

class WebSocketService {
  constructor() {
    this.client = null
    this.connected = false
  }

  connect(onSeatUpdate) {
    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/api/ws'),
      debug: (str) => {
        console.log('STOMP: ' + str)
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket Connected')
        this.connected = true
        
        // Subscribe to seat updates
        this.client.subscribe('/topic/seats', (message) => {
          const seatUpdate = JSON.parse(message.body)
          if (onSeatUpdate) {
            onSeatUpdate(seatUpdate)
          }
        })
      },
      onDisconnect: () => {
        console.log('WebSocket Disconnected')
        this.connected = false
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame)
      },
    })

    this.client.activate()
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate()
    }
  }

  sendSeatSelection(screeningId, seatId, action) {
    if (this.client && this.connected) {
      this.client.publish({
        destination: '/app/seat-selection',
        body: JSON.stringify({
          screeningId,
          seatId,
          action, // 'SELECT' or 'RELEASE'
        }),
      })
    }
  }
}

export default new WebSocketService()
