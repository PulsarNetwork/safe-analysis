const fs = require("fs")
const axios = require("axios")

// use your own
const apiKey = ""

// the manager address that we target for
const target = "0xDf21b894A490Cbdf49d9De7B9D780b79f7CB0AC7"
const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${target}&startblock=0&endblock=999999999&sort=asc&apikey=${apiKey}`

let addresses = {}

// SAFEs that the target interacted with
let suspects = {}

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

        try {
            const response = await axios.get(url)
            if (response.data.message !== "NOTOK") {
                if (response.data.result && response.data.result.length == 1) {
                    console.log(addr) // stdout should be redirected to a file. Log this for demo purpose
                    ++n
                }
            }
        }
        catch(e) { // ignore
        }
    }

    console.log(`found ${n} addresses in the end`)
}

run()