/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COINGECKO_API_KEY?: string
  /** 'false' esconde o botão de alertas (ex.: deploy sem banco configurado) */
  readonly VITE_ALERTS_ENABLED?: string
}
