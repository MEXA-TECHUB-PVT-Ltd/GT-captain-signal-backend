const pool = require("../config/dbconfig");

const addToWishlist = (req, res) => {
    const { signal_id, user_id } = req.body;

    // Check if the user exists
    const checkUserExistsQuery = `SELECT * FROM users WHERE id = $1`;

    pool.query(checkUserExistsQuery, [user_id], (err, userResult) => {
        if (err) {
            console.error('Error checking if user exists:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        if (userResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found', error: true });
        }

        // Check if the signal exists
        const checkSignalExistsQuery = `SELECT * FROM signals WHERE signal_id = $1`;

        pool.query(checkSignalExistsQuery, [signal_id], (err, signalResult) => {
            if (err) {
                console.error('Error checking if signal exists:', err);
                return res.status(500).json({ msg: 'Internal server error', error: true });
            }

            if (signalResult.rows.length === 0) {
                return res.status(404).json({ msg: 'Signal not found', error: true });
            }

            // Check if the signal_id already exists in the user's wishlist
            const checkExistingQuery = `SELECT * FROM wishlist WHERE signal_id = $1 AND user_id = $2`;

            pool.query(checkExistingQuery, [signal_id, user_id], (err, existingResult) => {
                if (err) {
                    console.error('Error checking existing signal in user\'s wishlist:', err);
                    return res.status(500).json({ msg: 'Internal server error', error: true });
                }

                if (existingResult.rows.length > 0) {
                    return res.status(400).json({ msg: 'Signal already exists in the user\'s wishlist', error: true });
                }

                // If the signal_id doesn't exist in the user's wishlist, insert it into the wishlist
                const insertWishlistQuery = `
                    INSERT INTO wishlist (signal_id, user_id, wishlist_status)
                    VALUES ($1, $2, true)
                    RETURNING *
                `;

                const wishlistValues = [signal_id, user_id];

                pool.query(insertWishlistQuery, wishlistValues, (err, result) => {
                    if (err) {
                        console.error('Error adding signal to user\'s wishlist:', err);
                        return res.status(500).json({ msg: 'Internal server error', error: true });
                    }

                    const insertedItemId = result.rows[0].id;
                    const wishlistStatus = result.rows[0].wishlist_status; // Get wishlist_status from the inserted row

                    // Fetch signal and user details after adding to the wishlist
                    const selectSignalQuery = `SELECT * FROM signals WHERE signal_id = $1`;
                    const selectUserQuery = `SELECT * FROM users WHERE id = $1`;

                    pool.query(selectSignalQuery, [signal_id], (err, signalResult) => {
                        if (err) {
                            console.error('Error retrieving signal details:', err);
                            return res.status(500).json({ msg: 'Internal server error', error: true });
                        }

                        pool.query(selectUserQuery, [user_id], (err, userResult) => {
                            if (err) {
                                console.error('Error retrieving user details:', err);
                                return res.status(500).json({ msg: 'Internal server error', error: true });
                            }

                            return res.status(201).json({
                                msg: 'Signal added to user\'s wishlist successfully',
                                id: insertedItemId,
                                wishlist_status: wishlistStatus,
                                signal: signalResult.rows[0],
                                user: userResult.rows[0], error: false,
                            });
                        });
                    });
                });
            });
        });
    });
};

const getallwishlists = async (req, res) => {
    try {
        const query = `
            SELECT wishlist.wishlist_status, signals.*, users.*
            FROM wishlist
            JOIN signals ON wishlist.signal_id = signals.signal_id
            JOIN users ON wishlist.user_id = users.id
        `;

        const result = await pool.query(query);

        if (result.rows.length === 0) {
            return res.status(200).json({ msg: 'No signals in the wishlist', data: [], error: false });
        }

        // Create a map to group signals by user ID
        const userSignalMap = new Map();

        result.rows.forEach(row => {
            const userId = row.id;

            if (!userSignalMap.has(userId)) {
                userSignalMap.set(userId, {
                    user: {
                        id: row.id,
                        name: row.name,
                        email: row.email,
                        password: row.password,
                        signup_type: row.signup_type,
                        image: row.image,
                        created_at: row.created_at,
                        updated_at: row.updated_at
                    },
                    signals: []
                });
            }

            userSignalMap.get(userId).signals.push({
                signal_id: row.signal_id,
                title: row.title,
                price: row.price,
                date: row.date,
                time: row.time,
                signal_status: row.signal_status,
                action: row.action,
                stop_loss: row.stop_loss,
                trade_result: row.trade_result,
                trade_probability: row.trade_probability,
                created_at: row.created_at,
                updated_at: row.updated_at,
                wishlist_status: row.wishlist_status // Include wishlist_status in the response
            });
        });

        // Convert the map to an array for the response
        const formattedData = Array.from(userSignalMap.values());

        res.status(200).json({ msg: 'Signals retrieved successfully', data: formattedData, error: false });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Internal Server Error', error: true });
    }
};

const getSignalsByUserId = async (req, res) => {
    const { userId } = req.params;

    try {
        const userQuery = 'SELECT * FROM users WHERE id = $1';
        const userResult = await pool.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found', error: true });
        }

        const query = `
            SELECT wishlist.wishlist_status, signals.*
            FROM wishlist
            JOIN signals ON wishlist.signal_id = signals.signal_id
            WHERE wishlist.user_id = $1
        `;

        const signalResult = await pool.query(query, [userId]);

        const userData = userResult.rows[0];
        const signalData = signalResult.rows;

        if (signalData.length === 0) {
            return res.status(200).json({ user: userData, signals: [], error: false });
        }

        res.status(200).json({ user: userData, signals: signalData, error: false });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Internal Server Error', error: true });
    }
};

const deletewishlists = async (req, res) => {
    const signal_id = req.params.signal_id;

    try {
        const removeQuery = 'DELETE FROM wishlist WHERE signal_id = $1';
        const result = await pool.query(removeQuery, [signal_id]);

        console.log('DELETE result:', result);

        if (result.rowCount > 0) {
            res.status(200).json({ error: false, msg: "Signal removed from the wishlist successfully" });
        } else {
            res.status(404).json({ error: true, msg: 'Signal not found in the wishlist' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
}

const removesignalbyuserID = async (req, res) => {
    const { signal_id, user_id } = req.body;

    // Check if the user exists
    const checkUserExistsQuery = 'SELECT * FROM users WHERE id = $1';

    try {
        const userResult = await pool.query(checkUserExistsQuery, [user_id]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found', error: true });
        }

        // Check if the signal exists in the user's wishlist
        const checkExistingQuery = `
            SELECT * FROM wishlist WHERE signal_id = $1 AND user_id = $2
        `;

        const existingResult = await pool.query(checkExistingQuery, [signal_id, user_id]);

        if (existingResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Signal not found in the user\'s wishlist', error: true });
        }

        // If the signal exists in the user's wishlist, remove it
        const removeWishlistQuery = `
            DELETE FROM wishlist WHERE signal_id = $1 AND user_id = $2
            RETURNING *
        `;

        const removeValues = [signal_id, user_id];

        const result = await pool.query(removeWishlistQuery, removeValues);

        // Check if there are any remaining signals for the user in the wishlist
        const remainingSignalsQuery = `
            SELECT * FROM wishlist WHERE user_id = $1
        `;

        const remainingSignals = await pool.query(remainingSignalsQuery, [user_id]);

        // If no signals are left in the wishlist for the user, update wishlist_status to false
        if (remainingSignals.rows.length === 0) {
            const updateWishlistStatusQuery = `
                UPDATE wishlist
                SET wishlist_status = false
                WHERE user_id = $1
            `;
            await pool.query(updateWishlistStatusQuery, [user_id]);
        }

        res.status(200).json({
            msg: 'Signal removed from user\'s wishlist successfully',
            removedSignal: result.rows[0],
            error: false,
        });
    } catch (error) {
        console.error('Error removing signal from user\'s wishlist:', error);
        res.status(500).json({ msg: 'Internal Server Error', error: true });
    }
};

module.exports = { addToWishlist, getallwishlists, deletewishlists, getSignalsByUserId, removesignalbyuserID };