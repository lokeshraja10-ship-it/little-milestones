# Little Milestones

A private web app for capturing your daughter's milestones — date, event,
location, and a photo — with a timeline view and a world map of everywhere
she's been. Photos live in Google Drive, milestone details live in a Google
Sheet. There's no separate backend or database to run: the app talks to
Google's APIs directly from the browser, and everyone in the family signs in
with their own Google account.

## How it works

- **Sign-in**: Each family member signs in with their own Google account
  (Google Identity Services). No passwords are stored anywhere.
- **Data**: Milestones are rows in a Google Sheet you own.
- **Photos**: Uploaded straight to a Google Drive folder you own, from
  mobile camera roll or camera.
- **Sharing**: You share the Sheet and the Drive folder with your
  partner/family as Editors. The app itself just needs everyone signed in —
  their own Google permissions control what they can see/edit.
- **Privacy**: Photos are fetched using each signed-in user's own
  credentials, not made public. Only people you've shared the Drive folder
  with can see them.

## One-time setup (about 15 minutes)

### 1. Create the Google Sheet
1. Create a new Google Sheet, name it whatever you like (e.g. "Milestones Data").
2. Rename the first tab to `Milestones` (exact spelling matters).
3. In row 1, add these headers exactly: `date | event | location | lat | lng | driveFileId | addedBy`
4. Copy the Sheet ID from its URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`
5. Share the Sheet with your partner/family as **Editor**.

### 2. Create the Drive folder
1. Create a folder in Google Drive (e.g. "Milestone Photos").
2. Copy its ID from the URL: `https://drive.google.com/drive/folders/`**`THIS_PART`**
3. Share the folder with your partner/family as **Editor**.

### 3. Create a Google Cloud OAuth Client
1. Go to [console.cloud.google.com](https://console.cloud.google.com) and
   create a new project (any name).
2. Go to **APIs & Services → Library** and enable:
   - Google Sheets API
   - Google Drive API
3. Go to **APIs & Services → OAuth consent screen**:
   - User type: External (or Internal if you have Google Workspace)
   - Add your family members' Google emails as Test users if the app is in
     "Testing" mode — otherwise only you'll be able to sign in.
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth
   client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins: add your deployed URL (you'll get this
     from Vercel in step 5, e.g. `https://little-milestones.vercel.app`) and
     `http://localhost:5173` for local testing.
   - Copy the **Client ID**.

### 4. Configure the app
Copy `.env.example` to `.env` and fill in the three values:

```
VITE_GOOGLE_CLIENT_ID=...
VITE_SHEET_ID=...
VITE_DRIVE_FOLDER_ID=...
```

### 5. Push to GitHub and deploy on Vercel
```bash
git init
git add .
git commit -m "Little Milestones"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/little-milestones.git
git push -u origin main
```
Then in [vercel.com](https://vercel.com):
1. "Add New Project" → import the GitHub repo.
2. Framework preset: Vite (auto-detected).
3. Add the three `VITE_...` environment variables from your `.env` file.
4. Deploy.
5. Copy the resulting URL back into your OAuth client's Authorized
   JavaScript origins (step 3) and redeploy if needed.

## Local development
```bash
npm install
npm run dev
```

## Notes
- Locations are geocoded automatically (via the free OpenStreetMap
  Nominatim service) when you save a milestone, so the world map fills in
  on its own — no need to enter coordinates by hand.
- Add this site to your phone's home screen (Share → Add to Home Screen)
  for an app-like experience.
- If sign-in fails for a family member, double check they're added as a
  Test user on the OAuth consent screen (step 3) and as an Editor on the
  Sheet and Drive folder.
