import type { ProtocolCipher } from '@mcbe-mods/protocol'

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
   * If a payload (or already compressed payload) exceeds this many **bytes**
   * (not characters), it will be split into chunks.
   *
   * Minecraft's `/scriptevent` command has a **2048-byte** message limit:
   * @see https://learn.microsoft.com/en-us/minecraft/creator/reference/content/commandsreference/examples/commands/scriptevent?view=minecraft-bedrock-stable#usage
   *
   * With `compressToBase64`, each character is 1 byte,
   * so the safe value keeps each chunk data slice + URL overhead ≤ 2048.
   * @default 1800
   */
  chunkSize?: number
  /** Raw JSON payloads larger than this will be compressed with deflate before sending. @default 800 */
  compressThreshold?: number
  /** Maximum allowed serialized packet body size in characters. Throws if exceeded. @default 1_000_000 */
  maxPacketSize?: number
  /**
   * Maximum time (ms) a partially-assembled chunked packet is kept in the buffer
   * before being discarded. 0 disables timeout. @default 30_000
   */
  chunkTimeout?: number
  /**
   * Optional cipher for encrypting/decrypting protocol messages.
   * If provided, all IPC messages will be encrypted at the transport layer.
   * @see ProtocolCipher
   */
  cipher?: ProtocolCipher
}
