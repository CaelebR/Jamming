import Track from './Track';

function SearchResults({ tracks, onAdd, onAddPlaylist, removeFromTracks }) {
  const handleClick = (track) => {
    onAdd(track);
    onAddPlaylist(track);
  };

  return (
    <div className="SearchResults">
      <h2>Results</h2>
      <ul className="SearchResults-items">
        {tracks.map((track) => (
          <li key={track.id} className="SearchResults-item">
            <Track track={track} />
            <button
              type="button"
              onClick={() => {
                handleClick(track); 
                removeFromTracks(track.id);
              }}
              className="SearchResults-add-button"
            >
              Add to Playlist
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SearchResults;
