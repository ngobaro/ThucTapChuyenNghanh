import { Heart } from 'lucide-react';
import './FavoritesPage.css';

function FavoritesPage() {
  return (
    <div className="favorites-page">
      <div className="page-header">
        <div className="header-icon">
          <Heart size={48} />
        </div>
        <div className="header-info">
          <span className="page-type">COLLECTION</span>
          <h1>Bài hát yêu thích</h1>
          <p>Tất cả bài hát bạn đã thích</p>
        </div>
      </div>

      <div className="empty-state">
        <Heart size={64} />
        <h2>Chưa có bài hát yêu thích</h2>
        <p>Nhấn vào biểu tượng trái tim để lưu bài hát vào đây</p>
      </div>
    </div>
  );
}

export default FavoritesPage;