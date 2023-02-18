const express = require('express');
const stream = require("stream");
const { google } = require('googleapis');
const mysqldump = require('mysqldump');
const path = require("path");
const fs = require("fs");
const fileContent = fs.readFileSync("test.sql");
const KEYFILEPATH = path.join(__dirname, "credentials.json");
const SCOPES = ["https://www.googleapis.com/auth/drive"];
// 載入 dotenv
require('dotenv').config();

const app = express();
app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});

//驗證google
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

// 備份與上傳
app.get('/mysql', (req, res) => {
  res.send('備份資料');
  mysqldump({
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      port: process.env.DB_PORT,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    },
    dumpToFile: 'test.sql'
  })
    .then(function (err) {
      //確認完成
      console.log('Dump completed');
      //上傳檔案至google drive
      const bufferStream = new stream.PassThrough();
      bufferStream.end(fileContent);
      google.drive({ version: "v3", auth }).files.create({
        media: {
          mimeType: "application/sql",
          body: bufferStream,
        },
        requestBody: {
          name: "test.sql",
          parents: ["1ty2_qlmCG75dElJ21t1gfkbUN7ny8_w9"],
        },
        fields: "id,name",
      });
      console.log(`Uploaded file susees`);
    })
    .catch(function (err) {
      console.log('Dump failed: ' + err);
    });

});

