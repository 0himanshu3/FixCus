import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Timeline = ({ issueId, isOpen, onClose }) => {
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState(null);

  useEffect(() => {
    if (isOpen && issueId) {
      fetchTimelineEvents();
    }
  }, [issueId, isOpen]);

  const fetchTimelineEvents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/issues/timeline/${issueId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTimelineEvents(data.timelineEvents || []);
      }
    } catch (error) {
      console.error('Error fetching timeline events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (eventType) => {
    const iconMap = {
      'issue_created': '🎯',
      'issue_taken_up': '🏛️',
      'staff_assigned': '👥',
      'task_created': '📋',
      'task_updated': '📝',
      'task_proof_submitted': '📤',
      'task_approved': '✅',
      'task_rejected': '❌',
      'task_escalated': '⚠️',
      'issue_resolved': '🎉',
      'feedback_submitted': '⭐',
      'comment_added': '💬'
    };
    return iconMap[eventType] || '📌';
  };

  const getEventColor = (eventType) => {
    const colorMap = {
      'issue_created': 'bg-blue-500',
      'issue_taken_up': 'bg-green-500',
      'staff_assigned': 'bg-purple-500',
      'task_created': 'bg-indigo-500',
      'task_updated': 'bg-yellow-500',
      'task_proof_submitted': 'bg-orange-500',
      'task_approved': 'bg-green-600',
      'task_rejected': 'bg-red-500',
      'task_escalated': 'bg-red-600',
      'issue_resolved': 'bg-emerald-500',
      'feedback_submitted': 'bg-pink-500',
      'comment_added': 'bg-cyan-500'
    };
    return colorMap[eventType] || 'bg-gray-500';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const toggleEventExpansion = (eventId) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-purple-900/95 z-50 overflow-y-auto"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="min-h-screen px-4 py-8 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-pink-200 to-pink-300 rounded-2xl shadow-2xl w-full max-w-4xl relative border-4 border-purple-600"
            style={{
              maxHeight: "calc(100vh - 4rem)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-pink-300 to-pink-200 rounded-t-xl p-6 border-b-4 border-purple-600 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-purple-900 overflow-hidden">
                  📅 Issue Timeline
                </h2>
                <button
                  onClick={onClose}
                  className="text-4xl font-black text-purple-900 hover:text-purple-700 transition-colors"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : timelineEvents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-purple-700 font-semibold text-lg">No timeline events available yet.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-purple-400"></div>
                  
                  <div className="space-y-6">
                    {timelineEvents.map((event, index) => {
                      const { date, time } = formatDate(event.createdAt);
                      const isExpanded = expandedEvent === event._id;
                      
                      return (
                        <motion.div
                          key={event._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative flex items-start space-x-4"
                        >
                          {/* Timeline dot */}
                          <div className={`relative z-10 w-12 h-12 ${getEventColor(event.eventType)} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg border-4 border-pink-300`}>
                            {getEventIcon(event.eventType)}
                          </div>
                          
                          {/* Event content */}
                          <div className="flex-1 bg-white rounded-lg p-4 shadow-md border-2 border-purple-300 hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-purple-900 mb-1">
                                  {event.title}
                                </h3>
                                <p className="text-purple-700 font-semibold mb-2">
                                  {event.description}
                                </p>
                                
                                <div className="flex items-center space-x-4 text-sm text-purple-600">
                                  <span className="flex items-center">
                                    👤 {event.actor?.name || 'Unknown User'}
                                  </span>
                                  <span className="flex items-center">
                                    🏷️ {event.actorRole}
                                  </span>
                                  <span className="flex items-center">
                                    📅 {date} at {time}
                                  </span>
                                </div>
                                
                                {/* Additional metadata */}
                                {event.metadata && Object.keys(event.metadata).length > 0 && (
                                  <button
                                    onClick={() => toggleEventExpansion(event._id)}
                                    className="mt-2 text-sm text-purple-600 hover:text-purple-800 font-semibold"
                                  >
                                    {isExpanded ? '▼ Hide Details' : '▶ Show Details'}
                                  </button>
                                )}
                                
                                <AnimatePresence>
                                  {isExpanded && event.metadata && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200"
                                    >
                                      <h4 className="font-semibold text-purple-800 mb-2">Event Details:</h4>
                                      <div className="space-y-1 text-sm text-purple-700">
                                        {Object.entries(event.metadata).map(([key, value]) => (
                                          <div key={key} className="flex justify-between">
                                            <span className="font-medium capitalize">
                                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                                            </span>
                                            <span className="ml-2">
                                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Timeline;
