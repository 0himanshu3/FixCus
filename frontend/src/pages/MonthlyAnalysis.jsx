import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from 'axios';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { motion } from 'framer-motion'
import { FaCheckCircle, FaTasks, FaUsers, FaThumbsUp, FaThumbsDown } from 'react-icons/fa'
import { Link } from 'react-router-dom'

const COLORS = ['#10b981', '#f59e0b'];

const StatCard = ({ title, value, icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{title}</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem', color: '#111827' }}>{value}</p>
      </div>
      <div style={{ fontSize: '1.875rem', color: '#9ca3af' }}>{icon}</div>
    </div>
  </motion.div>
);

const small = (hours) => {
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
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
});

// Generate last 12 months, up to current month
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
  }, [userId,selectedMonth]);

  const cloneAndFixColors = (el) => {
    const clone = el.cloneNode(true);
    const all = clone.querySelectorAll('*');
    all.forEach(node => {
      const style = getComputedStyle(node);
      node.style.color = style.color;
      node.style.backgroundColor = style.backgroundColor;
      node.style.borderColor = style.borderColor;
    });
    return clone;
  };

 const handleDownloadPDF = () => {
  setPdfLoading(true);
  const input = document.getElementById("monthly-analysis-container");

  // Force hex colors for all elements in the container
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


  if (loading) return <p style={{ padding: '2rem', color: '#4b5563' }}>Loading analysis...</p>;
  if (error) return <p style={{ padding: '2rem', color: '#b91c1c' }}>{error}</p>;

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
    <div id="monthly-analysis-container" style={{ backgroundColor: '#f3f4f6', color: '#111827', padding: '2rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827' }}>Monthly Analysis</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Overview of issues & performance (this month)</p>
          <select
      value={selectedMonth}
      onChange={(e) => setSelectedMonth(e.target.value)}
      className="p-1 border rounded"
      style={{ fontSize: '0.875rem', color: '#111827' }}
    >
      {months.map((m) => (
        <option key={m.value} value={m.value}>{m.label}</option>
      ))}
    </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <StatCard title="Assigned Issues" value={assignedIssues} icon={<FaTasks />} />
          <StatCard title="Completed Issues" value={completedIssues} icon={<FaCheckCircle />} />
          <StatCard title="Avg Completion Time" value={small(avgCompletionTimeHours)} icon={<FaUsers />} />
          <StatCard title="Staff Working" value={staffCount} icon={<FaUsers />} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>Completion Rate</h3>
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
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>Top Issues (Upvotes vs Downvotes)</h3>
            {votesBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={votesBarData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="upvotes" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="downvotes" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: '#6b7280' }}>No issue votes data available.</p>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {mostUpvoted ? (
            <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827' }}>
                <FaThumbsUp style={{ color: '#10b981' }} /> Most Upvoted Issue
              </h4>
              <p style={{ marginTop: '0.75rem', fontSize: '1rem', fontWeight: 500 }}>{mostUpvoted.title}</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: '#6b7280' }}>Upvotes: {mostUpvoted.upvotes || 0}</p>
              <Link to={`/issue/${mostUpvoted._id}`} style={{ marginTop: '1rem', display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: '#ffffff', borderRadius: '0.5rem' }}>
                View
              </Link>
            </div>
          ) : <p style={{ color: '#6b7280' }}>No upvoted issues available.</p>}

          {mostDownvoted ? (
            <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827' }}>
                <FaThumbsDown style={{ color: '#ef4444' }} /> Most Downvoted Issue
              </h4>
              <p style={{ marginTop: '0.75rem', fontSize: '1rem', fontWeight: 500 }}>{mostDownvoted.title}</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: '#6b7280' }}>Downvotes: {mostDownvoted.downvotes || 0}</p>
              <Link to={`/issue/${mostDownvoted._id}`} style={{ marginTop: '1rem', display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: '#ffffff', borderRadius: '0.5rem' }}>
                View
              </Link>
            </div>
          ) : <p style={{ color: '#6b7280' }}>No downvoted issues available.</p>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontWeight: 600,
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              opacity: pdfLoading ? 0.6 : 1,
              cursor: pdfLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {pdfLoading ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  )
};

export default MonthlyAnalysis;
