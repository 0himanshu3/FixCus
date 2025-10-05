import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from 'axios';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { motion } from 'framer-motion'
import { FaCheckCircle, FaTasks, FaUsers, FaThumbsUp, FaThumbsDown, FaDownload } from 'react-icons/fa'
import { Link } from 'react-router-dom'

const COLORS = ['#10b981', '#f59e0b'];

const StatCard = ({ title, value, icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-5 rounded-xl shadow-lg border border-gray-200"
  >
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        <p className="text-2xl font-bold mt-2 text-gray-900">{value}</p>
      </div>
      <div className="text-3xl text-gray-300">{icon}</div>
    </div>
  </motion.div>
);

const formatTime = (hours) => {
  if (!hours) return 'N/A';
  const h = Math.round(hours);
  const days = Math.floor(h / 24);
  const remHours = h % 24;
  return days > 0 ? `${days}d ${remHours}h` : `${remHours}h`;
};

const MonthlyAnalysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const userId = useSelector((state) => state.auth.user?._id);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Generate last 12 months
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    months.push({ value: monthValue, label: monthLabel });
  }

  useEffect(() => {
    if (!userId) return;
    const fetchAnalysis = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/v1/issues/monthly-analysis`, {
          params: { userId, month: selectedMonth }
        }); 
        setData(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch data');
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [userId, selectedMonth]);

  const handleDownloadPDF = () => {
    setPdfLoading(true);
    const input = document.getElementById("monthly-analysis-container");

    const all = input.querySelectorAll("*");
    all.forEach((el) => {
      const style = getComputedStyle(el);
      el.style.color = style.color;
      el.style.backgroundColor = style.backgroundColor;
      el.style.borderColor = style.borderColor;
    });

    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("Monthly_Analysis.pdf");
      setPdfLoading(false);
    }).catch((err) => {
      console.error(err);
      setPdfLoading(false);
    });
  };

  if (loading) return <div className="p-8 text-gray-600">Loading analysis...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  const {
    assignedIssues = 0,
    completedIssues = 0,
    avgCompletionTimeHours = 0,
    staffCount = 0,
    mostUpvoted = null,
    mostDownvoted = null,
    votesData = []
  } = data || {};

  const pieData = [
    { name: 'Completed', value: completedIssues },
    { name: 'Pending', value: Math.max(assignedIssues - completedIssues, 0) }
  ];

  const votesBarData = votesData.map(item => ({
    name: item.title ? (item.title.length > 24 ? item.title.slice(0, 21) + '...' : item.title) : 'N/A',
    upvotes: item.upvotes || 0,
    downvotes: item.downvotes || 0
  }));

  return (
    <div id="monthly-analysis-container" className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Monthly Analysis</h1>
            <p className="text-sm text-gray-500 mt-1">Overview of issues & performance</p>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 font-medium"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Assigned Issues" value={assignedIssues} icon={<FaTasks />} />
          <StatCard title="Completed Issues" value={completedIssues} icon={<FaCheckCircle />} />
          <StatCard title="Avg Completion Time" value={formatTime(avgCompletionTimeHours)} icon={<FaUsers />} />
          <StatCard title="Staff Working" value={staffCount} icon={<FaUsers />} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Completion Rate</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={3}
                  label={({ percent }) => `${Math.round(percent * 100)}%`}
                >
                  <Cell fill={COLORS[0]} />
                  <Cell fill={COLORS[1]} />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Top Issues (Upvotes vs Downvotes)</h3>
            {votesBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={votesBarData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="upvotes" fill="#3b82f6" />
                  <Bar dataKey="downvotes" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No issue votes data available.</p>
            )}
          </div>
        </div>

        {/* Most Upvoted/Downvoted */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Most Upvoted */}
          {mostUpvoted ? (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h4 className="text-lg font-bold flex items-center gap-2 text-gray-900 mb-4">
                <FaThumbsUp className="text-green-500" /> Most Upvoted Issue
              </h4>
              <p className="text-lg font-semibold text-gray-900">{mostUpvoted.title}</p>
              <p className="text-sm text-gray-600 mt-2">Upvotes: {mostUpvoted.upvotes || 0}</p>
              <Link 
                to={`/issue/${mostUpvoted._id}`} 
                className="mt-4 inline-block px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow"
              >
                View Issue
              </Link>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <p className="text-gray-500">No upvoted issues available.</p>
            </div>
          )}

          {/* Most Downvoted */}
          {mostDownvoted ? (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h4 className="text-lg font-bold flex items-center gap-2 text-gray-900 mb-4">
                <FaThumbsDown className="text-red-500" /> Most Downvoted Issue
              </h4>
              <p className="text-lg font-semibold text-gray-900">{mostDownvoted.title}</p>
              <p className="text-sm text-gray-600 mt-2">Downvotes: {mostDownvoted.downvotes || 0}</p>
              <Link 
                to={`/issue/${mostDownvoted._id}`} 
                className="mt-4 inline-block px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow"
              >
                View Issue
              </Link>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <p className="text-gray-500">No downvoted issues available.</p>
            </div>
          )}
        </div>

        {/* Download Button */}
        <div className="flex justify-center">
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-lg"
          >
            <FaDownload />
            {pdfLoading ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  )
};

export default MonthlyAnalysis;
