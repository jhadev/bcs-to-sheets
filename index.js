import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';
import axios from 'axios';
import { get } from 'http';
import {
  email,
  password,
  assignments,
  courseId,
  spreadsheetId
} from './utils/config';
import { authorize, getNewToken } from './utils/auth';
import inquirer from 'inquirer';

let grades = [];
let homeworkTitle = '';
let selectionRange = '';

const prompt = [
  {
    type: 'list',
    name: 'doChoice',
    message: 'What would you like to do?',
    choices: [
      'Get A Token From Google',
      'Read from Google Sheets',
      'Write To Google Sheets',
      'Write And Verify',
      'Quit'
    ]
  },
  {
    type: 'input',
    name: 'selectionChoice',
    message: 'Enter your sheet selection range in this format - Sheet1!A1:B',
    validate: input => (typeof input === 'string' ? true : false),
    when: answer =>
      answer.doChoice !== 'Quit' &&
      answer.doChoice !== 'Get A Token From Google'
  },
  {
    type: 'list',
    name: 'assignmentChoice',
    message: 'Which assignment would you like to send to Google Sheets?',
    choices: assignments,
    when: answer =>
      answer.doChoice === 'Write To Google Sheets' ||
      answer.doChoice === 'Write And Verify'
  }
];

const runPrompt = async () => {
  const { doChoice, assignmentChoice, selectionChoice } = await inquirer.prompt(
    prompt
  );

  selectionRange = selectionChoice;

  homeworkTitle = assignmentChoice;

  try {
    switch (doChoice) {
      case 'Get A Token From Google':
        verify(tokenCreated);
      case 'Read from Google Sheets':
        verify(readFromSheet);
        break;
      case 'Write To Google Sheets':
        getGrades();
        break;
      case 'Write And Verify':
        // get grades from bcs, update sheets, then read back sheet file.
        getGrades().then(() => verify(readFromSheet));
        break;
      case 'Quit':
        process.exit();
        break;
      default:
        console.log('Hi');
    }
  } catch (err) {
    console.log(err);
  }
};

const verify = callback => {
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), callback);
  });
};

const tokenCreated = () => console.log('token.json has been created');

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
  console.log(`BCS AUTH TOKEN: ${authToken}`);
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
      .map(({ studentName, grade, assignmentTitle }) => [
        studentName,
        grade,
        assignmentTitle
      ]);
    verify(printGradesToSheets);
  } catch (err) {
    console.log(err);
  }
};

const printGradesToSheets = auth => {
  // just messing around has no use at the moment.
  // const mapStudentToGrade = new Map(grades);
  // console.log(mapStudentToGrade);

  const header = ['Student Name', 'Grade', 'Assignment'];
  grades.unshift(header);

  // define sheet options here
  const options = {
    spreadsheetId,
    range: selectionRange, //Change Sheet1 if your worksheet's name is something else
    valueInputOption: 'USER_ENTERED',
    // insertDataOption: 'OVERWRITE', //INSERT_ROWS
    responseValueRenderOption: 'FORMATTED_VALUE',
    resource: {
      values: grades
    }
  };

  const sheets = google.sheets({ version: 'v4', auth });
  // UPDATE WILL OVERWRITE EXISTING FIELDS BUT NOW CREATE NEW ROWS.
  sheets.spreadsheets.values.update(options, (err, response) => {
    if (err) {
      console.log(`The API returned an error: ${err}`);
      return;
    } else {
      console.log(`Selected Homework: ${homeworkTitle}`);
      console.log(grades);
      console.log('Sheet updated!');
    }
  });
};

const readFromSheet = auth => {
  const sheets = google.sheets({ version: 'v4', auth });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId,
      range: selectionRange //Change Sheet1 if your worksheet's name is something else
    },
    (err, response) => {
      if (err) {
        return console.log(err.errors);
      }
      const rows = response.data.values;
      if (rows.length) {
        // only prints 2 rows at the moment
        rows.map(row => {
          row.length === 1 ? (row.length = 2) && (row[1] = 'Ungraded') : null;
          const [name, grade, assignment] = row;
          row = { name, grade, assignment };
          homeworkTitle !== undefined ? console.log(homeworkTitle) : null;
          console.log(
            `=================================================================`
          );
          console.table(row);
        });
        console.log(`Rows: ${rows.length}`);
      } else {
        console.log('No data found.');
      }
    }
  );
};

// RUN

runPrompt();
