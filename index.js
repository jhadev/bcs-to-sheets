import fs from 'fs';
import { table } from 'table';
import { google } from 'googleapis';
import axios from 'axios';
import {
  email,
  password,
  courseId,
  gradesEndpoint,
  loginEndpoint,
  spreadsheetId,
  prompt,
  authorize,
  TOKEN_PATH,
  groupByGradeConfig,
  countConfig,
  readConfig
} from './utils/';
import inquirer from 'inquirer';

// EXCUSE THE MESS

// query and sheet params homeworkTitle and selectionRange
const params = {};

const runPrompt = async () => {
  try {
    const {
      doChoice,
      assignmentChoice,
      sheetChoice,
      selectionChoice
    } = await inquirer.prompt(prompt);

    params.selectionRange = `${sheetChoice}!${selectionChoice}`;

    params.homeworkTitle = assignmentChoice;

    switch (doChoice) {
      case 'Get A Token From Google':
        verify(tokenCreated);
        break;
      case 'Read from Google Sheets':
        verify(readGradesFromSheet);
        break;
      case 'Write To Google Sheets':
        verify(writeGradesToSheet);
        break;
      case 'Quit':
        process.exit();
        break;
      default:
        console.log('Something went wrong. Oops.');
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

const tokenCreated = () =>
  console.log('token.json has been created. Run npm start again.');

// request an authToken from BCS
const login = async () => {
  try {
    const response = await axios.post(loginEndpoint, {
      email,
      password
    });
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

  try {
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
    // filter from
    const { data } = response;
    const grades = data
      .filter(({ assignmentTitle }) => params.homeworkTitle === assignmentTitle)
      .map(({ studentName, grade, assignmentTitle, submitted }) => {
        if (submitted) {
          return [studentName, grade, assignmentTitle];
        } else {
          return [studentName, 'Unsubmitted', assignmentTitle];
        }
      });

    return grades;
  } catch (err) {
    console.log(err);
  }
};

const writeGradesToSheet = async auth => {
  const grades = await getGrades();

  const header = ['Student Name', 'Grade', 'Assignment'];
  grades.unshift(header);
  // define sheet options here
  const options = {
    spreadsheetId,
    range: params.selectionRange,
    valueInputOption: 'USER_ENTERED',
    // insertDataOption: 'OVERWRITE', //INSERT_ROWS
    responseValueRenderOption: 'FORMATTED_VALUE',
    resource: {
      values: grades
    }
  };

  const sheets = google.sheets({ version: 'v4', auth });
  // UPDATE WILL OVERWRITE EXISTING FIELDS BUT NOT CREATE NEW ROWS UNLESS THEY DO NOT EXIST.
  sheets.spreadsheets.values.update(options, (err, response) => {
    if (err) {
      console.log(`The API returned an error: ${err}`);
      return;
    } else {
      console.log(`Selected Homework: ${params.homeworkTitle}`);
      console.log('GRADES FROM BCS');
      console.table(grades);
      console.log('Sheet updated!');
      console.log('GOOGLE SHEET VALUES');
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
      range: params.selectionRange
    },
    (err, response) => {
      if (err) {
        return console.log(err.errors);
      }
      const { values } = response.data;
      // TODO: Clean this mess up.
      if (values.length) {
        const rows = values.map(([name, grade, assignment]) => {
          if (!grade) {
            grade = 'Submitted But Ungraded';
          }
          return [name, grade, assignment];
        });
        console.log(`\n Rows: ${rows.length}`);
        console.log(table(rows, readConfig));

        const gradesCount = rows
          .map(([name, grade, assignment]) => grade)
          .reduce((map, grade) => {
            if (map.has(grade)) {
              map.set(grade, map.get(grade) + 1);
            } else {
              map.set(grade, 1);
            }
            map.delete('Grade');
            return map;
          }, new Map());
        console.log(`\nGrades Count\n`);

        const countByGrade = [...gradesCount.entries()].sort();
        console.log(table(countByGrade, countConfig));

        const groupByGrade = rows
          .map(([name, grade]) => ({
            name,
            grade
          }))
          .reduce((map, { name, grade }) => {
            if (map.has(grade)) {
              map.set(grade, [...map.get(grade), name]);
            } else {
              map.set(grade, [name]);
            }
            map.delete('Grade');
            return map;
          }, new Map());

        const gradesTable = [...groupByGrade.entries()].sort();
        console.log(`\nGroup By Grade\n`);
        console.log(table(gradesTable, groupByGradeConfig));
      } else {
        console.log('No data found.');
      }
      runPrompt();
    }
  );
};

const checkIfTokenExists = () => {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
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
