// FILE: demo/src/services/profileService.js
import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { getMySongs } from './songService'; // Reuse existing my songs fetch

// Fetch full profile data (user + processed mySongs)
export const fetchProfileData = async () => {
  try {
    // Parallel fetches
    const [resArt, resArtSong, resAlb, userRes] = await Promise.all([
      api.get(API_ENDPOINTS.ARTISTS),
      api.get(API_ENDPOINTS.ARTIST_SONGS.BASE),
      api.get(API_ENDPOINTS.ALBUMS),
      api.get(API_ENDPOINTS.MY_INFO)
    ]);

    // Process artists map
    const aMap = {};
    const artistsData = resArt.data.result || resArt.data || [];
    artistsData.forEach(a => {
      const artistId = a.idartist || a.id;
      aMap[artistId] = a.artistname || a.name || 'Unknown Artist';
    });

    // Process artist-song map
    const asMap = {};
    const artSongData = resArtSong.data.result || resArtSong.data || [];
    artSongData.forEach(item => {
      const songId = item.idsong;
      const artistId = item.idartist;
      if (songId && artistId) {
        if (!asMap[songId]) asMap[songId] = [];
        asMap[songId].push(artistId);
      }
    });

    // Process albums map
    const albMap = {};
    const albumsData = resAlb.data.result || resAlb.data || [];
    albumsData.forEach(al => {
      const albumId = al.idalbum || al.id;
      albMap[albumId] = al.albumname || al.title || 'Single';
    });

    // User data
    const user = userRes.data.result || userRes.data || null;

    // My songs
    let mySongs = [];
    try {
      const songsRes = await getMySongs();
      const rawSongs = songsRes.data.result || songsRes.data || [];
      mySongs = rawSongs.map(song => {
        const sId = song.songId || song.id;
        const artistNames = (asMap[sId] || [])
          .map(id => aMap[id])
          .filter(name => name)
          .join(', ') || song.artist || 'Unknown Artist';

        return {
          ...song,
          id: sId,
          artist: artistNames,
          album: albMap[song.idalbum] || song.album || 'Single',
          coverUrl: song.avatar || '/default-cover.png',
        };
      });
    } catch (songErr) {
      console.error('Error fetching my songs:', songErr);
      mySongs = []; // Empty on error
    }

    return { user, mySongs };
  } catch (error) {
    console.error('Error fetching profile data:', error);
    throw error; // Throw to component for handling
  }
};