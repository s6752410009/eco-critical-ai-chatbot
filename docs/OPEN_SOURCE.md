# Open-source provenance

- Upstream: https://github.com/Mintplex-Labs/anything-llm
- Imported commit: `cbaf3357c7d9810bfa1f91f075cae7f533554f80`
- Retrieved: 5 November 2026, Asia/Bangkok.
- License: MIT, Copyright (c) Mintplex Labs Inc. Original LICENSE retained unmodified.
- React frontend, Express server, collector, SQLite/Prisma, vector search and RAG/citations are reused as real source code, not recreated as a mock.
- Alternative considered: LibreChat (React/MIT). AnythingLLM chosen for document workspaces, query mode, multi-user access and a single upstream document pipeline.
- The adaptation uses a normal branch based on the pinned upstream commit. Upstream history is retained in the GitHub fork and the upstream Git remote remains available locally for inspecting updates. Track later changes deliberately rather than replacing customized source with an unrelated release image.
- The source-only publishing branch leaves upstream workflow files unchanged because the active account lacks workflow scope. A classroom CI recipe is provided as docs/classroom-ci.example.yml for review; repository Actions are kept disabled until an owner enables the intended workflow.
- Current UI uses platform sans fonts. Historical font assets retain their original OFL notices.

References checked:
- https://docs.anythingllm.com/features/chat-modes
- https://github.com/Mintplex-Labs/anything-llm/blob/master/LICENSE
- https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash
- https://ai.google.dev/gemini-api/docs/embeddings

Gemini remains a hosted API chosen by the owner; open-source application code does not make the hosted model itself open source.

Educational sample references (original Thai summaries, not copied articles):
- WHO: https://www.who.int/teams/environment-climate-change-and-health/air-quality-and-health/health-impacts/types-of-pollutants
- EPA: https://www.epa.gov/nutrientpollution/basic-information-nutrient-pollution
- UNEP: https://www.unep.org/en/what-we-do/ocean-seas-and-coasts/ecosystem-degradation-pollution/plastic-pollution-marine-litter
- NASA: https://science.nasa.gov/climate-change/causes/

These are sample teaching materials, not a clinically validated or school-approved curriculum.


## Mentingo native frontend source
The owner selected Selleo/mentingo. Original source at `1490a8d56119cb78b2a5a781dfdfdaacf05cded9` is imported into `frontend/src/mentingo/` and directly rendered by the existing React application. Student catalog and lesson pages use original components; teacher tables and forms use original primitives. The source patches, data/router capability adapters and MIT notice are documented in [the integration map](../third_party/mentingo/README.md). This does not import the Mentingo backend or claim unsupported features. Images use the separately recorded Unsplash license.
