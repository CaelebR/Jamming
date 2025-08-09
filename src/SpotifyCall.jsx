import { ClientID, RedirectURI } from './SpotifyAPIInfo';

const Spotify = (() => {
  // ---- Minimal PKCE getAccessToken ----
  let accessToken = null;
  let expiresAt = 0;

  async function getAccessToken() {
    // 1) in-memory and valid
    if (accessToken && Date.now() < expiresAt) return accessToken;

    // 2) session storage and valid
    const storedAccess = sessionStorage.getItem('sp_access_token');
    const storedExp = Number(sessionStorage.getItem('sp_expires_at') || 0);
    if (storedAccess && Date.now() < storedExp) {
      accessToken = storedAccess;
      expiresAt = storedExp;
      return accessToken;
    }

    // 3) just came back from Spotify with ?code=...
    const qs = new URLSearchParams(window.location.search);
    const code = qs.get('code');
    if (code) {
      const verifier = sessionStorage.getItem('sp_verifier');
      if (!verifier) throw new Error('Missing PKCE verifier');

      const body = new URLSearchParams({
        client_id: ClientID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: RedirectURI,
        code_verifier: verifier,
      });

      const r = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!r.ok) throw new Error('Token exchange failed: ' + (await r.text()));
      const json = await r.json();

      accessToken = json.access_token;
      expiresAt = Date.now() + json.expires_in * 1000;

      sessionStorage.setItem('sp_access_token', accessToken);
      sessionStorage.setItem('sp_expires_at', String(expiresAt));

      // Clean ?code=... (&state=...) from URL but keep hash/route
      const { pathname, hash } = window.location;
      window.history.replaceState(null, '', pathname + (hash || ''));

      return accessToken;
    }

    // 4) start auth — generate verifier + challenge inline (no helpers)
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~';
    let verifier = '';
    for (let i = 0; i < 64; i++) verifier += chars[Math.floor(Math.random() * chars.length)];
    sessionStorage.setItem('sp_verifier', verifier);

    const enc = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', enc);
    const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const scope = [
      'playlist-modify-public',
      'playlist-modify-private',
      'user-read-private',
    ].join(' ');

    const authUrl =
      'https://accounts.spotify.com/authorize?' +
      new URLSearchParams({
        client_id: ClientID,
        response_type: 'code',
        redirect_uri: RedirectURI,
        code_challenge_method: 'S256',
        code_challenge: challenge,
        scope,
      }).toString();

    // Tiny delay so any console logs appear before navigating (optional)
    setTimeout(() => { window.location.href = authUrl; }, 50);
    return null; // navigation happens
  }

  const _authHeader = async () => {
    const token = await getAccessToken();
    if (!token) throw new Error('No Spotify access token available.');
    return { Authorization: `Bearer ${token}` };
  };

  // ---- Helpers to keep UI simple ----
  const _normalizeTracks = (items) =>
    (items ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      artist: t.artists.map((a) => a.name).join(', '),
      album: t.album?.name ?? '',
      uri: t.uri,
      previewUrl: t.preview_url || null,
      image:
        t.album?.images?.[2]?.url ||
        t.album?.images?.[1]?.url ||
        t.album?.images?.[0]?.url ||
        '',
    }));

  // ---- Public API ----
  const searchTracks = async (query) => {
    const endpoint = `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(query)}`;
    const res = await fetch(endpoint, { headers: await _authHeader() });
    if (!res.ok) throw new Error(`Spotify search failed: ${res.status} ${await res.text()}`);
    const json = await res.json();
    return _normalizeTracks(json.tracks?.items);
  };

  // Optional: keep if you need user profile/id
  const getCurrentUserId = async () => {
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: await _authHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch current user: ' + (await res.text()));
    const data = await res.json();
    return data.id;
  };

  // Create playlist on current user (no need to fetch userId separately)
  const createPlaylist = async (name, { isPublic = true, description = '' } = {}) => {
    const res = await fetch('https://api.spotify.com/v1/me/playlists', {
      method: 'POST',
      headers: { ...(await _authHeader()), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, public: isPublic, description }),
    });
    if (!res.ok) throw new Error(`Create playlist failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.id; // playlistId
  };

  // Add up to 100 URIs per request
  const addTracksToPlaylist = async (playlistId, trackUris) => {
    if (!Array.isArray(trackUris) || trackUris.length === 0) return;
    const chunkSize = 100;
    for (let i = 0; i < trackUris.length; i += chunkSize) {
      const chunk = trackUris.slice(i, i + chunkSize);
      const res = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: 'POST',
          headers: { ...(await _authHeader()), 'Content-Type': 'application/json' },
          body: JSON.stringify({ uris: chunk }),
        }
      );
      if (!res.ok) throw new Error(`Add tracks failed: ${res.status} ${await res.text()}`);
    }
  };

  // Convenience
  const savePlaylist = async (name, uris, opts) => {
    const id = await createPlaylist(name, opts);
    await addTracksToPlaylist(id, uris);
    return id;
  };

  return {
    // auth
    getAccessToken, // exposed if you want to force auth early
    // search + playlists
    searchTracks,
    createPlaylist,
    addTracksToPlaylist,
    savePlaylist,
    // optional
    getCurrentUserId,
  };
})();

export default Spotify;