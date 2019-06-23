import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';
import axios from 'axios';
import { get } from 'http';
import {
  email,
  password,
  homeworkTitle,
  courseId,
  spreadsheetId
} from './utils/config';
import { authorize, getNewToken } from './utils/auth';
import inquirer from 'inquirer';

let grades = [];

const prompt = [
  {
    type: 'list',
    name: 'choices',
    message: 'What would you like to do?',
    choices: ['Read from Google Sheets', 'Write To Google Sheets', 'Quit']
  }
];

inquirer.prompt(prompt).then(answers => {
  //use switch case to choose which functions to run
  switch (answers.choices) {
    case 'Read from Google Sheets':
      verify(readFromSheet);
      break;
    case 'Write To Google Sheets':
      getGrades();
      break;
    case 'Quit':
      process.exit();
      break;
    default:
      console.log('Hi');
  }
});

const verify = callback =>
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), callback);
  });

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
    verify(printGradesToSheets);
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
    spreadsheetId,
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

const readFromSheet = auth => {
  const sheets = google.sheets({ version: 'v4', auth });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId,
      range: 'Sheet1!A2:B' //Change Sheet1 if your worksheet's name is something else
    },
    (err, response) => {
      if (err) {
        throw new Error('API crapped out');
      }
      const rows = response.data.values;
      if (rows.length) {
        console.log(homeworkTitle);
        // Print columns A and E, which correspond to indices 0 and 4.
        rows.map(row => {
          row.length === 1 ? (row.length = 2) && (row[1] = 'Ungraded') : null;
          const [name, grade] = row;
          console.log(`${name}, ${grade}`);
        });
      } else {
        console.log('No data found.');
      }
    }
  );
};

// RUN

// get grades from bcs, update sheets, then read back sheet file.
// getGrades().then(() => verify(readFromSheet));
