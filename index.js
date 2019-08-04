import fs from 'fs';
import { table } from 'table';
import { google } from 'googleapis';
import axios from 'axios';
import inquirer from 'inquirer';
import wunderbar from '@gribnoysup/wunderbar';
import {
  email,
  password,
  courseId,
  gradesEndpoint,
  loginEndpoint,
  userEndpoint,
  spreadsheetId,
  prompt,
  authorize,
  TOKEN_PATH,
  groupByGradeConfig,
  countConfig,
  readConfig
} from './utils/';

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
      case 'Get Course IDs':
        getCourseIds();
        break;
      case 'Display Grades From BCS':
        displayGrades();
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

const getCourseIds = async () => {
  const authToken = await login();
  console.log(`BCS AUTH TOKEN: ${authToken}\n`);

  try {
    const response = await axios.post(
      userEndpoint,
      {},
      {
        headers: {
          authToken
        }
      }
    );
    // filter from
    const { userAccount, enrollments } = response.data;

    console.log(`ID: ${userAccount.id}`);
    console.log(`Name: ${userAccount.firstName} ${userAccount.lastName}`);
    console.log(`Username: ${userAccount.userName}`);

    const courses = enrollments.map(({ course }) => ({
      courseId: course.id,
      name: course.name,
      startDate: course.startDate,
      endDate: course.endDate
    }));
    console.log(`\ncourse id can be put into the .env file for setup\n`);
    console.table(courses);
    runPrompt();
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
        if (!submitted) {
          return [studentName, 'Unsubmitted', assignmentTitle];
        }
        return [studentName, grade, assignmentTitle];
      });

    return grades;
  } catch (err) {
    console.log(err);
  }
};

const displayGrades = async () => {
  try {
    const grades = await getGrades();
    console.log(`Selected Homework: ${params.homeworkTitle}`);
    const rows = convertUngraded(grades);
    console.log(`\n Rows: ${rows.length}`);
    console.log(table(rows, readConfig));
    displayGradesCount(rows);
    displayGroupByGrade(rows);
    runPrompt();
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
        const rows = convertUngraded(values);
        console.log(`\n Rows: ${rows.length}`);
        console.log(table(rows, readConfig));
        displayGradesCount(rows);
        displayGroupByGrade(rows);
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
      prompt[0].choices = [
        prompt[0].choices[0],
        prompt[0].choices[1],
        prompt[0].choices[5]
      ];
    }
  } catch (err) {
    console.error(err);
  }
};

const printBarChart = arr => {
  const { chart, legend, scale, __raw } = wunderbar(arr, {
    min: 0,
    length: 42,
    sort: 'none'
  });

  console.log();
  console.log(chart);
  console.log();
  console.log(scale);
  console.log(legend);
};

const displayGradesCount = arr => {
  const gradesCount = arr
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
  const setBarChart = countByGrade.map(([grade, total]) => ({
    value: total,
    label: grade
  }));

  console.log(table(countByGrade, countConfig));
  printBarChart(setBarChart);
};

const displayGroupByGrade = arr => {
  const groupByGrade = arr
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
};

const convertUngraded = arr => {
  const rows = arr.map(([name, grade, assignment]) => {
    if (!grade) {
      grade = 'Submitted But Ungraded';
    }
    return [name, grade, assignment];
  });

  return rows;
};

// RUN
checkIfTokenExists();
runPrompt();
