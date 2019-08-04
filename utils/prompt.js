import assignments from './assignments';

const prompt = [
  {
    type: 'list',
    name: 'doChoice',
    message: 'What would you like to do?',
    choices: [
      'Get A Token From Google',
      'Get Course IDs',
      'Display Grades From BCS',
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
      answer.doChoice === 'Read from Google Sheets' ||
      answer.doChoice === 'Write To Google Sheets'
  },
  {
    type: 'input',
    name: 'selectionChoice',
    message: 'Enter your sheet selection range in this format - A1:C',
    validate: input => (typeof input === 'string' ? true : false),
    when: answer =>
      answer.doChoice === 'Read from Google Sheets' ||
      answer.doChoice === 'Write To Google Sheets'
  },
  {
    type: 'list',
    name: 'assignmentChoice',
    message: 'Which assignment would you like to send to Google Sheets?',
    choices: assignments,
    when: answer =>
      answer.doChoice === 'Write To Google Sheets' ||
      answer.doChoice === 'Display Grades From BCS'
  }
];

export default prompt;
