import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
// Kiểm tra xem file này có tồn tại không, nếu không hãy tạm comment dòng dưới
import { API_ENDPOINTS } from '../../utils/constants';
import './CheckoutPage.css';

const CheckoutPage = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Kiểm tra an toàn trước khi gọi API
                const endpoint = API_ENDPOINTS?.MY_INFO || '/users/myInfo';
                const res = await api.get(endpoint);
                setUser(res.data.result || res.data);
            } catch (error) {
                console.error("Checkout Auth Error:", error);
            }
        };
        fetchUser();
    }, []);

    return (
        <div className="checkout-page">
            <header className="checkout-header">
                <div className="header-content">
                    <div className="user-badge">
                        <div className="avatar-circle">
                            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                    </div>
                    <h1 className="header-title">Thanh toán</h1>
                    <button className="change-plan-btn" onClick={() => navigate(-1)}>
                        Thay đổi gói
                    </button>
                </div>
            </header>

            <main className="checkout-container">
                <div className="checkout-grid">
                    <section className="payment-section">
                        <h2 className="section-title">Phương thức thanh toán</h2>
                        <div className="payment-methods">
                            <label className="payment-option">
                                <input type="radio" name="payment" defaultChecked />
                                <div className="option-content">
                                    <span className="option-name">Ví MoMo</span>
                                    <img src="https://paymentsdk.spotifycdn.com/svg/providers/momo.svg" alt="MoMo" />
                                </div>
                            </label>

                            <label className="payment-option">
                                <input type="radio" name="payment" />
                                <div className="option-content">
                                    <span className="option-name">Thẻ tín dụng hoặc ghi nợ</span>
                                    <div className="card-icons">
                                        <img src="https://paymentsdk.spotifycdn.com/svg/cards/visa.svg" alt="Visa" />
                                        <img src="https://paymentsdk.spotifycdn.com/svg/cards/mastercard.svg" alt="Mastercard" />
                                    </div>
                                </div>
                            </label>
                        </div>

                        <button className="buy-now-btn" onClick={() => alert('Đang kết nối trang thanh toán...')}>
                            Mua ngay
                        </button>
                    </section>

                    <aside className="summary-section">
                        <h2 className="section-title">Tóm tắt</h2>
                        <div className="summary-card">
                            <div className="product-info">
                                <img src="https://fra.cloud.appwrite.io/v1/storage/buckets/67e38fcb0034ab17ef07/files/68220288000154ca8f9b/view?project=67debda60034b16e5e45&mode" alt="Pro" />
                                <div className="product-text">
                                    <p className="product-name">Premium Individual</p>
                                    <p className="product-desc">1 tài khoản Premium</p>
                                </div>
                            </div>
                            <div className="price-info">
                                <span className="total-label">Tổng cộng:</span>
                                <span className="total-price">79.000 ₫</span>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default CheckoutPage;