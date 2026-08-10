// Thin wrapper around Google Identity Services + Sheets/Drive REST APIs.
// No backend required — everything runs with a short-lived access token
// held in memory in the browser tab.

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
  'openid',
  'email',
  'profile',
].join(' ')

let tokenClient = null
let cachedToken = null // { access_token, expires_at }

export function initGoogle(clientId) {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error('Google Identity script not loaded yet'))
      return
    }
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: () => {}, // overridden per-call below
    })
    resolve()
  })
}

export function getAccessToken() {
  return new Promise((resolve, reject) => {
    if (cachedToken && cachedToken.expires_at > Date.now() + 30_000) {
      resolve(cachedToken.access_token)
      return
    }
    if (!tokenClient) {
      reject(new Error('Google not initialized'))
      return
    }
    tokenClient.callback = (resp) => {
      if (resp.error) {
        reject(new Error(resp.error))
        return
      }
      cachedToken = {
        access_token: resp.access_token,
        expires_at: Date.now() + (resp.expires_in || 3600) * 1000,
      }
      resolve(resp.access_token)
    }
    tokenClient.requestAccessToken({ prompt: cachedToken ? '' : 'consent' })
  })
}

export function signOut() {
  if (cachedToken) {
    window.google?.accounts.oauth2.revoke(cachedToken.access_token, () => {})
  }
  cachedToken = null
}

export async function fetchUserInfo(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to fetch user info')
  return res.json() // { name, email, picture, ... }
}

// ---------- Sheets ----------

// Expected header row in the sheet: date | event | location | lat | lng | driveFileId | addedBy
export async function fetchMilestones(sheetId, accessToken) {
  const range = 'Milestones!A2:G'
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Sheets read failed: ${res.status}`)
  const data = await res.json()
  const rows = data.values || []
  return rows
    .filter((r) => r[0])
    .map((r, i) => ({
      rowIndex: i + 2,
      date: r[0] || '',
      event: r[1] || '',
      location: r[2] || '',
      lat: r[3] ? parseFloat(r[3]) : null,
      lng: r[4] ? parseFloat(r[4]) : null,
      driveFileId: r[5] || '',
      addedBy: r[6] || '',
    }))
}

export async function appendMilestone(sheetId, accessToken, milestone) {
  const range = 'Milestones!A:G'
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED`
  const values = [
    [
      milestone.date,
      milestone.event,
      milestone.location,
      milestone.lat ?? '',
      milestone.lng ?? '',
      milestone.driveFileId ?? '',
      milestone.addedBy ?? '',
    ],
  ]
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  })
  if (!res.ok) throw new Error(`Sheets append failed: ${res.status}`)
  return res.json()
}

// ---------- Drive ----------

export async function uploadImageToDrive(file, folderId, accessToken) {
  const metadata = {
    name: `${Date.now()}-${file.name}`,
    parents: folderId ? [folderId] : undefined,
  }
  const form = new FormData()
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  )
  form.append('file', file)

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  )
  if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`)
  return res.json() // { id, name }
}

// Fetch image bytes with the user's auth (keeps photos private to people
// with Drive access, rather than making files public-link-shared).
export async function fetchDriveImageBlobUrl(fileId, accessToken) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`Drive image fetch failed: ${res.status}`)
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
