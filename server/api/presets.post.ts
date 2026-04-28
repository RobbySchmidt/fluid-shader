import { directusFetch, type DirectusPreset } from '../utils/directus'

type Body = {
  name?: unknown
  settings?: unknown
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event)

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Preset name is required' })
  }
  if (!body.settings || typeof body.settings !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Preset settings are required' })
  }

  const res = await directusFetch<{ data: DirectusPreset }>(
    event,
    '/items/shader_presets?fields=id,name,settings,date_created',
    {
      method: 'POST',
      body: { name, settings: body.settings },
    },
  )
  return res.data
})
