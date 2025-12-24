// src/hooks/useDashboardData.js
import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';

export const useDashboardData = () => {
    const [loading, setLoading] = useState(false);
    const [rawSongs, setRawSongs] = useState([]);
    const [users, setUsers] = useState([]);
    const [artists, setArtists] = useState([]);
    const [artistSongs, setArtistSongs] = useState([]); // Danh sách quan hệ
    const [albums, setAlbums] = useState([]);
    const [genres, setGenres] = useState([]);
    const [songGenreMap, setSongGenreMap] = useState({}); // songId → genreName

    const [stats, setStats] = useState({
        totalSongs: 0,
        totalUsers: 0,
        totalArtists: 0,
        totalAlbums: 0,
        totalGenres: 0
    });

    const normalize = (res) => {
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data?.result)) return res.data.result;
        if (Array.isArray(res.data?.data)) return res.data.data;
        return [];
    };

    const buildSongGenreMap = async (genresData) => {
        const map = {};

        if (API_ENDPOINTS.GENRE_SONGS) {
            try {
                await Promise.allSettled(
                    genresData.map(async (genre) => {
                        const genreId = genre.idgenre || genre.id;
                        try {
                            const res = await api.get(API_ENDPOINTS.GENRE_SONGS(genreId));
                            const songsInGenre = normalize(res);
                            songsInGenre.forEach(song => {
                                const songId = song.songId || song.id || song.idsong;
                                if (songId && !map[songId]) {
                                    map[songId] = genre.genrename || genre.name;
                                }
                            });
                        } catch (error) {
                            console.warn(`Không thể load songs cho genre ${genreId}:`, error.message);
                        }
                    })
                );
            } catch (error) {
                console.error('Error building genre map:', error);
            }
        }

        rawSongs.forEach(song => {
            const songId = song.songId || song.id;
            const genreId = song.idgenre;
            if (songId && genreId && !map[songId]) {
                const genre = genresData.find(g => (g.idgenre || g.id) == genreId);
                if (genre) {
                    map[songId] = genre.genrename || genre.name;
                }
            }
        });

        return map;
    };

    const loadAllData = async () => {
        try {
            setLoading(true);

            const requests = [
                api.get(API_ENDPOINTS.SONGS),
                api.get(API_ENDPOINTS.USERS),
                api.get(API_ENDPOINTS.ARTISTS),
                api.get(API_ENDPOINTS.ALBUMS),
                api.get(API_ENDPOINTS.GENRES)
            ];

            if (API_ENDPOINTS.ARTIST_SONGS) {
                requests.push(api.get(API_ENDPOINTS.ARTIST_SONGS.BASE || API_ENDPOINTS.ARTIST_SONGS));
            }

            const responses = await Promise.all(requests.map(p => p.catch(e => ({ error: e }))));

            const [
                songsRes, usersRes, artistsRes, albumsRes, genresRes, artistSongsRes
            ] = responses;

            const songsData = normalize(songsRes);
            const usersData = normalize(usersRes);
            const artistsData = normalize(artistsRes);
            const albumsData = normalize(albumsRes);
            const genresData = normalize(genresRes);
            const artistSongsData = artistSongsRes && !artistSongsRes.error ? normalize(artistSongsRes) : [];

            setRawSongs(songsData);
            setUsers(usersData);
            setArtists(artistsData);
            setAlbums(albumsData);
            setGenres(genresData);
            setArtistSongs(artistSongsData);

            const genreMapping = await buildSongGenreMap(genresData);
            setSongGenreMap(genreMapping);

            setStats({
                totalSongs: songsData.length,
                totalUsers: usersData.length,
                totalArtists: artistsData.length,
                totalAlbums: albumsData.length,
                totalGenres: genresData.length
            });

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            alert('Không thể tải dữ liệu: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    // =============== MAPS ===============
    const artistMap = useMemo(() => {
        const map = {};
        artists.forEach(artist => {
            const id = artist.idartist || artist.id;
            const name = artist.artistname || artist.name;
            if (id && name) map[id] = name;
        });
        return map;
    }, [artists]);

    // QUAN TRỌNG: Lưu cả relationId và artistId
    const artistSongMap = useMemo(() => {
        const map = {}; // songId → [{ relationId, artistId }]
        artistSongs.forEach(rel => {
            const songId = rel.idsong || rel.songId || rel.id_song;
            const artistId = rel.idartist || rel.artistId || rel.id_artist;
            const relationId = rel.id || rel.idartistsong || rel.id_artist_song; // ID của bảng trung gian

            if (songId && artistId) {
                if (!map[songId]) map[songId] = [];
                map[songId].push({ relationId, artistId });
            }
        });
        return map;
    }, [artistSongs]);

    const albumMap = useMemo(() => {
        const map = {};
        albums.forEach(album => {
            const id = album.idalbum || album.id;
            const name = album.albumname || album.title;
            if (id && name) map[id] = name;
        });
        return map;
    }, [albums]);

    const genreMap = useMemo(() => {
        const map = {};
        genres.forEach(genre => {
            const id = genre.idgenre || genre.id;
            const name = genre.genrename || genre.name;
            if (id && name) map[id] = name;
        });
        return map;
    }, [genres]);

    // =============== SONGS WITH DETAILS ===============
    const songsWithDetails = useMemo(() => {
        if (!rawSongs.length) return [];

        return rawSongs.map(song => {
            const songId = song.songId || song.id;

            // Artist name
            let artistName = 'Unknown Artist';
            const rels = artistSongMap[songId] || [];
            if (rels.length > 0) {
                const names = rels.map(r => artistMap[r.artistId]).filter(Boolean);
                if (names.length > 0) artistName = names.join(', ');
            } else if (song.idartist && artistMap[song.idartist]) {
                artistName = artistMap[song.idartist];
            } else if (typeof song.artist === 'string') {
                artistName = song.artist;
            } else if (song.artist && typeof song.artist === 'object') {
                artistName = song.artist.artistname || song.artist.name || 'Unknown';
            }

            // Genre name
            let genreName = 'Unknown Genre';
            if (songGenreMap[songId]) {
                genreName = songGenreMap[songId];
            } else if (song.idgenre && genreMap[song.idgenre]) {
                genreName = genreMap[song.idgenre];
            } else if (typeof song.genre === 'string') {
                genreName = song.genre;
            } else if (song.genre && typeof song.genre === 'object') {
                genreName = song.genre.genrename || song.genre.name || 'Unknown';
            }

            // Album name
            let albumName = '-';
            if (song.idalbum && albumMap[song.idalbum]) {
                albumName = albumMap[song.idalbum];
            } else if (typeof song.album === 'string') {
                albumName = song.album;
            } else if (song.album && typeof song.album === 'object') {
                albumName = song.album.albumname || song.album.title || '-';
            }

            return {
                ...song,
                artistName,
                genreName,
                albumName
            };
        });
    }, [rawSongs, artistSongMap, artistMap, albumMap, genreMap, songGenreMap]);

    const albumsWithArtists = useMemo(() => {
        return albums.map(album => {
            let artistName = 'Unknown Artist';
            const artistId = album.idartist;
            if (artistId && artistMap[artistId]) {
                artistName = artistMap[artistId];
            } else if (typeof album.artist === 'string') {
                artistName = album.artist;
            } else if (album.artist && typeof album.artist === 'object') {
                artistName = album.artist.artistname || album.artist.name || 'Unknown';
            }
            return { ...album, artistName };
        });
    }, [albums, artistMap]);

    return {
        loading,
        users,
        artists,
        genres,
        albums,
        songsWithDetails,
        albumsWithArtists,
        stats,
        loadAllData,
        artistSongMap,     // Đã có relationId
        songGenreMap,
        artistMap,
        genreMap
    };
};