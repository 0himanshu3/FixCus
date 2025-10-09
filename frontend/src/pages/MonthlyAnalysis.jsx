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
    style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827' }}
    className="p-5 rounded-xl shadow-lg border"
  >
    <div className="flex justify-between items-center">
      <div>
        <p style={{ color: '#4b5563', fontSize: '0.875rem', fontWeight: 500 }}>{title}</p>
        <p style={{ color: '#111827', fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>{value}</p>
      </div>
      <div style={{ color: '#d1d5db', fontSize: '1.875rem' }}>{icon}</div>
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
          params: { month: selectedMonth },
          withCredentials: true
        }); 
        console.log(res);
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

if (loading) return <div style={{ padding: '2rem', color: '#4b5563' }}>Loading analysis...</div>;
  if (error) return <div style={{ padding: '2rem', color: '#b91c1c' }}>{error}</div>;
  const {
    assignedIssues = 0,
    completedIssues = 0,
    avgCompletionTimeHours = 0,
    staffCount = 0,
    mostUpvoted = null,
    mostDownvoted = null,
    votesData = []
  } = data || {};
  const newMostDownvoted =
  mostDownvoted && mostUpvoted && mostDownvoted._id === mostUpvoted._id
    ? null
    : mostDownvoted;
    
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
      <div id="monthly-analysis-container" style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827' }}>Monthly Analysis</h1>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Overview of issues & performance</p>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              borderColor: '#d1d5db',
              color: '#111827',
              fontWeight: 500
            }}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <StatCard title="Assigned Issues" value={assignedIssues} icon={<FaTasks />} />
          <StatCard title="Completed Issues" value={completedIssues} icon={<FaCheckCircle />} />
          <StatCard title="Avg Completion Time" value={formatTime(avgCompletionTimeHours)} icon={<FaUsers />} />
          <StatCard title="Staff Working" value={staffCount} icon={<FaUsers />} />
        </div>

        {/* Charts Row */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
  
  {/* Pie Chart */}
  <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', overflow: 'auto', maxHeight: '24rem' }}>
    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: '#111827' }}>Completion Rate</h3>
    <ResponsiveContainer width="100%" height={250}>
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
  <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: '#111827' }}>Top Issues (Upvotes vs Downvotes)</h3>
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
      <p style={{ color: '#6b7280' }}>No issue votes data available.</p>
    )}
  </div>
</div>


          {/* Most Upvoted/Downvoted */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Most Upvoted */}
          {mostUpvoted ? (
            <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#111827' }}>
                <FaThumbsUp style={{ color: '#22c55e' }} /> Most Upvoted Issue
              </h4>
              <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>{mostUpvoted.title}</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#4b5563' }}>Upvotes: {mostUpvoted.upvotes || 0}</p>
              <Link 
                to={`/issue/${mostUpvoted.slug}`} 
                style={{ marginTop: '1rem', display: 'inline-block', padding: '0.625rem 1.5rem', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '0.5rem', fontWeight: 600, textDecoration: 'none' }}
              >
                View Issue
              </Link>
            </div>
          ) : (
            <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
              <p style={{ color: '#6b7280' }}>No upvoted issues available.</p>
            </div>
          )}

          {/* Most Downvoted */}
          {newMostDownvoted ? (
            <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#111827' }}>
                <FaThumbsDown style={{ color: '#ef4444' }} /> Most Downvoted Issue
              </h4>
              <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>{newMostDownvoted.title}</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#4b5563' }}>Downvotes: {newMostDownvoted.downvotes || 0}</p>
              <Link 
                to={`/issue/${newMostDownvoted._id}`} 
                style={{ marginTop: '1rem', display: 'inline-block', padding: '0.625rem 1.5rem', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '0.5rem', fontWeight: 600, textDecoration: 'none' }}
              >
                View Issue
              </Link>
            </div>
          ) : (
            <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
              <p style={{ color: '#6b7280' }}>No downvoted issues available.</p>
            </div>
          )}
        </div>

        {/* Download Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#8b5cf6',
              color: '#ffffff',
              fontWeight: 600,
              borderRadius: '0.5rem',
              cursor: pdfLoading ? 'not-allowed' : 'pointer'
            }}
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