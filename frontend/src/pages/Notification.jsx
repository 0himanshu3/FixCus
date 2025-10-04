import React, { useEffect } from 'react';
import { FaCheck, FaTrashAlt, FaBell, FaRegBell } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";

const Notification = ({ notifications = [], fetchNotifications, userId, socket }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (userId && socket) {
      socket.emit("join", userId);
      socket.on("new-notification", () => {
        fetchNotifications(); // fetch latest notifications
      });
    }
    return () => {
      if (socket) {
        socket.off("new-notification");
      }
    };
  }, [userId, fetchNotifications, socket]);

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:3000/api/v1/notification/${notificationId}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      fetchNotifications();
      // Emit socket event for real-time update
      if (socket) {
        socket.emit("notification-updated", { userId, action: "read", notificationId });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await fetch(`http://localhost:3000/api/v1/notification/${notificationId}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchNotifications();
      // Emit socket event for real-time update
      if (socket) {
        socket.emit("notification-updated", { userId, action: "delete", notificationId });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.filter((notif) => !notif.isRead).map((notif) => markAsRead(notif._id))
      );
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await Promise.all(notifications.map((notif) => deleteNotification(notif._id)));
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    }
  };

  const handleView = (url) => {
    if (url) navigate(url);
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
              <FaBell size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500 mt-1">
                {notifications.length} {notifications.length === 1 ? "notification" : "notifications"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {notifications.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow"
              >
                Mark All Read
              </button>
              <button
                onClick={deleteAllNotifications}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition shadow"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <FaRegBell className="text-gray-400" size={32} />
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-1">No notifications yet</p>
          <p className="text-sm text-gray-500">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleView(notif.url)}
              className={`bg-white rounded-xl shadow border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                notif.isRead
                  ? "border-gray-200"
                  : "border-purple-300 bg-purple-50"
              }`}
            >
              <div className="p-5 flex justify-between items-start gap-4">
                
                {/* Left - Icon & Content */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    notif.isRead ? "bg-gray-100 text-gray-400" : "bg-purple-100 text-purple-600"
                  }`}>
                    <FaBell size={16} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-gray-800 ${!notif.isRead ? "font-semibold" : ""} break-words`}>
                      {notif.message.length > 200 ? notif.message.slice(0, 200) + "..." : notif.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span>{timeAgo(notif.createdAt)}</span>
                      <span>•</span>
                      <span className="hover:text-gray-700 cursor-help" title={new Date(notif.createdAt).toLocaleString()}>
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right - Action Buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  {!notif.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif._id);
                      }}
                      title="Mark as Read"
                      className="p-2 rounded-lg text-green-600 hover:bg-green-100 transition"
                    >
                      <FaCheck size={16} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif._id);
                    }}
                    title="Delete"
                    className="p-2 rounded-lg text-red-600 hover:bg-red-100 transition"
                  >
                    <FaTrashAlt size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

};

export default Notification;
