var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'lms'
});

const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const sheets = google.sheets('v4');
const { GoogleSpreadsheet } = require('google-spreadsheet');

module.exports = {
    submitscore: function(url,lesson,student_number) {
        // If modifying these scopes, delete token.json.
        const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
        // The file token.json stores the user's access and refresh tokens, and is
        // created automatically when the authorization flow completes for the first
        // time.
        const TOKEN_PATH = 'token.json';

        // Load client secrets from a local file.
        fs.readFile('credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            // Authorize a client with credentials, then call the Google Sheets API.
            authorize(JSON.parse(content), listMajors);
        });

        /**
         * Create an OAuth2 client with the given credentials, and then execute the
         * given callback function.
         * @param {Object} credentials The authorization client credentials.
         * @param {function} callback The callback to call with the authorized client.
         */
        function authorize(credentials, callback) {
            const { client_secret, client_id, redirect_uris } = credentials.installed;
            const oAuth2Client = new google.auth.OAuth2(
                client_id, client_secret, redirect_uris[0]);

            // Check if we have previously stored a token.
            fs.readFile(TOKEN_PATH, (err, token) => {
                if (err) return getNewToken(oAuth2Client, callback);
                oAuth2Client.setCredentials(JSON.parse(token));
                callback(oAuth2Client);
            });
        }

        /**
         * Get and store new token after prompting for user authorization, and then
         * execute the given callback with the authorized OAuth2 client.
         * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
         * @param {getEventsCallback} callback The callback for the authorized client.
         */
        function getNewToken(oAuth2Client, callback) {
            const authUrl = oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: SCOPES,
            });
            console.log('Authorize this app by visiting this url:', authUrl);
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            rl.question('Enter the code from that page here: ', (code) => {
                rl.close();
                oAuth2Client.getToken(code, (err, token) => {
                    if (err) return console.error('Error while trying to retrieve access token', err);
                    oAuth2Client.setCredentials(token);
                    // Store the token to disk for later program executions
                    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                        if (err) return console.error(err);
                        console.log('Token stored to', TOKEN_PATH);
                    });
                    callback(oAuth2Client);
                });
            });
        }

        /**
         * Prints the names and majors of students in a sample spreadsheet:
         * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
         * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
         */
        function listMajors(auth) {
            const sheets = google.sheets({ version: 'v4', auth });
            sheets.spreadsheets.values.get({
                spreadsheetId: url,
                range: 'A2:C',
            }, (err, res) => {
                if (err) return console.log('The API returned an error: ' + err);
                const rows = res.data.values;
                if (rows.length) {
                    //console.log('Time, Score, ID:');
                    // Print columns A and E, which correspond to indices 0 and 4.
                    rows.map((row) => {
                        //    console.log(row);
                        if (row[2] == student_number) {
                            var data = row[1].split("/");
                            //console.log(data[0]);
                            if (lesson == 0) {
                                connection.query('UPDATE result SET pretest = ?, statecheck = 1 WHERE student_number = ?', [data[0], student_number], function (error, results, fields) { });
                            } else if (lesson == 1) {
                                connection.query('UPDATE result SET test01 = ? WHERE student_number = ?', [data[0], student_number], function (error, results, fields) { });
                            } else if (lesson == 2) {
                                connection.query('UPDATE result SET test02 = ? WHERE student_number = ?', [data[0], student_number], function (error, results, fields) { });
                            } else if (lesson == 3) {
                                connection.query('UPDATE result SET test03 = ? WHERE student_number = ?', [data[0], student_number], function (error, results, fields) { });
                            } else if (lesson == 4) {
                                connection.query('UPDATE result SET test04 = ? WHERE student_number = ?', [data[0], student_number], function (error, results, fields) { });
                            } else if (lesson == 5) {
                                connection.query('UPDATE result SET test05 = ? WHERE student_number = ?', [data[0], student_number], function (error, results, fields) { });
                            } else if (lesson == 6) {
                                connection.query('UPDATE result SET test06 = ? WHERE student_number = ?', [data[0], student_number], function (error, results, fields) { });
                            } else if (lesson == 7) {
                                connection.query('UPDATE result SET test07 = ? WHERE student_number = ?', [data[0], student_number], function (error, results, fields) { });
                            } else if (lesson == 8) {
                                connection.query('UPDATE result SET test08 = ? WHERE student_number = ?', [data[0], student_number], function (error, results, fields) { });
                            } else if (lesson == 9) {
                                connection.query('UPDATE result SET test09 = ? WHERE student_number = ?', [data[0], student_number], function (error, results, fields) { });
                            } else if (lesson == 10) {
                                connection.query('UPDATE result SET test10 = ? WHERE student_number = ?', [data[0], student_number], function (error, results, fields) { });
                            } else if (lesson == 11) {
                                connection.query('UPDATE result SET posttest = ? WHERE student_number = ?', [data[0], student_number], function (error, results, fields) { });
                            }
                            //connection.query('UPDATE result SET ch01test = ? WHERE student_number = ?', [data[0], student_number], function (error, results, fields) {
                            //});
                            //console.log(`${row[0]}, ${row[1]}, ${row[2]}`);
                        }
                    });
                } else {
                    console.log('No data found.');
                }
            });
        }
    }
}