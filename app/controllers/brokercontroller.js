const pool = require("../config/dbconfig")

const createbroker = (req, res) => {

    const { image, name, email, profit, loss } = req.body;

    const insertbrokerQuery = `
        INSERT INTO broker (image, name, email, profit, loss)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;

    const brokerValues = [
        image, name, email, profit, loss
    ];

    pool.query(insertbrokerQuery, brokerValues, (err, result) => {
        if (err) {
            console.error('Error creating signal:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        return res.status(201).json({ msg: 'Broker created successfully', data: result.rows[0], error: false });

    });

};

const getallbroker = (req, res) => {

    const getbrokerQuery = `
        SELECT * FROM broker 
    `;

    pool.query(getbrokerQuery, (err, result) => {
        if (err) {
            console.error('Error creating signal:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        return res.status(201).json({ msg: 'All brokers fetched', data: result.rows, error: false });

    });

};

const getbrokerbyID = (req, res) => {

    const brokerID = req.params.broker_id;

    const getbrokerQuery = `
        SELECT * FROM broker WHERE broker_id=$1
    `;

    pool.query(getbrokerQuery, [brokerID], (err, result) => {
        if (err) {
            console.error('Error fetching broker:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        if (result.rows == 0) {
            return res.status(500).json({ msg: 'Broker not found', error: true });
        }

        return res.status(201).json({ msg: 'Broker fetched', data: result.rows[0], error: false });

    });

};

const deletebroker = (req, res) => {

    const brokerID = req.params.broker_id;

    const query = `
        DELETE FROM broker
        WHERE broker_id = $1
    `;

    pool.query(query, [brokerID], (err, result) => {
        if (err) {
            console.error('Error deleting broker:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        if (result.rowCount === 0) {
            return res.status(404).json({ error: true, msg: 'Broker not found' });
        }

        return res.status(200).json({ msg: 'Broker deleted', error: false });
    });

};

const updateBroker = (req, res) => {
    const { broker_id, image, name, email, profit, loss } = req.body;

    const updateBrokerQuery = `
        UPDATE broker
        SET image = $1, name = $2, email = $3, profit = $4, loss = $5
        WHERE broker_id = $6
        RETURNING *
    `;

    const brokerValues = [image, name, email, profit, loss, broker_id];

    pool.query(updateBrokerQuery, brokerValues, (err, result) => {
        if (err) {
            console.error('Error updating broker:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        if (result.rowCount === 0) {
            return res.status(404).json({ msg: 'Broker not found', error: true });
        }

        return res.status(200).json({ msg: 'Broker updated successfully', data: result.rows[0], error: false });
    });
};

module.exports = { createbroker, getallbroker, getbrokerbyID, deletebroker, updateBroker };