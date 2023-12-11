const pool = require("../config/dbconfig");
const FCM = require('fcm-node');

// Extract device IDs from userDeviceIDs
// const deviceTokens = userDeviceIDs.map(user => user.device_id);
// console.log(deviceTokens);

// const serverKey =
//     'AAAAhAfoM48:APA91bETW1Y8QWTJs1cV2hMOBz4h3xSRnmdgZZlBc0ewWFL3d_1DXWj8G3ZET65omaek80PVO6yKAM2LsyM5vAgs4S-1CTENPYcmkh6XwFAXxFP8bSc381wyM_jWrbQCC4h_RmYt9tcE';
// // 'AAAAkeCgr4A:APA91bF-MkjZGuGsAaHS1ES1pzPCqqKR5F6EuFtbRxVrPdzrodTtM0U9wbcpvwUpZIcL7gsgtQuupBCCID-kqQTO_GoIW2XJhoazanXDyVMAhk01IjIR9bvjDLm-2xI3hK5pBDS7bqdG';
// const fcm = new FCM(serverKey);

// const message = {
//     notification: {
//         title: 'Signal',
//         body: 'New Signal Created'
//     },
//     to: 'eXA-ZyQVTH6_m8-pNUAP3S:APA91bHr8G6Dkt6MICR74OyoMHMJTNXNsLOvMPH66D2y3B7tZN4rGIoQidK4iamPeMzq3gKWJmPKlE9kYXIsqNeo9QgyLJ7Ju3OZ3Y2s43tLZpCoB_EXAackzoxWl0NUO9nYtofXjcYa'
//     // 'fWKefWn0Rvu1F7p8nZ8bYX:APA91bGipE2vwNJdno00r7rlCpFtmWQptbrsewPBGbicP6NN9Q2J_AaqflrSnfRZzetPz1Hk1qDcmkcXxpYdPv65ZvVq4UNIXcf7tcaWRQSyQxUCi62zBnyu0pVzMqGCDm_6qJGxZ2Mm'
// };

// fcm.send(message, function (err, response) {
//     if (err) {
//         console.error('Error sending message', err);
//     } else {
//         console.log(
//             'Successfully sent message',
//             response,
//             message.notification
//         );
//     }
// });

const getAllUserDeviceIDs = (callback) => {
    const userDeviceIDsQuery = `
        SELECT id, device_id
        FROM Users
        WHERE deleted_status = false AND deleted_at IS NULL
    `;

    pool.query(userDeviceIDsQuery, (err, result) => {
        if (err) {
            console.error('Error fetching user device IDs:', err);
            callback(err, null);
        } else {
            const userDeviceIDs = result.rows.map(user => ({
                id: user.id,
                device_id: user.device_id
            }));
            callback(null, userDeviceIDs);
        }
    });
};

const createsignal = (req, res) => {
    const {
        title,
        price,
        date,
        time,
        signal_status,
        action,
        stop_loss,
        trade_probability,
        time_frame
    } = req.body;

    if (
        !title ||
        !price ||
        !date ||
        !time ||
        !signal_status ||
        !action ||
        !stop_loss ||
        !trade_probability ||
        !time_frame
    ) {
        return res
            .status(400)
            .json({ msg: 'Request body cannot be empty', error: true });
    }

    if (
        !['ACTIVE', 'INACTIVE', 'EXPIRED'].includes(signal_status) ||
        !['BUY', 'SELL'].includes(action)
    ) {
        return res.status(400).json({
            msg:
                'Status can be one of ACTIVE, INACTIVE, EXPIRED, and action will be BUY or SELL.',
            error: true
        });
    }

    // Validate and format the time value
    const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (typeof time !== 'string' || !time.match(timeRegex)) {
        return res.status(400).json({ msg: 'Invalid time format', error: true });
    }

    // Insert the new signal into the database
    const insertSignalQuery = `
        INSERT INTO signals (title, price, date, time, signal_status, action, stop_loss, trade_probability, time_frame)
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
        trade_probability,
        time_frame
    ];

    pool.query(insertSignalQuery, signalValues, (err, signalResult) => {
        if (err) {
            if (err.code === '23505' && err.constraint === 'signals_title_key') {
                return res.status(400).json({
                    msg: 'Title already exists, please choose a different title',
                    error: true
                });
            }
            console.error('Error creating signal:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        const newSignal = signalResult.rows[0];
        const emptyTakeProfit = [];

        getAllUserDeviceIDs((err, userDeviceIDs) => {
            if (err) {
                // Handle error
                console.error('Error fetching user device IDs:', err);
                return res.status(500).json({ msg: 'Error fetching user device IDs', error: true });
            }

            // Extract device IDs from userDeviceIDs
            const deviceTokens = userDeviceIDs.map(user => user.device_id);
            console.log(deviceTokens);

            // Sending notification to all devices
            const serverKey = 'AAAAhAfoM48:APA91bETW1Y8QWTJs1cV2hMOBz4h3xSRnmdgZZlBc0ewWFL3d_1DXWj8G3ZET65omaek80PVO6yKAM2LsyM5vAgs4S-1CTENPYcmkh6XwFAXxFP8bSc381wyM_jWrbQCC4h_RmYt9tcE';
            const fcm = new FCM(serverKey);

            const message = {
                notification: {
                    title: 'Signal',
                    body: 'New Signal Created'
                },
                registration_ids: deviceTokens
            };

            fcm.send(message, function (err, response) {
                if (err) {
                    console.error('Error sending message', err);
                } else {
                    console.log('Successfully sent message', response, message.notification);

                    // Insert notification details into the database
                    const insertNotificationQuery = `
                 INSERT INTO notification_info (user_id, signal_id, title, body)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *
             `;

                    userDeviceIDs.forEach(user => {
                        const notificationValues = [
                            user.id, // Using the individual user ID
                            newSignal.signal_id,
                            'Signal',
                            'New Signal Created'
                        ];

                        pool.query(insertNotificationQuery, notificationValues, (err, notificationResult) => {
                            if (err) {
                                console.error('Error inserting notification:', err);
                                // Handle error while inserting notification for this user
                            } else {
                                const insertedNotification = notificationResult.rows[0];
                                console.log('Notification inserted:', insertedNotification);
                                // Handle successful insertion of notification for this user
                            }
                        });
                    }); 

                }
            });

            const userdetails = userDeviceIDs.map(user => user);
            console.log(userdetails);

        });

        return res.status(201).json({
            msg: 'Signal created successfully',
            data: newSignal,
            take_profit: emptyTakeProfit,
            error: false
        });
    });
};

const updateSignalResult = (req, res) => {
    const { signal_id } = req.params;
    const { profit_loss, image } = req.body;

    if (!signal_id || !profit_loss || !image) {
        return res
            .status(400)
            .json({ msg: 'Signal ID, profit_loss, and image are required', error: true });
    }

    // Validate profit_loss value
    if (profit_loss !== 'PROFIT' && profit_loss !== 'LOSS') {
        return res
            .status(400)
            .json({ msg: 'Profit_loss must be either PROFIT or LOSS', error: true });
    }

    // Check if the signal exists
    const checkSignalQuery = `
        SELECT *
        FROM signals
        WHERE signal_id = $1
    `;

    pool.query(checkSignalQuery, [signal_id], (err, checkResult) => {
        if (err) {
            console.error('Error checking signal:', err);
            return res
                .status(500)
                .json({ msg: 'Internal server error', error: true });
        }

        const existingSignal = checkResult.rows[0];

        if (!existingSignal) {
            return res
                .status(404)
                .json({ msg: 'Signal not found', error: true });
        }

        // Update the existing signal in the database
        const updateSignalQuery = `
            UPDATE signals 
            SET profit_loss = $1, image = $2, result = true, updated_at = NOW()
            WHERE signal_id = $3
            RETURNING *
        `;

        const signalValues = [profit_loss, image, signal_id];

        pool.query(updateSignalQuery, signalValues, (err, signalResult) => {
            if (err) {
                console.error('Error updating signal:', err);
                return res
                    .status(500)
                    .json({ msg: 'Internal server error', error: true });
            }

            const updatedSignal = signalResult.rows[0];

            return res.status(200).json({
                msg: 'Signal updated successfully',
                data: updatedSignal,
                error: false
            });
        });
    });
}

const gettallsignals = (req, res) => {

    const { limit, page } = req.query;
    let query = `
        SELECT s.*, t.take_profit_id, t.open_price, t.take_profit
        FROM signals s
        LEFT JOIN take_profit t ON s.signal_id = t.signal_id
        ORDER BY s.created_at DESC
    `;

    if (limit && page) {
        const offset = (page - 1) * limit;
        query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    pool.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching signals:', err);
            return res.status(500).json({ msg: 'Internal server error', status: false });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'No signals found', status: true, count: 0, data: [] });
        }

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
                    result: row.result,
                    image: row.image,
                    trade_result: row.trade_result,
                    trade_probability: row.trade_probability,
                    time_frame: row.time_frame,
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

        return res.status(200).json({
            msg: 'Signals fetched successfully',
            status: true,
            count: signalsWithTakeProfits.length,
            data: signalsWithTakeProfits,
        });
    });
};

const getSignalById = (req, res) => {
    const signalId = req.params.signal_id; // Assuming you pass the signal_id as a parameter

    // Query to retrieve a specific signal and its associated take profits without signal results
    const query = `
        SELECT s.*, t.take_profit_id, t.open_price, t.take_profit
        FROM signals s
        LEFT JOIN take_profit t ON s.signal_id = t.signal_id
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
            signalWithTakeProfits.result = row.result;
            signalWithTakeProfits.profit_loss = row.profit_loss;
            signalWithTakeProfits.profit_loss = row.image;
            signalWithTakeProfits.trade_probability = row.trade_probability;
            signalWithTakeProfits.time_frame = row.time_frame;
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

        return res.status(200).json({ msg: 'Signal fetched', data: signalWithTakeProfits, status: true });
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
            // trade_result = existingData.trade_result,
            trade_probability = existingData.trade_probability,
            // profit_loss = existingData.profit_loss,
            time_frame = existingData.time_frame
        } = req.body;

        // Apply similar checks as in the createsignal function
        if (!title || !price || !date || !time || !signal_status || !action || !stop_loss || !trade_probability || !time_frame) {
            return res.status(400).json({ msg: 'Request body cannot be empty', error: true });
        }

        if (!['ACTIVE', 'INACTIVE', 'EXPIRED'].includes(signal_status) || !['BUY', 'SELL'].includes(action)) {
            return res.status(400).json({ msg: 'Status can be one of ACTIVE, INACTIVE, EXPIRED, and action will be BUY or SELL.', error: true });
        }

        // Validate and format the time value
        const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
        if (typeof time !== 'string' || !time.match(timeRegex)) {
            return res.status(400).json({ msg: 'Invalid time format', error: true });
        }

        // if (
        //     (trade_result === 'WAITING' && profit_loss !== 'WAITING') ||
        //     (trade_result === 'ANNOUNCED' && isNaN(profit_loss))
        // ) {
        //     return res.status(400).json({
        //         msg:
        //             'If trade_result is WAITING, profit_loss should be WAITING. If trade_result is ANNOUNCED, profit_loss can be any numerical value.',
        //         error: true
        //     });
        // }

        // Update the signal in the database
        const query = `
        UPDATE signals
        SET title = $1, price = $2, date = $3, time = $4, signal_status = $5, 
        action = $6, stop_loss = $7, trade_probability = $8, 
        time_frame = $9 /* Add your missing parameter here */
        WHERE signal_id = $10
        RETURNING *
    `;

        const values = [
            title, price, date, time, signal_status, action, stop_loss,
            trade_probability, time_frame, signalId
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

            console.log(result.rows[0]);
            getAllUserDeviceIDs((err, userDeviceIDs) => {
                if (err) {
                    // Handle error
                    console.error('Error fetching user device IDs:', err);
                    return res.status(500).json({ msg: 'Error fetching user device IDs', error: true });
                }
    
                // Extract device IDs from userDeviceIDs
                const deviceTokens = userDeviceIDs.map(user => user.device_id);
                console.log(deviceTokens);
    
                // Sending notification to all devices
                const serverKey = 'AAAAhAfoM48:APA91bETW1Y8QWTJs1cV2hMOBz4h3xSRnmdgZZlBc0ewWFL3d_1DXWj8G3ZET65omaek80PVO6yKAM2LsyM5vAgs4S-1CTENPYcmkh6XwFAXxFP8bSc381wyM_jWrbQCC4h_RmYt9tcE';
                const fcm = new FCM(serverKey);
    
                const message = {
                    notification: {
                        title: 'Signal',
                        body: 'Signal Updated Successfully'
                    },
                    registration_ids: deviceTokens
                };
    
                fcm.send(message, function (err, response) {
                    if (err) {
                        console.error('Error sending message', err);
                    } else {
                        console.log('Successfully sent message', response, message.notification);
    
                        // Insert notification details into the database
                        const insertNotificationQuery = `
                     INSERT INTO notification_info (user_id, signal_id, title, body)
                     VALUES ($1, $2, $3, $4)
                     RETURNING *
                 `;
    
                        userDeviceIDs.forEach(user => {
                            const notificationValues = [
                                user.id, // Using the individual user ID
                                result.rows[0].signal_id,
                                'Signal',
                                'Signal Updated Successfully'
                            ];
    
                            pool.query(insertNotificationQuery, notificationValues, (err, notificationResult) => {
                                if (err) {
                                    console.error('Error inserting notification:', err);
                                    // Handle error while inserting notification for this user
                                } else {
                                    const insertedNotification = notificationResult.rows[0];
                                    console.log('Notification inserted:', insertedNotification);
                                    // Handle successful insertion of notification for this user
                                }
                            });
                        }); 
    
                    }
                });
    
                const userdetails = userDeviceIDs.map(user => user);
                console.log(userdetails);
    
            });

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

const getUserSignals = async (req, res) => {
    const { userId } = req.params;

    try {
        const signalQuery = `
            SELECT signals.*
            FROM wishlist
            JOIN signals ON wishlist.signal_id = signals.signal_id
            WHERE wishlist.user_id = $1
        `;

        const signalResult = await pool.query(signalQuery, [userId]);

        const signalData = signalResult.rows;

        if (signalData.length === 0) {
            return res.status(404).json({ msg: 'No signals found for this user', error: true });
        }

        const userQuery = 'SELECT * FROM Users WHERE id = $1';
        const userResult = await pool.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found', error: true });
        }

        const userData = userResult.rows[0];

        res.status(200).json({ user: userData, signals: signalData, error: false });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Internal Server Error', error: true });
    }
};

const createSignalResult = async (req, res) => {
    const { signal_id, image, result, profit_loss } = req.body;

    try {
        // Check if the signal_id exists in signals table
        const signalExists = await pool.query('SELECT * FROM signals WHERE signal_id = $1', [signal_id]);

        if (signalExists.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Signal ID not found!' });
        }

        if (profit_loss !== 'PROFIT' && profit_loss !== 'LOSS') {
            return res.status(400).json({ error: true, msg: 'Profit loss can only be PROFIT or LOSS!' });
        }

        let dbResult = result === 'null' ? null : result;
        let dbImage = image === 'null' ? null : image;

        if (profit_loss === 'PROFIT') {
            if (dbResult === null || dbImage === null) {
                return res.status(400).json({ error: true, msg: "Result and Image caan't be null for PROFIT!" });
            }
        } else if (profit_loss === 'LOSS') {
            if (dbResult !== null || dbImage !== null) {
                return res.status(400).json({ error: true, msg: 'Result and Image should be null for LOSS!' });
            }
        }

        // Insert new record into signalresult table
        await pool.query('INSERT INTO signalresult (signal_id, image, result, profit_loss) VALUES ($1, $2, $3, $4)', [
            signal_id,
            dbImage,
            dbResult,
            profit_loss,
        ]);

        // Fetch signal details
        const signalDetails = signalExists.rows[0]; // Assuming there's only one entry for a specific signal_id

        // Prepare the response object
        const response = {
            msg: 'Result added successfully!',
            error: false,
            signal_id: signalDetails.signal_id,
            data: {
                signal_id,
                result: dbResult,
                image: dbImage,
                profit_loss,
            },
        };

        res.json(response);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: true, msg: 'Something went wrong!' });
    }
};

// const updateSignalResult = async (req, res) => {
//     const signalId = req.params.signal_id;
//     const signalResultId = req.params.id;
//     const { image, result, profit_loss } = req.body;

//     try {
//         // Check if the signal ID exists in signals table
//         const signalExists = await pool.query('SELECT * FROM signals WHERE signal_id = $1', [signalId]);

//         if (signalExists.rows.length === 0) {
//             return res.status(404).json({ error: true, msg: 'Signal ID not found!' });
//         }

//         if (profit_loss !== 'PROFIT' && profit_loss !== 'LOSS') {
//             return res.status(400).json({ error: true, msg: 'Profit loss can only be PROFIT or LOSS!' });
//         }

//         let dbresult = result === 'null' ? null : result;
//         let dbimage = image === 'null' ? null : image;

//         if (profit_loss === 'PROFIT') {
//             if (dbresult === null || dbimage === null) {
//                 return res.status(400).json({ error: true, msg: "Result and Image can't be null for PROFIT!" });
//             }
//         } else if (profit_loss === 'LOSS') {
//             if (dbresult !== null || dbimage !== null) {
//                 return res.status(400).json({ error: true, msg: 'Result and Image should be null for LOSS!' });
//             }
//         }

//         // Query to update the signal result based on IDs
//         const updateQuery = `
//         UPDATE signalresult
//         SET image = $1, result = $2, profit_loss = $3
//         WHERE signal_id = $4 AND signal_result_id = $5
//       `;

//         const updateResult = await pool.query(updateQuery, [dbimage, dbresult, profit_loss, signalId, signalResultId]);

//         if (updateResult.rowCount === 0) {
//             // No rows were affected by the update, indicating the signal or signal result ID was not found
//             return res.status(404).json({ status: false, error: 'Signal or Signal Result not found' });
//         }

//         return res.status(200).json({ msg: 'Signal Result updated successfully', status: true });
//     } catch (error) {
//         console.error('Error updating signal result:', error);
//         return res.status(500).json({ error: true, msg: 'Internal server error' });
//     }
// };

const searchsignalbyname = (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { name } = req.body;

    const offset = (page - 1) * limit;
    let queryParams = [];
    let nameFilter = '';

    if (name) {
        nameFilter = 'LOWER(s.title) LIKE $1';
        queryParams.push(`%${name.toLowerCase()}%`);
    }

    const query = `
        SELECT s.*, t.take_profit_id, t.open_price, t.take_profit
        FROM signals s
        LEFT JOIN take_profit t ON s.signal_id = t.signal_id
        ${nameFilter ? `WHERE ${nameFilter}` : ''}
        ORDER BY s.date DESC
        OFFSET $${queryParams.length + 1}
        LIMIT $${queryParams.length + 2}
    `;

    queryParams.push(offset, limit);

    pool.query(query, queryParams, (err, result) => {
        if (err) {
            console.error('Error fetching signals:', err);
            return res.status(500).json({ msg: 'Internal server error', status: false });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'No signals found', status: true, count: 0, data: [] });
        }

        // Process the results and send the paginated response
        const signalsWithTakeProfits = [];
        let currentSignal = null;

        for (const row of result.rows) {
            let currentSignal = signalsWithTakeProfits.find(signal => signal.signal_id === row.signal_id);

            if (!currentSignal) {
                currentSignal = {
                    signal_id: row.signal_id,
                    title: row.title,
                    price: row.price,
                    date: row.date,
                    time: row.time,
                    signal_status: row.signal_status,
                    action: row.action,
                    stop_loss: row.stop_loss,
                    result: row.result,
                    profit_loss: row.profit_loss,
                    profit_loss: row.image,
                    trade_probability: row.trade_probability,
                    time_frame: row.time_frame,
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

        return res.status(200).json({
            msg: 'Signals fetched successfully',
            status: true,
            // count: signalsWithTakeProfits.length,
            data: signalsWithTakeProfits,
        });
    });
};

module.exports = { createsignal, gettallsignals, getSignalById, updateSignalById, deleteSignalById, updateSignalStatus, getUserSignals, createSignalResult, updateSignalResult, searchsignalbyname };