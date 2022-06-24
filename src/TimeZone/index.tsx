import * as React from 'react'
import Select from 'react-select'
import spacetime from 'spacetime'
import soft from 'timezone-soft'
import allTimezones from './timezone-list.js'
import type {
  Props,
  ITimezone,
  ITimezoneOption,
  ILabelStyle,
} from './types/timezone'

export { allTimezones }
export type { ITimezone, ITimezoneOption, Props, ILabelStyle }

const TimezoneSelect = ({
  value,
  onBlur,
  onChange,
  labelStyle = 'original',
  timezones,
  //@ts-ignore
  extraLabels = [
    {
      tz: 'America/Sao_Paulo',
      label: 'Juiz de Fora'
    },
    {
      tz: 'America/Sao_Paulo',
      label: 'São Paulo'
    }
  ],
  ...props
}: Props) => {
  if (!timezones) timezones = allTimezones
  const getOptions = React.useMemo(() => {
    //@ts-ignore
    const defaultEntries = Object.entries(timezones)
      .reduce<ITimezoneOption[]>((selectOptions, zone) => {
        const now = spacetime.now(zone[0])
        const tz = now.timezone()
        const tzStrings = soft(zone[0])

        let label = ''
        let abbr = now.isDST()
          ? // @ts-expect-error
            tzStrings[0].daylight?.abbr
          : // @ts-expect-error
            tzStrings[0].standard?.abbr
        let altName = now.isDST()
          ? tzStrings[0].daylight?.name
          : tzStrings[0].standard?.name

        const min = tz.current.offset * 60
        const hr =
          `${(min / 60) ^ 0}:` + (min % 60 === 0 ? '00' : Math.abs(min % 60))
        const prefix = `(GMT${hr.includes('-') ? hr : `+${hr}`}) ${zone[1]}`

        switch (labelStyle) {
          case 'original':
            label = prefix
            break
          case 'altName':
            label = `${prefix} ${altName?.length ? `(${altName})` : ''}`
            break
          case 'abbrev':
            label = `${prefix} ${abbr?.length < 5 ? `(${abbr})` : ''}`
            break
          default:
            label = `${prefix}`
        }

        selectOptions.push({
          value: tz.name,
          label: label,
          offset: tz.current.offset,
          abbrev: abbr,
          altName: altName,
        })

        return selectOptions
      }, [])
      //@ts-ignore
      .sort((a: ITimezoneOption, b: ITimezoneOption) => a.offset - b.offset)

    const extraLabelsToBeAdded = [
      {
        value: 'America/Sao_Paulo',
        label: '(GMT-3:00) Juiz de Fora',
        //TODO grab from the selectOptions default
        offset: -3,
        abbrev: "BRT",
        altName: "Brasilia Standard Time"
      }
    ]

    console.log(extraLabels)

    // get the array of extra labels
    // build an array that matches the type that is expected on the selected component
    // {
    //   value: tz.name, //TODO going to get this value comparing to the timezones object
    //   label: label,
    //   offset: tz.current.offset,
    //   abbrev: abbr,
    //   altName: altName,
    // }

    return [...defaultEntries, ...extraLabelsToBeAdded]
  }, [labelStyle, timezones])

  const handleChange = (tz: ITimezoneOption) => {
    onChange && onChange(tz)
  }

  const findFuzzyTz = (zone: string): ITimezoneOption => {
    let currentTime = spacetime.now('GMT')
    try {
      currentTime = spacetime.now(zone)
    } catch (err) {
      //@ts-ignore
      return
    }
    return getOptions
      .filter(
        (tz: ITimezoneOption) =>
          tz.offset === currentTime.timezone().current.offset
      )
      .map((tz: ITimezoneOption) => {
        let score = 0
        if (
          currentTime.timezones[tz.value.toLowerCase()] &&
          !!currentTime.timezones[tz.value.toLowerCase()].dst ===
            currentTime.timezone().hasDst
        ) {
          if (
            tz.value
              .toLowerCase()
              .indexOf(
                currentTime.tz.substring(currentTime.tz.indexOf('/') + 1)
              ) !== -1
          ) {
            score += 8
          }
          if (
            tz.label
              .toLowerCase()
              .indexOf(
                currentTime.tz.substring(currentTime.tz.indexOf('/') + 1)
              ) !== -1
          ) {
            score += 4
          }
          if (
            tz.value
              .toLowerCase()
              .indexOf(currentTime.tz.substring(0, currentTime.tz.indexOf('/')))
          ) {
            score += 2
          }
          score += 1
        } else if (tz.value === 'GMT') {
          score += 1
        }
        return { tz, score }
      })
      .sort((a, b) => b.score - a.score)
      .map(({ tz }) => tz)[0]
  }

  const parseTimezone = (zone: ITimezone) => {
    if (typeof zone === 'object' && zone.value && zone.label) return zone
    if (typeof zone === 'string') {
      return (
        getOptions.find(tz => tz.value === zone) ||
        (zone.indexOf('/') !== -1 && findFuzzyTz(zone))
      )
    } else if (zone.value && !zone.label) {
      return getOptions.find(tz => tz.value === zone.value)
    }
  }

  return (
    <>
      {
        console.log({getOptions})
      }
      <Select
        value={parseTimezone(value)}
        //@ts-ignore
        onChange={handleChange}
        options={getOptions}
        onBlur={onBlur}
        {...props}
      />
    </>
  )
}

export default TimezoneSelect
