const express = require('express')
const { urlencoded } = require('body-parser');
const cors = require('cors');
const { checkUserIsAuthorize } = require('./middleware');
const PORT = process.env.PORT || 3001;

const app = express()

app.use(urlencoded({ extended: false }))

const whitelist = ['http://localhost:3000']
app.use(cors({ 
    allowedHeaders: ['Content-Type', 'Cookie', 'set-cookie'], 
    credentials: true, 
    origin: (origin, callback)=>{
      // if(origin){
      //     if (whitelist.indexOf(origin) !== -1) {
      //       callback(null, true)
      //     } else {
      //       callback(new Error('Not allowed by CORS'))
      //     }
      // }
        callback(null, true)
    }, 
    methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'] 
}))
app.use(express.json())

app.set('view engine', 'ejs')
app.engine('ejs', require('ejs').__express);
app.get('/', (req, res)=>{
    res.render('home')
    // res.send('Welcome to unofficial myBSN API. Head over to https://github.com/irfan-zahir/mybsn-scrap to contribute!')
})
app.use('/login', require('./login'))
app.use('/authorized', checkUserIsAuthorize, require('./authorized'))

app.listen(PORT)

ISIA

"ISIA"
