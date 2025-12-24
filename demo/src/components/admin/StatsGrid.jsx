// src/components/admin/StatsGrid.jsx
import { Music, Users, Disc, Tag } from 'lucide-react';

function StatsGrid({ stats }) {
    const statItems = [
        {
            icon: Music,
            count: stats.totalSongs,
            label: 'Bài hát',
            color: '#1DB954',
            bgColor: '#1DB95420'
        },
        {
            icon: Users,
            count: stats.totalUsers,
            label: 'Người dùng',
            color: '#FF6B6B',
            bgColor: '#FF6B6B20'
        },
        {
            icon: Users,
            count: stats.totalArtists,
            label: 'Nghệ sĩ',
            color: '#4ECDC4',
            bgColor: '#4ECDC420'
        },
        {
            icon: Disc,
            count: stats.totalAlbums,
            label: 'Albums',
            color: '#FF9F1C',
            bgColor: '#FF9F1C20'
        },
        {
            icon: Tag,
            count: stats.totalGenres,
            label: 'Thể loại',
            color: '#9D4EDD',
            bgColor: '#9D4EDD20'
        }
    ];

    return (
        <div className="stats-grid">
            {statItems.map((item, index) => (
                <div key={index} className="stat-card">
                    <div
                        className="stat-icon"
                        style={{ backgroundColor: item.bgColor, color: item.color }}
                    >
                        <item.icon size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{item.count}</h3>
                        <p>{item.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default StatsGrid;