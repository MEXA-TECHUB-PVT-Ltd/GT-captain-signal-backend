const pool = require("../config/dbconfig")

const createTakeProfit = (req, res) => {
    const { signal_id, open_price, take_profit } = req.body;

    // Check if the signal_id exists in the signals table
    const checkSignalQuery = `
        SELECT signal_id FROM signals WHERE signal_id = $1
    `;

    const signalValues = [signal_id];
    console.log("signalValues", signalValues);

    pool.query(checkSignalQuery, signalValues, (signalErr, signalResult) => {
        if (signalErr) {
            console.error('Error checking signal:', signalErr);
            return res.status(500).json({ error: 'Internal server error', status: false });
        }

        // Check if a signal with the provided signal_id exists
        if (signalResult.rows.length === 0) {
            return res.status(400).json({ error: 'Signal with this id not found', status: false });
        }

        // If the signal_id exists, insert the new take_profit record into the database
        const insertTakeProfitQuery = `
            INSERT INTO take_profit (signal_id, open_price, take_profit)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const takeProfitValues = [signal_id, open_price, take_profit];

        pool.query(insertTakeProfitQuery, takeProfitValues, (err, takeProfitResult) => {
            if (err) {
                console.error('Error creating take_profit record:', err);
                return res.status(500).json({ error: 'Internal server error', status: false });
            }

            const newTakeProfit = takeProfitResult.rows[0];
            return res.status(201).json({ message: 'Take profit record created successfully', data: newTakeProfit, status: true });
        });
    });
};

const getAllTakeProfits = (req, res) => {
    // Query to retrieve all take profits
    const query = `
        SELECT *
        FROM take_profit
    `;

    pool.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching take profits:', err);
            return res.status(500).json({ error: 'Internal server error', status: false });
        }

        const allTakeProfits = result.rows;
        return res.status(200).json({ msg: "All Take Profits Fetched", data: allTakeProfits, status: true });
    });
};

const getTakeProfitsBySignalId = (req, res) => {
    const signalId = req.params.signal_id;

    const query = `
        SELECT *
        FROM take_profit
        WHERE signal_id = $1
    `;

    pool.query(query, [signalId], (err, result) => {
        if (err) {
            console.error('Error fetching take profits:', err);
            return res.status(500).json({ error: 'Internal server error', status: false });
        }

        if (result.rows.length === 0) {
            // No take profits found for the specified signal_id
            return res.status(404).json({ error: 'No take profits found for this signal_id', status: false });
        }

        const takeProfits = result.rows;
        return res.status(200).json({ msg: "Take profit fetched ", data: takeProfits, status: true });
    });
};

const getTakeProfitbyID = (req, res) => {
    const takeprofitID = req.params.take_profit_id;
    console.log("takeprofitID", takeprofitID)
    const query = `
        SELECT *
        FROM take_profit
        WHERE take_profit_id = $1
    `;

    pool.query(query, [takeprofitID], (err, result) => {
        if (err) {
            console.error('Error fetching take profits:', err);
            return res.status(500).json({ error: 'Internal server error', status: false });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No take profit found for this ID', status: false });
        }

        const takeProfits = result.rows;
        return res.status(200).json({ msg: "Take profit fetched ", data: takeProfits, status: true });
    });
};

const updateTakeProfit = (req, res) => {
    const takeprofitID = req.params.take_profit_id; // Assuming you pass the take_profit_id as a parameter
    const { open_price, take_profit } = req.body;

    // Query to update the specific take profit
    const query = `
        UPDATE take_profit
        SET open_price = $1, take_profit = $2
        WHERE take_profit_id = $3
        RETURNING *
    `;

    const values = [open_price, take_profit, takeprofitID];

    pool.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating take profit:', err);
            return res.status(500).json({ error: 'Internal server error', staus: false });
        }

        if (result.rowCount === 0) {
            // The take profit with the specified take_profit_id was not found
            return res.status(404).json({ status: false, error: 'Take profit not found' });
        }

        // The update was successful, and the updated take profit attributes are in result.rows[0]
        return res.status(200).json({ msg: 'Take profit updated', data: result.rows[0], status: true });
    });
};

const deleteTakeProfit = (req, res) => {
    const takeprofitID = req.params.take_profit_id;

    const query = `
        DELETE FROM take_profit
        WHERE take_profit_id = $1
    `;

    pool.query(query, [takeprofitID], (err, result) => {
        if (err) {
            console.error('Error deleting take profit:', err);
            return res.status(500).json({ error: 'Internal server error', status: false });
        }

        if (result.rowCount === 0) {
            return res.status(404).json({ status: false, error: 'Take profit not found' });
        }

        return res.status(200).json({ msg: 'Take profit deleted', status: true });
    });
};

module.exports = { createTakeProfit, getAllTakeProfits, getTakeProfitsBySignalId, getTakeProfitbyID, updateTakeProfit, deleteTakeProfit };