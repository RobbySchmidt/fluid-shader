import type { H3Event } from 'h3'

export type DirectusPreset = {
  id: string
  name: string
  settings: Record<string, unknown>
  date_created: string
}

export function directusFetch<T>(event: H3Event, path: string, init: Parameters<typeof $fetch>[1] = {}): Promise<T> {
  const config = useRuntimeConfig(event)
  const token = config.directusToken
  const url = config.public.directusUrl

  if (!token || !url) {
    throw createError({ statusCode: 500, statusMessage: 'Directus is not configured (missing NUXT_DIRECTUS_TOKEN or NUXT_PUBLIC_DIRECTUS_URL)' })
  }

  return $fetch<T>(`${url}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  })
}
