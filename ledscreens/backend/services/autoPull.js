const { exec } = require('child_process');
const path = require('path');

const GIT_PATH = 'git';
const REPO_ROOT = path.join(__dirname, '..', '..');

let isChecking = false;

const checkForUpdates = () => {
  if (isChecking) return;
  isChecking = true;

  exec(`git fetch origin server-production`, { cwd: REPO_ROOT }, (err) => {
    if (err) {
      // Fallback for Windows if git is in default install path
      exec(`"C:\\Program Files\\Git\\cmd\\git.exe" fetch origin server-production`, { cwd: REPO_ROOT }, (winErr) => {
        if (winErr) {
          isChecking = false;
          return;
        }
        runPullSequence('"C:\\Program Files\\Git\\cmd\\git.exe"');
      });
      return;
    }
    runPullSequence('git');
  });
};

const runPullSequence = (gitCmd) => {
  exec(`${gitCmd} rev-parse HEAD`, { cwd: REPO_ROOT }, (errLocal, localHead) => {
    if (errLocal) {
      isChecking = false;
      return;
    }

    exec(`${gitCmd} rev-parse origin/server-production`, { cwd: REPO_ROOT }, (errRemote, remoteHead) => {
      isChecking = false;
      if (errRemote) return;

      const currentCommit = (localHead || '').trim();
      const latestCommit = (remoteHead || '').trim();

      if (currentCommit && latestCommit && currentCommit !== latestCommit) {
        console.log(`\n🔄 [AUTO-UPDATER] New commit detected on GitHub (${latestCommit.substring(0, 7)})!`);
        console.log('⬇️  Pulling changes from GitHub...');

        exec(`${gitCmd} pull origin server-production`, { cwd: REPO_ROOT }, (pullErr, stdout) => {
          if (pullErr) {
            console.error('❌ [AUTO-UPDATER] Pull error:', pullErr.message);
            return;
          }
          console.log('✅ [AUTO-UPDATER] Code updated successfully:', stdout.trim());
          console.log('⚡ [AUTO-UPDATER] Restarting Node.js server to apply changes...');
          setTimeout(() => process.exit(0), 1000);
        });
      }
    });
  });
};

if (!process.env.VERCEL) {
  console.log('⏱️  [AUTO-UPDATER] Git 60-second auto-fetcher enabled.');
  // Check immediately on startup
  setTimeout(checkForUpdates, 3000);
  // Check every 60 seconds
  setInterval(checkForUpdates, 60000);
}

module.exports = { checkForUpdates };
