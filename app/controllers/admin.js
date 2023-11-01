const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require("../config/dbconfig")

const adminsignup = (req, res) => {

    const { name, email, password } = req.body;

    // Check if the email already exists in the database
    pool.query('SELECT email FROM Admin WHERE email = $1', [email], (err, result) => {
        if (err) {
            console.error('Error checking email:', err);
            console.error('Error during registration:', insertErr);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.rows.length > 0) {
            // Email already exists
            return res.status(400).json({ error: 'Email already registered' });
        } else {
            // Email doesn't exist, proceed with registration
            bcrypt.hash(password, 10, (hashErr, hash) => {
                if (hashErr) {
                    console.error('Error hashing password:', hashErr);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                const insertQuery = 'INSERT INTO Admin (name, email, password) VALUES ($1, $2, $3) RETURNING *';
                const values = [name, email, hash];

                pool.query(insertQuery, values, (insertErr, result) => {
                    if (insertErr) {
                        console.error('Error during registration:', insertErr);
                        return res.status(500).json({ error: 'Internal server error' });
                    }

                    const data = result.rows[0];
                    return res.status(201).json({ message: 'Registration successful', data: data });
                });
            });
        }
    });

};

const login = (req, res) => {
    const { email, password } = req.body;

    // Check if the email exists in the database
    pool.query('SELECT * FROM Admin WHERE email = $1', [email], (err, result) => {
        if (err) {
            console.error('Error checking email:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.rows.length === 0) {
            // Email doesn't exist
            return res.status(400).json({ error: 'Email not registered' });
        }

        // Email exists, check the password
        const user = result.rows[0];
        bcrypt.compare(password, user.password, (hashErr, passwordMatch) => {
            if (hashErr) {
                console.error('Error comparing passwords:', hashErr);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (passwordMatch) {
                // Password matches, generate a JWT token
                const secretKey = crypto.randomBytes(32).toString('hex');
                const token = jwt.sign({ userId: user.id, email: user.email }, secretKey, { expiresIn: '1h' });

                // Include the token in the response
                return res.status(200).json({ message: 'Login successful', jwt_token: token, data: user });
            } else {
                // Password doesn't match
                return res.status(400).json({ error: 'Incorrect password' });
            }
        });
    });
};

module.exports = { adminsignup, login };