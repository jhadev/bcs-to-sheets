import 'dotenv/config';

// will probably be inquirer options
const email = process.env.EMAIL;
const password = process.env.BCS_PASSWORD;
const courseId = process.env.COURSE;
// this needs to be an inquirer option
const homeworkTitle = '0: Web Development Prework';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
const spreadsheetId = process.env.SHEET;

export {
  email,
  password,
  homeworkTitle,
  courseId,
  spreadsheetId,
  SCOPES,
  TOKEN_PATH
};
