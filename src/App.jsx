import { useState } from 'react';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import Spotify from './SpotifyCall';

function App() {
  const [tracks, setTracks] = useState([]);

  const handleSearch = async (query) => {
    try {
      const results = await Spotify.searchTracks(query);
      setTracks(results); // store results in state
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  return (
    <div>
      <h1>Make A Playlist!!</h1>
      <SearchBar onSearch={handleSearch} />
      <SearchResults tracks={tracks} />
    </div>
  );
}

export default App;
