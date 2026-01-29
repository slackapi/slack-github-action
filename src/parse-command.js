const { parse: _parse } = require('shell-quote');
const { execFile } = require('child_process');

async function parse(rawInput) {
  let tokens;
  try {
    tokens = _parse(rawInput);
  } catch (err) {
    throw Error("Invalid syntax: command contains at least one NULL character");
  }

  if (tokens.length === 0) {
    throw Error("No command provided");
  }

  console.log('Executing the command:', tokens.join(' '));
  const args = tokens.slice(1);

  execFile('slack', args, (error, stdout) => {
    if (error) {
      throw Error(`Slack CLI Error: ${error.message}`);
    }
    console.log(stdout);  
  });
}

if (require.main === module) {
  const rawInput = process.argv.slice(2).join(' '); 
  parse(rawInput);
}