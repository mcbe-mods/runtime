import { Base64, utf8Decode, utf8Encode } from '@mcbe-mods/utils'
import { deflateSync, inflateSync } from 'fflate/browser'

export class Compressor {
  compress(data: string): string {
    return Base64.fromBytes(deflateSync(utf8Encode(data)))
  }

  decompress(data: string): string {
    return utf8Decode(inflateSync(Base64.toBytes(data)))
  }
}
