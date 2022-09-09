const fs = require("fs")
const axios = require("axios")

const apiKey = ""
const target = "0x66A0FF664f8509370C5D718A0f69AC1DC01f5c3D"
const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${target}&startblock=0&endblock=999999999&sort=asc&apikey=${apiKey}`

let addresses = {}

// SAFEs that the target interacted with
let suspects = {}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function run() {
    console.log("loading eligible addresses")
    const content = fs.readFileSync("./safe_user_allocations_reworked.csv", { encoding: 'utf-8'})
    content.split(/\r?\n/).forEach(line =>  {
        const addr = line.split(",")[0]
        if (addr.startsWith("0x")) {
            addresses[addr.toLowerCase()] = true
        }
    }) 
    console.log("loading eligible addresses done")

    console.log("getting tx history of target address")
    const response = await axios.get(url)

    let i = 0
    if (response.data.message !== "NOTOK") {
        const txItems = response.data.result

        for (const tx of txItems) {
            // filter those Multisig Safe addresses that the target interacted with via "execTransaction"
            if (tx.functionName.startsWith("execTransaction")) {
                const toSafeAddress = tx.to
                if (addresses[toSafeAddress]) {
                    suspects[toSafeAddress] = true
                    ++i
                }
            } 
        }
    }

    console.log(`found ${i} suspects`)

    let n = 0
    // filter those suspects with only 1 tx in the history
    for (const addr of Object.keys(suspects)) {
        const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${addr}&startblock=0&endblock=999999999&sort=asc&apikey=${apiKey}`

        const response = await axios.get(url)
        if (response.data.message !== "NOTOK") {
            if (response.data.result && response.data.result.length == 1) {
                console.log(addr) // stdout should be redirected to a file. Log this for demo purpose
                ++n
            }
        }
        // sleep because etherscan rate limit is 5 per second
        // await sleep(200)
    }

    console.log(`found ${n} addresses in the end`)
}

run()