const pool = require("../config/dbconfig")

const createTakeProfit = (req, res) => {
    
    const { signal_id, take_profits } = req.body;

    // Check if the signal_id exists in the signals table
    const checkSignalQuery = `
        SELECT signal_id FROM signals WHERE signal_id = $1
    `;

    const signalValues = [signal_id];

    pool.query(checkSignalQuery, signalValues, (signalErr, signalResult) => {
        if (signalErr) {
            console.error('Error checking signal:', signalErr);
            return res.status(500).json({ error: 'Internal server error', status: false });
        }

        // Check if a signal with the provided signal_id exists
        if (signalResult.rows.length === 0) {
            return res.status(400).json({ error: 'Signal with this id not found', status: false });
        }

        // If the signal_id exists, insert the new take_profit records into the database
        const insertTakeProfitQuery = `
            INSERT INTO take_profit (signal_id, open_price, take_profit)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        // Create an array to hold all the insert queries
        const insertQueries = take_profits.map(tp => {
            const takeProfitValues = [signal_id, tp.open_price, tp.take_profit];
            return pool.query(insertTakeProfitQuery, takeProfitValues);
        });

        // Execute all insert queries in parallel
        Promise.all(insertQueries)
            .then(takeProfitResults => {
                const newTakeProfits = takeProfitResults.map(result => result.rows[0]);
                return res.status(201).json({ message: 'Take profit records created successfully', data: newTakeProfits, status: true });
            })
            .catch(err => {
                console.error('Error creating take_profit records:', err);
                return res.status(500).json({ error: 'Internal server error', status: false });
            });
    });

}

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

    const { signal_id, take_profits } = req.body;

    // Check if the signal_id exists in the signals table
    const checkSignalQuery = `
        SELECT signal_id FROM signals WHERE signal_id = $1
    `;

    const signalValues = [signal_id];

    pool.query(checkSignalQuery, signalValues, (signalErr, signalResult) => {
        if (signalErr) {
            console.error('Error checking signal:', signalErr);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        // Check if a signal with the provided signal_id exists
        if (signalResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Signal with this id not found', error: true });
        }

        // If the signal_id exists, update existing take_profit records and insert new ones

        // First, update existing take profit records if any
        const updateTakeProfitQuery = `
            UPDATE take_profit
            SET open_price = $2, take_profit = $3
            WHERE signal_id = $1 AND take_profit_id = $4
            RETURNING *
        `;

        const updateQueries = take_profits
            .filter(tp => tp.take_profit_id) // Filter only the records with take_profit_id
            .map(tp => {
                const takeProfitValues = [signal_id, tp.open_price, tp.take_profit, tp.take_profit_id];
                return pool.query(updateTakeProfitQuery, takeProfitValues);
            });

        // Then, insert new take profit records
        const insertTakeProfitQuery = `
            INSERT INTO take_profit (signal_id, open_price, take_profit)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const insertQueries = take_profits
            .filter(tp => !tp.take_profit_id) // Filter only the records without take_profit_id
            .map(tp => {
                const takeProfitValues = [signal_id, tp.open_price, tp.take_profit];
                return pool.query(insertTakeProfitQuery, takeProfitValues);
            });

        // Execute all update and insert queries in parallel
        Promise.all([...updateQueries, ...insertQueries])
            .then(takeProfitResults => {
                const updatedTakeProfits = takeProfitResults.map(result => result.rows[0]);
                return res.status(200).json({ msg: 'Take profit records updated successfully', data: updatedTakeProfits, error: false });
            })
            .catch(err => {
                console.error('Error updating/creating take_profit records:', err);
                return res.status(500).json({ msg: 'Internal server error', error: true });
            });
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