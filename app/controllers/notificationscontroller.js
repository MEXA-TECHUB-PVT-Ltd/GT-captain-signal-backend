const pool = require("../config/dbconfig");

const createnotification = async (req, res) => {
  const { sender_id, receiver_id, title, content } = req.body;

  try {
    // Check if the sender (admin) exists
    const { rows: senderRows } = await pool.query('SELECT * FROM Admin WHERE id = $1', [sender_id]);
    if (senderRows.length === 0) {
      return res.status(400).json({ msg: 'Sender not found', error: true });
    }

    // Check if the receiver (user) exists
    const { rows: receiverRows } = await pool.query('SELECT * FROM Users WHERE id = $1', [receiver_id]);
    if (receiverRows.length === 0) {
      return res.status(400).json({ msg: 'User with this id not found', error: true });
    }

    // Insert notification into the database
    const { rows: notificationRows } = await pool.query(
      'INSERT INTO notifications (sender_id, receiver_id, title, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [sender_id, receiver_id, title, content]
    );

    // Fetch details of the sender (Admin) and receiver
    const senderDetails = senderRows[0];
    const receiverDetails = receiverRows[0];

    // Combine notification details with sender and receiver details
    const notificationWithDetails = {
      id: notificationRows[0].id,
      title: notificationRows[0].title,
      content: notificationRows[0].content,
      created_at: notificationRows[0].created_at,
      sender_id: senderDetails.id,
      // sender: {
      //   id: senderDetails.id,
      //   name: senderDetails.name,
      //   email: senderDetails.email,
      //   created_at: senderDetails.created_at,
      //   updated_at: senderDetails.updated_at,
      // },
      user: {
        id: receiverDetails.id,
        name: receiverDetails.name,
        email: receiverDetails.email,
        created_at: receiverDetails.created_at,
        updated_at: receiverDetails.updated_at,
      },
    };

    // Return the success response
    res.json({ msg: 'Notification created successfully', error: false, data: notificationWithDetails });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getAllNotifications = async (req, res) => {
  try {
    const { rows: notifications } = await pool.query(`
      SELECT DISTINCT ON (n.id) n.id as notification_id, n.sender_id, n.title, n.content, n.created_at, n.updated_at, 
        u.id as user_id, u.name, u.email /* Add other user fields */
      FROM notifications n
      LEFT JOIN Users u ON n.receiver_id = u.id
    `);

    const notificationsWithUserDetails = notifications.map(notification => ({
      id: notification.notification_id,
      sender_id: notification.sender_id,
      title: notification.title,
      content: notification.content,
      created_at: notification.created_at,
      updated_at: notification.updated_at,
      user: {
        id: notification.user_id,
        name: notification.name,
        email: notification.email,
        // Add other user fields as needed
      },
    }));

    res.json({ msg: 'Notifications retrieved successfully', error: false, data: notificationsWithUserDetails });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getNotificationById = async (req, res) => {
  const notificationId = req.params.id;

  try {
    // Fetch the notification by ID
    const { rows: notifications } = await pool.query(`
      SELECT *
      FROM notifications
      WHERE id = $1
    `, [notificationId]);

    // Check if the notification with the specified ID exists
    if (notifications.length === 0) {
      return res.status(404).json({ msg: 'Notification not found', error: true });
    }

    const notificationDetails = notifications[0];

    // Fetch user details associated with the notification
    const { rows: users } = await pool.query(`
      SELECT *
      FROM Users
      WHERE id = $1
    `, [notificationDetails.receiver_id]);

    // Check if the associated user exists
    if (users.length === 0) {
      return res.status(404).json({ msg: 'User not found for this notification', error: true });
    }

    const userDetails = users[0];

    // Return the success response with the notification details and user details
    res.json({ msg: 'Notification retrieved successfully', error: false, data: { ...notificationDetails, user: userDetails } });
  } catch (error) {
    console.error('Error getting notification by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const deleteNotificationsByUserId = async (req, res) => {
  const userId = req.params.id;

  try {
    // Check if the user exists
    const { rows: userRows } = await pool.query('SELECT * FROM Users WHERE id = $1', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ msg: 'User not found', error: true });
    }

    // Check if there are notifications associated with the user
    const { rows: notificationRows } = await pool.query('SELECT * FROM notifications WHERE receiver_id = $1', [userId]);
    if (notificationRows.length === 0) {
      return res.status(404).json({ msg: 'No notifications found for the user', error: true });
    }

    // Delete notifications associated with the user
    await pool.query('DELETE FROM notifications WHERE receiver_id = $1', [userId]);

    // Return the success response
    res.json({ msg: 'Notifications deleted successfully', error: false });
  } catch (error) {
    console.error('Error deleting notifications by user ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateNotification = async (req, res) => {
  const notificationId = req.params.id;
  const { title, content } = req.body;

  try {
    // Check if the notification exists
    const { rows: notificationRows } = await pool.query('SELECT * FROM notifications WHERE id = $1', [notificationId]);
    if (notificationRows.length === 0) {
      return res.status(404).json({ msg: 'Notification not found', error: true });
    }

    // Get the existing notification details
    const existingNotification = notificationRows[0];

    // Update only the provided attributes
    const updatedTitle = title || existingNotification.title;
    const updatedContent = content || existingNotification.content;

    // Perform the update
    const { rows: updatedRows } = await pool.query(
      'UPDATE notifications SET title = $1, content = $2 WHERE id = $3 RETURNING *',
      [updatedTitle, updatedContent, notificationId]
    );

    // Return the success response
    res.json({ msg: 'Notification updated successfully', error: false, data: updatedRows[0] });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { createnotification, getAllNotifications, getNotificationById, deleteNotificationsByUserId, updateNotification };