export interface DiscoverOptions {
  heartbeatInterval?: number
  ttl?: number
}

export interface ResolvedService<M = Record<string, any>> {
  serviceType: string
  meta: M
}

export type ServiceEvent<M = Record<string, any>>
  = { type: 'service-resolved', service: ResolvedService<M> }
    | { type: 'service-removed', serviceType: string }

export interface LocalRegistration {
  fullname: string
  meta: unknown
  timer: number
}

export interface RemoteEntry {
  serviceType: string
  meta: unknown
  lastSeen: number
}

export interface QueryEntry {
  type: string
  callback: (event: ServiceEvent<any>) => void
}
