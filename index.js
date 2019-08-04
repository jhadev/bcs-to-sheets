import fs from 'fs';
import { table } from 'table';
import { google } from 'googleapis';
import axios from 'axios';
import inquirer from 'inquirer';
import wunderbar from '@gribnoysup/wunderbar';
import handle from './utils/handle';
import prompt from './utils/prompt';
import { authorize } from './utils/auth';
import { groupByGradeConfig, countConfig, readConfig } from './utils/tables';
import {
  EMAIL,
  PASSWORD,
  COURSE_ID,
  GRADES_ENDPOINT,
  LOGIN_ENDPOINT,
  USER_ENDPOINT,
  SHEET_ID,
  TOKEN_PATH
} from './utils/config';

// EXCUSE THE MESS

// query and sheet params homeworkTitle and selectionRange
const params = {};

const runPrompt = async () => {
  const [promptErr, promptSuccess] = await handle(inquirer.prompt(prompt));

  if (promptErr) {
    return console.log(promptErr);
  }

  const {
    doChoice,
    assignmentChoice,
    selectionChoice,
    sheetChoice
  } = promptSuccess;

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
  const [loginErr, loginSuccess] = await handle(
    axios.post(LOGIN_ENDPOINT, {
      EMAIL,
      PASSWORD
    })
  );

  if (loginErr) {
    return console.log(loginErr);
  }

  const { authToken } = loginSuccess.data.authenticationInfo;
  return authToken;
};

const getCourseIds = async () => {
  const [authTokenErr, authTokenSuccess] = await handle(login());

  if (authTokenErr) {
    return console.log(authTokenErr);
  }

  const authToken = authTokenSuccess;
  console.log(`BCS AUTH TOKEN: ${authToken}\n`);

  const [userDataErr, userDataSuccess] = await handle(
    axios.post(
      USER_ENDPOINT,
      {},
      {
        headers: {
          authToken
        }
      }
    )
  );

  if (userDataErr) {
    return console.log(userDataErr);
  }
  // filter from
  const { userAccount, enrollments } = userDataSuccess.data;

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
};

// await token and request grades for specific class via courseId
const getGrades = async () => {
  const [authTokenErr, authTokenSuccess] = await handle(login());

  if (authTokenErr) {
    return console.log(authTokenErr);
  }

  const authToken = authTokenSuccess;
  console.log(`BCS AUTH TOKEN: ${authToken}\n`);

  const [getGradesErr, getGradesSuccess] = await handle(
    axios.post(
      GRADES_ENDPOINT,
      {
        courseId: COURSE_ID
      },
      {
        headers: {
          authToken
        }
      }
    )
  );

  if (getGradesErr) {
    return console.log(getGradesErr);
  }
  // filter from
  const { data } = getGradesSuccess;
  const grades = data
    .filter(({ assignmentTitle }) => params.homeworkTitle === assignmentTitle)
    .map(({ studentName, grade, assignmentTitle, submitted }) => {
      if (!submitted) {
        return [studentName, 'Unsubmitted', assignmentTitle];
      }
      return [studentName, grade, assignmentTitle];
    });

  return grades;
};

const displayGrades = async () => {
  const [gradesErr, grades] = await handle(getGrades());

  if (gradesErr) {
    return console.log(gradesErr);
  }

  console.log(`Selected Homework: ${params.homeworkTitle}`);
  const rows = convertUngraded(grades);
  console.log(`\n Rows: ${rows.length}`);
  console.log(table(rows, readConfig));
  displayGradesCount(rows);
  displayGroupByGrade(rows);
  runPrompt();
};

const writeGradesToSheet = async auth => {
  const [gradesErr, grades] = await handle(getGrades());

  if (gradesErr) {
    return console.log(gradesErr);
  }
  const header = ['Student Name', 'Grade', 'Assignment'];
  grades.unshift(header);
  // define sheet options here
  const options = {
    SHEET_ID,
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
      SHEET_ID,
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
  fs.access(TOKEN_PATH, fs.F_OK, err => {
    if (err) {
      console.log(
        `  token.json doesn't exist, please select 'Get A Token From Google to continue.\n`
      );
      console.log(
        `  You can also get the course ids for your classes by selecting 'Get Course IDs'.\n`
      );
      prompt[0].choices = [
        prompt[0].choices[0],
        prompt[0].choices[1],
        prompt[0].choices[5]
      ];
      runPrompt();
    } else {
      //file exists
      prompt[0].choices.shift();
      runPrompt();
    }
  });
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
    .map(([, grade, ,]) => grade)
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
