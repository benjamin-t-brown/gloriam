require('dotenv').config();
const { exec } = require('child_process');

const execAsync = async command => {
  return new Promise(resolve => {
    console.log(command);
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(err, stdout, stderr);
        return;
      }
      resolve();
    });
  });
};

const exportDir = process.env.EXPORT_DIR;
const exportSoundDir = process.env.EXPORT_SOUND_DIR;
const main = async () => {
  const cmd = `cp -r cadences/*.cadence.json ${exportDir}`;
  await execAsync(cmd);
  if (exportSoundDir) {
    const cmd2 = `cp -r sounds/ ${exportSoundDir}`;
    await execAsync(cmd2);
  }
};
console.log('exporting to', exportDir);
main();
