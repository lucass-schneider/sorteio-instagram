// Publica a pasta dist/ na branch gh-pages (GitHub Pages) sem mexer na branch atual.
import { execFileSync } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const git = (args, env = {}) =>
  execFileSync('git', args, { encoding: 'utf8', env: { ...process.env, ...env } }).trim()

execFileSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true })
writeFileSync(join('dist', '.nojekyll'), '')

const gitDir = resolve(git(['rev-parse', '--git-dir']))
const index = join(gitDir, 'gh-pages-index')
try {
  const env = { GIT_INDEX_FILE: index }
  git(['-C', 'dist', `--git-dir=${gitDir}`, '--work-tree=.', 'add', '--all', '--force', '.'], env)
  const tree = git(['write-tree'], env)
  const source = git(['rev-parse', '--short', 'HEAD'])
  const commit = git(['commit-tree', tree, '-m', `Deploy de ${source}`])
  execFileSync('git', ['push', '--force', 'origin', `${commit}:refs/heads/gh-pages`], { stdio: 'inherit' })
  console.log(`\nPublicado: commit ${source} -> gh-pages`)
} finally {
  rmSync(index, { force: true })
}
