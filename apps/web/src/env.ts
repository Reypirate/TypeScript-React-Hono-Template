type ClientEnv = {
  VITE_APP_URL: string;
  VITE_API_URL: string;
};

const runtimeEnv = window.__env ?? {};

export const env: ClientEnv = {
  VITE_APP_URL: runtimeEnv.VITE_APP_URL ?? import.meta.env.VITE_APP_URL ?? window.location.origin,
  VITE_API_URL: runtimeEnv.VITE_API_URL ?? import.meta.env.VITE_API_URL ?? window.location.origin,
};
