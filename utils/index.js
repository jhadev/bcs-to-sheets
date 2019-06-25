import prompt from './prompt';
import { authorize, getNewToken } from './auth';
import {
  email,
  password,
  courseId,
  spreadsheetId,
  assignments,
  gradesEndpoint,
  loginEndpoint,
  SCOPES,
  TOKEN_PATH
} from './config';

export {
  email,
  password,
  courseId,
  spreadsheetId,
  assignments,
  gradesEndpoint,
  loginEndpoint,
  SCOPES,
  TOKEN_PATH,
  prompt,
  authorize,
  getNewToken
};
