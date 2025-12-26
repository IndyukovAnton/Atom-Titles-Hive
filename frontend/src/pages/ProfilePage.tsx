import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { mediaApi } from '../api/media';
import { FaUserCircle, FaStar, FaFilm, FaBook, FaCalendarAlt } from 'react-icons/fa';
import '../styles/Profile.css';

interface UserStats {
  totalItems: number;
  avgRating: number;
  byCategory: Record<string, number>;
  topCategory: string;
  totalTime?: string; // Placeholder
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    calculateStats();
  }, []);

  const calculateStats = async () => {
    try {
      const allMedia = await mediaApi.getAll();
      
      const totalItems = allMedia.length;
      const totalRating = allMedia.reduce((acc, curr) => acc + curr.rating, 0);
      const avgRating = totalItems > 0 ? (totalRating / totalItems).toFixed(1) : '0';
      
      const byCategory: Record<string, number> = {};
      allMedia.forEach(item => {
        const cat = item.category || 'Other';
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      });

      const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      setStats({
        totalItems,
        avgRating: Number(avgRating),
        byCategory,
        topCategory
      });
    } catch (e) {
      console.error('Failed to load stats', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="loading-state"><div className="spinner"></div></div>;

  return (
    <div className="profile-container">
      <div className="profile-header-card">
        <div className="profile-avatar">
          <FaUserCircle size={80} color="var(--primary-color)" />
        </div>
        <div className="profile-info">
          <h1>{user?.username}</h1>
          <p className="profile-email">{user?.email || 'No email provided'}</p>
          <p className="profile-joined"><FaCalendarAlt /> Joined recently</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><FaFilm /></div>
          <div className="stat-value">{stats?.totalItems}</div>
          <div className="stat-label">Total Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaStar /></div>
          <div className="stat-value">{stats?.avgRating}</div>
          <div className="stat-label">Average Rating</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaBook /></div>
          <div className="stat-value">{stats?.topCategory}</div>
          <div className="stat-label">Top Category</div>
        </div>
      </div>

      <div className="stats-details">
        <h3>Category Breakdown</h3>
        <div className="category-bars">
          {Object.entries(stats?.byCategory || {}).map(([cat, count]) => (
            <div key={cat} className="category-bar-item">
              <div className="cat-label">
                <span>{cat}</span>
                <span>{count}</span>
              </div>
              <div className="progress-bg">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(count / (stats?.totalItems || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
