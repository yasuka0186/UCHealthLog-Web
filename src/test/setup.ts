import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer'

Object.defineProperty(globalThis, 'Blob', {
  configurable: true,
  value: NodeBlob,
})
Object.defineProperty(globalThis, 'File', {
  configurable: true,
  value: NodeFile,
})

Object.defineProperty(globalThis, 'createImageBitmap', {
  configurable: true,
  value: async () => ({ width: 2000, height: 1000, close: () => undefined }),
})
if (typeof HTMLCanvasElement !== 'undefined') {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: () => ({ fillStyle: '', fillRect: () => undefined, drawImage: () => undefined }),
  })
  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    configurable: true,
    value: (callback: BlobCallback) => callback(new Blob(['compressed'], { type: 'image/jpeg' })),
  })
}
