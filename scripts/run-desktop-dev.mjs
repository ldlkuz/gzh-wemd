import { spawn } from 'child_process';
import http from 'http';

function run(command, args) {
  const child = spawn(command, args, { stdio: 'inherit', shell: true });
  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Command ${command} ${args.join(' ')} exited with code ${code}`);
      process.exit(code ?? 1);
    }
  });
  return child;
}

run('pnpm', ['dev:web']);

function checkServer(url, onReady) {
  const request = http.get(url, (res) => {
    res.destroy();
    onReady();
  });
  request.on('error', () => {
    setTimeout(() => checkServer(url, onReady), 1000);
  });
}

checkServer('http://localhost:5173', () => {
  run('pnpm', ['dev:electron']);
});
