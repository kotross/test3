const router = require('express').Router()
const { default: axios } = require('axios')
const { convertCookie, timeDifference } = require('./utils')

const LOGIN_URL = "https://www.mybsn.com.my/mybsn/login/login.do"

router.post('/username', async (req, resolve) => {
    const { username } = req.body
    let params = { username, confirmImage: "Login" }
    try {
        const res = await axios.post(LOGIN_URL, {}, { params, withCredentials: true })

        const imageSrc = res.data.match(/\/mybsn\/images\/users\/[a-zA-Z0-9]+\.jpg/g)[0]
        const _sourcePage = res.data.match(/name="_sourcePage" value="[^"]*"/i)[0].split('"')[3]
        const __fp = res.data.match(/name="__fp" value="[^"]*"/i)[0].split('"')[3]

        const Cookie = res.headers['set-cookie']

        resolve.status(200).json({ imageSrc, _sourcePage, __fp, Cookie })
        // resolve.status(200).json({  _sourcePage, __fp, data: res.data })
    } catch (error) {
        console.log(error)
        resolve.status(500).json({ error })
    }
})

router.post('/image', async (req, resolve) => {
    let { Cookie, ...params } = req.body
    params = { ...params, step2: "Yes" }
    try {
        const res = await axios.post(LOGIN_URL, {}, { params, withCredentials: true, headers: { Cookie } })

        const pwdInput = res.data.match(/name="password" id="password" type="[^"]*"/g)
        const imageSrc = res.data.match(/\/mybsn\/images\/users\/[a-zA-Z0-9]+\.jpg/g)[0]
        const _sourcePage = res.data.match(/name="_sourcePage" value="[^"]*"/i)[0].split('"')[3]
        const __fp = res.data.match(/name="__fp" value="[^"]*"/i)[0].split('"')[3]
        
        if (pwdInput) resolve.status(200).json({ _sourcePage, __fp, Cookie, imageSrc })
        if (!pwdInput) resolve.status(401).json({ message: 'Something wrong, cannot proceed to password page' })
    } catch (error) {
        console.log(error)
        resolve.status(500).json({ error })
    }
})

router.post('/password', async (req, resolve) => {
    let { Cookie, ...params } = req.body
    params = { step3: "Login", ...params }
    try {
        res = await axios.post(LOGIN_URL, {}, {
            params,
            withCredentials: true,
            headers: { Cookie },
            maxRedirects: 0,
            validateStatus: (status) => status < 500
        })

        Cookie = convertCookie([...Cookie, ...res.headers['set-cookie']]).toString()

        res = await axios.get('https://www.mybsn.com.my/mybsn/main.do', { headers: { Cookie } })
        const authorized = res.data.match(/<img src="\/mybsn\/images\/responsive_assets\/user-icon\.png">/i)

        if (authorized) {
            resolve.status(200).json({ message: "Successfully login into system.", authorized: {token:Cookie, track: Date.now()} })
        } else {
            resolve.status(401).json({ message: 'Unable to login. The information needed is missing.' })
        }
    } catch (error) {
        console.log(error)
        resolve.status(500).json({ error })
    }
})

router.post('/quick', async (req, resolve) => {
    const { username, password } = req.body

    let params = { username, confirmImage: "Login" }
    let res = await axios.post(LOGIN_URL, {}, { params, withCredentials: true })
    let _sourcePage = res.data.match(/name="_sourcePage" value="[^"]*"/i)[0].split('"')[3]
    let __fp = res.data.match(/name="__fp" value="[^"]*"/i)[0].split('"')[3]
    let Cookie = res.headers['set-cookie']

    params = { step2: 'Yes', _sourcePage, __fp }
    res = await axios.post(LOGIN_URL, {}, { params, withCredentials: true, headers: { Cookie } })
    _sourcePage = res.data.match(/name="_sourcePage" value="[^"]*"/i)[0].split('"')[3]
    __fp = res.data.match(/name="__fp" value="[^"]*"/i)[0].split('"')[3]

    params = { step3: "Login", password, _sourcePage, __fp }
    res = await axios.post(LOGIN_URL, {}, {
        params,
        withCredentials: true,
        headers: { Cookie },
        maxRedirects: 0,
        validateStatus: (status) => status < 500
    })

    Cookie = convertCookie([...Cookie, ...res.headers['set-cookie']]).toString()

    res = await axios.get('https://www.mybsn.com.my/mybsn/main.do', { headers: { Cookie } })
    const authorized = res.data.match(/<img src="\/mybsn\/images\/responsive_assets\/user-icon\.png">/i)

    if (authorized) {
        resolve
            .status(200).json({ message: "Successfully login into system", authorized: { token: Cookie, track: Date.now() } })
    } else {
        resolve.status(401).json({ message: 'Unable to quick login. The information needed is missing from your phone' })
    }
})

router.post('/isLoggedIn', async (req, resolve) => {
    try {
        const { token } = req.body
        let {token: Cookie, track} = JSON.parse(token)
        track = new Date(track)
        const exceedSession = timeDifference( new Date(Date.now()), track).minutes > 4
        if(exceedSession){
            let res = await axios.get('https://www.mybsn.com.my/mybsn/main.do', { headers: { Cookie } })
            const authorized = res.data.match(/<img src="\/mybsn\/images\/responsive_assets\/user-icon\.png">/i)
            if (authorized) {
                resolve.status(200).json({ message: "User is authorized", authorized: Cookie })
            } else {
                resolve.status(401).json({ message: 'User is not authorized' })
            }
        }else{
            resolve.status(200).json({ message: "User is authorized", authorized: Cookie })
        }
    } catch (error) {
        resolve.status(500).json({ message: "Unexpected error occured ", error })
    }
})

const logout = async (req, res) => {
    try {
        let res = await axios.get('https://www.mybsn.com.my/mybsn/login/logout.do', {}, { params, headers: { Cookie } })
        console.log('logout', res.data)
    } catch (error) {
        console.log(error)
        resolve.status(500).json({ error })
    }
}

module.exports = router


// aws_access_key_id aws_secret_access_key AKIA1XY2XY3XY4XY

