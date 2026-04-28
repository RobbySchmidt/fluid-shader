# Shader Presets — Design

## Goal
Allow saving and loading of shader configurations (presets) to/from a Directus backend, so the user can recall favourite looks without re-tweaking sliders.

## Backend (Directus)

**Instance:** `https://directuscon.axtlust.de`

**New collection:** `shader_presets`

| Field        | Type     | Notes                                |
|--------------|----------|--------------------------------------|
| `id`         | uuid     | Primary key, auto                    |
| `name`       | string   | Required, human-readable preset name |
| `settings`   | json     | Full shader config (see below)       |
| `date_created` | timestamp | Auto                              |

**`settings` JSON shape:**
```json
{
  "style": "flow",
  "speed": 0.025,
  "scale": 1.8,
  "warp": 1.2,
  "sharpness": 0.55,
  "brightness": 1.0,
  "colors": ["#050811", "#0c2440", "#1d4a5e", "#3b8a98"],
  "autoMode": false
}
```

Sort order in API: `-date_created` (newest first).

## Nuxt Server Routes

The Directus admin token must never reach the browser. All Directus calls are proxied through `server/api/` routes. Token comes from `runtimeConfig.directusToken` (private), URL from `runtimeConfig.public.directusUrl`.

| Route                     | Verb   | Body                       | Returns                 |
|---------------------------|--------|----------------------------|-------------------------|
| `/api/presets`            | GET    | —                          | `Preset[]`              |
| `/api/presets`            | POST   | `{ name, settings }`       | `Preset`                |
| `/api/presets/:id`        | DELETE | —                          | `{ ok: true }`          |

`Preset` shape: `{ id, name, settings, date_created }`.

Errors propagate as 4xx/5xx with `{ message }` so the client can surface them.

## Frontend (UI in `app/pages/index.vue`)

New "Presets" section in the existing control panel, placed directly above the "Reset" button:

```
─── Presets ───
[ Name eingeben…       ] [ Speichern ]

▸ Mein Sunset-Preset       ×
▸ Dunkles Blau             ×
▸ Pulse-Rot                ×
```

**Behaviour:**
- **Save:** Type a name → click "Speichern". Calls `POST /api/presets` with the current shader state. On success, name input clears and the list refreshes.
- **Load:** Click a preset name → all reactive `ref`s (style, speed, scale, warp, sharpness, brightness, c1–c4, autoMode) update to that preset's values. Existing `watch`-handlers propagate values to the GLSL uniforms automatically.
- **Delete:** Click `×` → small `confirm()` prompt → `DELETE /api/presets/:id`. List refreshes.
- **Initial load:** Fetch presets list on mount.

**State:** Plain reactive refs in the component (no Pinia needed):
- `presets: Ref<Preset[]>`
- `newPresetName: Ref<string>`
- `saving: Ref<boolean>` / `loading: Ref<boolean>` for button-disabled states
- `error: Ref<string | null>` shown as small red text inside the section if a request fails

**Order of fields when loading:** Set `autoMode` last so the auto-harmony watcher (which overwrites c1–c3 when toggled on) doesn't fight with the explicit colour values being restored.

## Security Note

There is no per-user authentication. The Nuxt server routes proxy all calls with the admin token, so anyone who can reach the deployed site can read/write/delete presets. This is acceptable for a personal tool. If multi-user separation is needed later, layer Directus role-based permissions and user auth on top — out of scope for this spec.

## Out of Scope
- Edit/rename existing presets (delete + re-save instead).
- Sharing / export / import as JSON file.
- Preset thumbnails or previews.
- Per-user accounts.
