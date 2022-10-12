const { JSDOM } = require("jsdom");

const convertCookie = (cookie) => {
    if (typeof cookie === "string") {
        let output = {};
        cookie.split(/\s*;\s*/).forEach(function (pair) {
            pair = pair.split(/\s*=\s*/);
            output[pair[0]] = pair.splice(1).join('=');
        });

        return output
    }
    let cookies = {}

    cookie.forEach(dirty => {
        const item = dirty.split('=')[0]
        const value = dirty.slice(item.length + 1, dirty.length)
        Object.assign(cookies, { [`${item}`]: value })
    })

    const toArray = () => {
        let array = []
        for (const item in cookies) {
            array = [...array, `${item}=${cookies[item]}`]
        }
        return array
    }

    return {
        toArray,
        toJSON: () => cookies,
        toString: () => toArray().join('; ')
    }
}

function timeDifference(date1, date2) {
    var difference = date1.getTime() - date2.getTime();

    function monthDiff(dateFrom, dateTo) {
        return dateTo.getMonth() - dateFrom.getMonth() +
            (12 * (dateTo.getFullYear() - dateFrom.getFullYear()))
    }

    var daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
    difference -= daysDifference * 1000 * 60 * 60 * 24

    var hoursDifference = Math.floor(difference / 1000 / 60 / 60);
    difference -= hoursDifference * 1000 * 60 * 60

    var minutesDifference = Math.floor(difference / 1000 / 60);
    difference -= minutesDifference * 1000 * 60

    var secondsDifference = Math.floor(difference / 1000);

    return {
        days: daysDifference,
        hours: hoursDifference,
        minutes: minutesDifference,
        seconds: secondsDifference,
        months: monthDiff(date1, date2),
    }
}

/**
 * @param {string} oldCookie
 * @param {Array<String>} newCookie
 */
const getPayloads = (htmltext, formQuery) => {
    const maindom = new JSDOM(htmltext)
    let inputs = {}
    // maindom.window.document.querySelectorAll('form').forEach(f=>console.log(f.action, f.innerHTML))
    maindom.window.document.querySelector(`form[${formQuery}]`)
        .querySelectorAll('input[type="hidden"]').forEach(val => Object.assign(inputs, { [`${val.name}`]: val.value }))
        // console.log(inputs)
    return inputs
}

module.exports = { convertCookie, timeDifference, getPayloads }