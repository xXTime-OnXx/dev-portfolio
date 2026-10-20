# Developer Portfolio: Mountain Trail & Bouldering Cave

## Concept

Visitors get to know me on a short mountain approach, then explore my work
through climbing routes inside a cave.

The portfolio should express my interests in nature, climbing, sports, and
AI, alongside my background as a developer and my bachelor's degree in AI &
ML, completed in summer 2026. Projects should include both personal work and
professional contributions.

This document records the agreed concept and recommended technology stack.
It is not yet a detailed implementation specification.

## Agreed experience

- **Visual style:** a stylized 3D world.
- **Introduction:** a short, scroll-controlled trail with a direct shortcut
  to the projects.
- **Project exploration:** visitors click or tap individual climbing holds
  in any order.
- **Route grades:** a playful representation of my subjective technical
  challenge implementing each project.
- **Mobile:** adaptive 3D, with simpler scenery and interactions suited to
  touch.

## Visitor journey

Trailhead → About me → Background and interests → Cave → Choose a project →
Explore its holds.

### 1. The mountain approach

The opening view shows a mountain path with the cave visible in the distance.
My name, a short introduction, and a “Scroll to explore” prompt appear
immediately.

A persistent **Projects · CV · Contact** navigation lets visitors jump
directly to the information they need.

Scrolling moves the camera along a fixed path through three brief moments:

1. **Trailhead — who I am:** my developer identity and the kind of work I enjoy.
2. **Viewpoint — my background:** my AI & ML degree and a concise introduction
   to my experience.
3. **Cave approach — what drives me:** climbing, sports, curiosity, and
   building things.

Text appears in readable overlays beside the scenery. Keep the introduction
to a few deliberate scroll gestures, with the complete CV accessible
separately.

### 2. The cave

At the entrance, the camera settles into a clear view of several bouldering
routes. Scrolling stops advancing the camera here so visitors can explore
at their own pace.

Each route represents one project and includes:

- A distinct hold color and a visible label; identification must not depend
  on color alone.
- The actual project name and a short description.
- A climbing grade representing subjective technical challenge.
- Personal or work context and relevant technologies.

**Recommended grading style:** Fontainebleau-style grades such as 6A, 6C,
and 7A. Include a short explanation that grades are a playful metaphor for
how challenging I found a project, not a measure of its value.

### 3. Exploring a project

Selecting a route gently frames its section of the wall. Other routes become
visually quieter, and visitors can select any of its holds.

| Hold | Content |
| --- | --- |
| The problem | What needed solving and for whom |
| My contribution | What I personally designed or implemented |
| Inside the build | Architecture, technologies, and important decisions |
| See it working | Screenshots, video, or an interactive demo |
| The outcome | Results, lessons, and relevant links |

Holds follow a natural climbing sequence, but no content requires unlocking.
Details open in a side panel on desktop and a bottom sheet on mobile.
A **Back to all routes** control returns to the cave overview.

## Visual direction

- Sculpted, stylized rock and alpine vegetation.
- Warm daylight outside and softer reflected light inside the cave.
- Colored holds and subtle chalk marks contrasting with the stone.
- Stable camera framing, gentle transitions, and minimal rotation.
- A fixed cave viewpoint rather than unrestricted first-person movement.

Show the AI background through real project content. An AI route could
contain an interactive model visualization or a demonstration from my
bachelor's project, depending on the material available.

## Recommended technology stack

| Layer | Choice | Purpose |
| --- | --- | --- |
| Site foundation | Astro + TypeScript | Introduction, CV, project content, and directly accessible case-study pages |
| Interactive experience | React | One coordinated component containing the trail, cave, selection state, and panels |
| 3D rendering | Three.js + React Three Fiber + Drei | Landscape, lighting, camera, and clickable holds |
| Animation | GSAP + ScrollTrigger | Synchronize the trail camera and text with scroll progress |
| Content | MDX + structured project data | Update project content independently of scene code |
| Visual assets | Blender-exported GLB models | Create terrain, cave geometry, and climbing holds |

Keep readable portfolio content separate from the interactive world.
Use shared project content for the cave and conventional case-study pages.
A database or CMS is not needed for the initial concept.

Reference documentation:

- [Astro integrations](https://docs.astro.build/guides/integrations/)
- [React Three Fiber](https://r3f.docs.pmnd.rs/)
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [React Three Fiber performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)

## Mobile, accessibility, and performance

Keep the same journey on phones while reducing scenery, shadows, and
rendering resolution. Use larger touch targets and a bottom sheet for
project details.

Configure and test performance adaptation explicitly. Provide a static
project list when 3D cannot load or visitors prefer reduced motion.

Support keyboard navigation, readable text, direct project URLs, and a
downloadable CV. Keep the project shortcut available throughout the trail.

## Content preparation

Start with three to five strong projects. Collect the following for each:

- Project name, summary, personal/work context, and technologies.
- The problem and intended audience.
- My specific contribution, especially for team projects.
- Technical decisions and challenges.
- Screenshots, video, or a suitable demonstration.
- Outcomes, lessons, and available source or live links.
- A subjective difficulty grade.

Use only professional project material that can be shared publicly.
Do not invent experience, results, or project details to fill missing content.

Prepare a short introduction, CV, contact links, and any personal imagery
needed for the trail.

## Recommended first validation

Build a short trail leading into one cave with one fully interactive project
route before expanding the world.

Validate that:

- The trail camera movement feels comfortable and follows scrolling.
- Introductory text stays readable.
- The Projects shortcut reaches the cave directly.
- A route and its individual holds are easy to discover and select.
- Project details are readable on desktop and mobile.
- Returning to the cave overview is straightforward.
- Keyboard and reduced-motion alternatives remain usable.
- Performance is acceptable on representative phones as well as desktop.

The largest creative investment will be the landscape's art direction and
camera choreography. Validate these alongside the interaction before
producing the full set of scenes and routes.

## Decisions for the detailed build plan

- Actual CV, project content, contact information, and public assets.
- Final environment artwork and asset production workflow.
- Exact camera path, scroll distances, and route layout.
- Whether any project includes an interactive AI demonstration.
- Performance targets and representative test devices.
- Hosting, domain, and publication arrangements.
