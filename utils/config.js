import 'dotenv/config';

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.BCS_PASSWORD;
const COURSE_ID = parseInt(process.env.COURSE);
const SHEET_ID = process.env.SHEET;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';
const LOGIN_ENDPOINT = 'https://bootcampspot.com/api/instructor/v1/login';
const GRADES_ENDPOINT = 'https://bootcampspot.com/api/instructor/v1/grades';
const USER_ENDPOINT = 'https://bootcampspot.com/api/instructor/v1/me';
// CHANGE ASSIGNMENTS FOR DATA CLASS here
export {
  EMAIL,
  PASSWORD,
  COURSE_ID,
  SHEET_ID,
  GRADES_ENDPOINT,
  LOGIN_ENDPOINT,
  USER_ENDPOINT,
  SCOPES,
  TOKEN_PATH
};
