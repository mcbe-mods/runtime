import type { ProtocolCipher } from '@mcbe-mods/protocol'

/** Custom compression — transforms a string into a smaller string representation */
export interface DataCompressor {
  /** @returns The compressed representation of `data` */
  compress: (data: string) => string
  /** @returns The original data restored from compressed form */
  decompress: (data: string) => string
}

/** Custom serialization — transforms complex data into a string for transport */
export interface Serializer<T> {
  /** @returns The string representation of `value` */
  serialize: (value: T) => string
}

/** Custom deserialization — restores data from the string produced by {@link Serializer} */
export interface Deserializer<T> {
  /** @returns The parsed value */
  deserialize: (data: string) => T
}

/** Options for {@link IPC.send} */
export interface SendOptions<T = never> {
  /** Custom serializer for the data */
  serializer?: Serializer<T>
}

/** Options for {@link IPC.on} */
export interface OnOptions<T = never> {
  /** Custom deserializer for received data */
  deserializer?: Deserializer<T>
}

/** Options for creating an IPC instance */
export interface IPCOptions {
  /** Namespace used in URLs: `bedrock://<namespace>.ipc/<channel>`. @default 'global' */
  namespace?: string
  /**
   * Size of each chunk in UTF-16 code units (not bytes). Non-ASCII characters may occupy multiple code units.
   * @default 1800
   */
  chunkSize?: number
  /**
   * Raw payloads larger than this (characters) will be compressed when `compress` is set.
   * IPC compares the compressed result length against the original — if shorter, the
   * compressed version is sent with a `c` flag for the receiver to decompress.
   * @default 800
   */
  compressThreshold?: number
  /**
   * Optional compressor for payload compression.
   * When set, payloads exceeding `compressThreshold` are passed through `compress()`.
   * If the result is shorter than the original, it's sent with a `c` flag.
   * On receive, the `decompress()` function is called to restore the original data.
   *
   * @example
   * ```ts
   * import { Compressor } from '@mcbe-mods/compress'
   * const ipc = new IPC({ compress: new Compressor() })
   * ```
   */
  compress?: DataCompressor
  /** Maximum allowed serialized packet body size in characters. Throws if exceeded. @default 1_000_000 */
  maxPacketSize?: number
  /**
   * Maximum time (ms) a partially-assembled chunked packet is kept in the buffer
   * before being discarded. 0 disables timeout. @default 30_000
   */
  chunkTimeout?: number
  /**
   * Maximum number of in-flight message IDs tracked for loopback detection.
   * When exceeded, the oldest entry is evicted. @default 1000
   */
  maxInflightIds?: number
  /**
   * Optional cipher for encrypting/decrypting protocol messages.
   * If provided, all IPC messages will be encrypted at the transport layer.
   * @see ProtocolCipher
   */
  cipher?: ProtocolCipher
}
