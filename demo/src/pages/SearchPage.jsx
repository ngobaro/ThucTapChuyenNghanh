import { useState } from 'react';
import { Search } from 'lucide-react';
import { searchSongs } from '../services/songService';
import SongList from '../components/music/SongList';
import './SearchPage.css';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await searchSongs(query);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          <Search size={24} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm bài hát, nghệ sĩ, album..."
            className="search-input-large"
          />
        </div>
        <button type="submit" className="btn-search">
          Tìm kiếm
        </button>
      </form>

      {loading && <div className="loading">Đang tìm kiếm...</div>}

      {results.length > 0 && (
        <div className="search-results">
          <h2>Kết quả tìm kiếm ({results.length})</h2>
          <SongList songs={results} />
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div className="no-results">
          <p>Không tìm thấy kết quả cho "{query}"</p>
        </div>
      )}
    </div>
  );
}

export default SearchPage;