//Open Cypress in local dev mode

const cypress = require('cypress')
const argv = require('minimist')(process.argv.slice(2)) //minimist comes bundled with Cypress

const util = require('util')
const exec = util.promisify(require('child_process').exec) //needed to execute Shell commands using NodeJs

async function getSpecs() {
  if (argv.suite) {
    const tags = argv.suite
      .trim()
      .replace(/ /g, '')
      .toLowerCase()
      .split(',')
      .map((tags) => {
        // if paramaters passed by the user are not in `@tags` format then prepend `@` here
        if (tags.charAt(0) !== '@') {
          return (tags = `@${tags}`)
        } else {
          return tags //else return with original `@tags` format
        }
      })

    console.log('\nRunning specs containing tags: ', tags)

    const tagsToMatch = tags.join('|')
    const integrationFolder = 'cypress/integration'
    const shellCmd = `find ${integrationFolder} -name '*.spec.js' -exec awk '/${tagsToMatch}/{print FILENAME;exit;}' {} \\;`
    /* 
      Explanation for shell command:
      - `find ${integrationFolder} -name '*.spec.js'` === find all spec files in cypressIntegration folder
      - `-exec awk '/${tagsToMatch}/{print FILENAME;exit;}` ===  from the above spec files found, find which files contain @tags using ReGex
                                                                  and exit as soon tag is found (do not scan all the lines of code).
                                                                  Hence, to get faster performance, place @tags towards the top of the file
                                                                  ** note: certain directives like /// <reference types="cypress" />
                                                                    and //* eslint disable *\/ comments only work if they are at the first
                                                                    line of the code, so better place your @tags just below them
    */

    try {
      let { stdout } = await exec(shellCmd)

      return stdout
        .split('\n')
        .filter(String)
        .map((path) => path.replace(`${integrationFolder}/`, '')) //return specFile paths without the cypress/integration in the path
    } catch (e) {
      console.error(e)
    }
  } else {
    return '**/*.spec.js'
  }
}

async function getConfig(environment) {
  return {
    config: {
      testFiles: await getSpecs()
    }
  }
}

;(async () => {
  const openOptions = await getConfig()
  console.log('\nOpening with the following config :\n', openOptions)

  await cypress.open(openOptions).catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
})()
