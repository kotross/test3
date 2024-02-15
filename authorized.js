const router = require('express').Router()
const { default: axios } = require('axios')
const { JSDOM } = require('jsdom')
const { getPayloads } = require('./utils')
const qs = require('qs')

router.get('/dashboard', async (req, res) => {
    try {
        let { token: Cookie } = JSON.parse(req.headers.authorization)

        // console.log(Cookie)
        let maindo = await axios.get('https://www.mybsn.com.my/mybsn/main.do', { headers: { Cookie } })
        let payloads = getPayloads(maindo.data, 'name="landingForm"')
        let resp = await axios.post(
            'https://www.mybsn.com.my/mybsn/main.do?querySAAccountLists=',
            payloads,
            { headers: { Cookie, 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
        let sadom = new JSDOM(resp.data)

        let display_name = sadom.window.document.querySelectorAll('span.welcometext')
        display_name = display_name[display_name.length - 1].innerHTML
        display_name = display_name.substring(0, display_name.length - 1);

        let profile_image = sadom.window.document.querySelector('div.user-icon>img')
        profile_image = profile_image.getAttribute('src')

        let saving_balance = sadom.window.document.querySelectorAll('tbody.sa>tr')
        saving_balance = saving_balance[saving_balance.length - 1].querySelectorAll('td')
        saving_balance = saving_balance[saving_balance.length - 1].querySelector('b').innerHTML.replace(/\s/g, '')

        let all_savings = await axios.get('https://www.mybsn.com.my/mybsn/account/accounts_enquiry.do?saAll=', { headers: { Cookie } })
        all_savings = new JSDOM(all_savings.data)
        all_savings = all_savings.window.document.querySelectorAll('table#table-org>tbody>tr')

        let saving_accs = []
        all_savings.forEach(acc => {
            let details = {}
            acc.querySelectorAll('td').forEach((info, idx) => {
                if (idx === 0) details = { ...details, type: info.innerHTML.replace(/\s/g, '') }
                if (idx === 1) {
                    details = { ...details, acc_num: info.innerHTML.replace(/\s/g, '').match(/([0-9]+(-[0-9]+)+)/i)[0] }
                    details = { ...details, listNumber: info.innerHTML.replace(/\s/g, '').match(/[a-zA-Z]+=[0-9]+/i)[0].split('=')[1] }
                }
                if (idx === 2) details = { ...details, balance: info.innerHTML.replace(/\s/g, '') }
                if (idx === 3) details = { ...details, status: info.innerHTML.replace(/\s/g, '') }
            })
            Object.entries(details).length !== 0 && saving_accs.push(details)
        })
        res.status(200).json({ display_name, saving_balance, saving_accs, profile_image })
    } catch (error) {
        res.status(500).send('Unexpected error occured!')
    }
})

router.post('/dashboard_history', async (req, res) => {
    try {
        let { token: Cookie } = JSON.parse(req.headers.authorization)
        const { listNumber } = req.body

        let accounts_enquiry = await axios.get("https://www.mybsn.com.my/mybsn/account/accounts_enquiry.do?saAll=", { headers: { Cookie } })
        accounts_enquiry = await axios.get(
            `https://www.mybsn.com.my/mybsn/account/accounts_enquiry.do?saDetails=&listNumber=${listNumber}`,
            {
                headers: { Cookie, Referer: "https://www.mybsn.com.my/mybsn/account/accounts_enquiry.do?saAll=" },
            },
        )

        let payloads = getPayloads(accounts_enquiry.data, 'action="/mybsn/account/accounts_enquiry.do"')
        // console.log(payloads)
        accounts_enquiry = await axios({
            method: 'POST',
            url: 'https://www.mybsn.com.my/mybsn/account/accounts_enquiry.do',
            data: qs.stringify({ ...payloads, 'saHistory': 'Transaction History' }),
            headers: {
                Cookie,
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        })
        payloads = getPayloads(accounts_enquiry.data, 'action="/mybsn/account/accounts_enquiry.do"')
        accounts_enquiry = await axios.post(
            'https://www.mybsn.com.my/mybsn/account/accounts_enquiry.do',
            qs.stringify({ ...payloads, saHistoryRange: "Current Month", saHistorySearch: "Submit" }),
            {
                headers: {
                    Cookie,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    // Referer:"https://www.mybsn.com.my/mybsn/account/accounts_enquiry.do" 
                }
            }
        )

        //CUrrent Month transaction info
        let history = new JSDOM(accounts_enquiry.data)
        history = history.window.document.querySelectorAll('table.table-org>tbody>tr')
        let dashboard_history = []
        let noData = false;
        history.forEach(row => {
            let details = {}
            row.querySelectorAll('td').forEach((info, idx) => {
                if (info.innerHTML.indexOf("No result found") > -1) noData = true
                if (idx === 0) details = { ...details, date: info.innerHTML.replace(/\s/g, '') }
                if (idx === 1) details = { ...details, description: info.innerHTML.replace(/\s/g, '') }
                if (idx === 2) details = { ...details, debit: info.innerHTML.replace(/\s/g, '') }
                if (idx === 3) details = { ...details, credit: info.innerHTML.replace(/\s/g, '') }
            })
            if (!noData) Object.entries(details).length !== 0 && dashboard_history.push(details)
        })
        // dashboard_history.push({"date": "30-Jun-2022", "description": "PURCHASEFROMGIRO", "debit": "6.00", "credit": ""})

        //Previous Month transaction info
        payloads = getPayloads(accounts_enquiry.data, 'action="/mybsn/account/accounts_enquiry.do"')
        accounts_enquiry = await axios.post(
            'https://www.mybsn.com.my/mybsn/account/accounts_enquiry.do',
            qs.stringify({ ...payloads, saHistoryRange: "Last Month", saHistorySearch: "Submit" }),
            {
                headers: {
                    Cookie,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    // Referer:"https://www.mybsn.com.my/mybsn/account/accounts_enquiry.do" 
                }
            }
        )

        let previous_history = new JSDOM(accounts_enquiry.data)
        previous_history = previous_history.window.document.querySelectorAll('table.table-org>tbody>tr')
        let previous = []
        noData = false;
        previous_history.forEach(row => {
            let details = {}

            row.querySelectorAll('td').forEach((info, idx) => {
                if (info.innerHTML.indexOf("No result found") > -1) noData = true
                if (idx === 0) details = { ...details, date: info.innerHTML.replace(/\s/g, '') }
                if (idx === 1) details = { ...details, description: info.innerHTML.replace(/\s/g, '') }
                if (idx === 2) details = { ...details, debit: info.innerHTML.replace(/\s/g, '') }
                if (idx === 3) details = { ...details, credit: info.innerHTML.replace(/\s/g, '') }
            })
            if (!noData) Object.entries(details).length !== 0 && previous.push(details)
        })

        if (dashboard_history.length > 0) {
            res.status(200).json({ history: dashboard_history })
        } else {
            res.status(200).json({ history: dashboard_history, previous })
        }
    } catch (error) {
        console.log(error)
        res.status(500).send('Unexpected error occured. ' + error)
    }

})

#  (require 'msf/core')

module.exports = router
