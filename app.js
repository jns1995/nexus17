const express = require('express');
const methodOverride = require('method-override');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql');
const adminRoutes = require('./routes/admin');
require('dotenv').config(); // For environment variables
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');  // Import SendGrid

const app = express();
const PORT = process.env.PORT || 3000;

// MySQL connection setup
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nexus17'
});

const sendEmail = async (to, subject, text) => {
    const msg = {
        to, // Recipient's email
        from: 'johnniebre1995', // Your verified sender email in SendGrid
        subject: subject,
        text: text
    };

    try {
        await sgMail.send(msg);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email: ', error);
        if (error.response) {
            console.error(error.response.body);
        }
    }
};

// Connect to the database
db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to the database');
    }
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

app.use((req, res, next) => {
    if (req.session.userId) {
        db.query('SELECT * FROM employees WHERE id = ?', [req.session.userId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return next();
            }
            if (results.length > 0) {
                res.locals.employeeData = results[0]; // Store the employee data
            } else {
                res.locals.employeeData = null; // No user found
            }
            next();
        });
    } else {
        res.locals.employeeData = null; // No user logged in
        next();
    }
});

app.use((req, res, next) => {
    if (req.session.role) {
        let query;
        let params = [];
        let totalPendingCount = 0; // Initialize total pending count to 0

        if (req.session.role === 'HR') {
            // Query to count "Pending" statuses for HR (changestatus table)
            query = 'SELECT COUNT(*) AS pendingCount FROM changestatus WHERE status = ?';
            params = ['Pending'];

            // Perform query for changestatus first
            db.query(query, params, (err, changestatusResults) => {
                if (err) {
                    console.error('Error fetching changestatus pending count:', err);
                    return next();
                }

                // Add the result to the total pending count
                totalPendingCount += changestatusResults[0].pendingCount || 0;

                // Query to count "Pending" statuses for HR (users table)
                query = 'SELECT COUNT(*) AS pendingCount FROM users WHERE status = ?';
                params = ['Pending'];

                // Now perform the query for the users table
                db.query(query, params, (err, usersResults) => {
                    if (err) {
                        console.error('Error fetching users pending count:', err);
                        return next();
                    }

                    // Add the result from users table to the total pending count
                    totalPendingCount += usersResults[0].pendingCount || 0;

                    // Attach the total pending count to res.locals, so it's available in all views
                    res.locals.pendingCount = totalPendingCount;
                    next();
                });
            });
        } else if (req.session.role === 'Admin') {
            // Query to count "Pending" statuses for Admin (idprint table)
            query = 'SELECT COUNT(*) AS pendingCount FROM idprint WHERE status = ?';
            params = ['Pending'];

            // Execute the query for Admin
            db.query(query, params, (err, results) => {
                if (err) {
                    console.error('Error fetching idprint pending count:', err);
                    return next();
                }

                // Attach the pending count to res.locals for Admin
                res.locals.pendingCount = results[0].pendingCount || 0;
                next();
            });
        } else {
            res.locals.pendingCount = 0; // Default to 0 if role is not HR or Admin
            next();
        }
    } else {
        res.locals.pendingCount = 0; // Default to 0 if no session or role
        next();
    }
});


// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Redirect root to login
app.get('/', (req, res) => {
    res.redirect('/admin/welcome');
});

// Login route
app.get('/admin/welcome', (req, res) => {
    res.render('welcome');
});
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM employees WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal server error');
        }

        if (results.length === 0) {
            // If no user found
            return res.render('welcome', { error: 'Invalid username or password!' });
        }

        const user = results[0];

        // Check if the account is active
        if (!user.active) {
            return res.render('welcome', { error: 'Your account has been temporarily suspended. Once the contract is renewed, your account and Digital ID will be reactivated. Thank you for your understanding.' });
        }

        // If the password doesn't match
        if (password !== user.password) {
            return res.render('welcome', { error: 'Invalid username or password!' });
        }

        // Set user session
        req.session.userId = user.id;
        req.session.role = user.role;

        // Redirect based on user role
        switch (user.role) {
            case 'Admin':
            case 'HR':
                return res.redirect('/admin/das');
            default:
                return res.redirect('/admin/dig');
        }
    });
});



// Registration route
app.get('/admin/createAccount', (req, res) => {
    res.render('register');
});

// Handle registration POST request
app.post('/admin/createAccount', (req, res) => {
    const {
        firstName,
        middleName,
        lastName,
        extName,
        gender,
        email,
        phone,
        position,
        type,
        office,
        birthday,
        username // Include username here
    } = req.body;

    const status = 'Pending'; // Default status

    // Step 1: Check if the username already exists in either the 'users' or 'employees' table
    const checkUsernameQuery = `
        SELECT username FROM users WHERE username = ? 
        UNION 
        SELECT username FROM employees WHERE username = ?
    `;

    db.query(checkUsernameQuery, [username, username], (err, results) => {
        if (err) {
            console.error('Error checking username:', err);
            return res.status(500).json({ message: 'Error checking username' });
        }

        // Step 2: If username exists in either table, return an error message and stop the process
        if (results.length > 0) {
            console.log('Username is already taken.');
            return res.render('registerX', {
                error: 'Username is already taken!',
                users: req.body // Send the form data back to keep the input values
            });
        }

        // Step 3: Format the birthday to ensure it's in the correct format (YYYY-MM-DD)
        let formattedBirthday = birthday;
        if (formattedBirthday) {
            // If the birthday is in a different format, we can convert it here
            formattedBirthday = new Date(formattedBirthday).toISOString().split('T')[0]; // Format as YYYY-MM-DD
        }

        // Step 4: If username is not taken, proceed with inserting the new user into the 'users' table
        const insertQuery = `
            INSERT INTO users 
            (firstName, middleName, lastName, extName, gender, email, phone, position, type, office, birthday, status, username) 
            VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(insertQuery, [
            firstName, 
            middleName || null, 
            lastName, 
            extName || null, 
            gender, 
            email, 
            phone, 
            position, 
            type, 
            office, 
            formattedBirthday, // Use the formatted birthday here
            status, 
            username // Ensure that the username is included here
        ], (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).json({ message: 'Error saving user' });
            }

            // Step 5: Redirect to the success page if the user is successfully created
            console.log('User created successfully.');
            res.redirect('/admin/success');
        });
    });
});




// Add a route to render the success page
app.get('/admin/success', (req, res) => {
    res.render('success'); // Render success.ejs
});

app.get('/success', (req, res) => {
    res.render('success'); // This assumes you have a 'success.ejs' file
  });
  

app.get('/admin/files', (req, res) => {
    db.query('SELECT * FROM files ORDER BY uploaded_at DESC', (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal server error');
        }
        
        // Pass the files data to the EJS template
        res.render('files', { files: results });
    });
});

app.get('/register', (req, res) => {
    res.render('register'); // Render register.ejs
});

app.get('/forgotForm', (req, res) => {
    res.render('forgotForm'); // Render register.ejs
});

// Use the admin routes
app.use('/admin', adminRoutes);

// Add this route to handle the /dig path

const transporter = nodemailer.createTransport({
    service: 'gmail', // Using Gmail as the email service
    auth: {
        user: 'johnferrysantiago@gmail.com', // Your email address
        pass: '&success08' // Your email password
    },
    tls: {
        rejectUnauthorized: false // Disable certificate validation (for development only)
    }
});

sgMail.setApiKey('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');

// Reactivate employee route
app.get('/admin/reactivate/:id', (req, res) => {
    const employeeId = req.params.id;

    // SQL query to update the employee's active status to true
    const query = 'UPDATE employees SET active = ? WHERE id = ?';

    db.query(query, [true, employeeId], (err, results) => {
        if (err) {
            console.error('Error reactivating employee:', err);
            return res.status(500).send('Internal server error');
        }

        if (results.affectedRows === 0) {
            return res.status(404).send('Employee not found');
        }

        db.query('SELECT email FROM employees WHERE id = ?', [employeeId], (err, userResults) => {
            if (err) {
                console.error('Error fetching employee email:', err);
                return res.status(500).send('Internal server error');
            }

            if (userResults.length === 0) {
                return res.status(404).send('Employee not found');
            }

            const employeeEmail = userResults[0].email;

            // Prepare the email content
            const msg = {
                to: employeeEmail,  // The employee's email address
                from: 'johnniebre1995@gmail.com',  // Your SendGrid verified sender email
                subject: 'Congratulations! Your account has been reactivated',
                text: `Dear employee,

                We are happy to inform you that your account has been reactivated. You can now access your account and continue using our services.

                Best regards,
                The Team`,
                html: `<p>Dear employee,</p>
                        <p>We are happy to inform you that your account has been reactivated. You can now access your account and continue using our services.</p>
                        <p>Best regards,</p>
                        <p>The Team</p>`
            };

            // Send the email using SendGrid
            sgMail
                .send(msg)
                .then(() => {
                    console.log('Email sent successfully');
                    res.redirect('/admin/emp');  // Redirect to success page after email is sent
                })
                .catch(error => {
                    console.error('Error sending email:', error);
                    res.status(500).send('Error sending email');
                });
        });
    });
});

app.get('/admin/deactivate/:id', (req, res) => {
    const employeeId = req.params.id;

    // SQL query to update the employee status to inactive (assuming active = 0 means inactive)
    const query = 'UPDATE employees SET active = ? WHERE id = ?';

    db.query(query, [false, employeeId], (err, results) => {
        if (err) {
            console.error('Error updating employee status:', err);
            return res.status(500).send('Internal server error');
        }

        if (results.affectedRows === 0) {
            return res.status(404).send('Employee not found');
        }

        // After successfully deactivating the account, send an email to the employee
        const getEmployeeEmailQuery = 'SELECT email FROM employees WHERE id = ?';
        db.query(getEmployeeEmailQuery, [employeeId], (err, results) => {
            if (err) {
                console.error('Error retrieving employee email:', err);
                return res.status(500).send('Internal server error');
            }

            if (results.length === 0) {
                return res.status(404).send('Employee not found');
            }

            const email = results[0].email; // Get the employee's email address

            // Send the email notification to the employee
            const msg = {
                to: email, // Employee's email
                from: 'johnniebre1995@gmail.com', // Your verified sender email (SendGrid)
                subject: 'Your Account Has Been Temporarily Suspended',
                html: `
                    <h2>Account Suspension Notice</h2>
                    <p>Your account has been temporarily suspended. Once the contract is renewed, your account and Digital ID will be reactivated.</p>
                    <p>Thank you for your understanding.</p>
                    <p><strong>Science City of Muñoz</strong></p>
                `
            };

            // Send the email using SendGrid
            sgMail
                .send(msg)
                .then(() => {
                    console.log('Deactivation email sent successfully');
                    // Redirect to a success page or back to employee management page
                    res.redirect('/admin/emp'); // Adjust to your desired route after deactivation
                })
                .catch(error => {
                    console.error('Error sending email:', error);
                    res.status(500).send('Error sending email notification');
                });
        });
    });
});
app.post('/forgotPass2', async (req, res) => {
    const email = req.body.email;
  
    try {
      // 1. Query to find the employee by email
      db.query('SELECT * FROM employees WHERE email = ?', [email], (err, results) => {
        if (err) {
          console.error('Error fetching employee:', err);
          return res.status(500).send('An error occurred while checking the email.');
        }
  
        // 2. If the employee does not exist
        if (results.length === 0) {
          return res.status(404).send('Employee not found!');
        }
  
        // 3. Update the password for the employee
        db.query('UPDATE employees SET password = ? WHERE email = ?', ['123456', email], (err, updateResult) => {
          if (err) {
            console.error('Error updating password:', err);
            return res.status(500).send('An error occurred while updating the password.');
          }
  
          // 4. Send the new password to the employee via email using SendGrid
          const msg = {
            to: email,
            from: 'johnniebre1995@gmail.com', // Replace with a verified SendGrid sender email
            subject: 'Your New Password',
            text: 'Your password has been reset. Your new password is: 123456',
            html: '<p>Your password has been reset. Your new password is: <strong>123456</strong></p>',
          };
  
          sgMail.send(msg)
            .then(() => {
              // 5. Redirect or respond with success
              res.redirect('/success'); // Redirect to success page after email is sent
            })
            .catch(err => {
              console.error('Error sending email:', err);
              res.status(500).send('An error occurred while sending the email.');
            });
        });
      });
    } catch (err) {
      console.error('Error during password reset process:', err);
      res.status(500).send('An error occurred. Please try again later.');
    }
  });
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
