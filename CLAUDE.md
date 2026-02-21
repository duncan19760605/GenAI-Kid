# CLAUDE.md - Universal Development Guidelines

> Global guidelines for Claude Code interactions. Project-specific documentation should exist in each project's root CLAUDE.md.

## 1. Design Philosophy

### KISS - Keep It Simple, Stupid
- Write the simplest solution that works
- Avoid premature optimization
- No speculative features - implement only what is requested
- Prefer clarity over cleverness

### DRY - Don't Repeat Yourself
- Extract common patterns into reusable components
- Use existing utilities before creating new ones
- Reference existing implementations as templates

### Anti-Patterns to Avoid
- Adding "nice-to-have" features not requested
- Over-engineering simple solutions
- Creating abstractions for single-use cases
- Adding excessive error handling for unlikely scenarios

## 2. Quality & Accuracy (Anti-Hallucination Protocol)

### Before Answering or Writing Code
1. **Read First** - Always read relevant source files before modifying or discussing them
2. **Verify Imports** - Check actual exports/interfaces of modules before using them
3. **Check Existing Patterns** - Search codebase for similar implementations
4. **Validate Assumptions** - If uncertain about behavior, read the code rather than assume

### Investigation Requirements
- Use `Glob` and `Grep` to find relevant files
- Read function signatures and types before calling them
- Check package.json/pubspec.yaml for actual dependencies
- Reference existing CLAUDE.md files in subdirectories for module-specific constraints

### Red Flags (Pause and Investigate)
- Using an API without having read its documentation/source
- Assuming a file exists without checking
- Guessing at function signatures or return types
- Making claims about code behavior without reading it

## 3. Action-Oriented Behavior

### Proactive Coding
- When asked to implement something: **write the code**, don't just explain how
- When a bug is described: **fix it**, don't just describe the fix
- When improvement is needed: **make the change**, don't just suggest it

### Handling Ambiguity
When user intent is unclear:
1. Analyze the context and codebase patterns
2. Infer the most logical interpretation
3. State your interpretation clearly
4. Proceed with implementation
5. Invite feedback: "I interpreted X as Y. Let me know if you meant something different."

### Avoid Passive Behavior
Instead of: "You could do X or Y, what do you prefer?"
Prefer: "Based on the codebase patterns, I'll implement X. [reasoning]"

## 4. Task Continuity & Progress Tracking

### Real-Time Tracking (TodoWrite)
- Use TodoWrite for tasks with 3+ steps
- Update status immediately as work progresses
- Mark tasks complete only when fully verified

### Long Task Checkpoints
For tasks requiring extended work:

1. **When to Checkpoint**
   - Before complex refactoring
   - After completing a major phase
   - When context usage approaches ~70%

2. **Checkpoint Location**
   - Directory: `.claude/checkpoints/`
   - Format: `{date}-{brief-description}.md`

3. **Checkpoint Content**
   ```
   # Checkpoint: {Task Description}
   Date: {YYYY-MM-DD HH:MM}

   ## Completed
   - [x] Item 1
   - [x] Item 2

   ## In Progress
   - [ ] Current item (state: ...)

   ## Remaining
   - [ ] Item 3
   - [ ] Item 4

   ## Key Files Modified
   - path/to/file.ts - description

   ## Resume Notes
   - Next steps...
   - Important context...
   ```

4. **Resuming Work**
   - Read checkpoint file first
   - Verify current state matches checkpoint
   - Continue from "In Progress" item

### Never
- End task prematurely due to token concerns
- Leave work half-done without checkpoint
- Lose track of multi-step implementations

---

## 5. Project: Genius GenAI for Kid

Multilingual voice-interactive AI character companion for children ages 4-6. Children speak to an animated character (Bear, Rabbit, or Cat) in their native language; the AI responds in character with age-appropriate content in zh/en/es.

### Monorepo Structure
```
apps/
  backend/      Python FastAPI — voice pipeline, auth, DB, AI providers
  kid-ui/       React Native (Expo) — child-facing animated character + mic
  parent-ui/    Next.js — parent dashboard for settings, usage, conversations
docker-compose.yml   PostgreSQL 16 + Redis 7
.env.example         All required environment variables
```

### Running Services
```bash
# Database
docker compose up -d

# Backend (from apps/backend, with venv activated)
uvicorn app.main:app --reload --port 8000

# Parent UI (from apps/parent-ui)
npm run dev          # http://localhost:3000

# Kid UI (from apps/kid-ui)
npx expo start       # scan QR with Expo Go app
```

### Database Migrations
```bash
cd apps/backend
alembic upgrade head
alembic revision --autogenerate -m "description"
```

### Backend Architecture (`apps/backend/app/`)

**Voice Pipeline** (`api/ws/voice.py` — WebSocket `/ws/voice/{child_id}`):
1. `audio_start` → session init
2. `audio_chunk` (base64 PCM) → buffered
3. `audio_end` → STT → safety check → LLM → safety check → TTS → stream back as `audio_chunk`
4. `command` → repeat/slower/switch_language/dont_understand

**Provider Pattern**: `providers/factory.py` checks DB `ProviderConfig` first, falls back to env vars.
- LLM: OpenAI `gpt-4o-mini` or Anthropic `claude-haiku-3-5`
- STT: OpenAI Whisper at $0.006/min
- TTS: OpenAI TTS (zh→nova, en→shimmer, es→alloy, speed=0.9)

**Auth**: Parent uses JWT Bearer tokens. Child uses 6-digit login code → `child_token`. API keys encrypted with Fernet (`auth/encryption.py`).

**Safety** (`services/safety.py`): `BLOCKED_TOPICS` set + `PII_PATTERNS` regex; redirects child away from inappropriate content.

**Windows**: `database.py` and `alembic/env.py` set `asyncio.WindowsSelectorEventLoopPolicy()` for psycopg async.

**DB Models**: `User`, `Child` (login_code, character_id, learning_languages ARRAY), `Conversation`+`Message`, `ProviderConfig` (encrypted key), `DailyUsage` (UniqueConstraint user_id+date).

### Parent UI (`apps/parent-ui/src/`)
Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Recharts.
- `lib/api.ts` — `ApiClient` class with all API calls + TypeScript interfaces
- `lib/auth-context.tsx` — `AuthProvider`; token in localStorage
- Route groups: `(auth)/` (public) and `(dashboard)/` (protected, checks token)

### Kid UI (`apps/kid-ui/`)
Stack: React Native, Expo 54, Expo Router, expo-av, react-native-reanimated, react-native-svg.
- `hooks/useVoiceSession.ts` — state machine: idle→recording→listening→thinking→speaking
- `components/Character/CharacterView.tsx` — SVG Bear/Rabbit/Cat with breathing+bounce animations; `mouthOpen` (0–1) drives mouth shape
- `services/audioManager.ts` — `AudioManager` (playback) + `RecordingManager`

### Characters
| ID | English | Chinese | Notes |
|----|---------|---------|-------|
| bear | Bobby Bear | 小熊貝貝 | Brown, warm |
| rabbit | Hoppy Rabbit | 小兔跳跳 | White/pink eyes |
| cat | Mimi Cat | 小貓咪咪 | Orange, slit pupils |

Emotions: `happy curious sad excited encouraging empathetic patient gentle neutral`
Each maps to glow color (`COLORS.emotionX`) and eye style (happy/sad/wide/normal).

### Critical Environment Variables
- `DATABASE_URL` — `postgresql+psycopg://user:pass@localhost:5432/genius_kid`
- `JWT_SECRET` — random secret
- `ENCRYPTION_KEY` — Fernet key: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
- `OPENAI_API_KEY` — required for default STT/TTS/LLM

### API Routes
- `POST /api/parent/auth/register|login`, `GET /api/parent/auth/me`
- `GET|POST|PUT|DELETE /api/parent/children`
- `GET /api/parent/conversations`, `GET /api/parent/conversations/{id}`
- `GET|POST /api/parent/providers`
- `GET /api/parent/usage/daily|summary`
- `POST /api/kid/auth/login` (6-digit code)
- `GET /api/kid/character/{child_id}`
- `WS /ws/voice/{child_id}`
