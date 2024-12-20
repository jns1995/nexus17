const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
sgMail.setApiKey('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');
const fs = require('fs');
const mime = require('mime-types');


function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/admin/welcome'); // Redirect to login if not authenticated
}

router.get('/dig', isAuthenticated, async (req, res) => {
    const employeeId = req.session.userId; // Retrieve user ID from session
    const userRole = req.session.role; // Get the user role from the session

    db.query('SELECT * FROM employees WHERE id = ?', [employeeId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal server error');
        }

        if (results.length === 0) {
            return res.status(404).send('Employee not found');
        }

        const employee = results[0]; // Get the employee data

        // Create a string with the employee information for the QR code
        const employeeInfo = `This is a bonafide employee of LGU Science City of Mu؜ñoz\n` +
        `Name: ${employee.firstName} ${employee.middleName ? employee.middleName.charAt(0) + '.' : ''} ${employee.lastName}\n` +
         `Position: ${employee.position}\n` +
         `Office: ${employee.office}\n`;

        // Generate QR code
        QRCode.toDataURL(employeeInfo, (err, url) => {
            if (err) {
                console.error('Error generating QR code:', err);
                return res.status(500).send('Error generating QR code');
            }

            // Render the view with the QR code URL, employee data, and user role
            res.render('dig', { employee, qrCodeUrl: url, user: { role: userRole } });
        });
    });
});
router.get('/digStat', isAuthenticated, async (req, res) => {
    const employeeId = req.session.userId; // Retrieve user ID from session
    const userRole = req.session.role; // Get the user role from the session

    // First, fetch the employee information from the 'employees' table
    db.query('SELECT * FROM employees WHERE id = ?', [employeeId], (err, employeeResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal server error');
        }

        if (employeeResults.length === 0) {
            return res.status(404).send('Employee not found');
        }

        const employee = employeeResults[0]; // Get the employee data

        // Now, fetch matching data from the 'idprint' table based on the employee ID
        db.query('SELECT * FROM idprint WHERE userId = ?', [employeeId], (err, idPrintResults) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Internal server error');
            }

            // Fetch data from the 'changestatus' table based on the employee ID
            db.query('SELECT * FROM changestatus WHERE employee_id = ?', [employeeId], (err, changeStatusResults) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).send('Internal server error');
                }

                // Combine changeStatusData and idPrintData
                const combinedData = [...changeStatusResults, ...idPrintResults];

                // Sort the combined data by date in descending order (latest first)
                combinedData.sort((a, b) => {
                    const dateA = new Date(a.created_at || a.createAt); // Get the 'created_at' or 'createAt' date
                    const dateB = new Date(b.created_at || b.createAt);
                    return dateB - dateA; // Sort in descending order
                });

                // Prepare employee information string for QR code
                const employeeInfo = `Name: ${employee.firstName} ${employee.middleName ? employee.middleName.charAt(0) + '.' : ''} ${employee.lastName}\n` +
                                     `ID: ${employee.userId}\n` +
                                     `Position: ${employee.position}\n` +
                                     `Office: ${employee.office}\n` +
                                     `Contact: ${employee.phone}\n` +
                                     `Email: ${employee.email}`;

                // Generate QR code
                QRCode.toDataURL(employeeInfo, (err, url) => {
                    if (err) {
                        console.error('Error generating QR code:', err);
                        return res.status(500).send('Error generating QR code');
                    }

                    // Render the view with combined data, employee data, QR code URL, and user role
                    res.render('digStat', { 
                        employee, 
                        combinedData,  // Pass combined data to the view
                        qrCodeUrl: url, 
                        user: { role: userRole } 
                    });
                });
            });
        });
    });
});


router.get('/digSign', isAuthenticated, async (req, res) => {
    const employeeId = req.session.userId; // Retrieve user ID from session
    const userRole = req.session.role; // Get the user role from the session

    // First, fetch the employee information from the 'employees' table
    db.query('SELECT * FROM employees WHERE id = ?', [employeeId], (err, employeeResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal server error');
        }

        if (employeeResults.length === 0) {
            return res.status(404).send('Employee not found');
        }

        const employee = employeeResults[0]; // Get the employee data

        // Now, fetch matching data from the 'idprint' table based on the employee ID
        db.query('SELECT * FROM idprint WHERE userId = ?', [employeeId], (err, idPrintResults) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Internal server error');
            }

            // Fetch data from the 'changestatus' table based on the employee ID
            db.query('SELECT * FROM changestatus WHERE employee_id = ?', [employeeId], (err, changeStatusResults) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).send('Internal server error');
                }

                // Prepare employee information string for QR code
                const employeeInfo = `Name: ${employee.firstName} ${employee.middleName ? employee.middleName.charAt(0) + '.' : ''} ${employee.lastName}\n` +
                                     `ID: ${employee.userId}\n` +
                                     `Position: ${employee.position}\n` +
                                     `Office: ${employee.office}\n` +
                                     `Contact: ${employee.phone}\n` +
                                     `Email: ${employee.email}`;

                // Generate QR code
                QRCode.toDataURL(employeeInfo, (err, url) => {
                    if (err) {
                        console.error('Error generating QR code:', err);
                        return res.status(500).send('Error generating QR code');
                    }

                    // Render the view with employee data, idprint data, changestatus data, QR code URL, and user role
                    res.render('digSign', { 
                        employee, 
                        idPrintData: idPrintResults, // Pass the idprint data to the view
                        changeStatusData: changeStatusResults, // Pass changestatus data to the view
                        qrCodeUrl: url, 
                        user: { role: userRole } 
                    });
                });
            });
        });
    });
});


const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services too
    auth: {
        user: 'your-email@gmail.com', // Your email address
        pass: 'your-email-password' // Your email password or an app password
    }
});

// Function to send email
const sendPasswordResetEmail = (email, newPassword) => {
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Password Reset Notification',
        text: `Your password has been reset. Your new password is: ${newPassword}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};


// Set up MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus17'
});

// Connect to the database
db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to the database');
    }
});

// Route for the admin dashboard
router.get('/das', (req, res) => {
    // Query for offices
    db.query(`
        SELECT office, COUNT(*) AS total, 
               (COUNT(*) / (SELECT COUNT(*) FROM employees) * 100) AS percentage 
        FROM employees 
        GROUP BY office
    `, (err, officeResults) => {
        if (err) {
            console.error('Error fetching office summary:', err);
            return res.status(500).send('Error fetching office summary');
        }

        // Query for barangays
        db.query(`
            SELECT brgyName, COUNT(*) AS total, 
                   (COUNT(*) / (SELECT COUNT(*) FROM employees) * 100) AS percentage 
            FROM employees 
            GROUP BY brgyName
        `, (err, barangayResults) => {
            if (err) {
                console.error('Error fetching barangay summary:', err);
                return res.status(500).send('Error fetching barangay summary');
            }

            // Query for gender counts
            db.query(`
                SELECT gender, COUNT(*) AS total,
                       (COUNT(*) / (SELECT COUNT(*) FROM employees) * 100) AS percentage
                FROM employees
                WHERE gender IS NOT NULL
                GROUP BY gender
            `, (err, genderResults) => {
                if (err) {
                    console.error('Error fetching gender summary:', err);
                    return res.status(500).send('Error fetching gender summary');
                }

                // Query for age distribution
                db.query(`
                    SELECT 
                        SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) BETWEEN 18 AND 24 THEN 1 ELSE 0 END) AS age_18_24,
                        SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) BETWEEN 25 AND 34 THEN 1 ELSE 0 END) AS age_25_34,
                        SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) BETWEEN 35 AND 44 THEN 1 ELSE 0 END) AS age_35_44,
                        SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) BETWEEN 45 AND 54 THEN 1 ELSE 0 END) AS age_45_54,
                        SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) BETWEEN 55 AND 64 THEN 1 ELSE 0 END) AS age_55_64,
                        SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) >= 65 THEN 1 ELSE 0 END) AS age_65_plus
                    FROM employees;
                `, (err, ageResults) => {
                    if (err) {
                        console.error('Error fetching age distribution:', err);
                        return res.status(500).send('Error fetching age distribution');
                    }

                    // Query for total employees by type and issued counts
                    db.query(`
                        SELECT type, 
                               COUNT(*) AS total,
                               SUM(issuedCount) AS totalIssuedCount,
                               (SUM(issuedCount) / (SELECT SUM(issuedCount) FROM employees WHERE issuedCount IS NOT NULL) * 100) AS percentage
                        FROM employees
                        WHERE issuedCount IS NOT NULL
                        GROUP BY type;
                    `, (err, typeResults) => {
                        if (err) {
                            console.error('Error fetching employee type summary:', err);
                            return res.status(500).send('Error fetching employee type summary');
                        }

                        // Query for count of "Success" status per type in idprint table
                        db.query(`
                            SELECT type, COUNT(*) AS successCount
                            FROM idprint
                            WHERE status = 'Success'
                            GROUP BY type
                        `, (err, successResults) => {
                            if (err) {
                                console.error('Error fetching success counts by type:', err);
                                return res.status(500).send('Error fetching success counts by type');
                            }

                            // Calculate total successes
                            const totalSuccesses = successResults.reduce((sum, row) => sum + row.successCount, 0);

                            // Calculate success percentage for each type
                            const successByType = successResults.reduce((acc, curr) => {
                                const successPercentage = totalSuccesses > 0 
                                    ? ((curr.successCount / totalSuccesses) * 100).toFixed(2) // Correct percentage calculation
                                    : 0;
                                acc[curr.type] = {
                                    successCount: curr.successCount,
                                    percentage: successPercentage
                                };
                                return acc;
                            }, {});

                            // Query for monthly success counts
                            db.query(`
                                SELECT 
                                    MONTH(createAt) AS month, 
                                    COUNT(*) AS successCount
                                FROM idprint
                                WHERE status = 'success'
                                GROUP BY MONTH(createAt)
                                ORDER BY month;
                            `, (err, successMonthlyResults) => {
                                if (err) {
                                    console.error('Error fetching monthly success counts:', err);
                                    return res.status(500).send('Error fetching monthly success counts');
                                }

                                const months = Array(12).fill(0);
                                successMonthlyResults.forEach(row => {
                                    months[row.month - 1] = row.successCount;
                                });

                                // Determine highest records for each category
                                const highestOffice = officeResults.reduce((prev, current) => (prev.total > current.total) ? prev : current, {});
                                const highestBarangay = barangayResults.reduce((prev, current) => (prev.total > current.total) ? prev : current, {});
                                const highestType = typeResults.reduce((prev, current) => (prev.total > current.total) ? prev : current, {});

                                // Get the highest age group and gender counts
                                const highestAgeGroup = ageResults[0];
                                const highestFemale = genderResults.find(g => g.gender === 'Female') || { total: 0, percentage: 0 };
                                const highestMale = genderResults.find(g => g.gender === 'Male') || { total: 0, percentage: 0 };

                                // Prepare the highest record data
                                const highestRecord = {
                                    office: highestOffice,
                                    barangay: highestBarangay,
                                    type: highestType,
                                    ageGroups: [
                                        { age: '18-24', total: highestAgeGroup.age_18_24, percentage: (highestAgeGroup.age_18_24 / (highestAgeGroup.age_18_24 + highestAgeGroup.age_25_34 + highestAgeGroup.age_35_44 + highestAgeGroup.age_45_54 + highestAgeGroup.age_55_64 + highestAgeGroup.age_65_plus) * 100).toFixed(2) },
                                        { age: '25-34', total: highestAgeGroup.age_25_34, percentage: (highestAgeGroup.age_25_34 / (highestAgeGroup.age_18_24 + highestAgeGroup.age_25_34 + highestAgeGroup.age_35_44 + highestAgeGroup.age_45_54 + highestAgeGroup.age_55_64 + highestAgeGroup.age_65_plus) * 100).toFixed(2) },
                                        { age: '35-44', total: highestAgeGroup.age_35_44, percentage: (highestAgeGroup.age_35_44 / (highestAgeGroup.age_18_24 + highestAgeGroup.age_25_34 + highestAgeGroup.age_35_44 + highestAgeGroup.age_45_54 + highestAgeGroup.age_55_64 + highestAgeGroup.age_65_plus) * 100).toFixed(2) },
                                        { age: '45-54', total: highestAgeGroup.age_45_54, percentage: (highestAgeGroup.age_45_54 / (highestAgeGroup.age_18_24 + highestAgeGroup.age_25_34 + highestAgeGroup.age_35_44 + highestAgeGroup.age_45_54 + highestAgeGroup.age_55_64 + highestAgeGroup.age_65_plus) * 100).toFixed(2) },
                                        { age: '55-64', total: highestAgeGroup.age_55_64, percentage: (highestAgeGroup.age_55_64 / (highestAgeGroup.age_18_24 + highestAgeGroup.age_25_34 + highestAgeGroup.age_35_44 + highestAgeGroup.age_45_54 + highestAgeGroup.age_55_64 + highestAgeGroup.age_65_plus) * 100).toFixed(2) },
                                        { age: '65+', total: highestAgeGroup.age_65_plus, percentage: (highestAgeGroup.age_65_plus / (highestAgeGroup.age_18_24 + highestAgeGroup.age_25_34 + highestAgeGroup.age_35_44 + highestAgeGroup.age_45_54 + highestAgeGroup.age_55_64 + highestAgeGroup.age_65_plus) * 100).toFixed(2) },
                                    ],
                                    female: highestFemale,
                                    male: highestMale,
                                    successByType: successByType, // Add success count and percentage
                                    totalSuccesses: totalSuccesses, // Add total successes to use in the view
                                    monthlySuccessCounts: months, // Pass the monthly success counts to the view
                                };

                                // Render the dashboard with all data
                                res.render('admin/das', {
                                    offices: officeResults,
                                    barangays: barangayResults,
                                    genders: genderResults,
                                    ageDistribution: highestAgeGroup,
                                    employeeTypes: typeResults,
                                    highestRecord: highestRecord, // Pass the highest record object to the view
                                    typeWithSuccessData: successByType, // Add success data by type
                                    totalSuccessCount: totalSuccesses, // Add total success count
                                    monthlySuccessCounts: months, // Add the monthly success counts data
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});


router.get('/das2', (req, res) => {
    // Query for total success count across all types in the idprint table
    db.query(`
        SELECT COUNT(*) AS totalSuccess
        FROM idprint
        WHERE status = 'Success';
    `, (err, totalSuccessResult) => {
        if (err) {
            console.error('Error fetching total success count:', err);
            return res.status(500).send('Error fetching total success count');
        }

        const totalSuccessCount = totalSuccessResult[0].totalSuccess; // Get the total success count

        // Query for success count per type
        db.query(`
            SELECT type, COUNT(*) AS successCount
            FROM idprint
            WHERE status = 'Success'
            GROUP BY type;
        `, (err, successResults) => {
            if (err) {
                console.error('Error fetching success counts by type:', err);
                return res.status(500).send('Error fetching success counts by type');
            }

            // Calculate success percentage for each type based on the total success count
            const typeWithSuccessData = successResults.map(typeData => {
                const successPercentage = totalSuccessCount > 0 
                    ? ((typeData.successCount / totalSuccessCount) * 100).toFixed(2)
                    : 0; // Calculate percentage of success for each type

                return {
                    type: typeData.type,
                    successCount: typeData.successCount,
                    successPercentage: successPercentage, // Correct percentage based on total success
                };
            });

            // Query for success count per office
            db.query(`
                SELECT office, COUNT(*) AS successCount
                FROM idprint
                WHERE status = 'Success'
                GROUP BY office;
            `, (err, officeSuccessResults) => {
                if (err) {
                    console.error('Error fetching success counts by office:', err);
                    return res.status(500).send('Error fetching success counts by office');
                }

                // Prepare data for the office table
                const officeData = officeSuccessResults.map(result => {
                    const successPercentage = totalSuccessCount > 0 
                        ? ((result.successCount / totalSuccessCount) * 100).toFixed(2)
                        : 0; // Calculate percentage for each office

                    return {
                        office: result.office,
                        successCount: result.successCount,
                        successPercentage: successPercentage, // Correct percentage based on total success
                    };
                });

                // Query for success count per brgyName
                db.query(`
                    SELECT brgyName, COUNT(*) AS successCount
                    FROM idprint
                    WHERE status = 'Success'
                    GROUP BY brgyName;
                `, (err, brgyNameSuccessResults) => {
                    if (err) {
                        console.error('Error fetching success counts by brgyName:', err);
                        return res.status(500).send('Error fetching success counts by brgyName');
                    }

                    // Prepare data for the brgyName table
                    const brgyNameData = brgyNameSuccessResults.map(result => {
                        const successPercentage = totalSuccessCount > 0 
                            ? ((result.successCount / totalSuccessCount) * 100).toFixed(2)
                            : 0; // Calculate percentage for each brgyName

                        return {
                            brgyName: result.brgyName,
                            successCount: result.successCount,
                            successPercentage: successPercentage, // Correct percentage based on total success
                        };
                    });

                    // Query to fetch records with "Success" status only
                    db.query(`
                        SELECT userName, idType, remarks, type, brgyName, office, createAt
                        FROM idprint
                        WHERE status = 'Success'
                    `, (err, idprintResults) => {
                        if (err) {
                            console.error('Error fetching records with "Success" status:', err);
                            return res.status(500).send('Error fetching records with "Success" status');
                        }

                        // Function to format createAt as "Sep 20, 2024 8:17 AM"
                        const formatDate = (dateString) => {
                            const options = { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                            };
                            const date = new Date(dateString);
                            return date.toLocaleString('en-US', options);
                        };

                        // Prepare data for the full table (only "Success" status, formatted date)
                        const fullIdprintData = idprintResults.map(record => ({
                            userName: record.userName,
                            idType: record.idType,
                            remarks: record.remarks,
                            type: record.type,
                            brgyName: record.brgyName,
                            office: record.office,
                            createAt: formatDate(record.createAt), // Format the createAt field
                        }));

                        // Render the dashboard with all the relevant data
                        res.render('admin/das2', {
                            typeWithSuccessData: typeWithSuccessData, // Pass the data with success count and percentages by type
                            totalSuccessCount: totalSuccessCount, // Pass the total success count as well
                            officeData: officeData, // Pass the success count and percentages by office
                            brgyNameData: brgyNameData, // Pass the success count and percentages by brgyName
                            fullIdprintData: fullIdprintData, // Pass the filtered records with formatted createAt
                        });
                    });
                });
            });
        });
    });
});


router.get('/das3', (req, res) => {
    // Get the current date
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);  // First day of the current month
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);  // Last day of the current month
    
    // Format the start and end dates in 'YYYY-MM-DD' format for MySQL comparison
    const startOfMonthStr = startOfMonth.toISOString().slice(0, 19).replace('T', ' ');
    const endOfMonthStr = endOfMonth.toISOString().slice(0, 19).replace('T', ' ');

    // Query to fetch all records with status "Success" from this month
    db.query(`
        SELECT userName, idType, remarks, type, brgyName, office, createAt
        FROM idprint
        WHERE status = 'Success'
        AND createAt BETWEEN ? AND ?;
    `, [startOfMonthStr, endOfMonthStr], (err, records) => {
        if (err) {
            console.error('Error fetching success records:', err);
            return res.status(500).send('Error fetching success records');
        }

        // Format 'createAt' into the desired format (e.g., "Sep 20, 2024 8:17 AM")
        const formattedRecords = records.map(record => {
            const formattedCreateAt = new Date(record.createAt).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
        });
        

            return {
                userName: record.userName,
                idType: record.idType,
                remarks: record.remarks,
                type: record.type,
                brgyName: record.brgyName,
                office: record.office,
                createAt: formattedCreateAt,
            };
        });

        // Query for total success count across all types for this month
        db.query(`
            SELECT COUNT(*) AS totalSuccess
            FROM idprint
            WHERE status = 'Success'
            AND createAt BETWEEN ? AND ?;
        `, [startOfMonthStr, endOfMonthStr], (err, totalSuccessResult) => {
            if (err) {
                console.error('Error fetching total success count:', err);
                return res.status(500).send('Error fetching total success count');
            }

            const totalSuccessCount = totalSuccessResult[0].totalSuccess; // Get the total success count for the current month

            // Query for success count per type within the current month
            db.query(`
                SELECT type, COUNT(*) AS successCount
                FROM idprint
                WHERE status = 'Success'
                AND createAt BETWEEN ? AND ?
                GROUP BY type;
            `, [startOfMonthStr, endOfMonthStr], (err, successResults) => {
                if (err) {
                    console.error('Error fetching success counts by type:', err);
                    return res.status(500).send('Error fetching success counts by type');
                }

                // Calculate success percentage for each type based on the total success count for the current month
                const typeWithSuccessData = successResults.map(typeData => {
                    const successPercentage = totalSuccessCount > 0 
                        ? ((typeData.successCount / totalSuccessCount) * 100).toFixed(2)
                        : 0; // Calculate percentage of success for each type

                    return {
                        type: typeData.type,
                        successCount: typeData.successCount,
                        successPercentage: successPercentage, // Correct percentage based on total success
                    };
                });

                // Query for success count per office within the current month
                db.query(`
                    SELECT office, COUNT(*) AS successCount
                    FROM idprint
                    WHERE status = 'Success'
                    AND createAt BETWEEN ? AND ?
                    GROUP BY office;
                `, [startOfMonthStr, endOfMonthStr], (err, officeSuccessResults) => {
                    if (err) {
                        console.error('Error fetching success counts by office:', err);
                        return res.status(500).send('Error fetching success counts by office');
                    }

                    // Calculate success percentage for each office
                    const officeData = officeSuccessResults.map(result => {
                        const successPercentage = totalSuccessCount > 0 
                            ? ((result.successCount / totalSuccessCount) * 100).toFixed(2)
                            : 0;

                        return {
                            office: result.office,
                            successCount: result.successCount,
                            successPercentage: successPercentage,
                        };
                    });

                    // Query for success count per brgyName within the current month
                    db.query(`
                        SELECT brgyName, COUNT(*) AS successCount
                        FROM idprint
                        WHERE status = 'Success'
                        AND createAt BETWEEN ? AND ?
                        GROUP BY brgyName;
                    `, [startOfMonthStr, endOfMonthStr], (err, brgyNameSuccessResults) => {
                        if (err) {
                            console.error('Error fetching success counts by brgyName:', err);
                            return res.status(500).send('Error fetching success counts by brgyName');
                        }

                        // Calculate success percentage for each brgyName
                        const brgyNameData = brgyNameSuccessResults.map(result => {
                            const successPercentage = totalSuccessCount > 0 
                                ? ((result.successCount / totalSuccessCount) * 100).toFixed(2)
                                : 0;

                            return {
                                brgyName: result.brgyName,
                                successCount: result.successCount,
                                successPercentage: successPercentage,
                            };
                        });

                        // Add total success count for this month
                        const currentMonthData = {
                            totalSuccessCount: totalSuccessCount,  // Total success count for this month
                            totalSuccessPercentage: totalSuccessCount > 0 ? ((totalSuccessCount / totalSuccessCount) * 100).toFixed(2) : 0 // For consistency, even though total is 100%
                        };

                        // Render the dashboard with the relevant data
                        res.render('admin/das3', {
                            currentMonthData: currentMonthData,   // Pass the total success count and percentage for the current month
                            typeWithSuccessData: typeWithSuccessData,  // Pass the data with success count and percentages by type
                            officeData: officeData,    // Pass the success count and percentages by office
                            brgyNameData: brgyNameData,   // Pass the success count and percentages by brgyName
                            records: formattedRecords   // Pass the records to the frontend
                        });
                    });
                });
            });
        });
    });
});


router.get('/das6', (req, res) => {
    // Query for total success count for today
    db.query(`
        SELECT COUNT(*) AS totalSuccess
        FROM idprint
        WHERE status = 'Success' AND DATE(createAt) = CURDATE();
    `, (err, totalSuccessResult) => {
        if (err) {
            console.error('Error fetching total success count for today:', err);
            return res.status(500).send('Error fetching total success count for today');
        }

        const totalSuccessCount = totalSuccessResult[0].totalSuccess; // Get the total success count for today

        // Query for success count per type for today
        db.query(`
            SELECT type, COUNT(*) AS successCount
            FROM idprint
            WHERE status = 'Success' AND DATE(createAt) = CURDATE()
            GROUP BY type;
        `, (err, successResults) => {
            if (err) {
                console.error('Error fetching success counts by type for today:', err);
                return res.status(500).send('Error fetching success counts by type for today');
            }

            // Calculate success percentage for each type based on the total success count for today
            const typeWithSuccessData = successResults.map(typeData => {
                const successPercentage = totalSuccessCount > 0 
                    ? ((typeData.successCount / totalSuccessCount) * 100).toFixed(2)
                    : 0; // Calculate percentage of success for each type

                return {
                    type: typeData.type,
                    successCount: typeData.successCount,
                    successPercentage: successPercentage, // Correct percentage based on total success for today
                };
            });

            // Query for success count per office for today
            db.query(`
                SELECT office, COUNT(*) AS successCount
                FROM idprint
                WHERE status = 'Success' AND DATE(createAt) = CURDATE()
                GROUP BY office;
            `, (err, officeSuccessResults) => {
                if (err) {
                    console.error('Error fetching success counts by office for today:', err);
                    return res.status(500).send('Error fetching success counts by office for today');
                }

                // Calculate success percentage for each office
                const officeData = officeSuccessResults.map(result => {
                    const successPercentage = totalSuccessCount > 0 
                        ? ((result.successCount / totalSuccessCount) * 100).toFixed(2)
                        : 0;

                    return {
                        office: result.office,
                        successCount: result.successCount,
                        successPercentage: successPercentage,
                    };
                });

                // Query for success count per brgyName for today
                db.query(`
                    SELECT brgyName, COUNT(*) AS successCount
                    FROM idprint
                    WHERE status = 'Success' AND DATE(createAt) = CURDATE()
                    GROUP BY brgyName;
                `, (err, brgyNameSuccessResults) => {
                    if (err) {
                        console.error('Error fetching success counts by brgyName for today:', err);
                        return res.status(500).send('Error fetching success counts by brgyName for today');
                    }

                    // Calculate success percentage for each brgyName
                    const brgyNameData = brgyNameSuccessResults.map(result => {
                        const successPercentage = totalSuccessCount > 0 
                            ? ((result.successCount / totalSuccessCount) * 100).toFixed(2)
                            : 0;

                        return {
                            brgyName: result.brgyName,
                            successCount: result.successCount,
                            successPercentage: successPercentage,
                        };
                    });

                    // Query for all success records for today
                    db.query(`
                        SELECT userName, idType, remarks, type, brgyName, office, createAt
                        FROM idprint
                        WHERE status = 'Success' AND DATE(createAt) = CURDATE();
                    `, (err, successRecords) => {
                        if (err) {
                            console.error('Error fetching success records for today:', err);
                            return res.status(500).send('Error fetching success records for today');
                        }

                        // Format createAt for each record as 'Sep 20, 2024 8:17 am' format
                        const formattedRecords = successRecords.map(record => {
                            const createAt = new Date(record.createAt);

                            // Format date to 'Sep 20, 2024 8:17 am'
                            const formattedCreateAt = createAt.toLocaleString('en-US', {
                                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
                            });

                            return {
                                ...record,
                                createAt: formattedCreateAt
                            };
                        });

                        // Render the dashboard with the relevant data for today
                        res.render('admin/das6', {
                            totalSuccessCount: totalSuccessCount, // Pass the total success count for today
                            typeWithSuccessData: typeWithSuccessData, // Pass the success data by type
                            officeData: officeData, // Pass the success data by office
                            brgyNameData: brgyNameData, // Pass the success data by brgyName
                            successRecords: formattedRecords, // Pass all success records for today with formatted createAt
                        });
                    });
                });
            });
        });
    });
});
router.get('/das4', (req, res) => {
    // Query for total success count for this week
    db.query(`
        SELECT COUNT(*) AS totalSuccess
        FROM idprint
        WHERE status = 'Success' AND YEARWEEK(createAt, 1) = YEARWEEK(CURDATE(), 1);
    `, (err, totalSuccessResult) => {
        if (err) {
            console.error('Error fetching total success count for this week:', err);
            return res.status(500).send('Error fetching total success count for this week');
        }

        const totalSuccessCount = totalSuccessResult[0].totalSuccess; // Get the total success count for this week

        // Query for success count per type for this week
        db.query(`
            SELECT type, COUNT(*) AS successCount
            FROM idprint
            WHERE status = 'Success' AND YEARWEEK(createAt, 1) = YEARWEEK(CURDATE(), 1)
            GROUP BY type;
        `, (err, successResults) => {
            if (err) {
                console.error('Error fetching success counts by type for this week:', err);
                return res.status(500).send('Error fetching success counts by type for this week');
            }

            // Calculate success percentage for each type based on the total success count for this week
            const typeWithSuccessData = successResults.map(typeData => {
                const successPercentage = totalSuccessCount > 0 
                    ? ((typeData.successCount / totalSuccessCount) * 100).toFixed(2)
                    : 0; // Calculate percentage of success for each type

                return {
                    type: typeData.type,
                    successCount: typeData.successCount,
                    successPercentage: successPercentage, // Correct percentage based on total success for this week
                };
            });

            // Query for success count per office for this week
            db.query(`
                SELECT office, COUNT(*) AS successCount
                FROM idprint
                WHERE status = 'Success' AND YEARWEEK(createAt, 1) = YEARWEEK(CURDATE(), 1)
                GROUP BY office;
            `, (err, officeSuccessResults) => {
                if (err) {
                    console.error('Error fetching success counts by office for this week:', err);
                    return res.status(500).send('Error fetching success counts by office for this week');
                }

                // Calculate success percentage for each office
                const officeData = officeSuccessResults.map(result => {
                    const successPercentage = totalSuccessCount > 0 
                        ? ((result.successCount / totalSuccessCount) * 100).toFixed(2)
                        : 0;

                    return {
                        office: result.office,
                        successCount: result.successCount,
                        successPercentage: successPercentage,
                    };
                });

                // Query for success count per brgyName for this week
                db.query(`
                    SELECT brgyName, COUNT(*) AS successCount
                    FROM idprint
                    WHERE status = 'Success' AND YEARWEEK(createAt, 1) = YEARWEEK(CURDATE(), 1)
                    GROUP BY brgyName;
                `, (err, brgyNameSuccessResults) => {
                    if (err) {
                        console.error('Error fetching success counts by brgyName for this week:', err);
                        return res.status(500).send('Error fetching success counts by brgyName for this week');
                    }

                    // Calculate success percentage for each brgyName
                    const brgyNameData = brgyNameSuccessResults.map(result => {
                        const successPercentage = totalSuccessCount > 0 
                            ? ((result.successCount / totalSuccessCount) * 100).toFixed(2)
                            : 0;

                        return {
                            brgyName: result.brgyName,
                            successCount: result.successCount,
                            successPercentage: successPercentage,
                        };
                    });

                    // Query for all success records for this week
                    db.query(`
                        SELECT userName, idType, remarks, type, brgyName, office, createAt
                        FROM idprint
                        WHERE status = 'Success' AND YEARWEEK(createAt, 1) = YEARWEEK(CURDATE(), 1);
                    `, (err, successRecords) => {
                        if (err) {
                            console.error('Error fetching success records for this week:', err);
                            return res.status(500).send('Error fetching success records for this week');
                        }

                        // Format the createAt date (e.g. Sep 20, 2024 8:17 am)
                        const formattedRecords = successRecords.map(record => {
                            const formattedCreateAt = new Date(record.createAt).toLocaleString('en-US', {
                                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
                            });
                            return {
                                ...record,
                                createAt: formattedCreateAt,
                            };
                        });

                        // Render the dashboard with the relevant data for this week
                        res.render('admin/das4', {
                            totalSuccessCount: totalSuccessCount, // Total success count for this week
                            typeWithSuccessData: typeWithSuccessData, // Success count and percentage by type
                            officeData: officeData, // Success count and percentage by office
                            brgyNameData: brgyNameData, // Success count and percentage by brgyName
                            successRecords: formattedRecords, // All success records with formatted `createAt`
                        });
                    });
                });
            });
        });
    });
});

router.get('/das5', (req, res) => {
    // Query for total success count for this year
    db.query(`
        SELECT COUNT(*) AS totalSuccess
        FROM idprint
        WHERE status = 'Success' AND YEAR(createAt) = YEAR(CURDATE());
    `, (err, totalSuccessResult) => {
        if (err) {
            console.error('Error fetching total success count for this year:', err);
            return res.status(500).send('Error fetching total success count for this year');
        }

        const totalSuccessCount = totalSuccessResult[0].totalSuccess; // Get the total success count for this year

        // Query for success count per type for this year
        db.query(`
            SELECT type, COUNT(*) AS successCount
            FROM idprint
            WHERE status = 'Success' AND YEAR(createAt) = YEAR(CURDATE())
            GROUP BY type;
        `, (err, successResults) => {
            if (err) {
                console.error('Error fetching success counts by type for this year:', err);
                return res.status(500).send('Error fetching success counts by type for this year');
            }

            // Calculate success percentage for each type based on the total success count for this year
            const typeWithSuccessData = successResults.map(typeData => {
                const successPercentage = totalSuccessCount > 0 
                    ? ((typeData.successCount / totalSuccessCount) * 100).toFixed(2)
                    : 0; // Calculate percentage of success for each type

                return {
                    type: typeData.type,
                    successCount: typeData.successCount,
                    successPercentage: successPercentage, // Correct percentage based on total success for this year
                };
            });

            // Query for success count per office for this year
            db.query(`
                SELECT office, COUNT(*) AS successCount
                FROM idprint
                WHERE status = 'Success' AND YEAR(createAt) = YEAR(CURDATE())
                GROUP BY office;
            `, (err, officeSuccessResults) => {
                if (err) {
                    console.error('Error fetching success counts by office for this year:', err);
                    return res.status(500).send('Error fetching success counts by office for this year');
                }

                // Calculate success percentage for each office
                const officeData = officeSuccessResults.map(result => {
                    const successPercentage = totalSuccessCount > 0 
                        ? ((result.successCount / totalSuccessCount) * 100).toFixed(2)
                        : 0;

                    return {
                        office: result.office,
                        successCount: result.successCount,
                        successPercentage: successPercentage,
                    };
                });

                // Query for success count per brgyName for this year
                db.query(`
                    SELECT brgyName, COUNT(*) AS successCount
                    FROM idprint
                    WHERE status = 'Success' AND YEAR(createAt) = YEAR(CURDATE())
                    GROUP BY brgyName;
                `, (err, brgyNameSuccessResults) => {
                    if (err) {
                        console.error('Error fetching success counts by brgyName for this year:', err);
                        return res.status(500).send('Error fetching success counts by brgyName for this year');
                    }

                    // Calculate success percentage for each brgyName
                    const brgyNameData = brgyNameSuccessResults.map(result => {
                        const successPercentage = totalSuccessCount > 0 
                            ? ((result.successCount / totalSuccessCount) * 100).toFixed(2)
                            : 0;

                        return {
                            brgyName: result.brgyName,
                            successCount: result.successCount,
                            successPercentage: successPercentage,
                        };
                    });

                    // Query for all success records for this year
                    db.query(`
                        SELECT userName, idType, remarks, type, brgyName, office, DATE_FORMAT(createAt, '%b %d, %Y %l:%i %p') AS createAt
                        FROM idprint
                        WHERE status = 'Success' AND YEAR(createAt) = YEAR(CURDATE());
                    `, (err, successRecords) => {
                        if (err) {
                            console.error('Error fetching success records for this year:', err);
                            return res.status(500).send('Error fetching success records for this year');
                        }

                        // Render the dashboard with the relevant data for this year
                        res.render('admin/das5', {
                            totalSuccessCount: totalSuccessCount, // Pass the total success count for this year
                            typeWithSuccessData: typeWithSuccessData, // Pass the success data by type
                            officeData: officeData, // Pass the success data by office
                            brgyNameData: brgyNameData, // Pass the success data by brgyName
                            successRecords: successRecords, // Pass the success records for this year
                        });
                    });
                });
            });
        });
    });
});

router.get('/ann', (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
        return res.redirect('/admin/welcome'); // Redirect to login if not authenticated
    }

    // Retrieve the user role from the session
    const userRole = req.session.role;

    db.query(
        `SELECT 
            a.*, 
            e.role 
         FROM 
            announcement a 
         JOIN 
            employees e ON a.userId = e.id 
         ORDER BY 
            a.createdAt DESC`, 
        (err, results) => {
            if (err) {
                console.error('Error fetching announcement:', err);
                return res.status(500).send('Error fetching announcement');
            }
            // Pass the announcement data and user role to the template
            res.render('admin/ann', { announcement: results, user: { role: userRole } });
        }
    );
});

router.get('/dir', (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
        return res.redirect('/admin/welcome'); // Redirect to login if not authenticated
    }

    // Retrieve the user role from the session
    const userRole = req.session.role;

    // Query the 'hotline' table
    db.query('SELECT * FROM hotline', (err, hotlineResults) => {
        if (err) {
            console.error('Error fetching hotline:', err);
            return res.status(500).send('Error fetching hotline');
        }

        // Query the 'ephone' table
        db.query('SELECT * FROM ephone', (err, ephoneResults) => {
            if (err) {
                console.error('Error fetching ephone:', err);
                return res.status(500).send('Error fetching ephone');
            }

            // Pass hotline and ephone data, and user role to the template
            res.render('admin/dir', {
                hotline: hotlineResults,
                ephone: ephoneResults,
                user: { role: userRole }
            });
        });
    });
});


router.get('/editHotline/:id', (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
        return res.redirect('/admin/welcome'); // Redirect to login if not authenticated
    }
    
    // Retrieve the user role from the session
    const userRole = req.session.role;

    const hotlineId = req.params.id;
    const query = 'SELECT * FROM hotline WHERE id = ?';
    
    db.query(query, [hotlineId], (err, results) => {
        if (err) {
            console.error('Error fetching hotline data:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length === 0) {
            return res.status(404).send('Hotline not found');
        }

        const hotline = results[0];
        res.render('admin/editHotline', { hotline : hotline, user: { role: userRole }  });
    });
});

router.post('/updateHotline/:id', (req, res) => {
    const hotlineId = req.params.id;
    const { name, phone1, phone2, phone3, email, facebook, website } = req.body;

    const query = `
        UPDATE hotline
        SET name = ?, phone1 = ?, phone2 = ?, phone3 = ?, email = ?, facebook = ?, website = ?
        WHERE id = ?
    `;

    db.query(query, [name, phone1, phone2, phone3, email, facebook, website, hotlineId], (err, results) => {
        if (err) {
            console.error('Error updating hotline:', err);
            return res.status(500).send('Failed to update hotline');
        }

        if (results.affectedRows === 0) {
            return res.status(404).send('Hotline not found or no changes made');
        }

        res.redirect('/admin/dir');
    });
});

router.get('/editPhone/:id', (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
        return res.redirect('/admin/welcome'); // Redirect to login if not authenticated
    }
    
    // Retrieve the user role from the session
    const userRole = req.session.role;

    const phoneId = req.params.id;
    const query = 'SELECT * FROM ephone WHERE id = ?';
    
    db.query(query, [phoneId], (err, results) => {
        if (err) {
            console.error('Error fetching ephone data:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length === 0) {
            return res.status(404).send('Ephone not found');
        }

        const ephone = results[0];  // Corrected from "hotline" to "ephone"
        res.render('admin/editPhone', { ephone: ephone, user: { role: userRole } });
    });
});


router.post('/editPhone/:id', (req, res) => {
    const phoneId = req.params.id;
    const { name, item1, item2, item3 } = req.body;

    // Basic validation (Optional but recommended)
    if (!name || !item1 || !item2 || !item3) {
        return res.status(400).send('All fields are required.');
    }

    const query = `
        UPDATE ephone
        SET name = ?, item1 = ?, item2 = ?, item3 = ?
        WHERE id = ?
    `;

    db.query(query, [name, item1, item2, item3, phoneId], (err, results) => {
        if (err) {
            console.error('Error updating ephone:', err);
            return res.status(500).send('Failed to update ephone');
        }

        if (results.affectedRows === 0) {
            return res.status(404).send('Ephone not found or no changes made');
        }

        res.redirect('/admin/dir');
    });
});


router.get('/notif', (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
        return res.redirect('/admin/welcome'); // Redirect to login if not authenticated
    }

    // Retrieve the user role from the session
    const userRole = req.session.role;

    // Fetch data from changestatus
    db.query('SELECT * FROM changestatus', (err, changestatusResults) => {
        if (err) {
            console.error('Error fetching changestatus:', err);
            return res.status(500).send('Error fetching changestatus');
        }

        // Fetch data from users
        db.query('SELECT * FROM users', (err, usersResults) => {
            if (err) {
                console.error('Error fetching users:', err);
                return res.status(500).send('Error fetching users');
            }

            // Fetch data from idPrint table
            db.query('SELECT * FROM idPrint', (err, idPrintResults) => {
                if (err) {
                    console.error('Error fetching idPrint:', err);
                    return res.status(500).send('Error fetching idPrint');
                }

                // Log the fetched data for debugging
                console.log("ID Print Notifications:", idPrintResults);  // Debugging line

                // Merge changestatus and users data
                const combinedNotifications = [...changestatusResults, ...usersResults];

                // Sort combined notifications by creation date (newest first)
                combinedNotifications.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));

                // Pass the combined data to the template
                res.render('admin/notif', {
                    notifications: combinedNotifications, // Notifications array for HR
                    idPrintNotifications: idPrintResults,  // Notifications array for ID print requests
                    user: req.session // Pass the entire session, so you have access to all user data
                });
            });
        });
    });
});

router.get('/user', (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
        return res.redirect('/admin/welcome'); // Redirect to login if not authenticated
    }

    // Fetch user details from the database
    db.query('SELECT * FROM employees WHERE id = ?', [req.session.userId], (err, results) => {
        if (err) {
            console.error('Error fetching user details:', err);
            return res.status(500).send('Internal Server Error');
        }
        
        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        const user = results[0];

        // Render the user page with user data only
        res.render('admin/user', { user });
    });
});

router.get('/dig', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/admin/welcome'); // Redirect to login if not authenticated
    }

    // Fetch user details from the database
    db.query('SELECT * FROM employees WHERE id = ?', [req.session.userId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).send('User not found');
        }

        const user = results[0];

        // Render the user page with user data from the correct location
        res.render('dig', { user }); // Ensure this points to the right template
    });
});
router.get('/welcome', (req, res) => {
    res.render('admin/welcome');
});

router.get('/register', (req, res) => {
    res.render('admin/register');
});

router.get('/empLN', (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
        return res.redirect('/admin/welcome'); // Redirect to login if not authenticated
    }

    // Retrieve the user role from the session
    const userRole = req.session.role;

    // Get the current date and calculate the date for 7 days ago
    const currentDate = new Date();
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(currentDate.getDate() - 7); // Subtract 7 days

    db.query('SELECT * FROM employees ORDER BY lastName ASC', (err, results) => {
        if (err) {
            console.error('Error fetching employees:', err);
            return res.status(500).send('Error fetching employees');
        }

        // Add a "new" label to employees created within the last 7 days
        results.forEach(employee => {
            const createdAt = new Date(employee.createdAt);
            if (createdAt >= sevenDaysAgo) {
                employee.isNew = true; // Mark as "New" if created within the last 7 days
            } else {
                employee.isNew = false;
            }
        });

        // Pass the user role, employee data, and label info to the template
        res.render('admin/empLN', { employees: results, user: { role: userRole } });
    });
});

router.get('/emp', (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
        return res.redirect('/admin/welcome'); // Redirect to login if not authenticated
    }

    // Retrieve the user role from the session
    const userRole = req.session.role;

    // Update the query to filter by active status "1" and order by lastName alphabetically
    db.query('SELECT * FROM employees WHERE active = 1 ORDER BY lastName ASC', (err, results) => {
        if (err) {
            console.error('Error fetching employees:', err);
            return res.status(500).send('Error fetching employees');
        }

        // Pass the user role and employee data to the template
        res.render('admin/emp', { employees: results, user: { role: userRole } });
    });
});


router.get('/empArch', (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
        return res.redirect('/admin/welcome'); // Redirect to login if not authenticated
    }

    // Retrieve the user role from the session
    const userRole = req.session.role;

    // Update the query to order by lastName alphabetically and filter by active status "0"
    db.query('SELECT * FROM employees WHERE active = 0 ORDER BY lastName ASC', (err, results) => {
        if (err) {
            console.error('Error fetching employees:', err);
            return res.status(500).send('Error fetching employees');
        }

        // If no records found, pass a message to the view
        const noRecords = results.length === 0 ? 'NO RECORDS' : '';

        // Pass the user role, employee data, and the noRecords message to the template
        res.render('admin/empArch', { employees: results, user: { role: userRole }, noRecords: noRecords });
    });
});



router.get('/empSort', (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
        return res.redirect('/admin/welcome'); // Redirect to login if not authenticated
    }

    // Retrieve the user role from the session
    const userRole = req.session.role;

    // Update the query to filter by active status "1" and order by dateCreated DESC
    db.query('SELECT * FROM employees WHERE active = 1 ORDER BY dateCreated DESC', (err, results) => {
        if (err) {
            console.error('Error fetching employees:', err);
            return res.status(500).send('Error fetching employees');
        }

        // Pass the user role and employee data to the template
        res.render('admin/empSort', { employees: results, user: { role: userRole } });
    });
});

router.get('/viewEmp/:id', (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
        return res.redirect('/admin/welcome'); // Redirect to login if not authenticated
    }

    const employeeId = req.params.id;

    db.query('SELECT * FROM employees WHERE id = ?', [employeeId], (err, results) => {
        if (err) {
            console.error('Error fetching employee details:', err);
            return res.status(500).send('Error fetching employee details');
        }
        if (results.length === 0) {
            return res.status(404).send('Employee not found');
        }

        const employee = results[0];

        // Handle and format the birthday field
        if (employee.birthday) {
            try {
                employee.birthday = new Date(employee.birthday + 'T00:00:00').toISOString().split('T')[0]; // Format as YYYY-MM-DD
                const options = { year: 'numeric', month: 'long', day: '2-digit' };
                employee.birthdayFormatted = new Date(employee.birthday + 'T00:00:00').toLocaleDateString('en-US', options); // Format for display
            } catch (error) {
                console.error('Error formatting birthday:', error);
                employee.birthday = '';
                employee.birthdayFormatted = '';
            }
        }

        const userRole = req.session.role; // Retrieve user role from session

        // Render the viewEmp page with employee data and user role
        res.render('admin/viewEmp', { employee, user: { role: userRole } });
    });
});


router.get('/idUser/:id', (req, res) => {
    const employeeId = req.params.id;

    db.query('SELECT * FROM employees WHERE id = ?', [employeeId], (err, results) => {
        if (err) {
            console.error('Error fetching employee details:', err);
            return res.status(500).send('Error fetching employee details');
        }
        if (results.length === 0) {
            return res.status(404).send('Employee not found');
        }

        const employee = results[0];

        // Create a string with the employee information for the QR code
        const employeeInfo = `This is a bonafide employee of LGU Science City of Mu؜ñoz\n` +
                            `Name: ${employee.firstName} ${employee.middleName ? employee.middleName.charAt(0) + '.' : ''} ${employee.lastName}\n` +
                             `Position: ${employee.position}\n` +
                             `Office: ${employee.office}\n`;

        // Generate QR code
        QRCode.toDataURL(employeeInfo, (err, url) => {
            if (err) {
                console.error('Error generating QR code:', err);
                return res.status(500).send('Error generating QR code');
            }

            // Render the userId view with the QR code URL and session data
            res.render('admin/idUser', { employee, qrCodeUrl: url, userId: req.session.userId, role: req.session.role });
        });
    });
});
router.get('/editEmp/:id', (req, res) => {
    const employeeId = req.params.id;

    db.query('SELECT * FROM employees WHERE id = ?', [employeeId], (err, results) => {
        if (err) {
            console.error('Error fetching employee details for edit:', err);
            return res.status(500).send('Error fetching employee details');
        }
        if (results.length === 0) {
            return res.status(404).send('Employee not found');
        }

        // Extract and format the birthday if it exists
        let birthday = results[0].birthday;
        console.log('Raw Birthday:', birthday);

        if (birthday) {
            try {
                // If `birthday` is a Date, format it; otherwise, handle it as a string
                birthday = new Date(birthday).toISOString().split('T')[0];
            } catch (parseError) {
                console.error('Error parsing birthday:', parseError);
                birthday = ''; // Default to an empty string
            }
        }

        console.log('Formatted Birthday:', birthday);

        // Pass the formatted birthday to the template
        res.render('admin/editEmp', { employee: { ...results[0], birthday } });
    });
});


const storagePhotoX = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/photos'); // Define folder for user photos
    },
    filename: (req, file, cb) => {
        // Create a unique filename based on timestamp
        cb(null, Date.now() + path.extname(file.originalname)); // Filename format: timestamp + file extension
    }
});

const uploadPhotoX = multer({ storage: storagePhotoX });

// Assuming you're uploading both the user photo and the signature
const upload = uploadPhotoX.fields([
    { name: 'userPhoto', maxCount: 1 }, // user photo field
    { name: 'signature', maxCount: 1 }   // signature field
]);

// POST route for updating employee details
router.post('/updateEmp/:id', upload, (req, res) => {
    const employeeId = req.params.id;
    const { gender, birthday, nickName, bloodType, sssId, tinId, gsisId, pagIbig, philhealth, streetName, brgyName, phone, email, emergencyContactName, emergencyContactAddress, emergencyContactNumber } = req.body;

    // Collect file paths if the files were uploaded
    const userPhoto = req.files && req.files.userPhoto ? '/uploads/photos/' + req.files.userPhoto[0].filename : null;
    const signature = req.files && req.files.signature ? '/uploads/photos/' + req.files.signature[0].filename : null;

    // Update query including userPhoto and signature columns
    db.query(`
        UPDATE employees SET 
        gender = ?, 
        birthday = ?, 
        nickName = ?, 
        bloodType = ?, 
        sssId = ?, 
        tinId = ?, 
        gsisId = ?, 
        pagIbig = ?, 
        philhealth = ?, 
        streetName = ?, 
        brgyName = ?, 
        phone = ?, 
        email = ?, 
        eName = ?, 
        eAddress = ?, 
        ePhone = ?, 
        userPhoto = ?,         -- Update user photo
        signature = ?          -- Update signature
        WHERE id = ?
    `, [
        gender, birthday, nickName, bloodType, sssId, tinId, gsisId, pagIbig, philhealth,
        streetName, brgyName, phone, email, emergencyContactName, emergencyContactAddress, emergencyContactNumber,
        userPhoto, signature, employeeId
    ], (err) => {
        if (err) {
            console.error('Error updating employee details:', err);
            return res.status(500).send('Error updating employee details');
        }
        res.redirect(`/admin/viewEmp/${employeeId}`); // Redirect to the updated employee page
    });
});
router.get('/editEmpM/:id', (req, res) => {
    const employeeId = req.params.id;
    db.query('SELECT * FROM employees WHERE id = ?', [employeeId], (err, results) => {
        if (err) {
            console.error('Error fetching employee details for edit:', err);
            return res.status(500).send('Error fetching employee details');
        }
        if (results.length === 0) {
            return res.status(404).send('Employee not found');
        }
        res.render('admin/editEmpM', { employee: results[0] });
    });
});
router.post('/updateEmpM/:id', (req, res) => {
    const employeeId = req.params.id;
    const { userId, firstName, middleName, lastName, extName, position, type, office } = req.body;

    db.query(`
        UPDATE employees SET 
        userId = ?, 
        firstName = ?, 
        middleName = ?, 
        lastName = ?, 
        extName = ?, 
        position = ?, 
        type = ?, 
        office = ? 
        WHERE id = ?
    `, [userId, firstName, middleName, lastName, extName, position, type, office, employeeId], (err) => {
        if (err) {
            console.error('Error updating employee details:', err);
            return res.status(500).send('Error updating employee details');
        }
        res.redirect(`/admin/viewEmp/${employeeId}`);
    });
});
router.get('/editEmpMN/:id', (req, res) => {
    const changestatusId = req.params.id;  // Fetching changestatus ID from URL parameter

    console.log(`Fetching changestatus with ID: ${changestatusId}`);  // Log the changestatus ID for debugging

    // Step 1: Fetch the status data from the changestatus table
    db.query(`
        SELECT * 
        FROM changestatus 
        WHERE id = ?
    `, [changestatusId], (err, changestatusResults) => {
        if (err) {
            console.error('Error fetching changestatus details for edit:', err);
            return res.status(500).send('Error fetching changestatus details');
        }

        // Step 2: Check if any record was found for the given changestatus.id
        if (changestatusResults.length === 0) {
            console.log('No records found for changestatus.id:', changestatusId);
            return res.status(404).render('admin/error', { errorMessage: 'Changestatus not found' });
        }

        // Assuming changestatus contains employee-related data
        const statusData = changestatusResults[0];  // Get the first (and only) record

        console.log('Changestatus data:', statusData);  // Log the data for debugging

        // Step 3: Check if the userId already exists in the database
        const userId = statusData.userId; // Extract the userId from the changestatus data

        db.query(`
            SELECT * 
            FROM employees 
            WHERE userId = ? AND id != ?
        `, [userId, statusData.employee_id], (err, userCheckResults) => {
            if (err) {
                console.error('Error checking if userId already exists:', err);
                return res.status(500).send('Error checking userId existence');
            }

            // If userId already exists, return an error message
            if (userCheckResults.length > 0) {
                console.log('UserId already exists:', userId);
                return res.render('admin/editEmpMN', {
                    statusData,
                    errorMessage: 'User ID already exists! Please choose a different ID.'
                });
            }

            // Step 4: Render the form with the changestatus data if no error
            res.render('admin/editEmpMN', { statusData });
        });
    });
});

router.post('/updateEmpMN/:id', (req, res) => {
    const employeeIdFromUrl = req.params.id; // Get employee ID from URL
    const { userId, firstName, middleName, lastName, extName, position, type, office, id } = req.body;

    console.log('Employee ID from URL:', employeeIdFromUrl);
    console.log('Request Body:', req.body);

    // Ensure changestatusId is passed
    if (!id) {
        return res.json({ success: false, message: 'Missing changestatusId' });
    }

    // Step 1: Check if the userId already exists in the database (if provided)
    if (userId) {
        const checkUserIdQuery = `
            SELECT * FROM employees 
            WHERE userId = ? AND id != ?`;

        db.query(checkUserIdQuery, [userId, employeeIdFromUrl], (err, results) => {
            if (err) {
                console.error('Error checking userId:', err);
                return res.json({ success: false, message: 'Error checking userId' });
            }

            if (results.length > 0) {
                // If the userId already exists, redirect with an error message
                return res.redirect('/updateEmpMN/' + employeeIdFromUrl + '?error=User ID already exists!');
            }

            // Proceed with the update process if no duplicate userId
            updateEmployeeInfo();
        });
    } else {
        // Proceed without userId validation if it's not provided
        updateEmployeeInfo();
    }

    // Function to handle the actual employee update
    function updateEmployeeInfo() {
        const updateFields = [];
        const updateValues = [];

        // Add fields to update based on input
        if (firstName) { updateFields.push('firstName = ?'); updateValues.push(firstName); }
        if (middleName) { updateFields.push('middleName = ?'); updateValues.push(middleName); }
        if (lastName) { updateFields.push('lastName = ?'); updateValues.push(lastName); }
        if (extName) { updateFields.push('extName = ?'); updateValues.push(extName); }
        if (position) { updateFields.push('position = ?'); updateValues.push(position); }
        if (type) { updateFields.push('type = ?'); updateValues.push(type); }
        if (office) { updateFields.push('office = ?'); updateValues.push(office); }
        if (userId) { updateFields.push('userId = ?'); updateValues.push(userId); }  // Add userId to update

        // Ensure there are fields to update
        if (updateFields.length === 0) {
            return res.json({ success: false, message: 'No valid fields to update' });
        }

        // Add the employee ID to the values for WHERE clause
        updateValues.push(employeeIdFromUrl);

        const sqlUpdateEmployee = `
            UPDATE employees 
            SET ${updateFields.join(', ')} 
            WHERE id = ?`;

        console.log('SQL Update Query:', sqlUpdateEmployee);
        console.log('Update Values:', updateValues);

        db.query(sqlUpdateEmployee, updateValues, (err, result) => {
            if (err) {
                console.error('Error updating employee:', err);
                return res.json({ success: false, message: 'Error updating employee' });
            }

            // Step 3: Update changestatus to "Success"
            const updateChangeStatusQuery = `
                UPDATE changestatus 
                SET status = 'Success' 
                WHERE id = ? AND employee_id = ? AND status = 'Pending'`;

            db.query(updateChangeStatusQuery, [id, employeeIdFromUrl], (err) => {
                if (err) {
                    console.error('Error updating changestatus:', err);
                    return res.json({ success: false, message: 'Error updating changestatus' });
                }

                // Redirect to the employee view page on success
                res.redirect(`/admin/viewEmp/${employeeIdFromUrl}`);
            });
        });
    }
});



router.post('/resetPassword/:id', (req, res) => {
    const employeeId = req.params.id;
    const { newPassword } = req.body; // Only get newPassword

    // Update the password in the database
    db.query(`UPDATE employees SET password = ? WHERE id = ?`, [newPassword, employeeId], (err) => {
        if (err) {
            console.error('Error updating password:', err);
            return res.status(500).send('Error updating password');
        }

        res.redirect(`/admin/viewEmp/${employeeId}`); // Redirect after successful update
    });
});

router.post('/resetUserPassword/:id', (req, res) => {
    const employeeId = req.params.id;
    const { newPassword } = req.body;

    db.query(`UPDATE employees SET password = ? WHERE id = ?`, [newPassword, employeeId], (err) => {
        if (err) {
            console.error('Error updating password:', err);
            return res.status(500).send('Error updating password');
        }

        // Redirect to resetPassSuccess.ejs
        res.redirect('/admin/resetPassSuccess');
    });
});

router.get('/export', (req, res) => {
    const query = `
        SELECT 
            userId,
            firstName,
            middleName,
            lastName,
            extName,
            birthday,
            nickName,
            bloodType,
            sssId,
            tinId,
            gsisId,
            pagIbig,
            philhealth,
            phone,
            email,
            type,
            office,
            position,
            streetName,
            brgyName
        FROM employees
    `;

    db.query(query, (error, results) => {
        if (error) {
            return res.status(500).send('Database query failed');
        }

        const escapeCsv = (value) => {
            if (typeof value === 'string') {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        };

        const formatBirthday = (date) => {
            if (!date) return ''; // Return empty string if no date

            const d = new Date(date);
            if (isNaN(d.getTime())) return ''; // Check if date is valid

            return d.toISOString().split('T')[0]; // Format to YYYY-MM-DD
        };

        const csvHeader = 'Employee ID,First Name,Middle Name,Last Name,Ext Name,Birthday,Nick Name,Blood Type,SSS ID,TIN ID,GSIS ID,Pag Ibig,PhilHealth,Phone,Email,Type,Office,Position,Street Name,Brgy Name\n';
        const csvRows = results.map(row => 
            `${escapeCsv(row.userId)},${escapeCsv(row.firstName)},${escapeCsv(row.middleName)},${escapeCsv(row.lastName)},${escapeCsv(row.extName)},${escapeCsv(formatBirthday(row.birthday))},${escapeCsv(row.nickName)},${escapeCsv(row.bloodType)},${escapeCsv(row.sssId)},${escapeCsv(row.tinId)},${escapeCsv(row.gsisId)},${escapeCsv(row.pagIbig)},${escapeCsv(row.philhealth)},${escapeCsv(row.phone)},${escapeCsv(row.email)},${escapeCsv(row.type)},${escapeCsv(row.office)},${escapeCsv(row.position)},${escapeCsv(row.streetName)},${escapeCsv(row.brgyName)}`
        ).join('\n');

        const csvContent = csvHeader + csvRows;

        res.header('Content-Type', 'text/csv');
        res.attachment(`Employee Records ${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvContent);
    });
});

router.get('/exportHotline', (req, res) => {
    const query = `
        SELECT 
        name,
        phone1,
        phone2,
        phone3,
        email,
        facebook,
        website
        FROM hotline
    `;

    db.query(query, (error, results) => {
        if (error) {
            return res.status(500).send('Database query failed');
        }

        const escapeCsv = (value) => {
            if (typeof value === 'string') {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        };

        const csvHeader = 'name,phone1,phone2,phone3,email, facebook, website\n';
        const csvRows = results.map(row => 
            `${escapeCsv(row.name)},${escapeCsv(row.phone1)},${escapeCsv(row.phone2)},${escapeCsv(row.phone3)},${escapeCsv(row.email)},${escapeCsv(row.facebook)},${escapeCsv(row.website)}`
        ).join('\n');

        const csvContent = csvHeader + csvRows;

        res.header('Content-Type', 'text/csv');
        res.attachment(`Hotline Record ${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvContent);
    });
});

router.get('/editAnn/:id', (req, res) => {
    const announcementId = req.params.id;

    // Query the database to get the announcement by its ID
    db.query('SELECT * FROM announcement WHERE id = ?', [announcementId], (err, results) => {
        if (err) {
            console.error('Error fetching announcement details:', err);
            return res.status(500).send('Error fetching announcement details');
        }

        if (results.length === 0) {
            return res.status(404).send('Announcement not found');
        }

        const announcement = results[0]; // Assuming the query returns only one result

        // Render the editAnn.ejs template from the 'admin' folder
        res.render('admin/editAnn', { announcement });
    });
});

const storage3 = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads'; // Folder for uploaded files
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename based on timestamp
    }
});

// Set file filter (optional, to accept only images)
const fileFilter = (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'));
    }
};

const upload3 = multer({ 
    storage: storage3,
    fileFilter: fileFilter // Optional filter for image files
});

router.post('/updateAnn/:id', upload3.single('coverPhoto'), (req, res) => {
    const announcementId = req.params.id;
    const { title, annFrom, annto, description } = req.body;
    
    // Get the new cover photo file path if it exists
    let newCoverPhoto = null;
    if (req.file) {
        newCoverPhoto = '/uploads/' + req.file.filename; // Path to the uploaded image
    }
    
    // If no new image is uploaded, keep the existing cover photo (don't change it)
    db.query('SELECT coverPhoto FROM announcement WHERE id = ?', [announcementId], (err, results) => {
        if (err) {
            console.error('Error fetching current announcement data:', err);
            return res.status(500).send('Error fetching current announcement data');
        }

        const existingCoverPhoto = results[0] ? results[0].coverPhoto : null;
        
        // If no new file was uploaded, use the existing cover photo
        const coverPhotoToUpdate = newCoverPhoto || existingCoverPhoto;

        // Update the announcement record with new data
        db.query(`
            UPDATE announcement SET 
                title = ?, 
                annFrom = ?, 
                annto = ?, 
                description = ?, 
                coverPhoto = ? 
            WHERE id = ?
        `, [title, annFrom, annto, description, coverPhotoToUpdate, announcementId], (err, results) => {
            if (err) {
                console.error('Error updating announcement details:', err);
                return res.status(500).send('Error updating announcement details');
            }
            
            // Redirect to the announcements list
            res.redirect('/admin/ann'); 
        });
    });
});


router.post('/createAnn', upload3.single('coverPhoto'), (req, res) => {
    const { title, annFrom, annto, description } = req.body;
    
    // Validate input fields
    if (!title || !annFrom || !annto || !description) {
        return res.status(400).send('All fields are required');
    }

    const userId = req.session.userId; // Get userId from session

    // Check if userId is available
    if (!userId) {
        return res.status(403).send('User is not logged in');
    }

    // Handle file upload
    let coverPhotoPath = null;
    if (req.file) {
        coverPhotoPath = '/uploads/' + req.file.filename; // Store relative path of uploaded file
    }

    // SQL query to insert a new announcement
    const sql = `
        INSERT INTO announcement (title, annFrom, annto, description, coverPhoto, userId, createdAt) 
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    // Execute the query
    db.query(sql, [title, annFrom, annto, description, coverPhotoPath, userId], (err, results) => {
        if (err) {
            console.error('Error creating announcement:', err);
            return res.status(500).send('Error creating announcement: ' + err.message);
        }

        // Redirect to the announcements page after successful insertion
        res.redirect('/admin/ann');
    });
});


router.get('/dig', isAuthenticated, async (req, res) => {
    // Your logic to handle the /dig route
    // Example:
    if (!req.session.userId) {
        return res.redirect('/admin/welcome'); // Redirect if not authenticated
    }

    try {
        const userId = req.session.userId;
        const [userDetails] = await db.query('SELECT * FROM employees WHERE id = ?', [userId]);

        if (!userDetails) {
            return res.status(404).send('User not found');
        }

        // Optionally fetch digital resources or other data
        const digitalResources = await db.query('SELECT * FROM digital_resources WHERE userId = ?', [userId]);

        // Render the dig page
        res.render('admin/dig', { user: userDetails, resources: digitalResources });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Server error');
    }
});


router.get('/editUser/:id', (req, res) => {
    const employeeId = req.params.id;
    db.query('SELECT * FROM employees WHERE id = ?', [employeeId], (err, results) => {
        if (err) {
            console.error('Error fetching employee details for edit:', err);
            return res.status(500).send('Error fetching employee details');
        }
        if (results.length === 0) {
            return res.status(404).send('Employee not found');
        }

        // Extract the birthday
        let birthday = results[0].birthday;

        if (birthday) {
            // Convert birthday to a date object to avoid timezone issues
            const date = new Date(birthday);
            
            // Extract the date part in YYYY-MM-DD format
            birthday = date.toLocaleDateString('en-CA'); // 'en-CA' is YYYY-MM-DD format
        }

        // Pass the formatted birthday to the template
        res.render('admin/editUser', { employee: { ...results[0], birthday } });
    });
});


router.post('/updateUser/:id', (req, res) => {
    const employeeId = req.params.id;
    const { 
        gender, birthday, nickName, bloodType, 
        sssId, tinId, gsisId, pagIbig, 
        philhealth, streetName, brgyName, 
        phone, email, emergencyContactName, 
        emergencyContactAddress, emergencyContactNumber 
    } = req.body;

    db.query(`
        UPDATE employees SET 
        gender = ?, 
        birthday = ?, 
        nickName = ?, 
        bloodType = ?, 
        sssId = ?, 
        tinId = ?, 
        gsisId = ?, 
        pagIbig = ?, 
        philhealth = ?, 
        streetName = ?, 
        brgyName = ?, 
        phone = ?, 
        email = ?, 
        eName = ?, 
        eAddress = ?, 
        ePhone = ? 
        WHERE id = ?
    `, [gender, birthday, nickName, bloodType, sssId, tinId, gsisId, pagIbig, philhealth, streetName, brgyName, phone, email, emergencyContactName, emergencyContactAddress, emergencyContactNumber, employeeId], (err) => {
        if (err) {
            console.error('Error updating employee details:', err);
            return res.status(500).send('Error updating employee details');
        }

        // Directly render the success page without a message
        res.render('admin/editProfileSuccess', { employeeId });
    });
});

router.get('/editProfileSuccess', (req, res) => {
    const employeeId = req.query.employeeId; // Get the employee ID for the button

    res.render('admin/editProfileSuccess', { employeeId }); // Ensure the path is correct
});
router.get('/editProfileSuccess', (req, res) => {
    const message = req.query.message; // Get the message from the URL
    const employeeId = req.query.employeeId; // Get the employee ID for the button

    res.render('admin/editProfileSuccess', { message, employeeId }); // Ensure the path is correct
});
router.get('/user/:id', (req, res) => {
    const userId = req.params.id;

    // Fetch user details from the database
    db.query('SELECT * FROM employees WHERE id = ?', [userId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).send('User not found');
        }

        const user = results[0];
        // Render the user page with user data
        res.render('admin/user', { user });
    });
});
router.get('/printId', (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
        return res.redirect('/admin/welcome'); // Redirect to login if not authenticated
    }

    // Retrieve the user role from the session
    const userRole = req.session.role;

    // Pass user role to the template
    res.render('admin/printId', { user: { role: userRole } });
});

router.get('/create-account', (req, res) => {
    res.render('emp'); // Render your emp.ejs file
});
// POST route to create an employee account
router.post('/create-account', (req, res) => {
    const {
        username,
        password,
        firstName,
        middleName,
        lastName,
        extName,
        email,
        phone,
        gender,
        type,
        office,
        birthday,
        position,
        userId,
    } = req.body;

    // Step 1: Check if the userId already exists
    const checkUserIdQuery = 'SELECT COUNT(*) AS count FROM employees WHERE userId = ?';

    db.query(checkUserIdQuery, [userId], (err, results) => {
        if (err) {
            console.error('Error checking userId:', err);
            return res.status(500).send('Database error occurred while checking userId.');
        }

        // If userId already exists, send a response indicating that
        if (results[0].count > 0) {
            return res.status(400).send('User ID already exists.');
        }

        // Step 2: If userId is not taken, insert the new record into the database
        const insertQuery = `
            INSERT INTO employees (userId, username, password, firstName, middleName, lastName, extName, email, phone, gender, type, office, birthday, position)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(insertQuery, [userId, username, password, firstName, middleName, lastName, extName, email, phone, gender, type, birthday, office, position], (error, results) => {
            if (error) {
                console.error('Error inserting data:', error);
                return res.status(500).send('Username or Email Already Exist.');
            }

            // If insertion is successful, render the success page
            res.render('admin/createEmpSuccess'); // Adjusted path to include 'admin/'
        });
    });
});


router.get('/createEmpSuccess', (req, res) => {
    res.render('admin/createEmpSuccess');
});

router.get('/resetPassSuccess', (req, res) => {
    res.render('admin/resetPassSuccess');
});
router.delete('/deleteAnn/:id', (req, res) => {
    const { id } = req.params; // Get the ID from the URL params

    const query = 'DELETE FROM announcement WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error deleting announcement:', err);
            return res.status(500).send('Error deleting announcement');
        }

        if (results.affectedRows === 0) {
            return res.status(404).send('Announcement not found');
        }

        // Redirect to admin page or another page after deletion
        res.redirect('/admin/ann'); // Redirect to admin page or another route
    });
});


// Define POST route for change request
router.post('/insertChangeRequest', (req, res) => {
    const { firstName, middleName, lastName, extName, position, userId, office, type, remarks } = req.body;

    const status = 'pending'; // Default status
    const createdAt = new Date();
    const updatedAt = createdAt;

    // SQL query to insert data into the changestatus table
    const sql = `
        INSERT INTO changestatus (employee_id, firstName, middleName, lastName, extName, position, userId, office, type, status, remarks, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
        req.session.userId || null, // employee_id comes from session
        firstName,
        middleName,
        lastName,
        extName,
        position,
        userId, // userId comes from request body
        office,
        type,
        status,
        remarks,
        createdAt,
        updatedAt
    ];

    // Execute the query
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error inserting change request:', err);
            return res.status(500).send('Error inserting change request: ' + err.message);
        }

        // Redirect on success
        res.render('admin/changeStatusSuccess');
    });
});


router.get('/changeStatusSuccess', (req, res) => {
    res.render('admin/changeStatusSuccess');
});

router.get('/signSuccess', (req, res) => {
    res.render('admin/signSuccess');
});
router.post('/submit-print-request', async (req, res) => {
    try {
        const { idType, remarks } = req.body;

        // Assuming the user is logged in and their ID is stored in the session
        const userId = req.session.userId;  // User ID from the session
        if (!userId) {
            return res.status(400).json({ message: 'User not logged in' });
        }

        // Query the employees table to get the full name and other details based on userId
        const queryUser = `
            SELECT firstName, middleName, lastName, extName, type, brgyName, office
            FROM employees 
            WHERE id = ?
        `;

        db.query(queryUser, [userId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            // Check if the user exists
            if (results.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            const { firstName, middleName, lastName, extName, type, brgyName, office } = results[0];

            // Combine the employee's name (handling the middle name and extName)
            const userName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName} ${extName ? extName : ''}`.trim();

            // Get the current timestamp (use MySQL-friendly format)
            const createAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

            // Set default status (can be customized)
            const status = 'pending';

            // Prepare the SQL query to insert into idprint
            const queryInsert = `
                INSERT INTO idprint (userId, userName, createAt, status, idType, remarks)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.query(queryInsert, [userId, userName, createAt, status, idType, remarks], (err, result) => {
                if (err) {
                    console.error('Database insertion error:', err);
                    return res.status(500).json({ message: 'Error submitting print request' });
                }

                // Get the newly inserted idprint row's id
                const idprintId = result.insertId;

                // Now update the idprint table with the missing fields (type, brgyName, office)
                const queryUpdate = `
                    UPDATE idprint
                    SET 
                        type = ?, 
                        brgyName = ?, 
                        office = ?
                    WHERE id = ?
                `;

                db.query(queryUpdate, [type, brgyName, office, idprintId], (err, updateResult) => {
                    if (err) {
                        console.error('Database update error:', err);
                        return res.status(500).json({ message: 'Error updating print request' });
                    }

                    // Render the success page after successful submission
                    res.render('admin/printRequestSuccess');
                });
            });
        });
    } catch (error) {
        console.error('Error in submit print request route:', error);
        res.status(500).json({ message: 'An error occurred while processing your request' });
    }
});
router.patch('/update-status/:id', (req, res) => {
    const { id } = req.params;
    const status = 'Decline';  // Status to set when declining

    const query = 'UPDATE idprint SET status = ? WHERE id = ?';

    // Update the status in the database
    db.query(query, [status, id], (err, result) => {
        if (err) {
            console.error('Error updating status:', err);
            return res.redirect('/admin/notif');  // If error, redirect back to notif.ejs page
        }

        if (result.affectedRows > 0) {
            // Redirect back to notif page, with the hash to preserve scroll position
            return res.redirect('/admin/notif#status-' + id);  // Redirect with the anchor to the specific notification
        } else {
            // If no rows were updated (no such record found), just redirect back to notif
            return res.redirect('/admin/notif');  // Redirect back to notif.ejs page
        }
    });
});


router.patch('/restore/:id', (req, res) => {
    const { id } = req.params;
    const status = 'Pending';  // Status to set when declining

    const query = 'UPDATE idprint SET status = ? WHERE id = ?';

    // Update the status in the database
    db.query(query, [status, id], (err, result) => {
        if (err) {
            console.error('Error updating status:', err);
            return res.redirect('/admin/notif');  // If error, redirect back to notif.ejs page
        }

        if (result.affectedRows > 0) {
            // Redirect back to the notif page after updating the status
            return res.redirect('/admin/notif');  // Redirect directly to /admin/notif
        } else {
            // If no rows were updated (no such record found), just redirect back to notif
            return res.redirect('/admin/notif');  // Redirect back to notif.ejs page
        }
    });
});

router.patch('/restore3/:id', (req, res) => {
    const { id } = req.params;
    const status = 'Pending';  // Status to set when declining

    const query = 'UPDATE users SET status = ? WHERE id = ?';

    // Update the status in the database
    db.query(query, [status, id], (err, result) => {
        if (err) {
            console.error('Error updating status:', err);
            return res.redirect('/admin/notif');  // If error, redirect back to notif.ejs page
        }

        if (result.affectedRows > 0) {
            // Redirect back to the notif page after updating the status
            return res.redirect('/admin/notif');  // Redirect directly to /admin/notif
        } else {
            // If no rows were updated (no such record found), just redirect back to notif
            return res.redirect('/admin/notif');  // Redirect back to notif.ejs page
        }
    });
});

router.patch('/update-statushr/:id', (req, res) => {
    const { id } = req.params;
    const status = 'Decline';  // Status to set when declining

    const query = 'UPDATE changestatus SET status = ? WHERE id = ?';

    // Update the status in the database
    db.query(query, [status, id], (err, result) => {
        if (err) {
            console.error('Error updating status:', err);
            return res.redirect('/admin/notif');  // If error, redirect back to notif.ejs page
        }

        if (result.affectedRows > 0) {
            // Redirect back to the notif page after updating the status
            return res.redirect('/admin/notif');  // Redirect directly to /admin/notif
        } else {
            // If no rows were updated (no such record found), just redirect back to notif
            return res.redirect('/admin/notif');  // Redirect back to notif.ejs page
        }
    });
});

router.patch('/update-status3/:id', (req, res) => {
    const { id } = req.params;
    const status = 'Decline';  // Status to set when declining

    const query = 'UPDATE users SET status = ? WHERE id = ?';

    // Update the status in the database
    db.query(query, [status, id], (err, result) => {
        if (err) {
            console.error('Error updating status:', err);
            return res.redirect('/admin/notif');  // If error, redirect back to notif.ejs page
        }

        if (result.affectedRows > 0) {
            // Redirect back to the notif page after updating the status, with an anchor hash
            return res.redirect('/admin/notif#status-' + id);  // Redirect to /admin/notif and scroll to the updated notification
        } else {
            // If no rows were updated (no such record found), just redirect back to notif
            return res.redirect('/admin/notif');  // Redirect back to notif.ejs page
        }
    });
});


router.patch('/restorehr/:id', (req, res) => {
    const { id } = req.params;
    const status = 'Pending';  // Status to set when declining

    const query = 'UPDATE changestatus SET status = ? WHERE id = ?';

    // Update the status in the database
    db.query(query, [status, id], (err, result) => {
        if (err) {
            console.error('Error updating status:', err);
            return res.redirect('/admin/notif');  // If error, redirect back to notif.ejs page
        }

        if (result.affectedRows > 0) {
            // Redirect back to the notif page after updating the status
            return res.redirect('/admin/notif');  // Redirect directly to /admin/notif
        } else {
            // If no rows were updated (no such record found), just redirect back to notif
            return res.redirect('/admin/notif');  // Redirect back to notif.ejs page
        }
    });
});

router.patch('/update-statusAdmin/:id', (req, res) => {
    const { id } = req.params;
    const status = 'Success';  // Status to set when updating to 'Success'

    const query = 'UPDATE idprint SET status = ? WHERE id = ?';

    // Update the status in the database
    db.query(query, [status, id], (err, result) => {
        if (err) {
            console.error('Error updating status:', err);
            return res.redirect('/admin/notif');  // If error, redirect back to notif.ejs page
        }

        if (result.affectedRows > 0) {
            // Redirect back to the notif page after updating the status, with an anchor hash
            return res.redirect('/admin/notif#status-' + id);  // Redirect to /admin/notif and scroll to the updated notification
        } else {
            // If no rows were updated (no such record found), just redirect back to notif
            return res.redirect('/admin/notif');  // Redirect back to notif.ejs page
        }
    });
});


router.get('/idUserPrint/:id', (req, res) => {
    const employeeId = req.params.id;

    // First, query the employees table to get employee details
    db.query('SELECT * FROM employees WHERE id = ?', [employeeId], (err, employeeResults) => {
        if (err) {
            console.error('Error fetching employee details:', err);
            return res.status(500).send('Error fetching employee details');
        }
        if (employeeResults.length === 0) {
            return res.status(404).send('Employee not found');
        }

        const employee = employeeResults[0];

        // Query the idprint table to get the print request
        db.query('SELECT * FROM idprint WHERE userId = ? AND status = "Pending"', [employeeId], (err, printResults) => {
            if (err) {
                console.error('Error fetching print request:', err);
                return res.status(500).send('Error fetching print request');
            }

            if (printResults.length === 0) {
                return res.status(404).send('Print request not found');
            }

            const printRequest = printResults[0];

            // Generate QR code with employee info
            const employeeInfo = `Name: ${employee.firstName} ${employee.lastName}\nID: ${employee.userId}\nPosition: ${employee.position}\nContact: ${employee.phone}`;
            QRCode.toDataURL(employeeInfo, (err, qrCodeUrl) => {
                if (err) {
                    console.error('Error generating QR code:', err);
                    return res.status(500).send('Error generating QR code');
                }

                // Render the view, passing the employee data, print request, and QR code
                res.render('admin/idUserPrint', {
                    employee,
                    printRequest,
                    qrCodeUrl
                });
            });
        });
    });
});
router.get('/status-chart', (req, res) => {
    const query = `
        SELECT 
            MONTH(createAt) AS month,
            type,
            COUNT(*) AS successCount
        FROM 
            idprint
        WHERE 
            status = 'success'
        GROUP BY 
            MONTH(createAt), type
        ORDER BY 
            month, type;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
            return;
        }

        // Initialize months array for each month (12 months)
        const months = Array(12).fill(0).map(() => ({})); // Array for each month, with empty objects for types
        const types = [];

        // Predefined colors (one for each type)
        const colorPalette = [
            '#6b9f7d', '#4a7b58', '#44624a', '#3d5842', '#364e3b'
        ];

        // Process the query result and fill the months and types data
        results.forEach(row => {
            // Add a success count for the given month and type
            if (!months[row.month - 1][row.type]) {
                months[row.month - 1][row.type] = 0;
            }
            months[row.month - 1][row.type] = row.successCount;

            // Add the type to the types array if it's not already there
            if (!types.includes(row.type)) {
                types.push(row.type);
            }
        });

        // Prepare the data for the chart
        const chartData = {
            labels: [ // Labels for the months (January to December)
                'January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'
            ],
            datasets: types.map((type, index) => ({
                label: type, // The type will be the label for each dataset
                data: months.map(month => month[type] || 0), // Success count for this type for each month
                backgroundColor: colorPalette[index % colorPalette.length], // Assign predefined color
                borderColor: colorPalette[index % colorPalette.length], // Use the same color for border
                borderWidth: 0
            }))
        };

        // Send the chart data to the EJS template
        res.render('admin/statusChart', { chartData });
    });
});

router.get('/status-chart2', (req, res) => {
    const query = `
        SELECT 
            type,
            COUNT(*) AS successCount
        FROM 
            idprint
        WHERE 
            status = 'success'
            AND YEAR(createAt) = YEAR(CURDATE())  -- Current year
            AND MONTH(createAt) = MONTH(CURDATE())  -- Current month
        GROUP BY 
            type;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
            return;
        }

        // Prepare chart data
        const types = [];
        const successCounts = [];
        const colorPalette = [
            '#6b9f7d', '#4a7b58', '#44624a', '#3d5842', '#364e3b'
        ];

        // Process the results to build the chart data
        results.forEach(row => {
            types.push(row.type);
            successCounts.push(row.successCount);
        });

        // Prepare the data for the chart
        const chartData = {
            labels: types, // Labels will be the types (e.g., 'type1', 'type2', etc.)
            datasets: [{
                label: 'Success Count', // This is a single dataset for all types
                data: successCounts, // Success count for each type
                backgroundColor: colorPalette.slice(0, types.length), // Color for each bar
                borderColor: colorPalette.slice(0, types.length), // Border color
                borderWidth: 1
            }]
        };

        // Send the chart data to the EJS template
        res.render('admin/statusChart2', { chartData });
    });
});

router.get('/status-chart3', (req, res) => {
    const query = `
        SELECT 
            type,
            DAYOFWEEK(createAt) AS dayOfWeek,  -- Get the day of the week (1 = Sunday, 7 = Saturday)
            COUNT(*) AS successCount
        FROM 
            idprint
        WHERE 
            status = 'success'
            AND YEAR(createAt) = YEAR(CURDATE())  -- Current year
            AND WEEK(createAt, 1) = WEEK(CURDATE(), 1)  -- Current week (1 = Monday as the first day of the week)
        GROUP BY 
            type, DAYOFWEEK(createAt)
        ORDER BY 
            type, dayOfWeek;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
            return;
        }

        // Prepare chart data
        const types = [];
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const successData = {};

        // Predefined colors for each type
        const colorPalette = [
            '#6b9f7d', '#4a7b58', '#44624a', '#3d5842', '#364e3b'
        ];

        // Initialize the successData object for each type and each day of the week
        results.forEach(row => {
            if (!types.includes(row.type)) {
                types.push(row.type);
                successData[row.type] = Array(7).fill(0); // Initialize the success count for each day of the week (Sunday-Saturday)
            }
            // Map the success count to the correct day of the week
            successData[row.type][row.dayOfWeek - 1] = row.successCount; // dayOfWeek is 1-based (Sunday = 1, Saturday = 7)
        });

        // Prepare the chart data structure
        const chartData = {
            labels: daysOfWeek, // Days of the week (Sunday to Saturday)
            datasets: types.map((type, index) => ({
                label: type, // Type as the label for each dataset
                data: successData[type], // Success counts for each day of the current week
                backgroundColor: colorPalette[index % colorPalette.length], // Color for the bar
                borderColor: colorPalette[index % colorPalette.length], // Border color
                borderWidth: 1
            }))
        };

        // Send the chart data to the EJS template
        res.render('admin/statusChart3', { chartData });
    });
});

router.get('/status-chart4', (req, res) => {
    const query = `
        SELECT 
            type,
            COUNT(*) AS successCount
        FROM 
            idprint
        WHERE 
            status = 'success'
            AND DATE(createAt) = CURDATE()  -- Current date only
        GROUP BY 
            type;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
            return;
        }

        // Prepare chart data
        const types = [];
        const successCounts = [];
        const colorPalette = [
            '#6b9f7d', '#4a7b58', '#44624a', '#3d5842', '#364e3b'
        ];

        // Process the results to build the chart data
        results.forEach(row => {
            types.push(row.type);
            successCounts.push(row.successCount);
        });

        // Prepare the data for the chart
        const chartData = {
            labels: types, // Labels will be the types (e.g., 'type1', 'type2', etc.)
            datasets: [{
                label: 'Success Count', // Label for the dataset
                data: successCounts, // Success count for each type
                backgroundColor: colorPalette.slice(0, types.length), // Color for each bar
                borderColor: colorPalette.slice(0, types.length), // Border color for each bar
                borderWidth: 1
            }]
        };

        // Send the chart data to the EJS template
        res.render('admin/statusChart4', { chartData });
    });
});
router.get('/regAcc/:id', (req, res) => {
    const usersId = req.params.id;

    db.query('SELECT * FROM users WHERE id = ?', [usersId], (err, results) => {
        if (err) {
            console.error('Error fetching employee details:', err);
            return res.status(500).send('Error fetching employee details');
        }
        if (results.length === 0) {
            return res.status(404).send('Employee not found');
        }

        const employeeData = results[0]; // Assuming results[0] contains the employee data
        const userRole = req.session.role; // Retrieve user role from session

        // Format the birthday to YYYY-MM-DD (removing time part if exists)
        let birthday = employeeData.birthday;  // Get the birthday from employee data
        if (birthday) {
            // Convert to YYYY-MM-DD format
            birthday = birthday.toISOString().split('T')[0];
        }

        // Pass the formatted birthday and other data to the view
        res.render('admin/regAcc', { 
            users: { ...employeeData, birthday }, // Include formatted birthday
            user: { role: userRole } 
        });
    });
});



router.post('/register-account', (req, res) => {
    const {
        username,
        password,
        firstName,
        middleName,
        lastName,
        extName,
        email,
        phone,
        gender,
        type,
        office,
        birthday,
        position,
        userId,
        id // User ID from the form
    } = req.body;

    // Log the incoming data for debugging purposes
    console.log('Received data:', req.body);

    // Ensure birthday is in correct format (YYYY-MM-DD)
    const formattedBirthday = new Date(birthday).toISOString().split('T')[0];

    // Check if the email or userId already exists in the employees table
    db.query('SELECT * FROM employees WHERE email = ? OR userId = ?', [email, userId], (err, results) => {
        if (err) {
            console.error('Error checking email or userId:', err);
            return res.render('admin/regAcc', { error: 'Error checking email or userId', users: req.body });
        }

        if (results.length > 0) {
            // Log the existing email or userId
            console.log('Email or Employee Number already exists:', results);
            return res.render('admin/regAcc', { error: 'Email or Employee Number Already Exists!', users: req.body });
        }

        // Start a database transaction to ensure atomicity of operations
        db.beginTransaction((err) => {
            if (err) {
                console.error('Error starting transaction:', err);
                return res.render('admin/regAcc', { error: 'Error starting transaction!', users: req.body });
            }

            // Log the data being inserted for debugging
            console.log('Inserting data into employees:', [
                userId, username, password, firstName, middleName, lastName, extName, email, formattedBirthday, phone, gender, type, office, position
            ]);

            // Query to insert data into the employees table
            const queryInsert = `
                INSERT INTO employees (
                    userId, username, password, firstName, middleName, lastName, extName, email, birthday, phone, gender, type, office, position,
                    dateCreated, role, active
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
            `;

            // Query to update the status in the users table
            const queryUpdateStatus = `UPDATE users SET status = 'Success' WHERE id = ?`;

            db.query(queryInsert, [
                userId, username, password, firstName, middleName || null, lastName, extName || null, email, formattedBirthday, phone, gender, type, office, position,
                'Employee', 1 // Default values for 'role' and 'active'
            ], (error) => {
                if (error) {
                    console.error('Error inserting into employees table:', error); // Log the actual error
                    return db.rollback(() => {
                        return res.render('admin/regAcc', { error: `Error inserting user into employees table: ${error.message}`, users: req.body });
                    });
                }

                // Update status in users table after inserting employee
                db.query(queryUpdateStatus, [id], (error) => {
                    if (error) {
                        console.error('Error updating user status:', error); // Log error here
                        return db.rollback(() => {
                            return res.render('admin/regAcc', { error: 'Error updating user status!', users: req.body });
                        });
                    }

                    // Commit the transaction if both queries succeed
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error committing transaction:', err);
                                return res.render('admin/regAcc', { error: 'Error committing transaction!', users: req.body });
                            });
                        }

                        // Send the confirmation email using SendGrid
                        const msg = {
                            to: email,
                            from: 'johnniebre1995@gmail.com', // Sender email (ensure it is verified with SendGrid)
                            subject: 'Congratulations, You Are Now a Bonafide Employee!',
                            html: ` 
                                <h2>Congratulations!</h2>
                                <p>You are now a verified bonafide employee of the Local Government Unit of Science City of Muñoz.</p>
                                <p>Please click the link below to continue your account creation:</p>
                                <a href="https://yourapp.com/complete-account-setup">Complete Your Account Setup</a>
                                <p><strong>Your new username and password are:</strong></p>
                                <p><strong>Username:</strong> ${username}</p>
                                <p><strong>Password:</strong> ${password}</p>
                                <p>Welcome aboard, and Mabuhay!</p>
                            `
                        };

                        sgMail
                            .send(msg)
                            .then(() => {
                                console.log('Email sent successfully');
                                res.redirect('/admin/verSuccess'); // Redirect to success page
                            })
                            .catch(error => {
                                console.error('Error sending email:', error);
                                return res.render('admin/regAcc', { error: 'Error sending Email!, Invalid Email or Internet Connection Problem', users: req.body });
                            });
                    });
                });
            });
        });
    });
});




router.get('/verSuccess', (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
        return res.redirect('/admin/welcome'); // Redirect to login if not authenticated
    }

    // Retrieve the user role from the session (optional, in case you want to pass role data)
    const userRole = req.session.role;

    // Render the verSuccess page and pass the user role (if needed)
    res.render('admin/verSuccess', { user: { role: userRole } });
});


// Multer configuration for file uploads
const storage2 = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads'; // Folder for uploaded files
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename based on timestamp
    }
});

const upload2 = multer({ storage: storage2 });

// Route for rendering the form page with file data
router.get('/frm', isAuthenticated, (req, res) => {
    const userRole = req.session.role;

    // Fetch files from the database
    db.query('SELECT * FROM files ORDER BY code ASC', (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal server error');
        }
        
        // Log the results to make sure you get the expected data
        console.log(results); 

        // Pass results as 'files' to the template
        res.render('admin/frm', { 
            user: { role: userRole },
            files: results || [] // Ensure files is an empty array if no files are found
        });
    });
});


// Handle file uploads
router.post('/upload', isAuthenticated, upload2.single('pdfFile'), (req, res) => {
    // Check if a file was uploaded
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    // Get file details
    const filePath = req.file.path;
    const fileName = req.file.filename;

    // Get 'code' from the form data
    const code = req.body.code; // Assuming 'code' is part of the form data

    // Validate 'code' if needed (optional)
    if (!code) {
        return res.status(400).send('Code is required');
    }

    // Insert file details and code into the database
    db.query('INSERT INTO files (file_name, file_path, code) VALUES (?, ?, ?)', [fileName, filePath, code], (err, result) => {
        if (err) {
            console.error('Error saving file details to database:', err);
            return res.status(500).send('Internal server error');
        }

        res.redirect('/admin/frm'); // Redirect to the form page or wherever needed
    });
});


router.delete('/deleteFile/:id', (req, res) => {
    const { id } = req.params; // Get the ID from the URL params

    const query = 'DELETE FROM files WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error deleting announcement:', err);
            return res.status(500).send('Error deleting announcement');
        }

        if (results.affectedRows === 0) {
            return res.status(404).send('Announcement not found');
        }

        // Redirect to admin page or another page after deletion
        res.redirect('/admin/frm'); // Redirect to admin page or another route
    });
});

router.get('/editForm/:id', (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
        return res.redirect('/admin/welcome'); // Redirect to login if not authenticated
    }
    
    // Retrieve the user role from the session
    const userRole = req.session.role;

    const fileId = req.params.id;
    const query = 'SELECT * FROM files WHERE id = ?';
    
    db.query(query, [fileId], (err, results) => {
        if (err) {
            console.error('Error fetching hotline data:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length === 0) {
            return res.status(404).send('Hotline not found');
        }

        const file = results[0];
        res.render('admin/editForm', { file : file, user: { role: userRole }  });
    });
});

// Route to handle the file update after editing the form
router.post('/editForm/:id', isAuthenticated, upload2.single('pdfFile'), (req, res) => {
    const { id } = req.params;
    const { code } = req.body;

    // Get the file details (new or old)
    const fileName = req.file ? req.file.filename : undefined;
    const filePath = req.file ? req.file.path : undefined;

    // Update the file information in the database
    let updateQuery = 'UPDATE files SET code = ? WHERE id = ?';
    let updateParams = [code, id];

    if (fileName && filePath) {
        updateQuery = 'UPDATE files SET code = ?, file_name = ?, file_path = ? WHERE id = ?';
        updateParams = [code, fileName, filePath, id];
    }

    // Execute the update query
    db.query(updateQuery, updateParams, (err, result) => {
        if (err) {
            console.error('Error updating file:', err);
            return res.status(500).send('Error updating file');
        }

        res.redirect('/admin/frm'); // Redirect to the forms page after successful update
    });
});



router.get('/userPhoto', (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
        return res.redirect('/admin/welcome'); // Redirect to login if not authenticated
    }

    // Fetch user details from the database
    db.query('SELECT * FROM employees WHERE id = ?', [req.session.userId], (err, results) => {
        if (err) {
            console.error('Error fetching user details:', err);
            return res.status(500).send('Internal Server Error');
        }
        
        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        const user = results[0];

        // Render the user page with user data only
        res.render('admin/userPhoto', { user });
    });
});

// Multer storage configuration for user photo uploads
const storagePhoto = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/photos'); // Define folder for user photos
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Create a unique filename based on timestamp
    }
});

const uploadPhoto = multer({ storage: storagePhoto });

// Route to handle the photo upload
// Upload photo route
router.post('/uploadPhoto', isAuthenticated, uploadPhoto.single('userPhoto'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    // Get the file path and name
    const filePath = '/uploads/photos/' + req.file.filename;

    // Update the user photo path in the database
    const userId = req.session.userId;

    db.query('UPDATE employees SET userPhoto = ? WHERE id = ?', [filePath, userId], (err, result) => {
        if (err) {
            console.error('Error updating user photo:', err);
            return res.status(500).send('Internal Server Error');
        }

        res.redirect('/admin/userPhoto'); // Redirect to user photo page
    });
});

router.post('/uploadSign', isAuthenticated, uploadPhoto.single('signature'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    // Get the file path and name
    const filePath = '/uploads/photos/' + req.file.filename;

    // Update the user photo path in the database
    const userId = req.session.userId;

    db.query('UPDATE employees SET signature = ? WHERE id = ?', [filePath, userId], (err, result) => {
        if (err) {
            console.error('Error updating user photo:', err);
            return res.status(500).send('Internal Server Error');
        }

        res.redirect('/admin/signSuccess'); // Redirect to user photo page
    });
});

const sendEmail = (to, subject, body) => {
    const msg = {
        to: to,
        from: 'your-email@example.com',  // Your email address from which to send
        subject: subject,
        text: body,
    };

    sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent successfully');
        })
        .catch((error) => {
            console.error('Error sending email:', error);
        });
};
router.get('/download/:id', (req, res) => {
    const fileId = req.params.id;  // Get the file ID from the URL

    // Fetch file details from the database using the file ID
    db.query('SELECT * FROM files WHERE id = ?', [fileId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal server error');
        }

        if (results.length === 0) {
            console.error(`File with ID ${fileId} not found in database`);
            return res.status(404).send('File not found in database');
        }

        const file = results[0];  // Get the file record

        let filePath = file.file_path;  // Get the file path stored in the DB

        console.log('Original file path from DB:', filePath);  // Debugging: Log original file path from DB

        // Check if the file path starts with 'uploads/' and remove it only once
        if (filePath.startsWith('uploads\\')) {
            filePath = filePath.replace('uploads\\', '');  // Remove the 'uploads\' prefix only once
        }

        console.log('Corrected file path (no "uploads/" prefix):', filePath);  // Debugging: Log corrected file path

        // Define the absolute path to the 'uploads' directory
        const uploadsDir = path.join(__dirname, '..', 'uploads');  // Correct path to the uploads folder

        console.log('Uploads directory:', uploadsDir);  // Debugging: Log the uploads directory path

        // Combine the uploadsDir with the corrected filePath to get the full path
        const fullFilePath = path.join(uploadsDir, filePath);

        console.log('Full file path:', fullFilePath);  // Debugging: Log the final full file path

        // Check if the file exists on the server
        fs.exists(fullFilePath, (exists) => {
            if (!exists) {
                console.error('File not found on server:', fullFilePath);  // If file doesn't exist
                return res.status(404).send('File not found on server');  // Send 404 error
            }

            // Serve the file for download
            res.download(fullFilePath, file.file_name, (err) => {
                if (err) {
                    console.error('Error during download:', err);  // If there's an error during download
                    res.status(500).send('File download failed');  // Send 500 error if download fails
                }
            });
        });
    });
});

// Export the router
module.exports = router;
