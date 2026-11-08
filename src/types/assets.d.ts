// Vite "?url" imports resolve to the emitted asset URL.
declare module '*.mjs?url' {
  const url: string;
  export default url;
}
