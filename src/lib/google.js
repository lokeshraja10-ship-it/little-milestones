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

// Header row: date | event | location | lat | lng | driveFileIds | addedBy | category
// driveFileIds holds one or more Drive file IDs separated by "|".
const SHEET_RANGE = 'Milestones!A2:H'
const SHEET_APPEND_RANGE = 'Milestones!A:H'

function rowToMilestone(r, index) {
  return {
    rowIndex: index + 2, // +2 because data starts at row 2 (row 1 is headers)
    date: r[0] || '',
    event: r[1] || '',
    location: r[2] || '',
    lat: r[3] ? parseFloat(r[3]) : null,
    lng: r[4] ? parseFloat(r[4]) : null,
    driveFileIds: r[5] ? r[5].split('|').filter(Boolean) : [],
    addedBy: r[6] || '',
    category: r[7] || 'other',
  }
}

function milestoneToRow(milestone) {
  return [
    milestone.date,
    milestone.event,
    milestone.location,
    milestone.lat ?? '',
    milestone.lng ?? '',
    (milestone.driveFileIds || []).join('|'),
    milestone.addedBy ?? '',
    milestone.category ?? 'other',
  ]
}

export async function fetchMilestones(sheetId, accessToken) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(SHEET_RANGE)}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Sheets read failed: ${res.status}`)
  const data = await res.json()
  const rows = data.values || []
  return rows
    .map((r, i) => rowToMilestone(r, i))
    .filter((m) => m.date) // skip cleared/deleted rows
}

export async function appendMilestone(sheetId, accessToken, milestone) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    SHEET_APPEND_RANGE
  )}:append?valueInputOption=USER_ENTERED`
  const values = [milestoneToRow(milestone)]
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

export async function updateMilestone(sheetId, accessToken, rowIndex, milestone) {
  const range = `Milestones!A${rowIndex}:H${rowIndex}`
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    range
  )}?valueInputOption=USER_ENTERED`
  const values = [milestoneToRow(milestone)]
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  })
  if (!res.ok) throw new Error(`Sheets update failed: ${res.status}`)
  return res.json()
}

// "Deletes" a milestone by clearing its row rather than removing the row
// entirely — this avoids row-index shifting bugs and is simpler/safer with
// no backend to coordinate concurrent edits.
export async function clearMilestoneRow(sheetId, accessToken, rowIndex) {
  const range = `Milestones!A${rowIndex}:H${rowIndex}`
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    range
  )}:clear`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Sheets clear failed: ${res.status}`)
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

export async function deleteDriveFile(fileId, accessToken) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok && res.status !== 404) {
    throw new Error(`Drive delete failed: ${res.status}`)
  }
}
