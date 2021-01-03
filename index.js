'use strict'

const { program } = require('commander')
const ParamHelper = require('./lib/param_helper')
const newman = require('newman')

program
  .name('cma-tests')
  .requiredOption('-e, --environment <environment>', 'environment to run tests against')
  .option('-r, --reporters [reporters...]', 'reporters you wish newman to use', 'cli')
  .option('-f, --folders [folders...]', 'names of folders in the collection you wish newman to run')

program.on('--help', () => {
  console.log('')
  console.log('Examples:')
  console.log('  $ npm start -- -e dev')
  console.log('  $ npm start -- -e dev -r cli,json')
  console.log('  $ npm start -- -e dev -r cli -f admin')
})

program.parse()

const params = ParamHelper.params(program)

newman.run(
  params,
  function (err) {
    if (err) { throw err }
    console.log('Collection run complete!')
  }
)
