import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Assuming you use React Router for navigation

// --- Reusable UI Components ---

const Spinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
    <p className="font-bold">Error</p>
    <p>{message}</p>
  </div>
);

const StatCard = ({ title, value, icon, bgColor = 'bg-indigo-500' }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between transition-transform transform hover:-translate-y-1">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
    <div className={`text-3xl text-white p-3 rounded-full ${bgColor}`}>{icon}</div>
  </div>
);

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
    const isOverdue = issue.deadline && new Date(issue.deadline) < new Date() && issue.status !== 'Resolved';
    return(
      <Link to={`/issue/${issue.slug}`} className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-gray-800">{issue.title}</p>
            <p className="text-xs text-gray-500">{issue.category}</p>
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${issue.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
            {issue.status}
          </span>
        </div>
        <div className="mt-3 flex justify-between items-center text-sm">
          <span className={`text-gray-600 ${isOverdue ? 'font-bold text-red-500' : ''}`}>
            Deadline: {issue.deadline ? new Date(issue.deadline).toLocaleDateString() : 'N/A'}
          </span>
          <span className="text-gray-600">Priority: {issue.priority}</span>
        </div>
      </Link>
    );
};

const TaskCard = ({ task }) => {
    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'Completed';
    return (
        <Link to={`/task/${task._id}`} className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
            <div>
                <p className="font-bold text-gray-800">{task.title}</p>
                <p className="text-xs text-gray-500">Related Issue: {task.issueId?.title || 'N/A'}</p>
            </div>
            <div className="mt-3 flex justify-between items-center text-sm">
                <span className={`text-gray-600 ${isOverdue ? 'font-bold text-red-500' : ''}`}>
                    Deadline: {new Date(task.deadline).toLocaleDateString()}
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${task.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {task.status}
                </span>
            </div>
        </Link>
    );
};


// --- Main Dashboard Component ---
const DashboardStaff = () => {
  const [dashboardData, setDashboardData]
= useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'issues'

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/v1/issues/staff/dashboard', {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: 'include', // Handles sending the auth cookie automatically
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Failed to fetch dashboard data.');
        }

        const data = await response.json();
        setDashboardData(data.dashboardData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!dashboardData) return <div>No data available.</div>;

  const { issueStats, taskStats, roles, tasks } = dashboardData;

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Your Dashboard</h1>
        <p className="text-lg text-gray-600 mb-8">An overview of your assigned issues and tasks.</p>

        {/* --- Stats Overview --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <ProgressBar title="Issue Completion" percentage={issueStats.completionPercentage} />
            <ProgressBar title="Task Completion" percentage={taskStats.completionPercentage} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard title="Total Issues" value={issueStats.total} icon="📋" bgColor="bg-blue-500" />
            <StatCard title="Total Tasks" value={taskStats.total} icon="✔️" bgColor="bg-green-500" />
            <StatCard title="Pending Tasks" value={taskStats.pending} icon="⏳" bgColor="bg-yellow-500" />
            <StatCard title="Overdue Tasks & Issues" value={taskStats.overdue + issueStats.overdue} icon="🚨" bgColor="bg-red-500" />
        </div>

        {/* --- Tab Navigation --- */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button onClick={() => setActiveTab('tasks')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'tasks' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                My Tasks
              </button>
              <button onClick={() => setActiveTab('issues')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'issues' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                My Issues
              </button>
            </nav>
          </div>
        </div>

        {/* --- Content based on Active Tab --- */}
        <div>
          {activeTab === 'tasks' && (
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Pending Tasks ({tasks.pending.length})</h2>
                    <div className="space-y-4">{tasks.pending.length > 0 ? tasks.pending.map(task => <TaskCard key={task._id} task={task} />) : <p className="text-gray-500">No pending tasks. Great job!</p>}</div>
                </div>
                 <div>
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Overdue Tasks ({tasks.overdue.length})</h2>
                    <div className="space-y-4">{tasks.overdue.length > 0 ? tasks.overdue.map(task => <TaskCard key={task._id} task={task} />) : <p className="text-gray-500">No overdue tasks.</p>}</div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-green-600 mb-4">Completed Tasks ({tasks.completed.length})</h2>
                    <div className="space-y-4">{tasks.completed.length > 0 ? tasks.completed.map(task => <TaskCard key={task._id} task={task} />) : <p className="text-gray-500">No tasks completed yet.</p>}</div>
                </div>
            </div>
          )}

          {activeTab === 'issues' && (
             <div className="space-y-8">
                {Object.keys(roles).map(role => (
                    roles[role].length > 0 && (
                        <div key={role}>
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">As {role} ({roles[role].length})</h2>
                            <div className="space-y-4">
                                {roles[role].map(issue => <IssueCard key={issue._id} issue={issue} />)}
                            </div>
                        </div>
                    )
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardStaff;

