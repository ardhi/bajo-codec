async function transformer () {
  const { importPkg } = this.bajo.helper
  const { padStart, find, map, each } = await importPkg('lodash-es')
  const { recordFind } = this.bajoDb.helper
  const aisTypes = await recordFind('CodecAisType')
  const countries = await recordFind('CdbCountry')

  return {
    _common: {
      sentenceId: 'sid',
      _omit: ['sentenceName', 'chxOk'],
      _setNull: true,
      talkerId: 'tid',
      longitude: 'lng',
      latitude: 'lat',
      faaMode: 'mode',
      datetime: 'ts',
      time: 'ts',
      trackTrue: 'trackT',
      trackMagnetic: 'trackM',
      variation: 'var',
      variationPole: 'varPol',
      satellitesInView: 'satCnt',
      deviation: 'dev',
      deviationDirection: 'devDir',
      variationDirection: 'varDir',
      reference: 'ref',
      speedKnots: {
        key: 'speed',
        value: val => val * 1.852
      },
      speedOverGround: 'sog',
      courseOverGround: 'cog',
      destination: 'dest'
    },
    ROT: {
      rateOfTurn: 'value',
      status: {
        key: 'valid',
        value: val => val === 'A'
      }
    },
    TLL: {
      // _omit: ['number'],
      reference: {
        value: val => val === 'relative' ? 'R' : null
      }
    },
    TTM: {
      // _omit: ['number', 'unit'],
      distance: {
        value: (val, rec) => rec.unit === 'N' ? (val * 1.852) : val
      },
      speed: {
        value: (val, rec) => rec.unit === 'N' ? (val * 1.852) : val
      },
      distanceCpa: {
        key: 'distCpa',
        value: (val, rec) => rec.unit === 'N' ? (val * 1.852) : val
      },
      reference: {
        value: val => val === 'relative' ? 'R' : null
      },
      acquisition: 'acq'
    },
    VTG: {
      _omit: ['speedKmph']
    },
    GGA: {
      fixType: 'fix',
      horizontalDilution: 'hDil',
      altitudeMeters: 'alt',
      geoidalSeperation: 'geoidSep',
      differentialAge: 'diffAge',
      differentialRefStn: 'diffRefStn'
    },
    GLL: {
      status: {
        key: 'valid',
        value: val => val === 'valid'
      }
    },
    RMC: {
      status: {
        key: 'valid',
        value: val => val === 'valid'
      }
    },
    GSA: {
      selectionMode: {
        key: 'mode',
        value: val => val === 'automatic' ? 'A' : 'M'
      },
      fixMode: 'fixType',
      satellites: 'sat',
      PDOP: 'pdop',
      HDOP: 'hdop',
      VDOP: 'vdop'
    },
    GSV: {
      numberOfMessages: 'msgCnt',
      messageNumber: 'msgNo',
      satellites: {
        key: 'satInfos',
        value: val => map(val, v => {
          return {
            prn: v.prnNumber,
            elev: v.elevationDegrees,
            azmT: v.azimuthTrue,
            snr: v.SNRdB
          }
        })
      }
    },
    MWV: {
      _omit: ['units'],
      windAngle: 'angle',
      speed: {
        value: (val, rec) => rec.units === 'N' ? (val * 1.852) : (rec.units === 'M' ? (val * 3.6) : val)
      },
      status: {
        key: 'valid',
        value: val => val === 'valid'
      },
      reference: {
        value: val => val === 'relative' ? 'R' : 'T'
      }
    },
    MWD: {
      windDirTrue: 'dirT',
      windDirMagnetic: 'dirM'
    },
    'VDM,VDO': {
      speedOverGround: {
        value: val => val * 1.852
      },
      navStatus: 'navStat',
      lon: 'lng',
      rateOfTurn: 'rot',
      specialManoeuvre: 'manouver',
      callsign: 'callSign',
      typeAndCargo: 'aisType',
      type: 'msgType',
      dimBow: 'toBow',
      dimStern: 'toStern',
      dimPort: 'toPortside',
      dimStarboard: 'toStarboard',
      _after: ({ rec, nRec }) => {
        if ([0].includes(nRec.mmsi)) throw new Error(`Invalid MMSI: ${nRec.mmsi}`)
        nRec.mmsi += ''
        if (nRec.imo) nRec.imo += ''
        if (rec.type === 5) {
          nRec.eta = `${padStart(nRec.etaMonth, 2, 0)}-${padStart(nRec.etaDay, 2, 0)} ${padStart(nRec.etaHour, 2, 0)}:${padStart(nRec.etaMinute, 2, 0)}`
          each(['etaMonth', 'etaDay', 'etaHour', 'etaMinute'], k => {
            delete nRec[k]
          })
        }
        if ([24, 5].includes(rec.type)) {
          const country = find(countries, c => (c.mmsi ?? []).includes(parseInt(nRec.mmsi.slice(0, 3)))) ?? {}
          const cls = find(aisTypes, c => c.lookup.includes(rec.typeAndCargo)) ?? {}
          nRec.type = cls.id ?? 'UNSPEC'
          nRec.flag = country.id
        }
      }
    }
  }
}

export default transformer
