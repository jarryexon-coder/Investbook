import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { FaComments, FaUsers, FaCheckCircle, FaClock, FaMoneyBillWave } from 'react-icons/fa';

const STATUS_FLOW = ['open', 'due_diligence', 'funding', 'closed'];

export default function DealDetail() {
  const { id } = useParams();
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [interestedInvestors, setInterestedInvestors] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isInterested, setIsInterested] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    fetchDealDetails();
    // Check if user already expressed interest
    // In production: call /api/deals/:id/interest-status
  }, [id]);

  useEffect(() => {
    // Setup Socket.IO connection for chat
    if (deal && showChat) {
      socketRef.current = io(API);
      socketRef.current.emit('join_deal_chat', { deal_id: id });
      
      socketRef.current.on('message', (data) => {
        setMessages(prev => [...prev, data]);
      });

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [deal, showChat, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDealDetails = async () => {
    try {
      const [dealRes, investorsRes] = await Promise.all([
        axios.get(`${API}/api/deals`),
        // In production: separate endpoint for /api/deals/:id
      ]);
      const foundDeal = dealRes.data.find(d => d.id === parseInt(id));
      if (foundDeal) {
        setDeal(foundDeal);
      } else {
        toast.error('Deal not found');
        navigate('/deals');
      }
    } catch (error) {
      toast.error('Failed to load deal');
    } finally {
      setLoading(false);
    }
  };

  const handleInterest = async () => {
    try {
      await axios.post(`${API}/api/deals/${id}/interest`, {}, {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setIsInterested(true);
      toast.success('Interest expressed! The sponsor will contact you.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to express interest');
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && socketRef.current) {
      socketRef.current.emit('deal_chat_message', {
        deal_id: id,
        username: user.username,
        message: newMessage
      });
      setNewMessage('');
    }
  };

  const updateDealStatus = async (newStatus) => {
    try {
      await axios.put(`${API}/api/deals/${id}/status`, { status: newStatus }, {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setDeal(prev => ({ ...prev, status: newStatus }));
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!deal) {
    return <div className="text-center py-20">Deal not found</div>;
  }

  const statusIndex = STATUS_FLOW.indexOf(deal.status);
  const canUpdateStatus = deal.sponsor_username === user.username;
  const isInvestor = deal.sponsor_username !== user.username;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Deal Info */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold">{deal.title}</h1>
                <div className="flex gap-2 mt-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {deal.asset_type}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    deal.status === 'open' ? 'bg-green-100 text-green-800' :
                    deal.status === 'due_diligence' ? 'bg-yellow-100 text-yellow-800' :
                    deal.status === 'funding' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {deal.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                Sponsor: {deal.sponsor_username}
              </div>
            </div>

            <p className="text-gray-700 mb-6">{deal.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Total Price</div>
                <div className="text-2xl font-bold">${deal.total_price.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Minimum Investment</div>
                <div className="text-2xl font-bold">${deal.min_investment.toLocaleString()}</div>
              </div>
              {deal.location && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Location</div>
                  <div className="font-semibold">{deal.location}</div>
                </div>
              )}
              {deal.expected_roi && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Expected ROI</div>
                  <div className="font-semibold text-green-600">{deal.expected_roi}</div>
                </div>
              )}
            </div>

            {/* Status Workflow */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Deal Progress</h3>
              <div className="flex items-center gap-2">
                {STATUS_FLOW.map((status, idx) => (
                  <React.Fragment key={status}>
                    <div className={`flex items-center gap-2 ${idx <= statusIndex ? 'opacity-100' : 'opacity-50'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        idx < statusIndex ? 'bg-green-500 text-white' :
                        idx === statusIndex ? 'bg-blue-600 text-white' :
                        'bg-gray-200 text-gray-400'
                      }`}>
                        {idx < statusIndex ? <FaCheckCircle /> : idx + 1}
                      </div>
                      <span className="text-sm capitalize hidden sm:inline">
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                    {idx < STATUS_FLOW.length - 1 && (
                      <div className={`flex-1 h-1 ${idx < statusIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {deal.status === 'open' && !isInterested && isInvestor && (
              <button
                onClick={handleInterest}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Express Interest
              </button>
            )}

            {canUpdateStatus && statusIndex < STATUS_FLOW.length - 1 && (
              <div className="mt-4">
                <button
                  onClick={() => updateDealStatus(STATUS_FLOW[statusIndex + 1])}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
                >
                  Move to {STATUS_FLOW[statusIndex + 1].replace('_', ' ')}
                </button>
              </div>
            )}
          </div>

          {/* Interested Investors */}
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FaUsers /> Interested Investors
            </h3>
            {deal.sponsor_username === user.username ? (
              <div className="space-y-2">
                {interestedInvestors.length === 0 ? (
                  <p className="text-gray-500">No interested investors yet</p>
                ) : (
                  interestedInvestors.map((investor) => (
                    <div key={investor.user_id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{investor.username}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          Trust: {investor.trust_score?.toFixed(1) || 50}
                        </span>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        Contact
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-gray-500">Contact the sponsor to see interested investors</p>
            )}
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
            <button
              onClick={() => setShowChat(!showChat)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <FaComments /> {showChat ? 'Hide Chat' : 'Join Deal Chat'}
            </button>

            {showChat && (
              <div className="mt-4">
                <div className="h-80 overflow-y-auto border rounded-lg p-3 mb-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={idx} className="mb-2">
                        <span className="font-semibold">{msg.user || msg.system || 'System'}: </span>
                        <span>{msg.message || msg}</span>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
