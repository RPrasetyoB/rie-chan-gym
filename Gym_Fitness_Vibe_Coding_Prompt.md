# AI Vibe Coding Prompt --- "Rie-chan Cute PT" Full Stack Gym & Fitness Web App (Mobile First)

## License

This project is **free and open for personal, non-commercial use**.

-   No subscription, paywall, or license fee required for individual users.
-   Anyone may run, modify, and self-host the app for their own personal fitness tracking.
-   Attribution appreciated but not required.
-   Commercial redistribution, resale, or SaaS offering built on top of this codebase is outside the scope of "personal use" and would need separate consideration.

## Legal & Safety

-   **Global medical disclaimer**: display a "Not medical advice — consult
    a doctor or physical therapist before starting any new exercise
    program, especially with existing injuries or health conditions" notice
    in the README, Terms/onboarding flow, and footer. This is broader than
    the injury-specific AI disclaimer and should apply site-wide.
-   **Data privacy**: profile data includes sensitive fields (weight, body
    fat %, injuries, progress photos).
    -   Don't include these fields in analytics/logging.
    -   Allow the user to export and permanently delete their account and
        all associated data (profile, logs, photos) from Settings.
    -   Progress photos stored in a private Supabase Storage bucket
        (not public), accessed only via signed URLs scoped to the
        authenticated user.
-   **Exercise media rights**: do not scrape or embed copyrighted stock
    footage/GIFs from third-party sites. Use placeholder illustrations,
    simple vector/SVG animations, or AI-generated demonstration media for
    seed data, and clearly document in the README that real production
    media should be either licensed or self-recorded before public
    deployment.

## App Identity — "Rie-chan Cute PT"

The app is branded **Rie-chan Cute PT**. All coaching, guidance, and
system messaging throughout the app is delivered in-character by
**Rie-chan** — an original cute Japanese-style girl mascot character who
acts as the user's personal trainer.

-   **Rie-chan is an original character** designed for this app — not a
    likeness of any existing anime/game character, real person, or
    copyrighted IP. Design her as a fresh original design (custom hair
    color/style, outfit, color palette) in a cute/chibi anime-inspired
    art style; do not reuse or closely mimic an existing franchise
    character's design.
-   **Voice & personality:** warm, encouraging, a little playful/genki,
    never harsh or shaming — she celebrates effort, gently corrects form,
    and keeps motivation upbeat. Her tone should stay appropriate and
    all-ages friendly (this is a fitness coach persona, not a romantic or
    suggestive character).
-   **Where she appears:**
    -   **Onboarding:** introduces herself, walks the user through
        profile setup in first person ("Let's build your plan together!").
    -   **AI Coach chat:** the chat persona *is* Rie-chan — her avatar
        and name appear on every AI response, and system prompts for the
        AI layer should instruct the model to answer in her voice
        (encouraging, concise, coach-like) while still giving accurate,
        evidence-based fitness answers underneath.
    -   **Workout Screen:** a small animated Rie-chan sprite/avatar reacts
        during the session (cheering on set completion, "let's rest!" on
        the rest timer, encouraging poses during the live movement-
        guidance mode).
    -   **Achievement unlocks:** she's the one "handing over" the badge in
        the unlock animation/modal.
    -   **Empty states & tips:** she appears in empty-state illustrations
        ("No workouts yet — let's plan your first one!") and contextual
        tips throughout Dashboard/Progress.
    -   **Rest days / recovery / nutrition AI features:** she delivers
        these too, in the same consistent voice, so the whole app feels
        like one coherent coaching relationship rather than disconnected
        AI features.
-   **Implementation:** treat Rie-chan as a reusable design asset —
    a small set of SVG/vector poses or a lightweight sprite/Lottie
    animation (idle, cheer, point, rest, celebrate) reused across
    screens, rather than one-off art per screen. Keep her visual style
    consistent with the app's overall color theme from the Design & UX
    Direction section below (she can be the one carrying the app's
    accent color, e.g. in hair ribbon/outfit trim).
-   **AI system prompt note:** the LLM system prompt for the AI Coach
    should explicitly set the Rie-chan persona (name, tone, boundaries —
    stay on fitness/nutrition/motivation topics, redirect off-topic or
    inappropriate requests politely and in-character) so persona and
    safety are enforced server-side, not just client-side flavor text.

## Role

You are a senior Full-Stack Software Engineer, UI/UX Designer, Product
Manager, and Fitness Coach.

Build a production-ready Gym & Fitness web application. The app should
feel comparable to Hevy, Strong, Fitbod, Nike Training Club, and
Freeletics.

> **Primary success metric:** Mobile-first experience. Desktop is an
> enhancement, not the primary target.

## Tech Stack

-   Frontend: React, TypeScript, Vite, Tailwind CSS lts version with shadcn/ui, React
    Query, React Router, React Hook Form, Zod, Axios, Framer Motion
-   Backend: Node.js, Express.js, TypeScript (deployed as Vercel Serverless
    / Edge Functions, or a single Express app wrapped for Vercel)
-   Database: Supabase (PostgreSQL) + Prisma ORM — use Supabase's
    connection pooler (pgbouncer) URL for serverless connections, since
    Vercel functions are short-lived and can exhaust direct Postgres
    connections quickly
-   File Storage: Supabase Storage (progress photos, exercise media,
    avatars) — free tier, no separate S3 setup needed
-   Auth: JWT + Refresh Tokens (+ optional Google Login), implemented in
    our own Express backend. Do **not** use Supabase Auth — Supabase is
    used only for Postgres (via Prisma) and Storage. Passwords hashed
    with bcrypt/argon2, refresh tokens stored server-side (DB or
    httpOnly cookie) so they can be revoked on logout/password reset.
-   Charts: Recharts
-   AI Layer: LLM API (e.g. Claude API or OpenAI API) for the AI Personal
    Trainer / Coach features, called only from backend/serverless
    functions so API keys stay server-side. Free-tier friendly: AI calls
    should be optional and gracefully degrade to rule-based behavior if
    no API key is configured.

## Deployment

-   **Repository structure:** single **monorepo** containing both
    frontend and backend (e.g. `/apps/frontend`, `/apps/backend` or
    `/frontend`, `/api`), deployed as one Vercel project. This keeps
    deployment, env vars, and CORS simple for a free/solo setup, and
    allows shared TypeScript types (Zod schemas, DTOs) between FE and BE
    without publishing a separate package.
-   **Hosting:** Vercel (frontend static/SSR build + backend API routes
    as serverless functions).
-   **Database & Storage:** Supabase free tier (Postgres + Storage
    buckets for media/progress photos).
-   **Environment variables** (`DATABASE_URL`, `DIRECT_URL` for Prisma
    migrations, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
    `SUPABASE_SERVICE_ROLE_KEY`, AI provider key, JWT secrets) are set in
    the Vercel project dashboard, never committed to the repo.
-   Prisma should use two connection strings: a pooled `DATABASE_URL`
    (via Supabase's pgbouncer, port 6543) for normal serverless queries,
    and a direct `DIRECT_URL` (port 5432) for running migrations, per
    Prisma's recommended Supabase setup.
-   Since this is meant to run on free tiers, avoid features that need
    always-on background workers (e.g. cron-heavy jobs) unless done via
    Vercel Cron (free tier allows a limited number of scheduled
    invocations) or Supabase's built-in scheduled functions.

## Design & UX Direction

The app should feel like a modern, premium fitness product — not a
generic unstyled-shadcn-defaults look. Rie-chan's color palette and
art style should anchor the overall visual identity (her outfit/accent
color = the app's brand accent color), so the mascot and the UI feel like
one cohesive product, not a bolted-on chatbot avatar.

-   **Distinctive visual identity:** a custom MUI theme (not default
    palette/typography) — pick a specific brand color + accent (e.g. an
    energetic accent color like electric lime, coral, or cobalt against a
    near-black dark mode base), a real typographic pairing (a confident
    display font for numbers/headers + a clean body font), and
    consistent corner-radius/spacing scale used everywhere.
-   **Motion with purpose:** Framer Motion for meaningful transitions —
    set-completion checkmarks, rest-timer countdown rings, page
    transitions, achievement unlock animations, streak-flame pulses.
    Avoid motion for motion's sake; keep it snappy (150–300ms).
-   **Data made visual:** big, confident numbers for key stats (today's
    volume, streak count, PR badges) rather than dense tables — this is a
    "glanceable" fitness app, like a scoreboard, not a spreadsheet.
-   **Dark mode as a first-class citizen**, not an afterthought — the
    workout screen in particular should default to dark (gym lighting,
    battery life, easier on the eyes mid-set) with a light theme
    available in Settings.
-   **Micro-interactions:** haptic-style visual feedback on rep/set
    completion (scale-bounce, color flash, subtle confetti on PR), so
    logging a set feels satisfying, not just functional.
-   **Empty/loading states designed, not default:** every empty state
    (no workouts yet, no progress photos yet) should have an
    illustration + a clear CTA, not a blank "No data" text.
-   Avoid template-y layouts (generic card grids, default MUI Paper
    everywhere) — vary layout rhythm across screens (hero stat blocks on
    Dashboard, timeline on Progress, full-bleed animation on Workout
    screen) so the app doesn't feel like one repeated component pattern.

## Mobile First Requirements

-   Design mobile-first.
-   Responsive from 320px to desktop.
-   No horizontal scrolling.
-   Touch targets \>= 44x44 px.
-   Bottom navigation: Home, Workout, Exercises, Progress, Profile.
    (Calendar is accessible from Home/Dashboard and Progress rather than
    a 6th nav item, to keep touch targets and nav bar width comfortable
    on small screens — a calendar icon shortcut on Home is enough.)
-   Floating Start Workout button.
-   Full-screen workout mode.
-   Tables become cards on mobile.
-   Dialogs become full-screen on mobile.
-   Forms single-column on mobile.
-   Lazy load heavy content.
-   PWA support (installable, offline, splash screen, push notification
    placeholders).

## Features

### Authentication

-   Register, Login, Forgot Password, Reset Password
-   JWT authentication
-   Profile management

### User Profile

Store: - Name - Birthday - Age - Gender - Height - Weight - Body Fat % -
Goal Weight - Activity Level - Experience Level - Injuries - Available
Equipment - Workout Days - Session Duration

Automatically calculate: - BMI - BMR - Daily Calories - Maintenance
Calories - Lean Body Mass

### Goals

Support: - Lose Weight - Build Muscle - Strength - Fat Loss -
Endurance - Mobility - Flexibility - General Fitness - Better Posture -
Improve Stamina (sex stamina) - Improve Cardiovascular Fitness - Improve Core
Strength - Improve Hip Mobility - Pelvic Floor Strength

it can be multiple goals

Provide evidence-based exercise recommendations only.

### Exercise Library

Each exercise includes: - Name - Description - Difficulty - Equipment -
Muscle Groups - Calories Estimate - Safety Tips - Common Mistakes -
Animation (GIF, MP4, image sequence, vector, or real video) -
Step-by-step movement guide

Categories: Chest, Back, Shoulders, Arms, Legs, Core, Cardio, HIIT,
Yoga, Mobility, Stretching, Warm-up, Cool-down, Pelvic Floor.

### Workout

-   Custom workouts
-   Sets, reps, weight, duration
-   Rest timer
-   Superset
-   Dropset
-   Circuits
-   Workout history
-   Personal records

### Workout Screen

Display: - Large exercise animation (50--70% of screen) - Exercise
details - Current set/reps - Previous/Next - Complete Set - Skip -
Finish Workout - Full-screen rest timer

### Live Exercise Movement Guidance (Real-Time Follow-Along)

An optional camera-based mode where the user props their phone up and
the app watches their movement live, on-device — like a mirror that
counts for you.

-   **Pose detection on-device:** use a browser-based pose-estimation
    model (e.g. TensorFlow.js `pose-detection` / MoveNet, or
    MediaPipe Pose via `@mediapipe/tasks-vision`) running entirely in
    the browser via the device camera — no video is uploaded or sent to
    a server, for privacy and zero cost.
-   **Real-time rep counting:** track the relevant joint angles for the
    current exercise (e.g. elbow angle for bicep curls, hip/knee angle
    for squats) and auto-increment the rep counter when a full
    up/down cycle is detected.
-   **Live form cues:** simple, encouraging on-screen/voice cues based on
    joint-angle thresholds (e.g. "Go a bit lower," "Keep your back
    straight," "Nice depth!") — kept lightweight and rule-based per
    exercise, not a full biomechanics analysis.
-   **Auto rest timer:** the moment the tracked rep count hits the target
    for the set, automatically start the full-screen rest timer; auto-
    advance to the next set/exercise when rest ends (with a skip option).
-   **Voice/audio countdown:** optional spoken rep counts and rest
    countdown ("3... 2... 1... go") so the user doesn't need to look at
    the screen.
-   **Graceful fallback:** if the user denies camera permission, is on an
    unsupported browser, or the exercise has no defined tracking profile
    yet, fall back seamlessly to manual set/rep logging (tap to log a
    completed set) — this feature must be additive, never blocking.
-   **Exercise tracking profiles:** only a subset of exercises (common
    ones — squats, push-ups, bicep curls, lunges, jumping jacks, plank
    hold timing, etc.) need a defined joint-angle tracking profile in the
    Exercise Library seed data; others just use manual logging. Structure
    this as a `trackingProfile` field on Exercise so more can be added
    over time.

### Calendar

-   Month/week calendar view of the training program — scheduled workout
    days, rest days, and completed sessions shown as distinct visual
    states (e.g. filled = completed, outlined = scheduled, greyed =
    rest day).
-   Tap any day to view/start that day's planned workout, or view a past
    session's full log (exercises, sets, reps, weight, duration).
-   Drag-and-drop or tap-to-reschedule a workout to a different day when
    life gets in the way, with the rule engine adjusting the rest of the
    week's split accordingly.
-   Visual streak indicator woven into the calendar (e.g. a connected
    flame/line across consecutive completed days).
-   Syncs with Dashboard's "today's workout" card and the Progress
    streak/consistency stats — same underlying WorkoutSession data, just
    a different view.

### Progress

-   Weight
-   Measurements
-   Body Fat
-   Progress Photos (stored in Supabase Storage, private bucket, signed
    URLs)
-   Charts
-   Weekly & Monthly summaries
-   Workout streak
-   Consistency
-   Personal records timeline (auto-detected new PRs from logged sets,
    surfaced with a small celebratory badge — feeds the Gamification
    achievement unlocks)
-   Volume tracking (total weight lifted per session/week/muscle group),
    since volume trend often matters more to users than any single lift
    number

### Dashboard

Today's workout, goals, calories burned, charts, streaks, achievements,
recent activity.

### Recommendation Engine (Hybrid: Rule-Based + AI)

The recommendation system is split into two layers so the app stays
predictable and free to run, while still feeling like a real coach.

```
                User Profile
        (Age, Height, Weight, Goal,
         Experience, Injury, Equipment)
                     │
                     ▼
        Rule-Based Recommendation Engine
             (Deterministic & Safe)
                     │
       Generates Workout Plan
                     │
                     ▼
        AI Personal Trainer Layer
```

**Layer 1 — Rule-Based Recommendation Engine (deterministic, always on)**

Generate plans using: Age, gender, height, weight, BMI, experience,
goals, equipment, injuries, available days.

The rule engine decides:

-   Which workout split to use
-   Which exercises are appropriate
-   Sets
-   Reps
-   Rest time
-   Progressive overload
-   Weekly schedule

Recommend: Workout split, exercises, sets, reps, progression, cardio,
recovery, warm-up, cool-down.

**Why rule-based first, not AI-generated-from-scratch:**

If a beginner asks for "bigger chest," a pure-AI generator can return a
different exercise list every time it's asked (e.g. Bench/Incline/Cable
Fly one day, Machine Press/Push Up/Pec Deck the next, Dumbbell Fly/Decline
Press the day after). That inconsistency breaks the progressive-overload
model users rely on. A deterministic rule engine guarantees:

-   ✅ Same input → same workout
-   ✅ Easy testing
-   ✅ Scientifically structured progression
-   ✅ Progressive overload that actually compounds week over week
-   ✅ Fast
-   ✅ Free (no API cost, works offline)

Example:

```
Goal: Muscle Gain
Experience: Beginner
Equipment: Gym

↓

Day 1
Bench Press        3x10
Incline DB Press    3x12
Cable Fly           3x15
Tricep Pushdown     3x12
```

Every beginner with similar inputs gets the same sensible starting plan.

**Layer 2 — AI Personal Trainer Layer (optional enhancement, on top of the plan)**

The rule engine produces the plan; AI acts like a coach layered on top of
it. AI does not invent the base plan — it explains, adapts, and
supports it:

-   Explains why exercises were chosen
-   Suggests substitutions
-   Motivates the user
-   Answers fitness questions
-   Adjusts plans based on user feedback

Where AI shines is real-time, conversational adaptation:

| User says | AI responds |
|---|---|
| "I hate squats." | Replace squats with Leg Press or Bulgarian Split Squats while maintaining similar training volume. |
| "I only have 30 minutes today." | Convert today's workout into supersets to finish within 30 minutes. |
| "My shoulder hurts." | Avoid overhead pressing today and substitute lateral raises and machine chest press. If pain persists, consult a healthcare professional. |
| "I only have dumbbells." | Instantly rebuild the workout using only dumbbell-based movements. |

### AI Features To Build

**AI Coach (chat)**
A ChatGPT-style assistant inside the app, presented as chatting with
Rie-chan (see App Identity section), for questions like:
"How do I improve my bench?", "Why isn't my chest growing?", "What
should I eat after workout?", "How much protein do I need?"

**AI Workout Modifier**
Takes the current rule-generated workout and a user constraint (e.g. "no
bench available") and returns a modified version (e.g. swaps Bench Press
→ Machine Chest Press) rather than generating a workout from scratch.

**AI Progress Analysis**
After several weeks of logged lifts (e.g. Bench: 60kg → 65kg → 70kg),
AI summarizes the trend in plain language ("Your pushing strength
increased by ~16%. Consider increasing chest volume by one additional
set.") — the trend/math itself is computed deterministically; AI only
narrates it.

**AI Recovery**
Given logged training frequency per muscle group (e.g. legs trained 4x
this week), surface a computed recovery score and let AI phrase the
recommendation (e.g. "Recovery score: Low — take a rest day or do
mobility work.").

**AI Nutrition**
Given computed calories burned for the day (e.g. 540 kcal from logged
workouts), AI suggests directional macro adjustments (e.g. "Increase
carbohydrate intake today by approximately 50–70g to support
recovery.").

### Recommended System Architecture

```
                 User
                  │
        User Profile
                  │
                  ▼
        Recommendation Engine
        (Rule Based, deterministic)
                  │
                  ▼
      Generated Workout Plan
                  │
        Workout Database
                  │
                  ▼
         AI Personal Trainer
     (Optional Enhancement)
                  │
      • Explain
      • Modify
      • Motivate
      • Analyze
      • Answer questions
```

**Implementation notes:**

-   All AI calls go through the backend (never call the LLM API directly
    from the frontend) so API keys are never exposed to the client.
-   AI features should be feature-flagged / optional — if no API key is
    configured, the app should still fully function using the rule-based
    engine alone (keeps the app free/self-hostable with zero API cost).
-   Cache or store AI responses tied to the relevant workout/session so
    repeated views don't re-trigger paid API calls.
-   Any AI output that touches injury/pain should include a disclaimer to
    consult a healthcare professional, and should never override a hard
    safety rule from the rule-based engine (e.g. never re-recommend an
    exercise the user has flagged as injured, even if AI suggests it).

**Rate limiting (sized for personal / single-user or small-household use):**

Since this is meant to run for free on a personal API key, the limits
should be generous enough to feel unrestricted for one person but hard
enough to stop a runaway loop or bot from blowing through free/low-cost
API credits.

-   Per-user limits (stored per `userId`, reset on a rolling 24h window):
    -   AI Coach chat: **~30 messages / day**
    -   AI Workout Modifier: **~15 calls / day**
    -   AI Progress Analysis: **~5 calls / day** (naturally low-frequency —
        weekly/monthly summaries, cache the result until new data exists)
    -   AI Recovery suggestion: **~5 calls / day**
    -   AI Nutrition suggestion: **~10 calls / day**
-   Also apply a short **per-minute burst limit** (e.g. 5 requests/min per
    user) to prevent accidental double-submits or scripted abuse,
    independent of the daily cap.
-   Store counters in Postgres (a simple `ai_usage` table keyed by
    `userId` + `date` + `feature`) or Supabase's built-in rate-limiting if
    available — no need for Redis at this scale.
-   Limits should be configurable via environment variables (e.g.
    `AI_DAILY_CHAT_LIMIT=30`) so a self-hoster can raise/lower them for
    their own key's budget.
-   When a limit is hit, return a clear response — don't fail silently:
    *"You've reached today's AI coaching limit. It resets in a few hours —
    in the meantime your workout plan keeps working normally without AI."*

**Fallback behavior when AI is unavailable (no API key configured, key
invalid, or provider error/timeout):**

-   The rule-based engine and all core workout functionality must work
    completely normally — AI is additive, never a dependency.
-   AI-dependent UI (chat box, "Ask AI to modify" buttons, AI insights
    card on Progress) should detect unavailability and show a single
    consistent inline message rather than a broken/loading state, e.g.:
    *"AI Coach isn't available right now. Your workout plan and progress
    tracking are unaffected — you can still log sets, track weight, and
    follow your program as normal."*
-   Substitutions/modifications that would normally go through the AI
    Workout Modifier should fall back to a simple built-in equipment-swap
    table (e.g. Bench Press → Push Up if no equipment) so "no bench
    available" style requests still resolve without AI.

### Nutrition

Calories, macros, water tracker, meal log.

### Gamification & Achievements

-   **Streaks:** current streak + longest streak, visually tied into the
    Calendar and Dashboard.
-   **Badges/Achievements:** unlockable milestones across categories —
    consistency (e.g. "7-Day Streak," "30 Workouts Logged"), strength
    (e.g. "First 100kg Squat," "Bodyweight Bench"), volume (e.g. "10,000kg
    Total Lifted"), and exploration (e.g. "Tried 20 Different Exercises").
    Store as a rules-based `AchievementDefinition` table so new ones can
    be added via seed data, not code changes.
-   **Achievement unlock moment:** a designed, animated unlock modal
    (not a toast) featuring Rie-chan presenting the badge — this is a
    key emotional beat in the app, worth the Framer Motion polish (badge
    reveal, subtle confetti, share option).
-   **Challenges:** optional time-boxed goals (e.g. "Workout 4x this
    week") shown on Dashboard with a progress bar.
-   **Leaderboard:** opt-in, friends/community-scoped only (never a
    public global leaderboard by default, for privacy) — see Community.

### Community

Share workouts, likes, comments, leaderboard.

### Admin

Manage users, exercises, workout plans, categories, media.

## Database

Hosted on Supabase (Postgres). Create Prisma schema with: Users,
Profiles, Exercises, ExerciseMedia, WorkoutPlans, WorkoutSessions,
WorkoutLogs, Progress, Measurements, Goals, Achievements, Notifications,
Foods, Meals, Categories, Equipment, MuscleGroups, and **AiUsage**
(userId, feature, date, count) to back the AI rate-limit counters.

Additional entities for the newer features:

-   **AchievementDefinition** (key, title, description, category,
    criteria/threshold, icon) — rules-based, seedable, so new badges
    don't require code changes; **UserAchievement** (userId,
    achievementDefinitionId, unlockedAt) tracks who's unlocked what.
-   **CalendarEntry** (or derived view over WorkoutPlan + WorkoutSession)
    — scheduled vs. completed vs. rest day per date, supports the
    reschedule/drag-and-drop flow.
-   `trackingProfile` (JSON field) on **Exercise** — defines the
    joint-angle rules used by the live movement-guidance pose-detection
    feature for exercises that support it; `null`/absent for exercises
    that only support manual logging.

## API

REST API (/api/v1) - Controllers - Services - Repositories -
Validation - Pagination - Search - Filter - JWT middleware - AI Coach
endpoints (chat, workout-modify, progress-analysis, recovery,
nutrition-suggestion), all optional/feature-flagged behind an AI
provider API key.

## Deliverables

1.  Folder structure
2.  Prisma schema
3.  ERD
4.  Backend architecture
5.  Frontend architecture
6.  UI pages
7.  Components
8.  API endpoints
9.  Seed data
10. Mock exercise animations
11. Docker & Docker Compose
12. README (including License section stating free-for-personal-use,
    global medical disclaimer, Vercel + Supabase deployment steps, and
    how to plug in / omit an AI API key)
13. Environment variables (`DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`,
    `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, JWT secrets,
    optional `AI_PROVIDER_API_KEY`, and AI rate-limit env vars like
    `AI_DAILY_CHAT_LIMIT`)
14. Production-ready code

Follow SOLID principles, clean architecture, reusable components,
accessibility, dark mode, and responsive best practices.