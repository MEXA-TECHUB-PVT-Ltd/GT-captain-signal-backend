const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require("../config/dbconfig")
const nodemailer = require('nodemailer');
// const cryptoRandomString = require('crypto-random-string');

function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
}

const allowedSignupTypes = ["email", "google", "facebook"];

const usersignup = async (req, res) => {
    const { name, email, password, confirm_password, signup_type } = req.body;

    // Validate email format
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: true, msg: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
        return res.status(400).json({ error: true, msg: 'Password must be at least 6 characters long' });
    }

    // Validate signup_type
    if (!allowedSignupTypes.includes(signup_type)) {
        return res.status(400).json({ error: true, msg: 'Invalid signup type' });
    }

    // Check if the email already exists in the database
    try {
        const emailExists = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);

        if (emailExists.rows.length > 0) {
            return res.status(400).json({ error: true, msg: 'Email already exists' });
        }

        // Hash the password before storing it in the database
        const hashedPassword = await bcrypt.hash(password, 10); // You can adjust the number of rounds for security

        // Insert the user into the database with the hashed password
        const result = await pool.query(
            'INSERT INTO Users (name, email, password, confirm_password, signup_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, email, hashedPassword, confirm_password, signup_type]
        );

        const userId = result.rows[0];
        res.status(201).json({ error: false, msg: 'User signed up successfully', data: userId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const usersignin = async (req, res) => {
    const { email, password } = req.body;

    // Validate email format
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: true, msg: 'Invalid email format' });
    }

    try {
        // Check if the user with the provided email exists
        const user = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            return res.status(401).json({ error: true, msg: 'User not found' });
        }

        // Check if the provided password matches the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: true, msg: 'Invalid password' });
        }

        // Create and sign a JWT token
        const rows = user.rows[0];

        const secretKey = crypto.randomBytes(32).toString('hex');
        const token = jwt.sign(rows, secretKey, { expiresIn: '1h' }); // Change the secret key and expiration time

        res.status(200).json({ error: false, msg: 'Login successful', data: rows, jwt_token: token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
}

const getallusers = async (req, res) => {

    const query = `
        SELECT *
        FROM Users
    `;

    pool.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching take profits:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        const users = result.rows;
        return res.status(200).json({ msg: "All users fetched", data: users, error: false });
    });

}

const getalluserbyID = async (req, res) => {
    const userID = req.params.id;

    const query = `
        SELECT *
        FROM Users WHERE id = $1
    `;

    pool.query(query, [userID], (err, result) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found', error: true });
        }

        const user = result.rows[0];
        return res.status(200).json({ msg: "User fetched", data: user, error: false });
    });
}

const updateuserprofile = async (req, res) => {
    const { name, email, image } = req.body;
    const userId = req.params.id; // Assuming you have a middleware to extract user info from JWT

    try {
        // Fetch the existing user data
        const userData = await pool.query('SELECT * FROM Users WHERE id = $1', [userId]);

        if (userData.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        const existingUser = userData.rows[0];

        // Determine which attributes need to be updated
        const updatedAttributes = {};

        if (name !== undefined) {
            updatedAttributes.name = name;
        }

        if (email !== undefined) {
            // Validate email format
            if (!isValidEmail(email)) {
                return res.status(400).json({ error: true, msg: 'Invalid email format' });
            }
            updatedAttributes.email = email;
        }

        if (image !== undefined) {
            updatedAttributes.image = image;
        }

        // Build the update query
        if (Object.keys(updatedAttributes).length > 0) {
            let updateQuery = 'UPDATE Users SET '; // Change const to let
            const updateValues = [];
            const updateColumns = [];

            for (const [key, value] of Object.entries(updatedAttributes)) {
                updateColumns.push(`${key} = $${updateValues.length + 1}`);
                updateValues.push(value);
            }

            updateQuery += updateColumns.join(', ') + ` WHERE id = $${updateValues.length + 1} RETURNING *`;
            updateValues.push(userId);

            // Execute the update query
            const result = await pool.query(updateQuery, updateValues);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: true, msg: 'User not found' });
            }

            // Return the updated user data
            res.status(200).json({ error: false, msg: 'Profile updated successfully', user: result.rows[0] });
        } else {
            // Nothing to update
            res.status(200).json({ error: false, msg: 'No changes made', user: existingUser });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }

}

const forgetpassword = async (req, res) => {

    const { email } = req.body;

    // Check if a user with the provided email exists in your database
    const userExistsQuery = 'SELECT * FROM Users WHERE email = $1';
    const userExistsValues = [email];

    try {
        const userQueryResult = await pool.query(userExistsQuery, userExistsValues);

        if (userQueryResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User with this email not found' });
        }

        // Generate a random 4-digit OTP composed of digits only
        const otp = getRandomDigits(4);

        // Create an email message with the OTP
        const mailOptions = {
            from: 'mahreentassawar@gmail.com',
            to: email,
            subject: 'Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ error: false, msg: 'OTP sent successfully', userID: userQueryResult.rows[0].id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Failed to send OTP' });
    }

}

function getRandomDigits(length) {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10); // Generate a random digit (0-9)
    }
    return otp;
}

const transporter = nodemailer.createTransport({
    service: 'mahreentassawar@gmail.com', // e.g., 'Gmail', 'Outlook', etc.
    auth: {
        user: 'mahreentassawar@gmail.com',
        pass: 'apilqktqmvdfdryc',
    },
});

const updatepassword = async (req, res) => {
    const { email, password } = req.body;

    // Validate the new password
    if (password.length < 6) {
        return res.status(400).json({ error: true, msg: 'Password must be at least 6 characters long' });
    }

    try {
        // Check if the email exists in the database
        const userQueryResult = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);

        if (userQueryResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User with this email not found' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password in the database
        const result = await pool.query('UPDATE Users SET password = $1 WHERE email = $2 RETURNING *', [hashedPassword, email]);

        res.status(200).json({ error: false, msg: 'Password updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
}

const deleteuser = async (req, res) => {
    const userId = req.params.id;

    try {
        const userExistsQuery = 'SELECT * FROM Users WHERE id = $1';
        const userExistsValues = [userId];

        const userQueryResult = await pool.query(userExistsQuery, userExistsValues);

        if (userQueryResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        // Delete the user from the database
        const deleteUserQuery = 'DELETE FROM Users WHERE id = $1';
        const deleteUserValues = [userId];

        await pool.query(deleteUserQuery, deleteUserValues);

        res.status(200).json({ error: false, msg: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
}

module.exports = { usersignup, usersignin, getallusers, getalluserbyID, updateuserprofile, forgetpassword, updatepassword, deleteuser };