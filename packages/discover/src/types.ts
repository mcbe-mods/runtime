export interface DiscoverOptions {
  heartbeatInterval?: number
  ttl?: number
}

export interface ResolvedService {
  serviceType: string
  meta: Record<string, string>
}

export type ServiceEvent
  = { type: 'service-resolved', service: ResolvedService }
    | { type: 'service-removed', serviceType: string }

export interface LocalRegistration {
  fullname: string
  metadata: Record<string, string>
  timer: number
}

export interface RemoteEntry {
  serviceType: string
  meta: Record<string, string>
  lastSeen: number
}

export interface QueryEntry {
  type: string
  callback: (event: ServiceEvent) => void
}
