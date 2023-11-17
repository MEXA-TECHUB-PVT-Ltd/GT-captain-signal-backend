const pool = require("../config/dbconfig");
const FCM = require('fcm-node');

const serverKey = "AAAAkeCgr4A:APA91bF-MkjZGuGsAaHS1ES1pzPCqqKR5F6EuFtbRxVrPdzrodTtM0U9wbcpvwUpZIcL7gsgtQuupBCCID-kqQTO_GoIW2XJhoazanXDyVMAhk01IjIR9bvjDLm-2xI3hK5pBDS7bqdG";
const fcm = new FCM(serverKey);

const message = {
    notification: {
        title: "Notification Title",
        body: "Notification body"
    },
    to: "fWKefWn0Rvu1F7p8nZ8bYX:APA91bGipE2vwNJdno00r7rlCpFtmWQptbrsewPBGbicP6NN9Q2J_AaqflrSnfRZzetPz1Hk1qDcmkcXxpYdPv65ZvVq4UNIXcf7tcaWRQSyQxUCi62zBnyu0pVzMqGCDm_6qJGxZ2Mm"
}

fcm.send(message, function (err, response) {
    if (err) {
        console.error("Error sending message", err);
    } else {
        console.error("Successfully Send message", response, message.notification);
    }
})
// const admin = require('firebase-admin');
// const serviceAccount = require('../../gtcaptionsignals-firebase-adminsdk-ujvae-29a88cdd4e.json'); // Adjust the path

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
// });

// const messaging = admin.messaging()
// var payload = {
//     notification: {
//         title: "This is a Notification",
//         body: "This is the body of the notification message."
//     },
//     topic: 'topic'
// };

// messaging.send(payload)
//     .then((result) => {
//         console.log("Success : ",result)
//     })

const createsignal = (req, res) => {
    const { title, price, date, time, signal_status, action, stop_loss, trade_result, trade_probability, profit_loss } = req.body;

    if (!title || !price || !date || !time || !signal_status || !action || !stop_loss || !trade_result || !trade_probability || !profit_loss) {
        return res.status(400).json({ msg: 'Request body cannot be empty', error: true });
    }

    if (!['ACTIVE', 'INACTIVE', 'EXPIRED'].includes(signal_status) || !['BUY', 'SELL'].includes(action) || !['WAITING', 'ANNOUNCED'].includes(profit_loss) || !['WAITING', 'ANNOUNCED'].includes(trade_result)) {
        return res.status(400).json({ msg: 'Status can be one of ACTIVE, INACTIVE, EXPIRED, and action will be BUY or SELL. Profit_loss and trade_result can be waiting or announced.', error: true });
    }

    // Validate and format the time value
    const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (typeof time !== 'string' || !time.match(timeRegex)) {
        return res.status(400).json({ msg: 'Invalid time format', error: true });
    }

    // Check the relationship between profit_loss and trade_result
    if ((profit_loss === 'WAITING' && trade_result !== 'WAITING') || (profit_loss === 'ANNOUNCED' && trade_result !== 'ANNOUNCED')) {
        return res.status(400).json({ msg: 'If profit_loss is WAITING, trade_result should be WAITING. If profit_loss is ANNOUNCED, trade_result should be ANNOUNCED.', error: true });
    }

    // Insert the new signal into the database
    const insertSignalQuery = `
        INSERT INTO signals (title, price, date, time, signal_status, action, stop_loss, trade_result, trade_probability, profit_loss)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        profit_loss,
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
    const { page = 1, limit = 10 } = req.query;

    // Calculate the OFFSET based on the page and limit
    const offset = (page - 1) * limit;

    // Query to retrieve all signals and their associated take profits with pagination
    const query = `
        SELECT s.*, t.take_profit_id, t.open_price, t.take_profit
        FROM signals s
        LEFT JOIN take_profit t ON s.signal_id = t.signal_id
        OFFSET ${offset}
        LIMIT ${limit}
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
                    profit_loss: row.profit_loss,
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
                    take_profit_id: row.take_profit_id,
                    open_price: row.open_price,
                    take_profit: row.take_profit,
                });
            }
        }

        return res.status(200).json({ msg: "Signals fetched successfully", data: signalsWithTakeProfits, status: true });
    });
};

const getSignalById = (req, res) => {
    const signalId = req.params.signal_id; // Assuming you pass the signal_id as a parameter

    // Query to retrieve a specific signal and its associated take profits
    const query = `
        SELECT s.*, t.take_profit_id, t.open_price, t.take_profit
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
            signalWithTakeProfits.profit_loss = row.profit_loss;
            signalWithTakeProfits.trade_probability = row.trade_probability;
            signalWithTakeProfits.created_at = row.created_at;
            signalWithTakeProfits.updated_at = row.updated_at;

            if (row.open_price && row.take_profit) {
                signalWithTakeProfits.take_profit.push({
                    take_profit_id: row.take_profit_id,
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

    // Fetch the existing data for the signal using the signal_id
    pool.query('SELECT * FROM signals WHERE signal_id = $1', [signalId], (err, result) => {
        if (err) {
            console.error('Error fetching signal:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        if (result.rowCount === 0) {
            // The signal with the specified signal_id was not found
            return res.status(404).json({ error: true, msg: 'Signal not found' });
        }

        // Merge the existing data with the request body, only updating the provided attributes
        const existingData = result.rows[0];
        const {
            title = existingData.title,
            price = existingData.price,
            date = existingData.date,
            time = existingData.time,
            signal_status = existingData.signal_status,
            action = existingData.action,
            stop_loss = existingData.stop_loss,
            trade_result = existingData.trade_result,
            trade_probability = existingData.trade_probability,
            profit_loss = existingData.profit_loss,
        } = req.body;

        // Apply similar checks as in the createsignal function
        if (!title || !price || !date || !time || !signal_status || !action || !stop_loss || !trade_result || !trade_probability || !profit_loss) {
            return res.status(400).json({ msg: 'Request body cannot be empty', error: true });
        }

        if (!['ACTIVE', 'INACTIVE', 'EXPIRED'].includes(signal_status) || !['BUY', 'SELL'].includes(action) || !['WAITING', 'ANNOUNCED'].includes(profit_loss) || !['WAITING', 'ANNOUNCED'].includes(trade_result)) {
            return res.status(400).json({ msg: 'Status can be one of ACTIVE, INACTIVE, EXPIRED, and action will be BUY or SELL. Profit_loss and trade_result can be WAITING or ANNOUNCED.', error: true });
        }

        // Validate and format the time value
        const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
        if (typeof time !== 'string' || !time.match(timeRegex)) {
            return res.status(400).json({ msg: 'Invalid time format', error: true });
        }

        // Check the relationship between profit_loss and trade_result
        if ((trade_result === 'WAITING' && profit_loss !== 'WAITING') || (trade_result === 'ANNOUNCED' && profit_loss !== 'ANNOUNCED')) {
            return res.status(400).json({ msg: 'If trade_result is WAITING, profit_loss should be WAITING. If trade_result is ANNOUNCED, profit_loss should be ANNOUNCED.', error: true });
        }

        // Update the signal in the database
        const query = `
            UPDATE signals
            SET title = $1, price = $2, date = $3, time = $4, signal_status = $5, action = $6, stop_loss = $7, trade_result = $8, trade_probability = $9, profit_loss = $10
            WHERE signal_id = $11
            RETURNING *
        `;

        const values = [
            title, price, date, time, signal_status, action, stop_loss, trade_result, trade_probability, profit_loss, signalId
        ];

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

const updateSignalStatus = (req, res) => {
    const signalId = req.params.signal_id;
    const { signal_status } = req.body;

    // Check if signal_status is provided
    if (!signal_status) {
        return res.status(400).json({ msg: 'Signal status cannot be empty', error: true });
    }

    // Check if the provided signal_status is one of the allowed values
    if (!['ACTIVE', 'INACTIVE', 'EXPIRED'].includes(signal_status)) {
        return res.status(400).json({ msg: 'Signal status can only be ACTIVE, INACTIVE, or EXPIRED', error: true });
    }

    // Update the signal_status in the database
    const query = `
        UPDATE signals
        SET signal_status = $1
        WHERE signal_id = $2
        RETURNING *
    `;

    const values = [signal_status, signalId];

    pool.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating signal status:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        if (result.rowCount === 0) {
            // The signal with the specified signal_id was not found
            return res.status(404).json({ error: true, msg: 'Signal not found' });
        }

        // The update was successful, and the updated signal attributes are in result.rows[0]
        return res.status(200).json({ msg: 'Signal status updated', data: result.rows[0], error: false });
    });
};

module.exports = { createsignal, gettallsignals, getSignalById, updateSignalById, deleteSignalById, updateSignalStatus };