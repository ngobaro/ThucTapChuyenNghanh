// src/components/admin/TabsNavigation.jsx
import { Music, Users, Disc, Tag } from 'lucide-react';

function TabsNavigation({ activeTab, onTabChange }) {
    const tabs = [
        { id: 'songs', icon: Music, label: 'Bài hát' },
        { id: 'users', icon: Users, label: 'Người dùng' },
        { id: 'artists', icon: Users, label: 'Nghệ sĩ' },
        { id: 'albums', icon: Disc, label: 'Albums' },
        { id: 'genres', icon: Tag, label: 'Thể loại' }
    ];

    return (
        <div className="tabs-navigation">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    <tab.icon size={16} />
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

export default TabsNavigation;