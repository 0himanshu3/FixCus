import React, { useState } from 'react'
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { motion } from 'framer-motion'
import { FaCheckCircle, FaTasks, FaUsers, FaThumbsUp, FaThumbsDown } from 'react-icons/fa'
import { Link } from 'react-router-dom'

const COLORS = ['#10b981', '#f59e0b'] // green for completed, amber for pending

const StatCard = ({ title, value, icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-5 rounded-xl shadow-md"
    style={{ backgroundColor: '#ffffff' }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{title}</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>{value}</p>
      </div>
      <div style={{ fontSize: '1.875rem', color: '#9ca3af' }}>{icon}</div>
    </div>
  </motion.div>
)

const small = (hours) => {
  if (!hours) return 'N/A'
  const h = Math.round(hours)
  const days = Math.floor(h / 24)
  const remHours = h % 24
  return days > 0 ? `${days}d ${remHours}h` : `${remHours}h`
}

const MonthlyAnalysis = () => {
  const summary = {
    assignedIssues: 120,
    completedIssues: 80,
    avgCompletionTimeHours: 48.5,
    staffCount: 12
  }

  const topIssues = {
    mostUpvoted: { _id: '1', title: 'Pothole on Main Street', upvotes: 120 },
    mostDownvoted: { _id: '2', title: 'Noise complaint near Park', downvotes: 9 },
    votesData: [
      { title: 'Pothole on Main Street', upvotes: 120, downvotes: 3 },
      { title: 'No garbage collection in Sector 5', upvotes: 89, downvotes: 1 },
      { title: 'Street lights not working', upvotes: 65, downvotes: 2 },
      { title: 'Illegal parking issues', upvotes: 50, downvotes: 5 },
      { title: 'Water leakage near Plaza', upvotes: 40, downvotes: 2 }
    ]
  }

  const assigned = summary.assignedIssues
  const completed = summary.completedIssues
  const pending = assigned - completed
  const completionRate = assigned ? completed / assigned : 0

  const pieData = [
    { name: 'Completed', value: completed },
    { name: 'Pending', value: pending }
  ]

  const votesData = topIssues.votesData.map(item => ({
    name: item.title.length > 24 ? item.title.slice(0, 21) + '...' : item.title,
    upvotes: item.upvotes,
    downvotes: item.downvotes
  }))

  const handleDownloadPDF = () => {
    const input = document.getElementById("monthly-analysis-container");
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("Monthly_Analysis.pdf");
    });
  };

  return (
    <div id="monthly-analysis-container">
      <div className="min-h-screen p-8" style={{ backgroundColor: '#f3f4f6' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold" style={{ color: '#111827' }}>Monthly Analysis</h1>
            <p className="text-sm" style={{ color: '#6b7280' }}>Overview of issues & performance (this month)</p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard title="Assigned Issues" value={assigned} icon={<FaTasks />} />
            <StatCard title="Completed Issues" value={completed} icon={<FaCheckCircle />} />
            <StatCard title="Avg Completion Time" value={small(summary.avgCompletionTimeHours)} icon={<FaUsers />} />
            <StatCard title="Staff Working" value={summary.staffCount} icon={<FaUsers />} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Pie chart */}
            <div className="rounded-xl shadow p-6" style={{ backgroundColor: '#ffffff' }}>
              <h3 className="text-lg font-semibold mb-3" style={{ color: '#111827' }}>Completion Rate</h3>
              <div className="flex items-center gap-6">
                <div style={{ width: 500, height: 220 }}>
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
              </div>
            </div>

            {/* Votes Bar chart */}
            <div className="col-span-1 lg:col-span-2 rounded-xl shadow p-6" style={{ backgroundColor: '#ffffff' }}>
              <h3 className="text-lg font-semibold mb-3" style={{ color: '#111827' }}>Top Issues (Upvotes vs Downvotes)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={votesData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="upvotes" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="downvotes" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Highlighted issues */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl shadow p-6" style={{ backgroundColor: '#ffffff' }}>
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <FaThumbsUp style={{ color: '#10b981' }} /> Most Upvoted Issue
              </h4>
              <p className="mt-3 text-lg font-medium" style={{ color: '#111827' }}>{topIssues.mostUpvoted.title}</p>
              <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Upvotes: {topIssues.mostUpvoted.upvotes}</p>
              <Link to={`/issue/${topIssues.mostUpvoted._id}`} style={{ marginTop: '1rem', display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: '#ffffff', borderRadius: '0.5rem' }}>
                View
              </Link>
            </div>

            <div className="rounded-xl shadow p-6" style={{ backgroundColor: '#ffffff' }}>
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <FaThumbsDown style={{ color: '#ef4444' }} /> Most Downvoted Issue
              </h4>
              <p className="mt-3 text-lg font-medium" style={{ color: '#111827' }}>{topIssues.mostDownvoted.title}</p>
              <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Downvotes: {topIssues.mostDownvoted.downvotes}</p>
              <Link to={`/issue/${topIssues.mostDownvoted._id}`} style={{ marginTop: '1rem', display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: '#ffffff', borderRadius: '0.5rem' }}>
                View
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Download PDF Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={handleDownloadPDF}
          style={{ backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 600, padding: '0.5rem 1.5rem', borderRadius: '0.5rem', transition: 'all 0.2s' }}
        >
          Download PDF
        </button>
      </div>
    </div>
  )
}

export default MonthlyAnalysis
