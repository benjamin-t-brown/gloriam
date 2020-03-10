// this script reads all the rpgscript files in the game directory and creates an audacity
// recording template for any that don't exist.

const fs = require('fs');
const { exec } = require('child_process');
const { ScriptParser } = require('../game/src/db/map/ScriptParser');

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

async function getScripts() {
  return new Promise((resolve, reject) => {
    const scriptDir = __dirname + '/../game/src/db/map/scripts/';
    fs.readdir(scriptDir, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(
          files
            .filter(filename => filename.slice(-9) === 'rpgscript')
            .map(filename => scriptDir + filename)
        );
      }
    });
  });
}

async function main() {
  const scriptFiles = await getScripts();
  await Promise.all(
    scriptFiles.map(async fileName => {
      const text = await fs.promises.readFile(fileName);
      const parser = new ScriptParser(fileName);
      const { scripts: localScripts } = parser.parse(text.toString(), null);
      for (let i in localScripts) {
        const script = localScripts[i];
        const dir = script.name;
        if (Object.keys(script.soundsPerCharacter).length) {
          for (let chName in script.soundsPerCharacter) {
            if (!fs.existsSync(dir)) {
              console.log('mkdir', dir);
              fs.mkdirSync(dir);
            }
            if (!fs.existsSync(`${script.name}/${chName}.aup`)) {
              console.log('cp template', `${script.name}/${chName}.aup`);
              await execAsync(
                `cp -r template/template_data "${script.name}/${chName}_data"`
              );
              await execAsync(
                `cp template/template.aup "${script.name}/${chName}.aup"`
              );
            }
          }
        }
      }
    })
  );
  console.log('P', scriptFiles);
}
main();
