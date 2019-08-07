# bcs-to-sheets

### Instructions

Clone this repo.

Run npm install.

Navigate to Google Sheets API [reference page](https://developers.google.com/sheets/api/quickstart/nodejs)

1. Click on ENABLE THE GOOGLE SHEETS API in Step 1 shown on that page.
2. When the modal opens, click the DOWNLOAD CLIENT CONFIGURATION button. This will download a file named 'credentials.json'
3. Move 'credentials.json' to the root of the project directory.

4. Run npm start from the root of the project. Follow the prompts to create a .env file. Once you put in your Email, Password, and Google Sheet ID in the prompt it will fetch a list of your cohorts. Type in the courseId for the course you want to track and you are all set.

It will create a .env file at the root of the project that looks like this:

- EMAIL=**Your Bootcampspot email**
- BCS_PASSWORD=**Your Bootcampspot password**
- SHEET=**Google Sheet ID ex: sj7r-LuSE8mbV6lktPgmW7KUbbdlpeEIi0I1lUsSBgo (Can be found in sheet url)**
- COURSE=**Course ID Number (Found in BCS API call usually a 4 digit number)**

If you want to run through the process again, you can delete the .env file.

5. Run npm again start from the root of the project.

   - You should see an inquirer prompt, select the option to **'Get A Token From Google'**
   - Follow the instructions printed on the command line.

     **The app isn't verified warning.**

     > The OAuth consent screen that is presented to the user may show the warning "This app isn't verified" if it is requesting scopes that provide access to sensitive user data. During the development phase you can continue past this warning by clicking Advanced > Go to {Project Name} (unsafe).

   - You should receive a code from google to paste back into the command line.
   - If successful, 'token.json' will be created in the root of the project.
   - **DO NOT DELETE THIS FILE** - unless you want to get a new token for some reason.

Once you have 'token.json' in your project you now have read/write access for Google Sheets.

Setup is done! Run npm start again and choose your option.

- **'Get Course IDs'**:

  Fetches your user info from Bootcampspot and shows your list of cohorts and their course ids. One of which can be placed into the .env file to get grade data and run the sheet commands.

- **'Display Grades From BCS'**:

  Fetches grades for the selected homework a prints them out in various ways on the command line.

- **'Read from Google Sheets'**:

  This reads back your sheet file based on your selection range and prints it to the command line.
  Also displays counts of grades along with a table that groups students by grade.

- **'Write To Google Sheets'**:

  This fetches an authorization token from Bootcampspot, finds your specific course by the Course ID provided in the .env, fetches grades for your selected homework, then writes them to the sheet and range you provided in the prompt. This does not append new values to the sheet, it either updates existing fields in the range provided or creates them if they don't exist. It also creates headers for the columns (Student Name, Grade, Assignment) so you can start the range at the top row. Both values from BCS and updated Google Sheet values will be printed in the console.
