const API_KEY = process.env.GOOGLE_SAFE_BROWSING_KEY;
const ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

export async function isUrlUnsafe(url: string): Promise<boolean> {
  if (!API_KEY) return false; // no key → skip check

  try {
    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'onehundredthousandimage', clientVersion: '1.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      }),
    });
    if (!res.ok) return false; // API error → fail open
    const data = await res.json();
    return Array.isArray(data.matches) && data.matches.length > 0;
  } catch {
    return false; // network error → fail open
  }
}
