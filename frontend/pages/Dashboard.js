import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaBuilding, FaCar, FaBriefcase, FaUsers, FaStar } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, API } = useAuth();
  const [recentDeals, setRecentDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentDeals();
  }, []);

  const fetchRecentDeals = async () => {
    try {
      const response = await axios.get(`${API}/api/deals`);
      setRecentDeals(response.data.slice(0, 5));
    } catch (error) {
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { icon: FaBuilding, label: 'Properties', value: '12', color: 'blue' },
    { icon: FaCar, label: 'Vehicles', value: '8', color: 'green' },
    { icon: FaBriefcase, label: 'Businesses', value: '5', color: 'purple' },
    { icon: FaUsers, label: 'Active Investors', value: '47', color: 'orange' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.username}!
        </h1>
        <div className="flex items-center mt-2">
          <div className="flex items-center">
            <FaStar className="text-yellow-400 mr-1" />
            <span className="font-semibold">{user?.trust_score?.toFixed(1) || 50}</span>
            <span className="text-gray-500 ml-2">Trust Score</span>
          </div>
          <span className="mx-4 text-gray-300">|</span>
          <span className="text-gray-600">
            {user?.investments_completed || 0} deals completed
          </span>
        </div>
        <div className="mt-4 flex gap-3">
          <Link to="/deals/create" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            + List a Deal
          </Link>
          <Link to="/deals" className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition">
            Browse Deals
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6">
            <stat.icon className={`text-${stat.color}-500 text-3xl mb-2`} />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Deals */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Recent Investment Opportunities</h2>
        {loading ? (
          <div className="text-center py-8">Loading deals...</div>
        ) : recentDeals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No deals available yet. Be the first to list one!
          </div>
        ) : (
          <div className="space-y-4">
            {recentDeals.map((deal) => (
              <Link 
                key={deal.id} 
                to={`/deals/${deal.id}`}
                className="block border rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{deal.title}</h3>
                    <p className="text-gray-600 text-sm">{deal.description.substring(0, 100)}...</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {deal.asset_type}
                      </span>
                      <span>💰 ${deal.total_price.toLocaleString()}</span>
                      <span>Minimum: ${deal.min_investment.toLocaleString()}</span>
                      {deal.expected_roi && (
                        <span className="text-green-600">📈 {deal.expected_roi}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Sponsored by {deal.sponsor_username}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
