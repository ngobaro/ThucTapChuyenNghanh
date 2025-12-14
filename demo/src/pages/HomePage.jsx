import { useEffect, useState } from 'react';
import SongList from '../components/music/SongList';
import { getAllSongs } from '../services/songService';

function HomePage() {
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    getAllSongs().then(res => {
      console.log('API raw:', res);

      const mappedSongs = res.result.map((song, index) => ({
        id: index,                 // ⚠️ songId = 0 → không dùng
        title: song.title,
        artist: 'Unknown',
        coverUrl: song.avatar,     // ✅ ĐÚNG
        audioUrl: song.path        // ✅ ĐÚNG
      }));

      console.log('Mapped songs:', mappedSongs);
      setSongs(mappedSongs);
    });
  }, []);

  return <SongList songs={songs} />;
}

export default HomePage;
