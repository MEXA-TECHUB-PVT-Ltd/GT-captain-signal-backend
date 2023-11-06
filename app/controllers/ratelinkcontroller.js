const pool = require("../config/dbconfig")

const createratelink = async (req, res) => {

    const { link } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO ratelink (link) VALUES ($1) RETURNING *',
            [link]
        );

        res.status(200).json({ error: false, msg: "Link created successfully", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }

};

const getratelink = async (req, res) => {

    try {
        const result = await pool.query(
            'SELECT * FROM ratelink'
        );

        res.status(200).json({ error: false, msg: "Link fetched successfully", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }

};

const getratelinkbyID = async (req, res) => {
    const linkID = req.params.id;
    try {
        const result = await pool.query(
            'SELECT * FROM ratelink WHERE id=$1',
            [linkID]
        );

        if (result.rows.length > 0) {
            res.status(200).json({ error: false, msg: "Link fetched successfully", data: result.rows[0] });
        } else {
            res.status(404).json({ error: true, msg: 'Link not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const deleteratelink = async (req, res) => {
    const linkID = req.params.id;
    try {
        const result = await pool.query('DELETE FROM ratelink WHERE id = $1', [linkID]);

        if (result.rowCount > 0) {
            // Check if a row was deleted
            res.status(200).json({ error: false, msg: "Link deleted successfully" });
        } else {
            // If no rows were deleted, it means the link with the specified ID was not found
            res.status(404).json({ error: true, msg: 'Link not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const updateratelink = async (req, res) => {
    const linkID = req.params.id;
    const { link } = req.body;

    try {
        const result = await pool.query(
            'UPDATE ratelink SET link = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [link, linkID]
        );

        if (result.rowCount > 0) {
            // Check if a row was updated
            res.status(200).json({ error: false, msg: "Link updated successfully", data: result.rows[0] });
        } else {
            // If no rows were updated, it means the link with the specified ID was not found
            res.status(404).json({ error: true, msg: 'Link not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

module.exports = { createratelink, getratelink, getratelinkbyID, deleteratelink, updateratelink };