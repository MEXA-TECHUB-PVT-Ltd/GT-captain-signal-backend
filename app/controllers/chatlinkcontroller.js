const pool = require("../config/dbconfig")

const createChatLink = async (req, res) => {
    const { link } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO chatlink (link) VALUES ($1) RETURNING *',
            [link]
        );

        res.status(200).json({ error: false, msg: "Chat link created successfully", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const getChatLink = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM chatlink'
        );

        res.status(200).json({ error: false, msg: "Chat link fetched successfully", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const getChatLinkByID = async (req, res) => {
    const linkID = req.params.id;
    try {
        const result = await pool.query(
            'SELECT * FROM chatlink WHERE id=$1',
            [linkID]
        );

        if (result.rows.length > 0) {
            res.status(200).json({ error: false, msg: "Chat link fetched successfully", data: result.rows[0] });
        } else {
            res.status(404).json({ error: true, msg: 'Chat link not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const deleteChatLink = async (req, res) => {
    const linkID = req.params.id;
    try {
        const result = await pool.query('DELETE FROM chatlink WHERE id = $1', [linkID]);

        if (result.rowCount > 0) {
            // Check if a row was deleted
            res.status(200).json({ error: false, msg: "Chat link deleted successfully" });
        } else {
            // If no rows were deleted, it means the link with the specified ID was not found
            res.status(404).json({ error: true, msg: 'Chat link not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const updateChatLink = async (req, res) => {
    const linkID = req.params.id;
    const { link } = req.body;

    try {
        const result = await pool.query(
            'UPDATE chatlink SET link = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [link, linkID]
        );

        if (result.rowCount > 0) {
            // Check if a row was updated
            res.status(200).json({ error: false, msg: "Chat link updated successfully", data: result.rows[0] });
        } else {
            // If no rows were updated, it means the link with the specified ID was not found
            res.status(404).json({ error: true, msg: 'Chat link not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};


module.exports = { createChatLink, getChatLink, getChatLinkByID, deleteChatLink, updateChatLink };