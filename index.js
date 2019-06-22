import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';
import axios from 'axios';
import { get } from 'http';
import 'dotenv/config';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

let authToken = '';
const email = 'joshappeldev+ta@gmail.com';
const password = process.env.BCS_PASSWORD;
const homeworkTitle = '0: Web Development Prework';
let grades = [];

// START GOOGLE AUTH
// If modifying these scopes, delete token.json.

// Load client secrets from a local file.
const authorize = (credentials, callback) => {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
};

const getNewToken = (oAuth2Client, callback) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', code => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err)
        return console.error(
          'Error while trying to retrieve access token',
          err
        );
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
};

const login = async () => {
  const response = await axios.post(
    'https://bootcampspot.com/api/instructor/v1/login',
    {
      email: email,
      password: password
    }
  );
  return response;
};

login()
  .then(res => {
    const { data } = res;
    authToken = data.authenticationInfo.authToken;
    return authToken;
  })
  .then(() => {
    getGrades().then(res => {
      const { data } = res;
      grades = data
        .filter(({ assignmentTitle }) => homeworkTitle === assignmentTitle)
        .map(({ studentName, grade }) => [studentName, grade]);
      fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Sheets API.
        authorize(JSON.parse(content), printGradesToSheets);
      });
    });
  })
  .catch(err => console.log(err));

const getGrades = async () => {
  const response = await axios.post(
    'https://bootcampspot.com/api/instructor/v1/grades',
    {
      courseId: 1569
    },
    {
      headers: {
        authToken: authToken
      }
    }
  );
  return response;
};

const printGradesToSheets = auth => {
  const sheets = google.sheets({ version: 'v4', auth });
  sheets.spreadsheets.values.append(
    {
      spreadsheetId: '1sj7r-LuSE8mbV6lktPgmW7KUzxeoxeEIi0I1lUsSBgo',
      range: 'Sheet1!A2:B', //Change Sheet1 if your worksheet's name is something else
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: grades
      }
    },
    (err, response) => {
      if (err) {
        console.log(`The API returned an error: ${err}`);
        return;
      } else {
        console.log(grades);
        console.log('Appended');
      }
    }
  );
};
