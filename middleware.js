const { default: axios } = require("axios")
const { timeDifference } = require("./utils")

const checkUserIsAuthorize = async (req, res, next)=>{
    // let { auth: {token, track} } = req.body
    console.log('checking')
    try {
        // console.log(req.headers)
        const Cookie = JSON.parse(req.headers.authorization)
        let {track, token} = Cookie
        track = new Date(track)
        const exceedSession = timeDifference( new Date(Date.now()), track).minutes > 4
        let resp = await axios.get('https://www.mybsn.com.my/mybsn/main.do', { headers: { Cookie: token } })
        const authorized = resp.data.match(/<img src="\/mybsn\/images\/responsive_assets\/user-icon\.png">/i)
        console.log('authorizing')
        if (authorized) {
            res.setHeader('Authorization', JSON.stringify({token, track: Date.now()}))
            next()
        } else {
            res.setHeader('Authorization', '').status(401).json({ message: 'User is not authorized' })
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({message: `Unexpected error occured. ${error}`})
    }
}

module.exports = {checkUserIsAuthorize}