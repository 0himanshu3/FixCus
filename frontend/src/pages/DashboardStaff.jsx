import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Spinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="max-w-3xl mx-auto p-5 bg-pink-100 border-4 border-pink-300 text-pink-800 rounded-xl shadow mb-10 font-bold">
    {message}
  </div>
)

const StatCard = ({ title, value, icon, bgColor }) => (
  <div className={`bg-gradient-to-br ${bgColor} text-white rounded-3xl p-6 shadow-lg flex items-center justify-between hover:scale-105 transition-transform cursor-default`}>
    <div>
      <p className="uppercase text-xs tracking-widest font-semibold opacity-90">{title}</p>
      <p className="text-4xl font-extrabold">{value}</p>
    </div>
    <div className="text-6xl ml-4">{icon}</div>
  </div>
)

const ProgressBar = ({ title, percentage }) => (
  <div className="bg-white p-4 rounded-xl shadow-lg">
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm font-semibold text-gray-600">{title}</span>
      <span className="text-sm font-bold text-indigo-600">{percentage}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  </div>
);

const IssueCard = ({ issue }) => {
  const isOverdue = issue.deadline && new Date(issue.deadline) < new Date() && issue.status !== 'Resolved'
  return (
    <Link to={`/issue/${issue.slug}`} className="block p-5 rounded-2xl border-4 border-pink-300 bg-gradient-to-tr from-yellow-50 via-pink-50 to-purple-50 shadow-xl hover:shadow-2xl transition-colors duration-300 group">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-purple-900 group-hover:text-pink-600 text-lg truncate">{issue.title}</p>
          <p className="text-sm text-purple-600 mt-1">{issue.category}</p>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
          issue.status === 'Resolved' ? 'bg-green-300 text-green-900' : 'bg-pink-300 text-pink-900'
        }`}>
          {issue.status}
        </span>
      </div>
      <div className="mt-4 flex justify-between items-center text-purple-700 font-medium text-sm">
        <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
          Deadline: {issue.deadline ? new Date(issue.deadline).toLocaleDateString() : 'N/A'}
        </span>
        <span>Priority: {issue.priority}</span>
      </div>
    </Link>
  )
}

const TaskCard = ({ task }) => {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'Completed'
  return (
    <div className="block p-5 rounded-2xl border-4 border-purple-300 bg-gradient-to-tr from-white to-purple-50 shadow-lg hover:shadow-xl transition">
      <div>
        <p className="font-bold text-purple-800 truncate">{task.title}</p>
        <p className="text-sm text-purple-600 mt-1 truncate">Related Issue: {task.issueId?.title || 'N/A'}</p>
      </div>
      <div className="mt-4 flex justify-between items-center text-purple-700 font-semibold text-sm">
        <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
          Deadline: {new Date(task.deadline).toLocaleDateString()}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs ${
          task.status === 'Completed' ? 'bg-green-200 text-green-900' : 'bg-yellow-200 text-yellow-900'
        }`}>
          {task.status}
        </span>
      </div>
    </div>
  )
}

// --- Main Dashboard Component ---
const DashboardStaff = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('tasks')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/v1/issues/staff/dashboard', {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.message || 'Failed to load dashboard data')
        }
        const data = await res.json()
        setDashboardData(data.dashboardData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) return <Spinner />
  if (error) return <ErrorMessage message={error} />
  if (!dashboardData) return <div className="text-center text-purple-700 font-bold text-xl p-12">No data available</div>

  const { issueStats, taskStats, roles, tasks } = dashboardData

  return (
    <div className="bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-10">
        <header>
          <h1 className="text-5xl font-extrabold text-transparent bg-gradient-to-r from-purple-700 via-pink-600 to-yellow-500 bg-clip-text mb-2">
            Staff Dashboard
          </h1>
          <p className="text-xl text-purple-700 opacity-90">
            Overview of your assigned tasks and issues
          </p>
        </header>

        {/* Stats */}
        <section className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <ProgressBar title="Issue Completion" percentage={issueStats.completionPercentage} />
          <ProgressBar title="Task Completion" percentage={taskStats.completionPercentage} />
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <StatCard title="Total Issues" value={issueStats.total} icon="📋" bgColor="bg-gradient-to-br from-blue-500 to-blue-700" />
          <StatCard title="Total Tasks" value={taskStats.total} icon="✔️" bgColor="bg-gradient-to-br from-green-500 to-green-700" />
          <StatCard title="Pending Tasks" value={taskStats.pending} icon="⏳" bgColor="bg-gradient-to-br from-yellow-400 to-yellow-500" />
          <StatCard title="Overdue Tasks & Issues" value={taskStats.overdue + issueStats.overdue} icon="🚨" bgColor="bg-gradient-to-br from-red-500 to-red-700" />
        </section>

        {/* Tabs */}
        <nav className="max-w-6xl mx-auto border-b border-purple-300">
          <ul className="flex gap-8 text-purple-700 select-none">
            <li>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`py-3 border-b-4 font-bold text-sm transition ${
                  activeTab === 'tasks' ? 'border-pink-600 text-pink-600' : 'border-transparent hover:text-pink-600'
                }`}
              >
                My Tasks
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('issues')}
                className={`py-3 border-b-4 font-bold text-sm transition ${
                  activeTab === 'issues' ? 'border-pink-600 text-pink-600' : 'border-transparent hover:text-pink-600'
                }`}
              >
                My Issues
              </button>
            </li>
          </ul>
        </nav>

        {/* Tab content */}
        <main className="max-w-6xl mx-auto space-y-10">
          {activeTab === 'tasks' && (
            <>
              <section>
                <h2 className="text-3xl font-black text-pink-600 mb-6">Pending Tasks ({tasks.pending.length})</h2>
                {tasks.pending.length === 0 ? (
                  <p className="text-center font-semibold text-purple-700">No pending tasks. Great job!</p>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {tasks.pending.map(task => (
                      <TaskCard key={task._id} task={task} />
                    ))}
                  </div>
                )}
              </section>
              <section>
                <h2 className="text-3xl font-black text-red-600 mb-6">Overdue Tasks ({tasks.overdue.length})</h2>
                {tasks.overdue.length === 0 ? (
                  <p className="text-center font-semibold text-purple-700">No overdue tasks.</p>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {tasks.overdue.map(task => (
                      <TaskCard key={task._id} task={task} />
                    ))}
                  </div>
                )}
              </section>
              <section>
                <h2 className="text-3xl font-black text-green-600 mb-6">Completed Tasks ({tasks.completed.length})</h2>
                {tasks.completed.length === 0 ? (
                  <p className="text-center font-semibold text-purple-700">No tasks completed yet.</p>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {tasks.completed.map(task => (
                      <TaskCard key={task._id} task={task} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === 'issues' && (
            <>
              {Object.keys(roles).map(role =>
                roles[role].length ? (
                  <section key={role}>
                    <h2 className="text-3xl font-black text-purple-800 mb-6 capitalize">
                      As {role} ({roles[role].length})
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2">
                      {roles[role].map(issue => (
                        <IssueCard key={issue._id} issue={issue} />
                      ))}
                    </div>
                  </section>
                ) : null
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default DashboardStaff
