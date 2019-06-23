import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';
import axios from 'axios';
import { get } from 'http';
import { email, password, homeworkTitle, courseId } from './utils/config';
import { authorize, getNewToken } from './utils/auth';

let grades = [];

// request an authToken from BCS
const login = async () => {
  const response = await axios.post(
    'https://bootcampspot.com/api/instructor/v1/login',
    {
      email: email,
      password: password
    }
  );
  try {
    const { authToken } = response.data.authenticationInfo;
    return authToken;
  } catch (err) {
    console.log(err);
  }
};

// await token and request grades for specific class via courseId
const getGrades = async () => {
  const authToken = await login();
  console.log(authToken);
  const response = await axios.post(
    'https://bootcampspot.com/api/instructor/v1/grades',
    {
      courseId
    },
    {
      headers: {
        authToken
      }
    }
  );
  try {
    // filter from
    const { data } = response;
    grades = data
      .filter(({ assignmentTitle }) => homeworkTitle === assignmentTitle)
      .map(({ studentName, grade }) => [studentName, grade]);
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.
      authorize(JSON.parse(content), printGradesToSheets);
    });
  } catch (err) {
    console.log(err);
  }
};

const printGradesToSheets = auth => {
  // just messing around has no use at the moment.
  const mapStudentToGrade = new Map(grades);
  console.log(mapStudentToGrade);

  // define sheet options here
  const options = {
    spreadsheetId: '1sj7r-LuSE8mbV6lktPgmW7KUzxeoxeEIi0I1lUsSBgo',
    range: 'Sheet1!A2:B', //Change Sheet1 if your worksheet's name is something else
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'OVERWRITE', //INSERT_ROWS
    resource: {
      values: grades
    }
  };

  const sheets = google.sheets({ version: 'v4', auth });
  sheets.spreadsheets.values.append(options, (err, response) => {
    if (err) {
      console.log(`The API returned an error: ${err}`);
      return;
    } else {
      console.log(grades);
      console.log('Appended');
    }
  });
};

// RUN

getGrades();
