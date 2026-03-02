import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'

type Options<T> = {
  serialize?: (value: T) => string
  deserialize?: (raw: string) => T
}

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  options?: Options<T>,
): [T, Dispatch<SetStateAction<T>>] {
  const serialize = useMemo(() => options?.serialize ?? ((v: T) => JSON.stringify(v)), [options?.serialize])
  const deserialize = useMemo(
    () =>
      options?.deserialize ??
      ((raw: string) => {
        try {
          return JSON.parse(raw) as T
        } catch {
          return defaultValue
        }
      }),
    [defaultValue, options?.deserialize],
  )

  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw == null) return defaultValue
      return deserialize(raw)
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, serialize(state))
    } catch {
      // ignore
    }
  }, [key, serialize, state])

  return [state, setState]
}

