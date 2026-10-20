# WE Timeline

A practice-and-check app for the "WE" American history timeline booklet. Students climb a ladder of levels across the year; each level has a **practice** mode (instant feedback, unlimited tries) and a **check** mode (one try, scored, sent to a Google Sheet).

## What's built

| Level | Task | Status |
|---|---|---|
| 1 · Pair | Match each era's name to its description | Built |
| 2 · Place | Put the eras in order on the timeline, years given | Built |
| 3 · Boundaries | Put each era's start and end years back | Later |
| 4 · Events | Sort anchor events into eras, dates shown | Later |
| 5 · Events, no dates | Sort events using only what happened | Later |
| 6 · Rebuild | Rebuild the whole timeline from blank | Later |

All 69 anchor events are already in `data.js`, so levels 4–6 can be built on the same data.

## Files

- `index.html`: the page
- `style.css`: the look
- `data.js`: the eras, descriptions, years, and anchor events. **Edit wording here.**
- `app.js`: how the levels work. The `CONFIG` block at the top holds the settings you'll change.
- `apps-script/Code.gs`: collects check results in a Google Sheet

## Put it on GitHub Pages

1. Create a new repository and upload these files, keeping `apps-script/` as a folder.
2. In the repository, go to **Settings → Pages**. Under "Build and deployment," choose **Deploy from a branch**, pick `main` and `/ (root)`, then **Save**.
3. After a minute the site is live at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

## Links you'll give students

- Practice (the ladder): `https://YOUR-USERNAME.github.io/REPO-NAME/`
- Level 1 check: the same address ending in `#check-1`
- Level 2 check: the same address ending in `#check-2`
- Teacher tools: the same address ending in `#teacher`

A check link opens the check directly, even if a student hasn't unlocked that level. You can post check links in Schoology as an assignment link.

## Collect check results in a Google Sheet

1. Make a new Google Sheet (for example, "WE Timeline Results").
2. In the sheet: **Extensions → Apps Script**. Delete what's there, paste in all of `apps-script/Code.gs`, and save.
3. Click **Deploy → New deployment**. Click the gear and choose **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**, approve the permissions, and copy the **Web app URL**.
5. In `app.js`, paste the URL into `SHEET_URL: ""` at the top, then commit the change.

Each submitted check adds a row to the **Results** tab: name, hour, level, score, time, and which eras were missed.

If your district blocks "Anyone" access for Apps Script, students will see "Your result couldn't be sent. Show this screen to your teacher." Ask your tech department to allow it, or collect scores from screens for now.

If you edit `Code.gs` later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

## Hints

In practice mode, every name (Level 1) and era card (Level 2) has a **Hint** button with three steps:

1. **Think about it:** a strategy question, such as "The present means now. Which description is talking about you?"
2. **Clue:** on Level 1, the words to look for; on Level 2, an anchor event and its date.
3. **Show me where:** Level 1 highlights the matching words; Level 2 outlines the right spot.

Opening any hint makes the round a practice run, so it won't count as a clean run. The page explains this to students before they use one. Hints never appear in check mode.

All hint wording is in the `HINTS` list at the bottom of `data.js`. Level 1 clue words must match the description text exactly so they can be highlighted.

## How unlocking works

- A **clean run** is a practice round where every answer is right on the first check and no hints were used.
- Two clean runs open the next level. They don't have to be in a row. Change `CLEAN_RUNS_TO_UNLOCK` in `app.js` to adjust.
- Progress is saved in each computer's browser. If students share computers or clear their browser data, progress resets. The `#teacher` page can open every level or reset progress on one computer.

## Things to know about check mode

- Students can reload the page and take a check again. Every attempt lands in the sheet with a timestamp, so you can decide which attempt counts (for example, the first one).
- After submitting, students see their score and the right answers for anything they missed.
