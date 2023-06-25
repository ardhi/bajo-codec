import { decode } from 'kea-nmea'

async function decodeNmea ({ message, sentences, transformer } = {}) {
  const { _ } = this.bajo.helper
  const sid = message.slice(3, 6)
  if (sentences && !sentences.includes(sid)) return
  let packet
  try {
    packet = await decode(message, transformer)
    if (!packet) return
  } catch (err) {
    const errs = [
      'No known parser for sentence ID',
      'Invalid sentence',
      'Invalid MMSI'
    ]
    const founds = _.map(errs, e => err.message.startsWith(e))
    if (!founds.includes(true)) throw err
  }
  if (packet) return packet
}

export default decodeNmea
