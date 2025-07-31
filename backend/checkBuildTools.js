const { exec } = require('child_process');

exec('where cl.exe', (err, stdout, stderr) => {
  if (err) {
    console.error('cl.exe not found in PATH. Visual Studio Build Tools might be missing or not configured.');
    process.exit(1);
  }
  console.log('cl.exe found at:\n', stdout.trim());
});
