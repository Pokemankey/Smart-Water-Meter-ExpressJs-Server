const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json()); // Parse incoming request body as JSON
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodie

// Create MySQL Connection
const connection = mysql.createConnection({
    host: '',
    user: '',
    password: '',
    database: ''
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database!');
});

app.post('/login', (req, res) => {
    const { username, pass } = req.body; // Get username and password from the request body

    // Check if username and password exist
    if (!username || !pass) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Query the database to check if the user exists with the provided credentials
    const query = 'SELECT * FROM Users WHERE username = ? AND pass = ?';
    connection.query(query, [username, pass], (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length === 1) {
            // User with the provided credentials exists
            return res.status(200).json({ message: 'Login successful' });
        } else {
            // No user found with the provided credentials
            return res.status(401).json({ message: 'Invalid username or password' });
        }
    });
});

app.get('/arduinoId/:username', (req, res) => {
    const { username } = req.params; // Get username from the request params

    // Query the database to fetch Arduino ID based on the provided username
    const query = 'SELECT arduinoId FROM Users WHERE username = ?';
    connection.query(query, [username], (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length === 1) {
            const arduinoId = results[0].arduinoId;
            return res.status(200).json({ arduinoId });
        } else {
            return res.status(404).json({ message: 'Username not found' });
        }
    });
});

app.get('/waterUsage/:arduinoId', (req, res) => {
    const { arduinoId } = req.params; // Get Arduino ID from the request params

    // Get the current date
    const currentDate = new Date().toISOString().slice(0, 10);

    console.log(currentDate);

    // Query the database to fetch the sum of water usage for the provided Arduino ID on the current day
    const query = 'SELECT SUM(waterUsage) AS totalUsage FROM WaterUsage WHERE arduinoId = ? AND DATE(date_time) = ?';
    connection.query(query, [arduinoId, currentDate], (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }

        const totalUsage = results[0].totalUsage || 0; // Extract the total usage from the result

        return res.status(200).json({ totalUsage });
    });
});

app.get('/waterUsage/currentMonth/:arduinoId', (req, res) => {
    const { arduinoId } = req.params;

    // Get the start date of the current month
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startDate = startOfMonth.toISOString().slice(0, 10);

    // Get the current date
    const currentDateISO = currentDate.toISOString().slice(0, 10);

    const query = `
        SELECT DATE(date_time) AS day, SUM(waterUsage) AS totalUsage
        FROM WaterUsage
        WHERE arduinoId = ? AND DATE(date_time) >= ? AND DATE(date_time) <= ?
        GROUP BY DATE(date_time)
    `;
    connection.query(query, [arduinoId, startDate, currentDateISO], (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }

        return res.status(200).json({ waterUsagePerDay: results });
    });
});


const PORT = process.env.PORT || 3306;

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


// // Define a simple route
// app.get('/', (req, res) => {
//     // Example query to fetch data
//     connection.query('SELECT * FROM your_table', (err, results) => {
//         if (err) {
//             console.error('Error executing query:', err);
//             res.status(500).send('Error fetching data');
//             return;
//         }
//         res.json(results); // Assuming a JSON response
//     });
// });


// // To get user details with a specific id
// app.get('/users/:userId', (req, res) => {
//     const userId = req.params.userId;

//     const query = 'SELECT id, pass, arduinoId FROM Users WHERE id = ?';

//     connection.query(query, [userId], (err, results) => {
//         if (err) {
//             console.error('Error fetching user details:', err);
//             res.status(500).send('Error fetching user details');
//             return;
//         }

//         if (results.length === 0) {
//             res.status(404).send('User not found');
//             return;
//         }

//         const user = results[0]; // Assuming there's only one user with this ID
//         res.json(user);
//     });
// });
