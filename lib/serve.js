const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const Verso = require('verso')
const express = require('express')
const compression = require('compression')
const browserify = require('browserify')

const DEFAULT_PORT = 2020
const DEFAULT_IP = '0.0.0.0'

const program = require('commander');

let options = program
    .version('0.0.1')
    .command('verso-serve <path/to/verso/directory>')
    .option('-p, --port <port-number>', `Specify port to listen on. Defaults to ${DEFAULT_PORT}`, (n) => parseInt(n, 10))
    .option('-i, --ip <ip-address>', `Specify the interface to listen on. Defaults to ${DEFAULT_IP}`, ip => ip)
    .parse(process.argv)

options.port = options.port || DEFAULT_PORT
options.host = options.host || DEFAULT_IP

if (!options.args[0]) {
  // setup default directory as the current one
  options.args[0] = '.' 
}

let specPath = options.args[0]

let versoPagesPath = path.resolve(specPath, 'pages.js')
if (!fs.existsSync(versoPagesPath)) {
  console.error(chalk.red(`ERROR: verso pages not found at '${versoPagesPath}'`))
  program.outputHelp()
  process.exit(1)
}

let pages = require(versoPagesPath)

let versoContextPath = path.resolve(specPath, 'context.js')

// Context resolves to a Promise to allow context to be computed asynchronously before the servinc starts
let context;
if (fs.existsSync(versoContextPath)) {
  context = Promise.resolve(require(versoContextPath))
} else {
  console.warn(chalk.yello(`WARNING: using empty context since '${versoContextPath}' was not found`))
  context = Promise.resolve({})
}

context.then(ctx => {
  let v = Verso(pages, ctx)

  let publicPath = path.resolve(specPath, 'public/.')
  if (fs.existsSync(publicPath)) {
    options.public = publicPath
  }

  options.context = ctx
  options.versoContextPath = versoContextPath
  options.versoPagesPath = versoPagesPath

  return serve(v, options)
}).catch(err => {
  if (process.env.NODE_ENV === 'production') {
    console.error(chalk.red('ERROR: ' + err.message))
  } else {
    console.error(chalk.red(err.stack))
  }
})

function serve(verso, options) {
  var app = express();

  app.use(compression())

  app.get('/verso/*', function (req, res) {
    var uri = req.path.substr(6)
    verso.render(uri).then(html => {
      res.json({
        status: 200,
        content: html
      })
    }).catch(err => {
      res.status(err.code || 500).json({
        status: err.code || 500,
        error: err.message
      })
    })
  });

  app.get('/verso.js', function(req, res) {
    verso.compile()
        .then(JSON.stringify)
        .then(compiledVarso => {
      let dynamicJsFile = '/tmp/' + Date.now() + '.js'
      let versoPath = path.resolve(__dirname, '..', 'node_modules', 'verso', 'index.js')
      fs.writeFileSync(dynamicJsFile, `
        var Verso = require('${versoPath}')
        
        var app = window.app = Verso(${compiledVarso})
        var el = document.getElementById('app')
        
        document.addEventListener('click', function(e) {        
          if (e.target.tagName !== 'A') return
                    
          var href = e.target.pathname         
          if (!href || href[0] !== '/') return;
                         
          window.location.hash = href
          e.preventDefault()
          app.run(href, el)
        })
        `, {encoding: 'utf-8'})

      browserify([dynamicJsFile]).bundle((err, js) => {
        if (err) {
          res.status(500).json({
            status: 500,
            error: err.message
          })
        } else {
          res.type('text/javascript').send(js)
        }
      })
    }).catch(err => {
      res.send(err)
    })


  })

  if (options.public) {
    app.use(express.static(options.public, {
      index: 'index.html'
    }))
  }

  app.listen(options.port, options.host, function () {
    console.log(`Verso serving http://${options.host}:${options.port}`);
  });
}
