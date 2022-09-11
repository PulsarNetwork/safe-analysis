const fs = require("fs")
const axios = require("axios")

const apiKey = ""

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function getTokenTx(address) {
    try {
        const response = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=999999999&sort=asc&apikey=${apiKey}`)
        return response.data.result
    }
    catch(e) { return null }
}

async function work() {
    const content = fs.readFileSync("./aggregate-66a0-df21-raw.txt", { encoding: 'utf-8'})
    const lines = content.split(/\r?\n/)
    
    for (const address of lines) {
        let tokenTx = await getTokenTx(address)
        if (tokenTx && tokenTx.length == 0) {
            console.log(address) // to std out
        }
        await sleep(100)
    }
}

work()