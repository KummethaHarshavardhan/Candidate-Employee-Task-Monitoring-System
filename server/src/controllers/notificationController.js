const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });
    return successResponse(res, 200, 'Notifications retrieved successfully', { notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return errorResponse(res, 404, 'Notification not found');
    return successResponse(res, 200, 'Notification marked as read', { notification });
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    return successResponse(res, 200, 'Notifications marked as read');
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markNotificationRead, markAllNotificationsRead };
