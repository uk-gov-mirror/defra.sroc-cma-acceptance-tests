'use strict'

const fs = require('fs')

/**
 * Returns the params object needed by newman
 *
 * It is based on the arguments specified at runtime via the CLI. It takes this information and through the use of
 * additional functions determines the
 *
 * - collection
 * - environment
 * - reporters
 *
 * to use for the test run.
 *
 * @param {Object} program An instance of `require('commander').program` which has parsed `process.argv`
 * @return {Object} an object that represents the options that need to be passed to `newman.run()`
 */
const params = (program) => {
  const reporters = optionsToArray(program.reporters)
  const folders = optionsToArray(program.folders)

  return {
    collection: collectionFile(program.environment),
    environment: environmentFile(program.environment),
    // If no folders are specified we'll pass in an empty array to Newman. It's clever enough to ignore this and just
    // run all requests in the collection
    folder: folders,
    reporters: parseReporters(reporters),
    // It does not matter if the user does not specify the html reporter. Newman will simply ignore the htmlextra
    // section. But we must specify the `reporter:` property else the htmlextra reporter package fails
    reporter: {
      htmlextra: {
        browserTitle: 'SROC Charging Module API',
        title: 'SROC Charging Module API',
        skipSensitiveData: true
      }
    }
  }
}

/**
 * Determine which postman collection file to use
 *
 * If the environment is `example` the it is assumed we are running in CI and just testing that the project builds and
 * runs. Else we return our main `cma.postman_collection.json` collection.
 *
 * @param {string} environment Name of the environment we are running against
 * @returns {string} the contents of 'cma.postman_collection.json'
 */
const collectionFile = (environment) => {
  let collectionFile = 'cma.postman_collection.json'
  if (environment === 'example') {
    collectionFile = 'ci.postman_collection.json'
  }

  return require(`../${collectionFile}`)
}

/**
 * Determine which postman environment file to use
 *
 * We ask users to specify an environment on the command line. This function then searches the `environment/` folder for
 * a file which has a filename with a matching prefix. For example, if the environment specified is `dev` then this
 * function expects to find `environments/dev.postman_environment.json` and return it.
 *
 * @param {string} environment Name of the environment we are running against
 * @returns {string} the contents of the matching '[environment].postman_environment.json' file
 */
const environmentFile = (environment) => {
  const file = fs.readdirSync('./environments', { withFileTypes: true })
    .filter(item => !item.isDirectory())
    .map(item => item.name)
    .find(item => item.startsWith(environment))

  if (!file) {
    console.log(`Sorry, we can't find a matching 'environments/${environment}.postman_environment.json'`)
    process.exit(1)
  }

  return require(`../environments/${file}`)
}

/**
 * Parse the array of selected reporters passed via the command line
 *
 * The main purpose of this method is to handle a user selecting `html` on the command line and us needing to convert
 * that to `htmlextra`.
 *
 * The Postman maintained `html` reporter is pretty pants so we are using newman-reporter-htmlextra instead. It's
 * recognised reporter name is `htmlextra` but we want users of this project to not have to worry about this
 * distinction; if they select `html` they want the output from htmlextra.
 *
 * In addition to this the parser ensures all values are lowercase and removes any accidental duplicates.
 *
 * @param {string[]} reporters Array of strings
 * @returns {string[]} an array of string values representing reporters newman should use to generate test output and
 * results
 */
const parseReporters = (reporters) => {
  // If the -r option is not specified at the CLI reporters is not an array
  if (!Array.isArray(reporters)) {
    reporters = [reporters]
  }

  const lowercased = reporters.join('|').toLowerCase().split('|')
  const unique = [...new Set(lowercased)]

  const indexOfHtml = unique.indexOf('html')
  if (indexOfHtml !== -1) {
    unique[indexOfHtml] = 'htmlextra'
  }

  return unique
}

/**
 * Converts a value into an array if it's not already an array
 *
 * When using the command line there are scenarios where we could get an array or just a single value. For example, if
 * you don't specify any reporters using the -r option then Commander.js just returns `'cli'` rather than `['cli']`.
 * If you were to set `-r cli` on the command line then we would get an array.
 *
 * We cater for these scenarios by passing in whatever the options are we are expecting to be an array and if they are
 * not, we return it in one.
 *
 * @param {(string|string[])} options Either an array of options specified on the command line, or a single string value
 *
 * @returns {string[]} Either the original `options` if it was already an array, `options` as an array, or an empty
 * array if `options` was undefined
 */
const optionsToArray = (options) => {
  // If options is null or undefined just return an empty array
  if (!options) {
    return []
  }

  // If the -r option is not specified at the CLI reporters is not an array
  if (!Array.isArray(options)) {
    return [options]
  }

  return options
}

module.exports = { params }
