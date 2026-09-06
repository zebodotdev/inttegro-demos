declare module 'cloudflare:node' {
  type WorkerHandler = {
    fetch(request: Request): Response | Promise<Response>;
  };

  export function httpServerHandler(options: { port: number }): WorkerHandler;
}
