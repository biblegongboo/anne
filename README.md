# anne

Easy reading and dyslexia-friendly learning for the `anne.xlsx` sentence pipeline.

## Scope

- Keep `gongboo.org` unchanged.
- Build a separate production pipeline for `anne`.
- Readers do not log in.
- Treat one English source sentence as one output row.
- Support Korean translation, 0/1 question, answer, explanation, and chunks.
- Preserve resume/checkpoint behavior.

## Initial architecture

1. Python sentence pipeline
2. Excel QA export
3. Import to isolated service database
4. Reader UI with TTS and highlight
5. Access control / entitlement layer

## Next step

Define the `anne` Supabase schema and import script.
