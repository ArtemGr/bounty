const { exec } = require("child_process");

exec("DISPLAY=':99' gource -f -1280x720 -r 25 -o - | ffmpeg -y -r 25 -f image2pipe -vcodec ppm -i - -codec:v libx265 -preset slow -f mp4 commits.mp4", (error, stdout, stderr) => {
  if (error) {
    console.log(`error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`);
    return;
  }
  console.log(`output: ${stdout}`);
});
