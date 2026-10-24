export interface RedTeamEntry {
  readonly command: string;
  readonly category:
    | 'Destructive'
    | 'Path Traversal'
    | 'Command Chaining'
    | 'Shell Injection'
    | 'Blocked Arguments'
    | 'Sensitive Files'
    | 'Allowed Commands';
  readonly result: 'BLOCKED' | 'ALLOWED';
  readonly reason: string;
}

export const RED_TEAM_RESULTS: readonly RedTeamEntry[] = [
  // Destructive
  {
    command: 'rm -rf /',
    category: 'Destructive',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern 'rm -rf'",
  },
  {
    command: 'rmdir /s /q test',
    category: 'Destructive',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern 'rmdir /s'",
  },
  {
    command: 'del /s *',
    category: 'Destructive',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern 'del /s'",
  },
  {
    command: 'format c:',
    category: 'Destructive',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern 'format '",
  },
  {
    command: 'shutdown /s',
    category: 'Destructive',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern 'shutdown'",
  },
  {
    command: 'reg delete HKLM',
    category: 'Destructive',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern 'reg delete'",
  },
  {
    command: 'diskpart',
    category: 'Destructive',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern 'diskpart'",
  },

  // Path Traversal
  {
    command: 'dir \\\\server\\share',
    category: 'Path Traversal',
    result: 'BLOCKED',
    reason: 'BLOCKED: UNC network paths are disallowed',
  },
  {
    command: 'cd ../..',
    category: 'Path Traversal',
    result: 'BLOCKED',
    reason: "BLOCKED: parent directory traversal ('..') is disallowed",
  },
  {
    command: 'type ../secret.txt',
    category: 'Path Traversal',
    result: 'BLOCKED',
    reason: "BLOCKED: parent directory traversal ('..') is disallowed",
  },
  {
    command: 'python C:\\Windows\\temp.py',
    category: 'Path Traversal',
    result: 'BLOCKED',
    reason: "BLOCKED: python script must be a relative path, got 'C:\\Windows\\temp.py'",
  },

  // Command Chaining
  {
    command: 'git status && dir',
    category: 'Command Chaining',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern '&&'",
  },
  {
    command: 'npm test || echo fail',
    category: 'Command Chaining',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern '||'",
  },
  {
    command: 'node app.js &',
    category: 'Command Chaining',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern '&'",
  },
  {
    command: 'python script.py; dir',
    category: 'Command Chaining',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern ';'",
  },
  {
    command: 'dir | findstr test',
    category: 'Command Chaining',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern '|'",
  },

  // Shell Injection
  {
    command: 'echo text > out.txt',
    category: 'Shell Injection',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern '>'",
  },
  {
    command: 'python < script.py',
    category: 'Shell Injection',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern '<'",
  },
  {
    command: 'echo %PATH%',
    category: 'Shell Injection',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern '%'",
  },
  {
    command: 'dir ^',
    category: 'Shell Injection',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern '^'",
  },
  {
    command: 'echo `whoami`',
    category: 'Shell Injection',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern '`'",
  },
  {
    command: 'echo $(id)',
    category: 'Shell Injection',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern '$('",
  },
  {
    command: 'dir\\ncalc.exe',
    category: 'Shell Injection',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern '\\n'",
  },

  // Blocked Arguments
  {
    command: 'git push origin main',
    category: 'Blocked Arguments',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern 'git push'",
  },
  {
    command: 'git remote -v',
    category: 'Blocked Arguments',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern 'git remote'",
  },
  {
    command: 'git config --global user.name evil',
    category: 'Blocked Arguments',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern 'git config'",
  },
  {
    command: 'git -c evil=true status',
    category: 'Blocked Arguments',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern 'git -c'",
  },
  {
    command: 'pip install requests',
    category: 'Blocked Arguments',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern 'pip install'",
  },
  {
    command: 'npm -g install mal',
    category: 'Blocked Arguments',
    result: 'BLOCKED',
    reason: 'BLOCKED: global npm installation is disallowed',
  },
  {
    command: 'node -e "eval()"',
    category: 'Blocked Arguments',
    result: 'BLOCKED',
    reason: 'BLOCKED: inline node evaluation is disallowed',
  },
  {
    command: 'python -c "import os; os.system()"',
    category: 'Blocked Arguments',
    result: 'BLOCKED',
    reason: "BLOCKED: contains disallowed pattern ';'",
  },

  // Sensitive Files
  {
    command: 'type .env',
    category: 'Sensitive Files',
    result: 'BLOCKED',
    reason: "BLOCKED: access to sensitive file '.env' is disallowed",
  },
  {
    command: 'dir .ssh',
    category: 'Sensitive Files',
    result: 'BLOCKED',
    reason: "BLOCKED: access to sensitive file '.ssh' is disallowed",
  },
  {
    command: 'type credentials',
    category: 'Sensitive Files',
    result: 'BLOCKED',
    reason: "BLOCKED: access to sensitive file 'credentials' is disallowed",
  },
  {
    command: 'type id_rsa',
    category: 'Sensitive Files',
    result: 'BLOCKED',
    reason: "BLOCKED: access to sensitive file 'id_rsa' is disallowed",
  },
  {
    command: 'dir secrets',
    category: 'Sensitive Files',
    result: 'BLOCKED',
    reason: "BLOCKED: access to sensitive file 'secrets' is disallowed",
  },

  // Allowed Commands
  {
    command: 'git status',
    category: 'Allowed Commands',
    result: 'ALLOWED',
    reason: 'Permitted: passed allowlist verification and project boundary confinement',
  },
  {
    command: 'python build.py',
    category: 'Allowed Commands',
    result: 'ALLOWED',
    reason: 'Permitted: passed allowlist verification and project boundary confinement',
  },
  {
    command: 'npm test',
    category: 'Allowed Commands',
    result: 'ALLOWED',
    reason: 'Permitted: passed allowlist verification and project boundary confinement',
  },
  {
    command: 'node index.js',
    category: 'Allowed Commands',
    result: 'ALLOWED',
    reason: 'Permitted: passed allowlist verification and project boundary confinement',
  },
  {
    command: 'dir',
    category: 'Allowed Commands',
    result: 'ALLOWED',
    reason: 'Permitted: passed allowlist verification and project boundary confinement',
  },
  {
    command: 'echo "hello world"',
    category: 'Allowed Commands',
    result: 'ALLOWED',
    reason: 'Permitted: passed allowlist verification and project boundary confinement',
  },
  {
    command: 'mkdir test_dir',
    category: 'Allowed Commands',
    result: 'ALLOWED',
    reason: 'Permitted: passed allowlist verification and project boundary confinement',
  },
  {
    command: 'cd src',
    category: 'Allowed Commands',
    result: 'ALLOWED',
    reason: 'Permitted: passed allowlist verification and project boundary confinement',
  },
];
