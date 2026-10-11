/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'false' esconde o botão de alertas (ex.: deploy sem banco configurado) */
  readonly VITE_ALERTS_ENABLED?: string
}
