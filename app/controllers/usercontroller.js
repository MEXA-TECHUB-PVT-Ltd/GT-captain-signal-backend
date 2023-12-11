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

const emailverification = 'https://res.cloudinary.com/dxfdrtxi3/image/upload/v1702013412/emailverification_sfknfv.png;'
const imagePath = 'https://res.cloudinary.com/dxfdrtxi3/image/upload/v1702009226/gtsignalmain_ijtvdw.png';
const logo = "https://res.cloudinary.com/dxfdrtxi3/image/upload/v1702009135/logo_apxqiz.png";
const twitter = "https://res.cloudinary.com/dxfdrtxi3/image/upload/v1701865005/twitter_fnifjv.png"
const fb = "https://res.cloudinary.com/dxfdrtxi3/image/upload/v1701865043/fb_mnkz7w.png"
const insta = " https://res.cloudinary.com/dxfdrtxi3/image/upload/v1701865074/insta_lnp7x8.png"

function generateVerificationCode() {
    return Math.floor(1000 + Math.random() * 9000);
}

const usersignup = async (req, res) => {

    const { name, email, password, signup_type, token, device_id } = req.body;

    // Validate email format
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: true, msg: 'Invalid email format' });
    }

    try {
        // Check if the email already exists in the database
        const emailExists = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (emailExists.rows.length > 0) {
            const existingUser = emailExists.rows[0]; // Assuming only one user matches the email
            return res.status(400).json({ error: true, msg: 'Email already exists', user: existingUser });
        }

        // Validate password length
        if (signup_type === 'email' && password.length < 6) {
            return res.status(400).json({ error: true, msg: 'Password must be at least 6 characters long' });
        }

        // Generate random 4-digit code
        const verificationCode = generateVerificationCode();

        // Hash the password before storing it in the database (if signup_type is 'email')
        const hashedPassword = signup_type === 'email' ? await bcrypt.hash(password, 10) : null;

        const mailOptionsVerification = {
            from: 'mahreentassawar@gmail.com',
            to: email,
            subject: 'Verification Code for Signup',
            // text: `Your OTP for password reset is: ${otp}`,
            html: `
            <html>
            <head>
                <style>
                    /* Add your CSS styles for the email template here */
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        color: #333;
                        margin: 0;
                        padding: 0;
                    }
                    .header {
                        background-color: #E3B12F; /* Yellow background color */
                        padding: 10px;
                        text-align: center;
                        border-radius: 5px;
                    }
                    .logo-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        align-content:center;
                        margin-bottom: 10px;
                    }
                    .logo { 
                        display: inline-block;
                        margin: 0 5px; /* Adjust spacing between icons */
                        max-width: 100px;
                    }
                    .flirt-waves {
                        font-size: 24px;
                        color: black;
                        margin: 0; /* Remove default margins */
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #fff;
                        border-radius: 8px;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
                    .centered-image {
                        display: inline-block;
                        margin: 0 5px; /* Adjust spacing between icons */
                        max-width: 20px; /* Adjust size as needed */
                    }
                    .otp {
                        background-color: #E3B12F; /* Yellow background color */
                        padding: 5px;
                        width: 400vh;
                        font-size: 20px;
                        text-align: center;
                        margin-top: 40px;
                        margin-bottom: 20px;
                        letter-spacing: 5px;
                        border-radius: 50px;
                        color: white;
                    }
                    /* Add more styles as needed */
                </style>
            </head>
            <body>
            <img class="logo" src="${logo}" alt="Logo">
                </div>
                <div class="container">
                    <!-- Second Image -->
                    <img src="${emailverification}" alt="Embedded Image" style="width: 90px;">
                    <!-- Rest of your email content -->
                    <p style="color: #DC9A08; font-size:20px; font-weight:bold; margin: 15px 0;">
                    Verify your email address
                    </p>
                         
                    <p style="color: #606060; margin: 15px 0;">
                    You’ve entered ${email} as the email for your account. Please enter this code in the designated field on our platform. If you did not initiate this request, please disregard this email.
                    </p>

                    <strong class="otp">${verificationCode}</strong>       

                    <p style="color: #606060; margin: 10px 0;">
                    If you encounter any issues or have questions, feel free to contact our support team at [GTsignalsupport@email.com].
                    </p>

                    <div class="header"> 
                    <p style="color: black; text-align: center; font-weight:boldest; font-size:20px;">
                        Get In Touch!
                    </p>
                    <a href="https://www.facebook.com/link-to-facebook" target="_blank">
                        <img src="${fb}" alt="Facebook" class="centered-image">
                    </a>
                    <a href="https://www.instagram.com/link-to-instagram" target="_blank">
                        <img src="${insta}" alt="Instagram" class="centered-image">
                    </a>
                    <a href="https://www.twitter.com/link-to-twitter" target="_blank">
                        <img src="${twitter}" alt="Twitter" class="centered-image">  
                    </a>
            
                    <!-- Add a copyright symbol -->
                    <p style="color: black; text-align: center; font-weight:boldest; font-size:13px;">
                        &#169; 2023 GT-Signal. All right reserved
                    </p>
                </div>
            </body>
            </html>
        `,
        };

        await transporter.sendMail(mailOptionsVerification);

        // Store the verification code and hashed password (if applicable) in the database for the user
        const insertVerificationQuery = `
            INSERT INTO Users (name, email, password, signup_type, token, device_id, verificationCode)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        await pool.query(insertVerificationQuery, [name, email, hashedPassword, signup_type, token, device_id, verificationCode]);

        const userId = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);

        res.status(200).json({ error: false, msg: 'Verification code sent successfully', data: userId.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }

    // const { name, email, password, signup_type, token, device_id } = req.body;

    // // Validate email format
    // if (!isValidEmail(email)) {
    //     return res.status(400).json({ error: true, msg: 'Invalid email format' });
    // }

    // // Check if the email or device_id already exists in the database
    // try {
    //     const emailExists = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);

    //     if (emailExists.rows.length > 0) {
    //         const existingUser = emailExists.rows[0]; // Assuming only one user matches the email
    //         return res.status(400).json({ error: true, msg: 'Email already exists', user: existingUser });
    //     }

    //     // Initialize variables for password and token
    //     let hashedPassword = null;
    //     let tokenValue = null;

    //     // Check signup_type and handle password and token accordingly
    //     if (signup_type === 'email') {
    //         // Validate password length
    //         if (password.length < 6) {
    //             return res.status(400).json({ error: true, msg: 'Password must be at least 6 characters long' });
    //         }

    //         // Hash the password before storing it in the database
    //         hashedPassword = await bcrypt.hash(password, 10); // You can adjust the number of rounds for security
    //     } else if (signup_type === 'google' || signup_type === 'facebook') {
    //         // For Google or Facebook signups, set password to null and use the provided token
    //         hashedPassword = null;
    //         tokenValue = token; // Use the provided token for Google or Facebook signups
    //     }

    //     // Insert the user into the database
    //     const result = await pool.query(
    //         'INSERT INTO Users (name, email, password, signup_type, token, device_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    //         [name, email, hashedPassword, signup_type, tokenValue, device_id]
    //     );

    //     const mailOptions = {
    //         from: 'mahreentassawar@gmail.com',
    //         to: email,
    //         subject: 'Registration Successfull',
    //         // text: `Your OTP for password reset is: ${otp}`,
    //         html: `
    //         <html>
    //         <head>
    //             <style>
    //                 /* Add your CSS styles for the email template here */
    //                 body {
    //                     font-family: Arial, sans-serif;
    //                     background-color: #f4f4f4;
    //                     color: #333;
    //                     margin: 0;
    //                     padding: 0;
    //                 }
    //                 .header {
    //                     background-color: #E3B12F; /* Yellow background color */
    //                     padding: 10px;
    //                     text-align: center;
    //                     border-radius: 5px;
    //                 }
    //                 .logo-container {
    //                     display: flex;
    //                     justify-content: center;
    //                     align-items: center;
    //                     align-content:center;
    //                     margin-bottom: 10px;
    //                 }
    //                 .logo {
    //                     margin-top:-40vh;
    //                     display: inline-block;
    //                     margin: 0 5px; /* Adjust spacing between icons */
    //                     max-width: 100px; /* Adjust size as needed */
    //                 }
    //                 .flirt-waves {
    //                     font-size: 24px;
    //                     color: black;
    //                     margin: 0; /* Remove default margins */
    //                 }
    //                 .container {
    //                     max-width: 700px;
    //                     margin: 0 auto;
    //                     padding: 20px;
    //                     background-color: #fff;
    //                     border-radius: 8px;
    //                     box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    //                     text-align: center;
    //                 }
    //                 .centered-image {
    //                     display: inline-block;
    //                     margin: 0 5px; /* Adjust spacing between icons */
    //                     max-width: 20px; /* Adjust size as needed */
    //                 }
    //                 .otp {
    //                     background-color: #FFEEB6; /* Yellow background color */
    //                     padding: 10px;
    //                     width: 300px;
    //                     font-size: 24px;
    //                     text-align: center;
    //                     margin-top: 40px;
    //                     margin-bottom: 20px;
    //                     letter-spacing: 5px;
    //                     border-radius: 50px;
    //                     color: #F5BF03;
    //                 }
    //                 /* Add more styles as needed */
    //             </style>
    //         </head>
    //         <body>

    //             <div class="container">

    //             <img class="logo" src="${logo}" alt="Logo"> 

    //                 <!-- Second Image -->
    //                 <img src="${imagePath}" alt="Embedded Image" style="width: 100%;margin-top:20px; height:100px">
    //                 <!-- Rest of your email content -->
    //                 <p style="color: black; text-align: left; font-weight:600px; margin: 15px 0;">Hey,</p>
    //                 <p style="color: #606060; text-align: left; margin: 15px 0;">
    //                 Welcome to GT-Signals – the ultimate platform for seamless and intelligent trading. We're thrilled to have you on board, and we can't wait for you to experience the power of smart investing right at your fingertips.</p>

    //                 <p style="color: #606060; text-align: left; margin: 15px 0;">
    //                 To get started, simply log in to your account using the credentials you provided during registration. If you have any questions or need assistance, feel free to reach out to our support team at  <span style="color: #E3B12F;" >GT-Signal@email.com</span>
    //                 </p>

    //                 <p style="color: #606060; text-align: left; margin: 15px 0;">
    //                 Thank you for choosing GT-Signals. We're excited to be part of your trading journey, and we look forward to helping you achieve your financial goals.
    //                 Happy trading!
    //                 </p>

    //                 <div class="header"> 
    //                 <p style="color: black; text-align: center; font-weight:boldest; font-size:20px;">
    //                     Get In Touch!
    //                 </p>
    //                 <a href="https://www.facebook.com/link-to-facebook" target="_blank">
    //                     <img src="${fb}" alt="Facebook" class="centered-image">
    //                 </a>
    //                 <a href="https://www.instagram.com/link-to-instagram" target="_blank">
    //                     <img src="${insta}" alt="Instagram" class="centered-image">
    //                 </a>
    //                 <a href="https://www.twitter.com/link-to-twitter" target="_blank">
    //                     <img src="${twitter}" alt="Twitter" class="centered-image">  
    //                 </a>

    //                 <!-- Add a copyright symbol -->
    //                 <p style="color: black; text-align: center; font-weight:boldest; font-size:13px;">
    //                     &#169; 2023 GT-Signal. All right reserved
    //                 </p>
    //             </div>

    //             </div>
    //         </body>
    //         </html>
    //     `,
    //     };

    //     await transporter.sendMail(mailOptions);

    //     const userId = result.rows[0];
    //     res.status(201).json({ error: false, msg: 'User signed up successfully', data: userId });
    // } catch (error) {
    //     console.error(error);
    //     res.status(500).json({ error: true, msg: 'Internal server error' });
    // }
};

const verifySignup = async (req, res) => {
    const { email, verificationCode } = req.body;

    try {
        // Retrieve the stored verification code and user information associated with the email from the Users table
        const query = 'SELECT * FROM Users WHERE email = $1';
        const { rows } = await pool.query(query, [email]);

        // Check if the email exists in the database
        if (rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Email not found' });
        }

        const storedVerificationCode = rows[0].verificationcode; // Ensure column name matches your schema

        // Compare the entered code with the stored code
        if (verificationCode !== storedVerificationCode) {
            return res.status(400).json({ error: true, msg: 'Incorrect verification code' });
        }

        // Update verification status to indicate it's completed
        const updateQuery = 'UPDATE Users SET verificationCode = null WHERE email = $1';
        await pool.query(updateQuery, [email]);

        const mailOptions = {
            from: 'mahreentassawar@gmail.com',
            to: email,
            subject: 'Registration Successfull',
            // text: `Your OTP for password reset is: ${otp}`,
            html: `
            <html>
            <head>
                <style>
                    /* Add your CSS styles for the email template here */
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        color: #333;
                        margin: 0;
                        padding: 0;
                    }
                    .header {
                        background-color: #E3B12F; /* Yellow background color */
                        padding: 10px;
                        text-align: center;
                        border-radius: 5px;
                    }
                    .logo-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        align-content:center;
                        margin-bottom: 10px;
                    }
                    .logo {
                        margin-top:-40vh;
                        display: inline-block;
                        margin: 0 5px; /* Adjust spacing between icons */
                        max-width: 100px; /* Adjust size as needed */
                    }
                    .flirt-waves {
                        font-size: 24px;
                        color: black;
                        margin: 0; /* Remove default margins */
                    }
                    .container {
                        max-width: 700px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #fff;
                        border-radius: 8px;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
                    .centered-image {
                        display: inline-block;
                        margin: 0 5px; /* Adjust spacing between icons */
                        max-width: 20px; /* Adjust size as needed */
                    }
                    .otp {
                        background-color: #FFEEB6; /* Yellow background color */
                        padding: 10px;
                        width: 300px;
                        font-size: 24px;
                        text-align: center;
                        margin-top: 40px;
                        margin-bottom: 20px;
                        letter-spacing: 5px;
                        border-radius: 50px;
                        color: #F5BF03;
                    }
                    /* Add more styles as needed */
                </style>
            </head>
            <body>

                <div class="container">

                <img class="logo" src="${logo}" alt="Logo"> 

                    <!-- Second Image -->
                    <img src="${imagePath}" alt="Embedded Image" style="width: 100%;margin-top:20px; height:100px">
                    <!-- Rest of your email content -->
                    <p style="color: black; text-align: left; font-weight:600px; margin: 15px 0;">Hey,</p>
                    <p style="color: #606060; text-align: left; margin: 15px 0;">
                    Welcome to GT-Signals – the ultimate platform for seamless and intelligent trading. We're thrilled to have you on board, and we can't wait for you to experience the power of smart investing right at your fingertips.</p>

                    <p style="color: #606060; text-align: left; margin: 15px 0;">
                    To get started, simply log in to your account using the credentials you provided during registration. If you have any questions or need assistance, feel free to reach out to our support team at  <span style="color: #E3B12F;" >GT-Signal@email.com</span>
                    </p>

                    <p style="color: #606060; text-align: left; margin: 15px 0;">
                    Thank you for choosing GT-Signals. We're excited to be part of your trading journey, and we look forward to helping you achieve your financial goals.
                    Happy trading!
                    </p>

                    <div class="header"> 
                    <p style="color: black; text-align: center; font-weight:boldest; font-size:20px;">
                        Get In Touch!
                    </p>
                    <a href="https://www.facebook.com/link-to-facebook" target="_blank">
                        <img src="${fb}" alt="Facebook" class="centered-image">
                    </a>
                    <a href="https://www.instagram.com/link-to-instagram" target="_blank">
                        <img src="${insta}" alt="Instagram" class="centered-image">
                    </a>
                    <a href="https://www.twitter.com/link-to-twitter" target="_blank">
                        <img src="${twitter}" alt="Twitter" class="centered-image">  
                    </a>

                    <!-- Add a copyright symbol -->
                    <p style="color: black; text-align: center; font-weight:boldest; font-size:13px;">
                        &#169; 2023 GT-Signal. All right reserved
                    </p>
                </div>

                </div>
            </body>
            </html>
        `,
        };

        await transporter.sendMail(mailOptions);

        // Respond to the user indicating successful verification and include the user record
        const userRecord = rows[0]; // Contains the user information
        res.status(200).json({ error: false, msg: 'Email verified successfully', user: userRecord });
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

    const { limit, page } = req.query;
    let query = `
        SELECT *
        FROM Users
        WHERE deleted_status = false AND deleted_at IS NULL
        ORDER BY created_at DESC
    `;

    if (limit && page) {
        const offset = (page - 1) * limit;
        query += ` LIMIT ${limit} OFFSET ${offset}`;
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
        // const mailOptions = {
        //     from: 'mahreentassawar@gmail.com',
        //     to: email,
        //     subject: 'Password Reset OTP',
        //     text: `Your OTP for password reset is: ${otp}`,
        // };

        const mailOptions = {
            from: 'mahreentassawar@gmail.com',
            to: email,
            subject: 'Password Reset OTP',
            // text: `Your OTP for password reset is: ${otp}`,
            html: `
            <html>
            <head>
                <style>
                    /* Add your CSS styles for the email template here */
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        color: #333;
                        margin: 0;
                        padding: 0;
                    }
                    .header {
                        background-color: #E3B12F; /* Yellow background color */
                        padding: 10px;
                        text-align: center;
                        border-radius: 5px;
                    }
                    .logo-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        align-content:center;
                        margin-bottom: 10px;
                    }
                    .logo { 
                        display: inline-block;
                        margin: 0 5px; /* Adjust spacing between icons */
                        max-width: 100px;
                    }
                    .flirt-waves {
                        font-size: 24px;
                        color: black;
                        margin: 0; /* Remove default margins */
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #fff;
                        border-radius: 8px;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
                    .centered-image {
                        display: inline-block;
                        margin: 0 5px; /* Adjust spacing between icons */
                        max-width: 20px; /* Adjust size as needed */
                    }
                    .otp {
                        background-color: #E3B12F; /* Yellow background color */
                        padding: 5px;
                        width: 400vh;
                        font-size: 20px;
                        text-align: center;
                        margin-top: 40px;
                        margin-bottom: 20px;
                        letter-spacing: 5px;
                        border-radius: 50px;
                        color: white;
                    }
                    /* Add more styles as needed */
                </style>
            </head>
            <body>
            <img class="logo" src="${logo}" alt="Logo">
                </div>
                <div class="container">
                    <!-- Second Image -->
                    <img src="${emailverification}" alt="Embedded Image" style="width: 90px;">
                    <!-- Rest of your email content -->
                    <p style="color: #DC9A08; font-size:20px; font-weight:bold; margin: 15px 0;">
                    Verify your email address
                    </p>
                         
                    <p style="color: #606060; margin: 15px 0;">
                    You’ve entered ${email} as the email for your account. Please enter this code in the designated field on our platform. If you did not initiate this request, please disregard this email.
                    </p>

                    <strong class="otp">${otp}</strong>       

                    <p style="color: #606060; margin: 10px 0;">
                    If you encounter any issues or have questions, feel free to contact our support team at [GTsignalsupport@email.com].
                    </p>

                    <div class="header"> 
                    <p style="color: black; text-align: center; font-weight:boldest; font-size:20px;">
                        Get In Touch!
                    </p>
                    <a href="https://www.facebook.com/link-to-facebook" target="_blank">
                        <img src="${fb}" alt="Facebook" class="centered-image">
                    </a>
                    <a href="https://www.instagram.com/link-to-instagram" target="_blank">
                        <img src="${insta}" alt="Instagram" class="centered-image">
                    </a>
                    <a href="https://www.twitter.com/link-to-twitter" target="_blank">
                        <img src="${twitter}" alt="Twitter" class="centered-image">  
                    </a>
            
                    <!-- Add a copyright symbol -->
                    <p style="color: black; text-align: center; font-weight:boldest; font-size:13px;">
                        &#169; 2023 GT-Signal. All right reserved
                    </p>
                </div>
            </body>
            </html>
        `,
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
            WHERE deleted_status = true AND deleted_at IS NOT NULL
            ORDER BY created_at DESC
        `;

        const fetchResult = await pool.query(fetchQuery);

        const deletedUsers = fetchResult.rows;

        // Calculate the date 90 days ago from the current date
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

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
            // Calculate days left for each user until 90 days complete
            const currentDate = new Date();
            const usersWithDaysLeft = deletedUsers.map(user => {
                const deletedDate = new Date(user.deleted_at);
                const timeDifference = currentDate.getTime() - deletedDate.getTime(); // Difference in milliseconds
                const daysPassed = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)); // Convert milliseconds to days

                let daysLeft = 90 - daysPassed;
                daysLeft = daysLeft > 0 ? daysLeft : 0; // Ensuring non-negative days left
                return {
                    ...user,
                    daysLeft: daysLeft
                };
            });

            return res.status(200).json({
                msg: "Deleted users fetched with days left until 90 days complete",
                error: false,
                count: usersWithDaysLeft.length,
                data: usersWithDaysLeft
            });
        }
    } catch (error) {
        console.error('Error fetching and deleting users:', error);
        res.status(500).json({ msg: 'Internal server error', error: true });
    }

}

const deleteuserpermanently = async (req, res) => {
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

const updateuserstatus = async (req, res) => {

    const { userId } = req.params;
    const { block_status } = req.body;

    console.log('Received user ID:', userId);
    console.log('Received block status:', block_status);

    try {
        const updateUserQuery = 'UPDATE Users SET block_status = $1 WHERE id = $2 RETURNING *';
        const values = [block_status, userId];
        const result = await pool.query(updateUserQuery, values);

        console.log('Result from query:', result);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        res.status(200).json({ error: false, msg: 'Block status updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Error updating block status:', error);
        res.status(500).json({ msg: 'Error updating block status', error: false });
    }
}

const updateVipStatus = async (req, res) => {
    const { userId } = req.params;
    const { vip_status } = req.body; // Assuming the body contains a field named vip_status

    console.log('Received user ID:', userId);
    console.log('Received VIP status:', vip_status);

    try {
        const updateUserQuery = 'UPDATE Users SET vip_status = $1 WHERE id = $2 RETURNING *';
        const values = [vip_status, userId];
        const result = await pool.query(updateUserQuery, values);

        console.log('Result from query:', result);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        res.status(200).json({ error: false, msg: 'VIP status updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Error updating VIP status:', error);
        res.status(500).json({ msg: 'Error updating VIP status', error: true });
    }
};

module.exports = { usersignup, verifySignup, usersignin, getallusers, getalluserbyID, updateuserprofile, forgetpassword, resetpassword, updatePassword, deleteuser, getalldeletedusers, deleteuserpermanently, updateuserstatus, updateVipStatus };