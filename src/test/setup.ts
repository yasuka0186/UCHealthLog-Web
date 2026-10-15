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
