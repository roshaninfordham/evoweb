export type SSEEvent = { event: string; data: unknown };

export function createSSEStream() {
  const encoder = new TextEncoder();
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
    },
  });

  function send(event: string, data: unknown) {
    controllerRef?.enqueue(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    );
  }

  function close() {
    controllerRef?.close();
  }

  return { stream, send, close };
}
