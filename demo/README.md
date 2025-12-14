# Dự án Web Nghe Nhạc - React + Vite + Spring Boot

## 🎵 Tổng quan dự án

Ứng dụng web nghe nhạc online với các tính năng:
- 🎧 Phát nhạc trực tuyến
- 📱 Quản lý playlist cá nhân
- 🔍 Tìm kiếm bài hát, nghệ sĩ, album
- ❤️ Yêu thích bài hát
- 👤 Quản lý tài khoản người dùng
- 🎨 Giao diện thân thiện, responsive

---

## 🎯 Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                    MUSIC WEB APPLICATION                         │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────────┐  │
│  │ Music Player │ ──> │ Audio Engine │ ──> │  HTML5 Audio   │  │
│  │   (UI/UX)    │     │   (State)    │     │   API/Stream   │  │
│  └──────────────┘     └──────────────┘     └────────────────┘  │
│         ↓                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              React Components & Pages                     │  │
│  │  HomePage | SearchPage | PlaylistPage | ProfilePage      │  │
│  └──────────────────────────────────────────────────────────┘  │
│         ↓                                                        │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────────┐  │
│  │   Services   │ ──> │  REST API    │ ──> │  Spring Boot   │  │
│  │  (API Calls) │     │  (axios)     │     │    Backend     │  │
│  └──────────────┘     └──────────────┘     └────────────────┘  │
│                                                      ↓           │
│                                              ┌────────────────┐  │
│                                              │    Database    │  │
│                                              │ Songs/Users/   │  │
│                                              │   Playlists    │  │
│                                              └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Cấu trúc thư mục cho Web Nhạc

```
music-web/
│
├── node_modules/
│
├── public/
│   ├── audio/                    # 🎵 File nhạc tĩnh (nếu có)
│   │   └── samples/
│   ├── images/
│   │   ├── covers/              # Ảnh bìa album
│   │   └── artists/             # Ảnh nghệ sĩ
│   └── icons/
│
├── src/
│   │
│   ├── assets/
│   │   ├── images/
│   │   │   ├── default-cover.png    # Ảnh mặc định
│   │   │   ├── logo.png
│   │   │   └── background.jpg
│   │   ├── icons/
│   │   │   ├── play.svg
│   │   │   ├── pause.svg
│   │   │   ├── next.svg
│   │   │   ├── prev.svg
│   │   │   └── heart.svg
│   │   └── styles/
│   │       └── themes.css
│   │
│   ├── components/
│   │   │
│   │   ├── common/              # Component dùng chung
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorMessage.jsx
│   │   │
│   │   ├── layout/              # Layout chính
│   │   │   ├── Header.jsx       # Header với search, user menu
│   │   │   ├── Sidebar.jsx      # Menu: Home, Library, Playlists
│   │   │   ├── PlayerBar.jsx    # ⭐ Music player ở bottom
│   │   │   └── Footer.jsx
│   │   │
│   │   ├── music/               # 🎵 Components liên quan nhạc
│   │   │   ├── MusicPlayer.jsx         # Player chính
│   │   │   ├── PlayerControls.jsx      # Play/Pause/Next/Prev
│   │   │   ├── ProgressBar.jsx         # Thanh progress
│   │   │   ├── VolumeControl.jsx       # Điều chỉnh âm lượng
│   │   │   ├── SongCard.jsx            # Card hiển thị bài hát
│   │   │   ├── SongList.jsx            # Danh sách bài hát
│   │   │   ├── AlbumCard.jsx           # Card album
│   │   │   ├── ArtistCard.jsx          # Card nghệ sĩ
│   │   │   └── NowPlaying.jsx          # Bài đang phát
│   │   │
│   │   ├── playlist/            # Playlist components
│   │   │   ├── PlaylistCard.jsx
│   │   │   ├── PlaylistList.jsx
│   │   │   ├── CreatePlaylist.jsx
│   │   │   └── AddToPlaylist.jsx
│   │   │
│   │   ├── search/              # Tìm kiếm
│   │   │   ├── SearchInput.jsx
│   │   │   ├── SearchResults.jsx
│   │   │   └── SearchFilter.jsx
│   │   │
│   │   └── user/                # User components
│   │       ├── UserProfile.jsx
│   │       ├── UserAvatar.jsx
│   │       └── UserMenu.jsx
│   │
│   ├── pages/                   # 📄 Các trang chính
│   │   ├── HomePage.jsx                # Trang chủ - Trending songs
│   │   ├── SearchPage.jsx              # Trang tìm kiếm
│   │   ├── LibraryPage.jsx             # Thư viện của tôi
│   │   ├── PlaylistPage.jsx            # Chi tiết playlist
│   │   ├── AlbumPage.jsx               # Chi tiết album
│   │   ├── ArtistPage.jsx              # Trang nghệ sĩ
│   │   ├── FavoritesPage.jsx           # Bài hát yêu thích
│   │   ├── ProfilePage.jsx             # Trang cá nhân
│   │   ├── LoginPage.jsx               # Đăng nhập
│   │   ├── RegisterPage.jsx            # Đăng ký
│   │   └── NotFoundPage.jsx
│   │
│   ├── services/                # 🔌 API Services
│   │   ├── api.js              # Config axios chung
│   │   ├── authService.js      # Đăng nhập/đăng ký
│   │   ├── songService.js      # ⭐ API bài hát
│   │   ├── playlistService.js  # ⭐ API playlist
│   │   ├── albumService.js     # API album
│   │   ├── artistService.js    # API nghệ sĩ
│   │   ├── userService.js      # API user
│   │   └── searchService.js    # API tìm kiếm
│   │
│   ├── hooks/                   # 🪝 Custom Hooks
│   │   ├── useAuth.js
│   │   ├── usePlayer.js        # ⭐ Hook quản lý player
│   │   ├── usePlaylist.js      # Hook quản lý playlist
│   │   ├── useAudio.js         # ⭐ Hook xử lý audio
│   │   ├── useFavorites.js     # Hook yêu thích
│   │   └── useSearch.js        # Hook tìm kiếm
│   │
│   ├── context/                 # 🌐 Global State
│   │   ├── AuthContext.jsx     # User authentication
│   │   ├── PlayerContext.jsx   # ⭐ Player state (đang phát, queue)
│   │   ├── PlaylistContext.jsx # Playlist state
│   │   └── ThemeContext.jsx    # Dark/Light mode
│   │
│   ├── utils/                   # 🛠️ Utilities
│   │   ├── constants.js        # API_URL, AUDIO_FORMAT...
│   │   ├── formatTime.js       # ⭐ Format duration (3:45)
│   │   ├── audioHelper.js      # ⭐ Xử lý audio
│   │   ├── validation.js
│   │   └── storage.js          # LocalStorage helpers
│   │
│   ├── routes/
│   │   └── AppRoutes.jsx
│   │
│   ├── styles/
│   │   ├── global.css
│   │   ├── player.css          # ⭐ Style cho player
│   │   ├── animations.css      # Animations
│   │   └── responsive.css
│   │
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

---

## 🎵 Các tính năng chính

### 1. **Music Player** (Component quan trọng nhất)
- Phát/Dừng/Tiếp theo/Trước đó
- Tua nhanh/lùi
- Điều chỉnh âm lượng
- Repeat/Shuffle
- Hiển thị thời gian phát
- Progress bar tương tác

### 2. **Quản lý Playlist**
- Tạo playlist mới
- Thêm/xóa bài hát khỏi playlist
- Chỉnh sửa tên/mô tả playlist
- Chia sẻ playlist

### 3. **Tìm kiếm & Lọc**
- Tìm theo tên bài hát, nghệ sĩ, album
- Lọc theo thể loại
- Gợi ý tìm kiếm

### 4. **Thư viện cá nhân**
- Bài hát yêu thích
- Playlist đã tạo
- Lịch sử nghe nhạc
- Album đã lưu

### 5. **Xã hội hóa**
- Follow nghệ sĩ
- Like bài hát
- Chia sẻ playlist
- Bình luận (optional)

---

## 🔧 File quan trọng - PlayerContext.jsx

### **src/context/PlayerContext.jsx**
```javascript
import { createContext, useState, useContext, useRef, useEffect } from 'react';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());
  
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [repeat, setRepeat] = useState(false); // none, one, all
  const [shuffle, setShuffle] = useState(false);

  // Play a song
  const playSong = (song) => {
    if (currentSong?.id !== song.id) {
      setCurrentSong(song);
      audioRef.current.src = song.audioUrl;
    }
    audioRef.current.play();
    setIsPlaying(true);
  };

  // Pause
  const pauseSong = () => {
    audioRef.current.pause();
    setIsPlaying(false);
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      pauseSong();
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Next song
  const nextSong = () => {
    if (queue.length === 0) return;
    
    let nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      nextIndex = repeat ? 0 : queueIndex;
    }
    
    setQueueIndex(nextIndex);
    playSong(queue[nextIndex]);
  };

  // Previous song
  const prevSong = () => {
    if (queue.length === 0) return;
    
    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }
    
    setQueueIndex(prevIndex);
    playSong(queue[prevIndex]);
  };

  // Seek to time
  const seekTo = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // Change volume
  const changeVolume = (vol) => {
    audioRef.current.volume = vol;
    setVolume(vol);
  };

  // Play queue
  const playQueue = (songs, startIndex = 0) => {
    setQueue(songs);
    setQueueIndex(startIndex);
    playSong(songs[startIndex]);
  };

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (repeat === 'one') {
        audio.play();
      } else {
        nextSong();
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeat, queueIndex, queue]);

  const value = {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
    queueIndex,
    repeat,
    shuffle,
    playSong,
    pauseSong,
    togglePlay,
    nextSong,
    prevSong,
    seekTo,
    changeVolume,
    playQueue,
    setRepeat,
    setShuffle
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
}
```

---

## 🎵 Component MusicPlayer

### **src/components/music/MusicPlayer.jsx**
```javascript
import { usePlayer } from '../../context/PlayerContext';
import PlayerControls from './PlayerControls';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';
import { formatTime } from '../../utils/formatTime';
import './MusicPlayer.css';

function MusicPlayer() {
  const { currentSong, currentTime, duration } = usePlayer();

  if (!currentSong) {
    return (
      <div className="music-player empty">
        <p>Chọn bài hát để phát</p>
      </div>
    );
  }

  return (
    <div className="music-player">
      {/* Song Info */}
      <div className="player-song-info">
        <img 
          src={currentSong.coverUrl || '/default-cover.png'} 
          alt={currentSong.title}
          className="player-cover"
        />
        <div className="player-text">
          <h4>{currentSong.title}</h4>
          <p>{currentSong.artist}</p>
        </div>
        <button className="btn-favorite">
          <span className="icon-heart">❤️</span>
        </button>
      </div>

      {/* Controls */}
      <div className="player-controls-section">
        <PlayerControls />
        <div className="player-progress">
          <span className="time">{formatTime(currentTime)}</span>
          <ProgressBar />
          <span className="time">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Options */}
      <div className="player-options">
        <VolumeControl />
        <button className="btn-queue">Queue</button>
      </div>
    </div>
  );
}

export default MusicPlayer;
```

### **src/components/music/PlayerControls.jsx**
```javascript
import { usePlayer } from '../../context/PlayerContext';
import './PlayerControls.css';

function PlayerControls() {
  const { 
    isPlaying, 
    togglePlay, 
    nextSong, 
    prevSong,
    repeat,
    shuffle,
    setRepeat,
    setShuffle
  } = usePlayer();

  const handleRepeat = () => {
    const modes = [false, 'one', 'all'];
    const currentIndex = modes.indexOf(repeat);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeat(modes[nextIndex]);
  };

  return (
    <div className="player-controls">
      <button 
        className={`btn-control ${shuffle ? 'active' : ''}`}
        onClick={() => setShuffle(!shuffle)}
        title="Shuffle"
      >
        🔀
      </button>

      <button 
        className="btn-control btn-prev" 
        onClick={prevSong}
        title="Previous"
      >
        ⏮️
      </button>

      <button 
        className="btn-control btn-play-pause" 
        onClick={togglePlay}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸️' : '▶️'}
      </button>

      <button 
        className="btn-control btn-next" 
        onClick={nextSong}
        title="Next"
      >
        ⏭️
      </button>

      <button 
        className={`btn-control ${repeat ? 'active' : ''}`}
        onClick={handleRepeat}
        title={`Repeat: ${repeat || 'off'}`}
      >
        {repeat === 'one' ? '🔂' : '🔁'}
      </button>
    </div>
  );
}

export default PlayerControls;
```

### **src/components/music/ProgressBar.jsx**
```javascript
import { usePlayer } from '../../context/PlayerContext';
import './ProgressBar.css';

function ProgressBar() {
  const { currentTime, duration, seekTo } = usePlayer();

  const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    seekTo(time);
  };

  return (
    <div className="progress-bar" onClick={handleSeek}>
      <div 
        className="progress-fill" 
        style={{ width: `${percentage}%` }}
      >
        <div className="progress-handle"></div>
      </div>
    </div>
  );
}

export default ProgressBar;
```

---

## 🎵 API Services

### **src/services/songService.js**
```javascript
import api from './api';

// Lấy tất cả bài hát
export const getAllSongs = async (params = {}) => {
  const response = await api.get('/songs', { params });
  return response.data;
};

// Lấy bài hát theo ID
export const getSongById = async (id) => {
  const response = await api.get(`/songs/${id}`);
  return response.data;
};

// Tìm kiếm bài hát
export const searchSongs = async (query) => {
  const response = await api.get('/songs/search', { 
    params: { q: query } 
  });
  return response.data;
};

// Lấy bài hát trending
export const getTrendingSongs = async () => {
  const response = await api.get('/songs/trending');
  return response.data;
};

// Lấy bài hát theo thể loại
export const getSongsByGenre = async (genre) => {
  const response = await api.get(`/songs/genre/${genre}`);
  return response.data;
};

// Stream URL cho bài hát
export const getSongStreamUrl = (songId) => {
  return `${api.defaults.baseURL}/songs/${songId}/stream`;
};

// Tăng lượt nghe
export const incrementPlayCount = async (songId) => {
  await api.post(`/songs/${songId}/play`);
};
```

### **src/services/playlistService.js**
```javascript
import api from './api';

// Lấy tất cả playlists của user
export const getUserPlaylists = async () => {
  const response = await api.get('/playlists');
  return response.data;
};

// Tạo playlist mới
export const createPlaylist = async (data) => {
  const response = await api.post('/playlists', data);
  return response.data;
};

// Lấy chi tiết playlist
export const getPlaylistById = async (id) => {
  const response = await api.get(`/playlists/${id}`);
  return response.data;
};

// Thêm bài hát vào playlist
export const addSongToPlaylist = async (playlistId, songId) => {
  const response = await api.post(`/playlists/${playlistId}/songs`, {
    songId
  });
  return response.data;
};

// Xóa bài hát khỏi playlist
export const removeSongFromPlaylist = async (playlistId, songId) => {
  await api.delete(`/playlists/${playlistId}/songs/${songId}`);
};

// Cập nhật playlist
export const updatePlaylist = async (id, data) => {
  const response = await api.put(`/playlists/${id}`, data);
  return response.data;
};

// Xóa playlist
export const deletePlaylist = async (id) => {
  await api.delete(`/playlists/${id}`);
};
```

---

## 🎨 Utilities

### **src/utils/formatTime.js**
```javascript
// Format seconds to MM:SS
export const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) {
    return '0:00';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format to HH:MM:SS if needed
export const formatTimeDetailed = (seconds) => {
  if (isNaN(seconds) || seconds < 0) {
    return '0:00:00';
  }

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

### **src/utils/audioHelper.js**
```javascript
// Kiểm tra định dạng audio có được hỗ trợ không
export const isAudioFormatSupported = (format) => {
  const audio = new Audio();
  const mimeTypes = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4'
  };
  
  return audio.canPlayType(mimeTypes[format]) !== '';
};

// Preload audio
export const preloadAudio = (url) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.src = url;
    audio.addEventListener('canplaythrough', () => resolve(audio));
    audio.addEventListener('error', reject);
    audio.load();
  });
};

// Get audio metadata
export const getAudioMetadata = (file) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.src = url;
    audio.addEventListener('loadedmetadata', () => {
      resolve({
        duration: audio.duration,
        src: url
      });
      URL.revokeObjectURL(url);
    });
    audio.addEventListener('error', reject);
  });
};
```

---

## 🔄 Luồng hoạt động - Phát nhạc

```
[1. User click vào bài hát]
        ↓
[2. Component gọi usePlayer().playSong(song)]
        ↓
[3. PlayerContext cập nhật state]
   - setCurrentSong(song)
   - audioRef.src = song.audioUrl
        ↓
[4. Audio element load file]
   - Từ backend stream: /api/songs/{id}/stream
   - Hoặc URL trực tiếp
        ↓
[5. audio.play() được gọi]
        ↓
[6. Event listeners update UI]
   - timeupdate → update progress bar
   - loadedmetadata → set duration
   - ended → auto next song
        ↓
[7. UI tự động re-render]
   - Player hiển thị thông tin bài hát
   - Progress bar di chuyển
   - Play button → Pause button
        ↓
[8. Backend ghi nhận]
   - Increment play count
   - Lưu lịch sử nghe nhạc
```

---

## 🗄️ Database Schema (Backend)

```sql
-- Bảng Songs
CREATE TABLE songs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    album VARCHAR(255),
    duration INT,                    -- Seconds
    audio_url VARCHAR(500),          -- URL file nhạc
    cover_url VARCHAR(500),          -- URL ảnh bìa
    genre VARCHAR(100),
    release_date DATE,
    play_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Playlists
CREATE TABLE playlists (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_url VARCHAR(500),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Bảng Playlist_Songs (Many-to-Many)
CREATE TABLE playlist_songs (
    playlist_id BIGINT,
    song_id BIGINT,
    position INT,                    -- Thứ tự trong playlist
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, song_id),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id),
    FOREIGN KEY (song_id) REFERENCES songs(id)
);

-- Bảng Favorites
CREATE TABLE favorites (
    user_id BIGINT,
    song_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, song_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (song_id) REFERENCES songs(id)
);

-- Bảng Listen History
CREATE TABLE listen_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    song_id BIGINT,
    listened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (song_id) REFERENCES songs(id)
);
```

---

## 🚀 Tính năng nâng cao (Optional)

### 1. **Audio Visualizer**
```javascript
// Sử dụng Web Audio API
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
```

### 2. **Lyrics Display**
- Hiển thị lời bài hát theo thời gian
- Format: LRC file

### 3. **Queue Management**
- Xem danh sách chờ
- Kéo thả sắp xếp lại
- Xóa khỏi queue

### 4. **Social Features**
- Follow người dùng khác
- Share playlist
- Comment & Like

### 5. **Recommendation System**
- Gợi ý dựa trên lịch s