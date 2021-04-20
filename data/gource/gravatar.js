const { execSync } = require('child_process')
const fs = require('fs')
const http = require('http');
const crypto = require('crypto')

function pDownload(url, dest) {
  var file = fs.createWriteStream(dest);
  return new Promise((resolve, reject) => {
    var responseSent = false; // flag to make sure that response is sent only once.
    http.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          if (responseSent) return;
          responseSent = true;
          resolve();
        });
      });
    }).on('error', err => {
      if (responseSent) return;
      responseSent = true;
      reject(err);
    });
  });
}

function fetchGravatarImages() {
  const size = 90;

  const cmd = 'git log --pretty=format:"%ae|%an"';
  
  // directory path
  const output_dir = './../.git/avatar';

  // create new directory
  try {
    // first check if directory already exists
    if (!fs.existsSync(output_dir)) {
      fs.mkdirSync(output_dir);
      console.log("Directory is created.");
    } else {
      console.log("Directory already exists.");
    }
  } catch (err) {
    console.log(err);
  }

  let allLogs = [];
  const script = execSync(cmd)
  try {
    allLogs = script.toString().split(/\r?\n/);
    for (let val of allLogs) {
      const [email, name] = val.split('|');
      let authorName = name.replace(/\s/g, ''); 

      let md5hash = crypto.createHash('md5').update(email).digest("hex")
      console.log(md5hash)

      const grav_url = "http://www.gravatar.com/avatar/"+ md5hash + "?d=404&size="+ size; 

      let author_image_location = output_dir+ '/' + authorName + '.png';
      console.log(email)

      pDownload(grav_url, author_image_location)
        .then(() => console.log('downloaded file no issues...'))
        .catch(e => console.error('error while downloading', e));
    }

  } catch (err) {
    console.log(err);
  }

}

fetchGravatarImages()

module.exports = fetchGravatarImages

