const pool = require("../config/dbconfig")

const createsignal = (req, res) => {
    const { title, price, date, time, signal_status, action, stop_loss, trade_result, trade_probability } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'EXPIRED'].includes(signal_status) || !['BUY', 'SELL'].includes(action)) {
        return res.status(400).json({ error: 'Status can be one of ACTIVE, INACTIVE, EXPIRED, and action will be BUY or SELL' });
    }

    // Validate and format the time value
    const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (typeof time !== 'string' || !time.match(timeRegex)) {
        return res.status(400).json({ error: 'Invalid time format' });
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
            return res.status(500).json({ error: 'Internal server error' });
        }

        const newSignal = signalResult.rows[0];
        const emptyTakeProfit = [];
        return res.status(201).json({ message: 'Signal created successfully', data: newSignal, take_profit: emptyTakeProfit });

    });
};

const createTakeProfit = (req, res) => {
    const { signal_id, open_price, take_profit } = req.body;

    // Insert the new take_profit record into the database
    const insertTakeProfitQuery = `
        INSERT INTO take_profit (signal_id, open_price, take_profit)
        VALUES ($1, $2, $3)
        RETURNING *
    `;

    const takeProfitValues = [signal_id, open_price, take_profit];

    pool.query(insertTakeProfitQuery, takeProfitValues, (err, takeProfitResult) => {
        if (err) {
            console.error('Error creating take_profit record:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const newTakeProfit = takeProfitResult.rows[0];
        return res.status(201).json({ message: 'Take profit record created successfully', data: newTakeProfit });
    });
};

const gettallsignals = (req, res) => {

    pool.query('SELECT * FROM signals', (err, result) => {
        if (err) {
            console.error('Error fetching signals:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const allSignals = result.rows;
        return res.status(200).json({ data: allSignals });
    });
};

module.exports = { createsignal, gettallsignals, createTakeProfit };