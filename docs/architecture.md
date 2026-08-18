# anne architecture draft

## Goals

- One source sentence = one row
- Easy reading first
- Separate content production from delivery
- No changes to existing gongboo.org data

## Planned layers

- `pipeline/` sentence generation and QA
- `imports/` Excel to service DB sync
- `db/` schema and access rules
- `app/` reader UI
- `admin/` publish and entitlement tools

## Notes

- Passage generation stays out of production for now.
- Resume/checkpoint must remain deterministic.
