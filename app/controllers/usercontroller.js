const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require("../config/dbconfig")
const nodemailer = require('nodemailer');

function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
}

const allowedSignupTypes = ["email", "google", "facebook"];

const usersignup = async (req, res) => {
    const { name, email, password, signup_type, token, device_id } = req.body;

    // Validate email format
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: true, msg: 'Invalid email format' });
    }

    // Check if the email or device_id already exists in the database
    try {
        const emailExists = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);

        if (emailExists.rows.length > 0) {
            return res.status(400).json({ error: true, msg: 'Email already exists' });
        }

        // Initialize variables for password and token
        let hashedPassword = null;
        let tokenValue = null;

        // Check signup_type and handle password and token accordingly
        if (signup_type === 'email') {
            // Validate password length
            if (password.length < 6) {
                return res.status(400).json({ error: true, msg: 'Password must be at least 6 characters long' });
            }

            // Hash the password before storing it in the database
            hashedPassword = await bcrypt.hash(password, 10); // You can adjust the number of rounds for security
        } else if (signup_type === 'google' || signup_type === 'facebook') {
            // For Google or Facebook signups, set password to null and use the provided token
            hashedPassword = null;
            tokenValue = token; // Use the provided token for Google or Facebook signups
        }

        // Insert the user into the database
        const result = await pool.query(
            'INSERT INTO Users (name, email, password, signup_type, token, device_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, email, hashedPassword, signup_type, tokenValue, device_id]
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

        const userData = user.rows[0]; // User data retrieved from the database

        if (userData.signup_type === 'email') {
            // User signed up using email, require both email and password for login
            if (!password || typeof password !== 'string') {
                return res.status(400).json({ error: true, msg: 'Password is required for email login' });
            }

            const hashedPassword = userData.password;

            // Check if the provided password matches the hashed password in the database
            const isPasswordValid = await bcrypt.compare(password, hashedPassword);

            if (!isPasswordValid) {
                return res.status(401).json({ error: true, msg: 'Invalid password' });
            }
        } else if (userData.signup_type === 'google' || userData.signup_type === 'facebook') {
            // User signed up using Google or Facebook, only email is required
            if (password && typeof password === 'string') {
                return res.status(400).json({ error: true, msg: 'Password is not required for google and facebook login' });
            }
        }

        res.status(200).json({ error: false, msg: 'Login successful', data: userData });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const getallusers = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Calculate the OFFSET based on the page and limit
    const offset = (page - 1) * limit;

    let query = `
        SELECT *
        FROM Users
        WHERE deleted_status = false AND deleted_at IS NULL
    `;

    // Check if pagination parameters are provided
    if (page && limit) {
        query += `
            OFFSET ${offset}
            LIMIT ${limit}
        `;
    }

    pool.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        const users = result.rows;
        return res.status(200).json({
            msg: "Users fetched successfully",
            error: false,
            count: users.length,
            data: users
        });
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
    const { name, image } = req.body;
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
};


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

        res.status(200).json({ error: false, msg: 'OTP sent successfully', userID: userQueryResult.rows[0], otp: otp });
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

const resetpassword = async (req, res) => {
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

const updatePassword = async (req, res) => {
    const { userId, email, password } = req.body;

    // Validate the new password
    if (password.length < 6) {
        return res.status(400).json({ error: true, msg: 'Password must be at least 6 characters long' });
    }

    try {
        // Check if the user exists in the database
        const userQueryResult = await pool.query('SELECT * FROM Users WHERE id = $1 AND email = $2', [userId, email]);

        if (userQueryResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User with this ID and email not found' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password in the database
        const result = await pool.query('UPDATE Users SET password = $1 WHERE id = $2 AND email = $3 RETURNING *', [hashedPassword, userId, email]);

        res.status(200).json({ error: false, msg: 'Password updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
}

const deleteuser = async (req, res) => {
    const userId = req.params.id;

    try {
        // Check if the user with the provided ID exists
        const userExists = await pool.query('SELECT * FROM Users WHERE id = $1', [userId]);

        if (userExists.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        // Update the user's deleted_status to true and set deleted_at timestamp
        const result = await pool.query(
            'UPDATE Users SET deleted_status = true, deleted_at = NOW() WHERE id = $1 RETURNING *',
            [userId]
        );

        const deletedUser = result.rows[0];
        res.status(200).json({ error: false, msg: 'User deleted successfully', data: deletedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
}

const getalldeletedusers = async (req, res) => {

    try {
        // Fetch users with deleted_status=true and deleted_at not null
        const fetchQuery = `
            SELECT *
            FROM Users
            WHERE deleted_status = true AND deleted_at IS NOT NULL;
        `;

        const fetchResult = await pool.query(fetchQuery);

        const deletedUsers = fetchResult.rows;

        // Calculate the date 90 days ago from the current date
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // Convert the date to a PostgreSQL timestamp format
        const formattedDate = ninetyDaysAgo.toISOString().slice(0, 19).replace("T", " ");

        // Check if any users need to be permanently deleted
        const usersToDelete = deletedUsers.filter(user => new Date(user.deleted_at) < ninetyDaysAgo);

        if (usersToDelete.length > 0) {
            // Delete users permanently
            const deleteQuery = `
                DELETE FROM Users
                WHERE id IN (${usersToDelete.map(user => user.id).join(', ')})
                RETURNING *;
            `;

            const deleteResult = await pool.query(deleteQuery);
            const permanentlyDeletedUsers = deleteResult.rows;

            return res.status(200).json({
                // permanent delete
                msg: "Deleted users fetched",
                error: false,
                count: permanentlyDeletedUsers.length,
                data: permanentlyDeletedUsers
            });
        } else {
            return res.status(200).json({
                msg: "Deleted users fetched",
                error: false,
                count: deletedUsers.length,
                data: deletedUsers
            });
        }
    } catch (error) {
        console.error('Error fetching and deleting users:', error);
        res.status(500).json({ msg: 'Internal server error', error: true });
    }

}

const deleteuserpermanently= async (req, res) => {
    try {
        // Extract user ID from the request or any other parameter that identifies the user
        const userId = req.params.id; // Change this based on your route

        // Query to delete the user and all associated records
        const query = `
            DELETE FROM Users
            WHERE id = $1
            RETURNING *;
        `;

        const result = await pool.query(query, [userId]);

        const deletedUser = result.rows[0]; // Assuming only one user is deleted
        if (!deletedUser) {
            return res.status(404).json({
                msg: "User not found",
                error: true,
                data: null
            });
        } 

        return res.status(200).json({
            msg: "User deleted successfully",
            error: false,
            data: deletedUser
        });
    } catch (error) {
        console.error('Error deleting user and associated records:', error);
        res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

module.exports = { usersignup, usersignin, getallusers, getalluserbyID, updateuserprofile, forgetpassword, resetpassword,updatePassword, deleteuser, getalldeletedusers,deleteuserpermanently };