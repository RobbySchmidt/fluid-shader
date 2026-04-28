import { directusFetch } from '../../utils/directus'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Preset id is required' })
  }

  await directusFetch<void>(event, `/items/shader_presets/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  return { ok: true }
})
