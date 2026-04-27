param(
  [string]$RepoUrl = 'https://github.com/juyaning1995-dev/coach-course-demo.git',
  [string]$Branch = 'main',
  [string]$CommitMessage = 'init: coach booking demo'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Set-Location $repoRoot

Write-Host 'Preparing local repository...'

$paths = @(
  '.gitignore',
  'coach-course-demo-coach.html',
  'coach-course-demo-empty.html',
  'coach-course-demo-user.html',
  'coach-course-demo.html',
  'preview-server.js',
  'split-projects',
  'user-booking-demo.html'
)

git add -- $paths

$originExists = (git remote) -contains 'origin'
if ($originExists) {
  git remote set-url origin $RepoUrl
} else {
  git remote add origin $RepoUrl
}

git branch -M $Branch

git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -m $CommitMessage
} else {
  Write-Host 'No new local changes to commit.'
}

git push -u origin $Branch

Write-Host ''
Write-Host 'Upload finished.'
