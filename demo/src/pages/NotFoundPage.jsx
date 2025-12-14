import { Link } from 'react-router-dom';
import './NotFoundPage.css';

function NotFoundPage() {
  return (
    <div className="not-found-page">
      <h1>404</h1>
      <h2>Trang không tồn tại</h2>
      <p>Xin lỗi, trang bạn tìm kiếm không tồn tại.</p>
      <Link to="/" className="btn-home">
        Về trang chủ
      </Link>
    </div>
  );
}

export default NotFoundPage;