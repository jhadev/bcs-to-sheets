import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';
import axios from 'axios';
import { get } from 'http';
import {
  email,
  password,
  courseId,
  gradesEndpoint,
  loginEndpoint,
  spreadsheetId
} from './utils/config';
import prompt from './utils/prompt';
import { authorize, getNewToken } from './utils/auth';
import inquirer from 'inquirer';
const tokenPath = './token.json';

// query and sheet params homeworkTitle and selectionRange
const params = {};

const runPrompt = async () => {
  const {
    doChoice,
    assignmentChoice,
    sheetChoice,
    selectionChoice
  } = await inquirer.prompt(prompt);

  params.selectionRange = `${sheetChoice}!${selectionChoice}`;

  params.homeworkTitle = assignmentChoice;

  try {
    switch (doChoice) {
      case 'Get A Token From Google':
        verify(tokenCreated);
      case 'Read from Google Sheets':
        verify(readGradesFromSheet);
        break;
      case 'Write To Google Sheets':
        verify(writeGradesToSheets);
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
  const response = await axios.post(loginEndpoint, {
    email,
    password
  });
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
    gradesEndpoint,
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
    const grades = data
      .filter(({ assignmentTitle }) => params.homeworkTitle === assignmentTitle)
      .map(({ studentName, grade, assignmentTitle }) => [
        studentName,
        grade,
        assignmentTitle
      ]);

    return grades;
  } catch (err) {
    console.log(err);
  }
};

const writeGradesToSheets = async auth => {
  // just messing around has no use at the moment.
  // const mapStudentToGrade = new Map(grades);
  // console.log(mapStudentToGrade);

  const grades = await getGrades();

  const header = ['Student Name', 'Grade', 'Assignment'];
  grades.unshift(header);

  // define sheet options here
  const options = {
    spreadsheetId,
    range: params.selectionRange, //Change Sheet1 if your worksheet's name is something else
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
      console.log(`Selected Homework: ${params.homeworkTitle}`);
      console.log('LOCAL VALUES');
      console.table(grades);
      console.log('Sheet updated!');
      console.log('SHEET VALUES');
      console.table(response.config.data.values);
    }
    runPrompt();
  });
};

const readGradesFromSheet = auth => {
  const sheets = google.sheets({ version: 'v4', auth });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId,
      range: params.selectionRange //Change Sheet1 if your worksheet's name is something else
    },
    (err, response) => {
      if (err) {
        return console.log(err.errors);
      }
      const rows = response.data.values;
      if (rows.length) {
        rows.map(row => {
          row.length === 1 ? (row.length = 2) && (row[1] = 'Ungraded') : null;
          const [name, grade, assignment] = row;
          row = { name, grade, assignment };
          params.homeworkTitle !== undefined
            ? console.log(params.homeworkTitle)
            : null;
          console.log(
            `=================================================================`
          );
          console.log(row);
        });
        console.log(`Rows: ${rows.length}`);
        console.table(rows);
      } else {
        console.log('No data found.');
      }
      runPrompt();
    }
  );
};

const checkIfTokenExists = () => {
  try {
    if (fs.existsSync(tokenPath)) {
      //file exists
      prompt[0].choices.shift();
    } else {
      prompt[0].choices = [prompt[0].choices[0], prompt[0].choices[3]];
    }
  } catch (err) {
    console.error(err);
  }
};

// RUN
checkIfTokenExists();
runPrompt();
