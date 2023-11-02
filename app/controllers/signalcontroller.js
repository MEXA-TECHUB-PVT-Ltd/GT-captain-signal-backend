const pool = require("../config/dbconfig")

const createsignal = (req, res) => {
    const { title, price, date, time, signal_status, action, stop_loss, trade_result, trade_probability } = req.body;

    if (!title || !price || !date || !time || !signal_status || !action || !stop_loss || !trade_result || !trade_probability) {
        return res.status(400).json({ msg: 'Request body cannot be empty', error: true });
    }
    
    if (!['ACTIVE', 'INACTIVE', 'EXPIRED'].includes(signal_status) || !['BUY', 'SELL'].includes(action)) {
        return res.status(400).json({ msg: 'Status can be one of ACTIVE, INACTIVE, EXPIRED, and action will be BUY or SELL', error: true });
    }

    // Validate and format the time value
    const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (typeof time !== 'string' || !time.match(timeRegex)) {
        return res.status(400).json({ msg: 'Invalid time format', error: true });
    }

    // Insert the new signal into the database
    const insertSignalQuery = `
        INSERT INTO signals (title, price, date, time, signal_status, action, stop_loss, trade_result, trade_probability)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    `;

    const signalValues = [
        title,
        price,
        date,
        time,
        signal_status,
        action,
        stop_loss,
        trade_result,
        trade_probability,
    ];

    pool.query(insertSignalQuery, signalValues, (err, signalResult) => {
        if (err) {
            console.error('Error creating signal:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        const newSignal = signalResult.rows[0];
        const emptyTakeProfit = [];
        return res.status(201).json({ msg: 'Signal created successfully', data: newSignal, take_profit: emptyTakeProfit, error: false });

    });
};

const gettallsignals = (req, res) => {

    // Query to retrieve all signals and their associated take profits
    const query = `
     SELECT s.*, t.open_price, t.take_profit
     FROM signals s
     LEFT JOIN take_profit t
     ON s.signal_id = t.signal_id
 `;

    pool.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching signals:', err);
            return res.status(500).json({ error: 'Internal server error', status: false });
        }

        // Process the results and send the response
        const signalsWithTakeProfits = [];
        let currentSignal = null;

        for (const row of result.rows) {
            if (!currentSignal || currentSignal.signal_id !== row.signal_id) {
                currentSignal = {
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
                    take_profit: [],
                };
                signalsWithTakeProfits.push(currentSignal);
            }

            if (row.open_price && row.take_profit) {
                currentSignal.take_profit.push({
                    open_price: row.open_price,
                    take_profit: row.take_profit,
                });
            }
        }

        return res.status(200).json({ msg: "All signals fetched", data: signalsWithTakeProfits, status: true });
    });

};

const getSignalById = (req, res) => {
    const signalId = req.params.signal_id; // Assuming you pass the signal_id as a parameter

    // Query to retrieve a specific signal and its associated take profits
    const query = `
        SELECT s.*, t.open_price, t.take_profit
        FROM signals s
        LEFT JOIN take_profit t
        ON s.signal_id = t.signal_id
        WHERE s.signal_id = $1
    `;

    pool.query(query, [signalId], (err, result) => {
        if (err) {
            console.error('Error fetching signal:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.rows.length === 0) {
            // The signal with the specified signal_id was not found
            return res.status(404).json({ status: false, error: 'Signal not found' });
        }

        // Process the result and send the response
        const signalWithTakeProfits = {
            signal_id: signalId,
            take_profit: [],
        };

        for (const row of result.rows) {
            signalWithTakeProfits.title = row.title;
            signalWithTakeProfits.price = row.price;
            signalWithTakeProfits.date = row.date;
            signalWithTakeProfits.time = row.time;
            signalWithTakeProfits.signal_status = row.signal_status;
            signalWithTakeProfits.action = row.action;
            signalWithTakeProfits.stop_loss = row.stop_loss;
            signalWithTakeProfits.trade_result = row.trade_result;
            signalWithTakeProfits.trade_probability = row.trade_probability;
            signalWithTakeProfits.created_at = row.created_at;
            signalWithTakeProfits.updated_at = row.updated_at;

            if (row.open_price && row.take_profit) {
                signalWithTakeProfits.take_profit.push({
                    open_price: row.open_price,
                    take_profit: row.take_profit,
                });
            }
        }

        return res.status(200).json({ msg: "Signal fetched", data: signalWithTakeProfits, status: true });
    });
};

const updateSignalById = (req, res) => {
    const signalId = req.params.signal_id; 
    const { title, price, date, time, signal_status, action, stop_loss, trade_result, trade_probability } = req.body;

    const query = `
        UPDATE signals
        SET title = $1, price = $2, date = $3, time = $4, signal_status = $5, action = $6, stop_loss = $7, trade_result = $8, trade_probability = $9
        WHERE signal_id = $10
        RETURNING *
    `;

    const values = [title, price, date, time, signal_status, action, stop_loss, trade_result, trade_probability, signalId];

    pool.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating signal:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        if (result.rowCount === 0) {
            // The signal with the specified signal_id was not found
            return res.status(404).json({ error: true, msg: 'Signal not found' });
        }

        // The update was successful, and the updated signal attributes are in result.rows[0]
        return res.status(200).json({ msg: 'Signal updated', data: result.rows[0], error: false });
    });
};

const deleteSignalById = (req, res) => {
    const signalId = req.params.signal_id;
    
    const query = `
        DELETE FROM signals
        WHERE signal_id = $1
    `;

    pool.query(query, [signalId], (err, result) => {
        if (err) {
            console.error('Error deleting signal:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        if (result.rowCount === 0) {
            // The signal with the specified signal_id was not found
            return res.status(404).json({ error: true, msg: 'Signal not found' });
        }

        // The deletion was successful
        return res.status(200).json({ msg: 'Signal deleted', error: false });
    });
};

module.exports = { createsignal, gettallsignals, getSignalById, updateSignalById, deleteSignalById };