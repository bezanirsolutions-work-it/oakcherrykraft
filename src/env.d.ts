/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_APP_NAME: string;
    readonly VITE_API_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

declare module '*.mp4';
declare module '*.vtt';
declare module '*.webp';
declare module '*.jpeg';
declare module '*.jpg';
declare module '*.png';
declare module '*.svg';

export {};
