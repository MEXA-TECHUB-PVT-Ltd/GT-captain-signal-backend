const pool = require("../config/dbconfig");

const addToWishlist = (req, res) => {
    const { signal_id } = req.body;

    // Check if the signal_id exists in the signals table
    const checkSignalExistsQuery = `
        SELECT * FROM signals WHERE signal_id = $1
    `;

    pool.query(checkSignalExistsQuery, [signal_id], (err, signalResult) => {
        if (err) {
            console.error('Error checking if signal exists:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        if (signalResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Signal not found', error: true });
        }

        // Check if the signal_id already exists in the wishlist
        const checkExistingQuery = `
            SELECT * FROM wishlist WHERE signal_id = $1
        `;

        pool.query(checkExistingQuery, [signal_id], (err, existingResult) => {
            if (err) {
                console.error('Error checking existing signal in wishlist:', err);
                return res.status(500).json({ msg: 'Internal server error', error: true });
            }

            if (existingResult.rows.length > 0) {
                return res.status(400).json({ msg: 'Signal already exists in wishlist', error: true });
            }

            // If the signal_id doesn't exist in the wishlist, insert it into the wishlist
            const insertWishlistQuery = `
                INSERT INTO wishlist (signal_id)
                VALUES ($1)
                RETURNING *
            `;

            const wishlistValues = [signal_id];

            pool.query(insertWishlistQuery, wishlistValues, (err, result) => {
                if (err) {
                    console.error('Error adding signal to wishlist:', err);
                    return res.status(500).json({ msg: 'Internal server error', error: true });
                }

                // Query the signals table to get the signal details
                const signalId = result.rows[0].signal_id;

                const selectSignalQuery = `
                    SELECT * FROM signals WHERE signal_id = $1
                `;

                pool.query(selectSignalQuery, [signalId], (err, signalResult) => {
                    if (err) {
                        console.error('Error retrieving signal details:', err);
                        return res.status(500).json({ msg: 'Internal server error', error: true });
                    }

                    return res.status(201).json({
                        msg: 'Signal added to wishlist successfully',
                        signal: signalResult.rows[0],
                        error: false,
                    });
                });
            });
        });
    });
};

const getallwishlists = async (req, res) => {
    try {
        const wishlistQuery = 'SELECT * FROM wishlist';

        const signalsQuery = `
            SELECT * FROM signals WHERE signal_id IN (
                SELECT signal_id FROM wishlist
            )
        `;

        const wishlistResult = await pool.query(wishlistQuery);
        const signalsResult = await pool.query(signalsQuery);

        if (signalsResult.rows.length === 0) {
            return res.status(200).json({ msg: 'No signals in the wishlist', data: [], error: false });
        }

        res.status(200).json({ msg: 'Signals retrieved successfully', data: signalsResult.rows, error: false });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Internal Server Error', error: true });
    }
}

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

module.exports = { addToWishlist, getallwishlists, deletewishlists };