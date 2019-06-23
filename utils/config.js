import 'dotenv/config';

const email = 'joshappeldev+ta@gmail.com';
const password = process.env.BCS_PASSWORD;
const homeworkTitle = '0: Web Development Prework';
const courseId = 1569;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

export { email, password, homeworkTitle, courseId, SCOPES, TOKEN_PATH };
