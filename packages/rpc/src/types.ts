import type { ProtocolCipher } from '@mcbe-mods/protocol'

/** Options for creating an RPC instance */
export interface RPCOptions {
  /** Namespace used in URLs: `bedrock://<namespace>.req.rpc/<method>`. @default 'global' */
  namespace?: string
  /** Default timeout in ms for invoke calls. @default 5000 */
  timeout?: number
  /**
   * Optional cipher for encrypting/decrypting protocol messages.
   * If provided, all RPC messages will be encrypted at the transport layer.
   * @see ProtocolCipher
   */
  cipher?: ProtocolCipher
}
