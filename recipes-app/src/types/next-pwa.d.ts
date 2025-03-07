declare module 'next-pwa' {
  import { NextConfig } from 'next'

  interface PWAConfig {
    dest?: string
    disable?: boolean
    register?: boolean
    scope?: string
    sw?: string
    skipWaiting?: boolean
    runtimeCaching?: any[]
    buildExcludes?: Array<RegExp | string>
    publicExcludes?: Array<string>
    fallbacks?: {
      [key: string]: string
    }
    cacheOnFrontEndNav?: boolean
    reloadOnOnline?: boolean
    sw?: string
    register?: boolean
    scope?: string
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig
  export = withPWA
} 