# bcs-to-sheets

### Instructions

Clone this repo.
Run npm install.

Navigate to Google Sheets API [reference page](https://developers.google.com/sheets/api/quickstart/nodejs)

Click on ENABLE THE GOOGLE SHEETS API in Step 1 shown on that page.
When the modal opens, click the DOWNLOAD CLIENT CONFIGURATION button.
This will download a file named 'credentials.json'
Move 'credentials.json' to the root of the project directory.

Create a .env file in the root of the project and add these fields

- EMAIL=YOUR BOOTCAMPSPOT EMAIL
- BCS_PASSWORD=YOUR BOOTCAMPSPOT PASSWORD
- SHEET=LINK TO YOUR GOOGLE SHEET ex: sj7r-LuSE8mbV6lktPgmW7KUbbdlpeEIi0I1lUsSBgo
- COURSE=COURSEID NUMBER FOUND IN BCS API RESPONSE

Run npm start from the root of the project.

You should see an inquirer prompt, select the option to 'Get A Token From Google'
Follow the instructions printed on the command line.
You should receive a code from google to paste back into the command line.
If successful, 'token.json' will be created in the root on the project.
DO NOT DELETE THIS FILE - unless you want to get a new token for some reason.

Once you have 'token.json' in your project you now have read/write access for Google Sheets.

Run npm start again and choose your option.

- 'Read from Google Sheets':

  This reads back your sheet file based on your selection range and prints it to the command line.

- 'Write To Google Sheets':

  This fetches an authorization token from Bootcampspot, finds your specific course by the courseId in the .env, and fetches grades for your selected homework, then writes them to the sheet and range you provided in the prompt. This does not append new values to the sheet, it either updates existing fields in the range provided or creates them if they don't exist. It also creates headers for the columns (Student Name, Grade) so you can start the range at the top row.

- 'Write And Verify':

  Does both commands above at once, first writes, then reads back.
