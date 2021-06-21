const cypress = require('cypress')
const argv = require('minimist')(process.argv.slice(2))

const util = require('util')
const exec = util.promisify(require('child_process').exec)

async function getSpecs() {
  if (argv.suite) {
    const tags = argv.suite
      .toLowerCase()
      .split(',')
      .map((t) => {
        if (t.charAt(0) !== '@') return (t = `@${t}`)
      })

    const tagsToMatch = tags.join('|')
    const integrationFolder = 'cypress/integration'
    const shellCmd = `find ${integrationFolder} -name '*.spec.js' -exec awk '/${tagsToMatch}/{print FILENAME;exit;}' {} \\;`

    try {
      let { stdout } = await exec(shellCmd)

      return stdout
        .split('\n')
        .filter(String)
        .map((path) => path.replace(`${integrationFolder}/`, ''))
    } catch (e) {
      console.error(e)
    }
  } else {
    return '**/*.spec.js'
  }
}

async function getConfig(environment) {
  return {
    browser: 'chrome',
    config: {
      testFiles: await getSpecs()
    }
  }
}

;(async () => {
  const openOptions = await getConfig()
  console.log('Opening with the following config :\n', openOptions)
  // process.exit()
  await cypress.open(openOptions).catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
})()
