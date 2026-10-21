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

## Where it lives

The site is published by GitHub Pages from the `main` branch of this repository. Changes go live a minute or two after they're committed.

## Links you'll give students

- Practice (the ladder): `https://we-timeline.github.io/`
- Level 1 check: `https://we-timeline.github.io/#check-1`
- Level 2 check: `https://we-timeline.github.io/#check-2`
- Teacher tools: `https://we-timeline.github.io/#teacher`

A check link opens the check directly, even if a student hasn't unlocked that level. You can post check links in Schoology as an assignment link.

## Collect check results in Google Sheets (one sheet per teacher)

One script sends each check to the sheet for the teacher the student picked. The person who sets it up owns all the sheets and shares each one with its teacher. The other teachers only open a link.

**Set up (once):**

1. Go to **script.google.com** and click **New project**. Name it "WE Timeline results."
2. Delete what's in the editor, paste in all of `apps-script/Code.gs`, and save.
3. Check `SCHOOL_YEAR` and `TEACHERS` at the top of the script.
4. In the function menu at the top, choose **setup** and click **Run**. Approve the permissions.
5. Open the **Execution log**. It lists a link to each new sheet: "WE Timeline: STR (2026-27)", and so on. The sheets are also in your Google Drive.
6. Share each sheet with its teacher (**Share**, add their email, Viewer or Editor).
7. Click **Deploy → New deployment**, click the gear, and choose **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Click **Deploy** and copy the **Web app URL**.
9. Paste the URL into `SHEET_URL` at the top of `app.js` and commit the change. (This is already done for the current deployment.)

Each submitted check adds a row to that teacher's sheet: name, hour, level, score, time, and which eras were missed. If a result ever arrives without a known teacher, it goes to a sheet named "WE Timeline: Unsorted."

If your district blocks "Anyone" access for Apps Script, students will see "Your result couldn't be sent. Show this screen to your teacher." Ask your tech department to allow it, or collect scores from screens for now.

If you edit `Code.gs` later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

## Teachers and hours

On a check, students choose their teacher first. The Hour menu then lists only that teacher's hours. The list is `TEACHERS` at the top of `app.js`:

```js
TEACHERS: [
  { code: "STR", hours: ["1st Hour"] },
  { code: "LAF", hours: ["1st Hour", "7th Hour"] },
  { code: "LYS", hours: ["1st Hour", "2nd Hour", "3rd Hour"] }
]
```

## Starting a new school year

1. In `app.js`, update `TEACHERS` (codes and hours) and commit.
2. In the script, update `SCHOOL_YEAR` and `TEACHERS` (codes only), save, and run **setup** again. It makes a fresh set of sheets; last year's stay in your Drive.
3. Share the new sheets. The web app URL doesn't change, so `SHEET_URL` stays the same. After editing the script, use **Manage deployments → Edit → New version**.

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
