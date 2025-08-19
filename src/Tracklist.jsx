import Track from './Track';

const Tracklist = ({ tracklist, onSave, onRemove, onRemovePlaylist }) => {
  const handleRemove = (track) => {
    // If onRemove expects an id, use track.id instead of track
    onRemove(track.id);
    onRemovePlaylist(track.uri);
  };

  return (
    <div className="Tracklist">
      <h2>Your Playlist</h2>
      <ul className="Tracklist-items"   >
        {tracklist.map((track) => (
          <li key={track.id} className="Tracklist-item">
            <Track track={track} />
            <button type="button" onClick={() => handleRemove(track)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <button type="button" onClick={onSave}>
        Save Playlist To Spotify
      </button>
    </div>
  );
};

export default Tracklist;
