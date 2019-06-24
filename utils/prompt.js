import { assignments } from './config';

const prompt = [
  {
    type: 'list',
    name: 'doChoice',
    message: 'What would you like to do?',
    choices: [
      'Get A Token From Google',
      'Read from Google Sheets',
      'Write To Google Sheets',
      'Quit'
    ]
  },
  {
    type: 'input',
    name: 'sheetChoice',
    message: 'Enter your sheet name ex: Sheet1 or Week-1',
    validate: input => (typeof input === 'string' ? true : false),
    when: answer =>
      answer.doChoice !== 'Quit' &&
      answer.doChoice !== 'Get A Token From Google'
  },
  {
    type: 'input',
    name: 'selectionChoice',
    message: 'Enter your sheet selection range in this format - A1:C',
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
    when: answer => answer.doChoice === 'Write To Google Sheets'
  }
];

export { prompt as default };
