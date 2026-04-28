import { directusFetch, type DirectusPreset } from '../utils/directus'

export default defineEventHandler(async (event) => {
  const res = await directusFetch<{ data: DirectusPreset[] }>(
    event,
    '/items/shader_presets?sort=-date_created&fields=id,name,settings,date_created',
  )
  return res.data
})
