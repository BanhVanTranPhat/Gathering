## Organized Map Assets

This folder is structured for AI-friendly map building with PixiJS + Tiled.

### Active Maps

- `university/`
  - `tiled/`: source map files (`.tmx`) for campus zones.
  - `tilesets/`: textures used by university maps.
- `office/`
  - `tiled/`: source map files (`.tmj`) for floor-based office maps.
  - `tilesets/`: textures used by office maps.

### Legacy Maps

- `school/` and `company/` are legacy sources kept for migration/reference only.
- New features should target `university` and `office` templates.

### Notes

- Legacy assets remain in `../sprites` and `../tilesets` for backward compatibility.
- New map work should be added under this folder to keep map context clean for AI.

### Tiled Conventions (required for parser)

- Layer naming:
  - `floor*` -> `floor`
  - `walls*` or `furniture*` -> `object`
  - `above*` -> `above_floor`
  - `collisions` -> set `impassable: true`
- Object properties:
  - `exitUrl: "<target-file>#<start-name>"` creates teleporter.
  - object `name` can be used as start marker (for example `from-floor-2`).
- Manifest (`index.json`) should define:
  - `parser` (`tmj-office`, `tmx-campus`, or `realm-template`)
  - `spawnpoint`
  - optional `floors` and `elevator` metadata for multi-floor maps.
