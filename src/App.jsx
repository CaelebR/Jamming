import { useState } from 'react';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
// Remove if unused:
// import Playlist from './Playlist';
import Tracklist from './Tracklist';
import Spotify from './SpotifyCall';

function App() {
  const [tracks, setTracks] = useState([]);        
  const [tracklist, setTracklist] = useState([]);  
  const [playlist, setPlaylist] = useState([]);    

  const handleSearch = async (query) => {
    try {
      const results = await Spotify.searchTracks(query);
      setTracks(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Error fetching search results:', error);
      setTracks([]);
    }
  };

  const removeFromTracks = (trackId) => {
    setTracks(prevTracks => prevTracks.filter(track => track.id !== trackId));
  }
  // Add/remove full track objects to the tracklist (dedupe by id)
  const addToTracklist = (track) =>
    setTracklist(prev => (prev.some(t => t.id === track.id) ? prev : [...prev, track]));

  const removeFromTracklist = (trackId) =>
    setTracklist(prev => prev.filter(t => t.id !== trackId));

  // Add/remove URIs to the playlist (dedupe by uri)
  const addToPlaylist = (track) =>
    setPlaylist(prev => (prev.includes(track.uri) ? prev : [...prev, track.uri]));

  const removeFromPlaylist = (trackUri) =>
    setPlaylist(prev => prev.filter(uri => uri !== trackUri));

  const savePlaylist = async () => {
    if (playlist.length === 0) {
      alert('Your playlist is empty!');
      return;
    }
    try {
      const playlistId = await Spotify.savePlaylist('My Playlist', playlist, { isPublic: true });
      setTracklist([]); // Clear tracklist after saving
      setPlaylist([]); // Clear playlist after saving
      alert(`Playlist saved! ID: ${playlistId}`);
    } catch (error) {
      console.error('Error saving playlist:', error);
      alert('Failed to save playlist. See console for details.');
    }
  };

  return (
  <div className="App">
    <h1 className='title'>Make A Playlist!!</h1>

    {/* wrap the three pieces in a grid container */}
    <div className="layout">
      <div className="top-element">
        <SearchBar onSearch={handleSearch} />
      </div>

      <SearchResults
        tracks={tracks}
        removeFromTracks={removeFromTracks}
        onAdd={addToTracklist}
        onAddPlaylist={addToPlaylist}
      />

      <Tracklist
        tracklist={tracklist}
        onRemove={removeFromTracklist}
        onRemovePlaylist={removeFromPlaylist}
        onSave={savePlaylist}
      />
    </div>
  </div>
);

}

export default App;
