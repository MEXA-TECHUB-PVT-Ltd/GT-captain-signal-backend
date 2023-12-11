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
    const query = `
      SELECT n.notification_id, n.title AS notification_title, n.body AS notification_body,
             u.id AS user_id, u.name AS user_name, u.email AS user_email,
             s.signal_id, s.title AS signal_title, s.price, s.date, s.time,
             s.signal_status, s.action, s.stop_loss, s.trade_probability, s.time_frame
      FROM notification_info n
      INNER JOIN Users u ON CAST(n.user_id AS INTEGER) = u.id
      INNER JOIN signals s ON CAST(n.signal_id AS INTEGER) = s.signal_id;
    `;

    const { rows } = await pool.query(query);
    res.status(200).json({ msg: "All notifications fetched", error: false, data: rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ msg: 'Internal server error', error: true });
  }
};

const getNotificationById = async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Check if the notification ID exists
    const checkQuery = 'SELECT EXISTS(SELECT 1 FROM notification_info WHERE notification_id = $1)';
    const { rows: checkResult } = await pool.query(checkQuery, [notificationId]);

    if (!checkResult[0].exists) {
      return res.status(404).json({ msg: 'Notification not found', error: true });
    }

    // If the ID exists, fetch the notification
    const query = `
      SELECT n.notification_id, n.title AS notification_title, n.body AS notification_body,
             u.id AS user_id, u.name AS user_name, u.email AS user_email,
             s.signal_id, s.title AS signal_title, s.price, s.date, s.time,
             s.signal_status, s.action, s.stop_loss, s.trade_probability, s.time_frame
      FROM notification_info n
      INNER JOIN Users u ON CAST(n.user_id AS INTEGER) = u.id
      INNER JOIN signals s ON CAST(n.signal_id AS INTEGER) = s.signal_id
      WHERE CAST(n.notification_id AS INTEGER) = $1;
    `;

    const { rows } = await pool.query(query, [notificationId]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Notification not found', error: true });
    }

    res.status(200).json({ msg: "Notification fetched", error: false, data: rows[0] });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getNotificationsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT n.notification_id, n.title AS notification_title, n.body AS notification_body,
             u.id AS user_id, u.name AS user_name, u.email AS user_email,
             s.signal_id, s.title AS signal_title, s.price, s.date, s.time,
             s.signal_status, s.action, s.stop_loss, s.trade_probability, s.time_frame
      FROM notification_info n
      INNER JOIN Users u ON CAST(n.user_id AS INTEGER) = u.id
      INNER JOIN signals s ON CAST(n.signal_id AS INTEGER) = s.signal_id
      WHERE CAST(n.user_id AS INTEGER) = $1;
    `;

    const { rows } = await pool.query(query, [userId]);
    res.status(200).json({ msg: "Notification fetched", error: false, data: rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ msg: 'Internal server error', error: true });
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

module.exports = { createnotification, getAllNotifications, getNotificationById, getNotificationsByUserId, updateNotification };