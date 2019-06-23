import 'dotenv/config';

const email = process.env.EMAIL;
const password = process.env.BCS_PASSWORD;
const courseId = parseInt(process.env.COURSE);
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const spreadsheetId = process.env.SHEET;
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

const assignments = [
  '1: Building a Wireframe / That Portfolio Though',
  '2: Responsiveness Assignment',
  '3: JavaScript Assignment',
  '4: jQuery Assignment',
  '5: JavaScript Assignment 2',
  '6: GifTastic',
  '7: Train Scheduler (Basic - Recommended) / Rock Paper Scissors (Challenge)',
  '8: LIRI Bot',
  '9: Advanced JavaScript Assignment: Constructor Word Guess',
  '10: Node.js & MySQL',
  '11: Friend Finder - Node and Express Servers',
  '12: Node Express Handlebars',
  '13: Burger 2: The Sequel',
  "14: All the News That's Fit to Scrape",
  '15: Clicky Game',
  '16: Google Books React Search'
];

export {
  email,
  password,
  courseId,
  spreadsheetId,
  assignments,
  SCOPES,
  TOKEN_PATH
};
