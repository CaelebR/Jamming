import Track from './Track';

function SearchResults({ tracks }) {
  return (
    <div className="SearchResults">
      <h2>Results</h2>
      <ul>
        {tracks.map((track) => (
          <li key={track.id}>
            <Track track={track} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SearchResults;

