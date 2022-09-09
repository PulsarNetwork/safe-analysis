const { ethers } = require("ethers")
const axios = require("axios")

// use your own
const provider = new ethers.providers.JsonRpcProvider("")
const apiKey = ""

const letter5Addr = {}

// some seed ens names, we'll put the addresses in a queue
let sybilOwnerEns = {}

let sybilOwnerAddr = {}

let queue = []

let safeCreationTxs = []

async function getEtherscanTxs(target) {
    try {
        const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${target}&startblock=0&endblock=999999999&sort=asc&apikey=${apiKey}`
        const response = await axios.get(url)
        if (response.data.message !== "NOTOK") {
            if (response.data.result && response.data.result.length >= 1) {
                return response.data.result
            }
        }
    }
    catch (e) {
    }
    return null
}

async function lookupEnsByAddress(address) {
    var ens = null
    try {
        var reverse = await provider.lookupAddress(address)
        if (reverse && reverse.endsWith('.eth')) {
            ens = reverse
        }

    } catch (e) {
        console.error(e)
        return null
    }
    return ens
}

async function work() {
    // get 5-letter ens from master address tx history
    const master = "0x54c7bb00d5b38ea2583069eaac8b42d56b6aaff2"
    const txs = await getEtherscanTxs(master)
    for (const tx of txs) {
        const counterparty = tx.to == master ? tx.from : tx.to
        if (!letter5Addr[counterparty]) {
            let ens = await lookupEnsByAddress(counterparty)
            // filter 5-letter ens
            if (ens && ens.length == 9) {
                letter5Addr[counterparty] = true
                sybilOwnerAddr[counterparty] = true
                sybilOwnerEns[ens] = counterparty
                console.log(`${ens},${counterparty}`)
            }
        }
    }

    console.log("gathering all 5-letter ens as seeds")
    queue = Object.keys(letter5Addr)
    

    // starting from seed address, we find all the 5-letter ens addresses that it interacted with
    let addr = queue.shift()
    while (addr) {

        const txs = await getEtherscanTxs(addr)
        if (txs) {
            // we only look up the first 10 txs
            for (let i = 0; i < Math.min(10, txs.length); ++i) {
                const tx = txs[i]
                const counterparty = tx.to == addr ? tx.from : tx.to

                // if the counterparty is new, proceed
                if (!sybilOwnerAddr[counterparty]) {
                    let ens = await lookupEnsByAddress(counterparty)
                    // filter those 5-letter ens such like abcde.eth
                    if (ens && ens.length == 9) {
                        // enqueue, process later
                        queue.push(counterparty)
                        sybilOwnerAddr[counterparty] = true
                        sybilOwnerEns[ens] = counterparty
                        console.log(`${ens},${counterparty}`)
                    }
                }
            }

            // next, find the safe address that it created
            const safeCreation = txs.filter(tx => {
                return tx.functionName.split("(")[0] == "createProxy"
            })

            if (safeCreation && safeCreation.length > 0) {
                safeCreationTxs.push(safeCreation[0].hash)
            }
        }

        addr = queue.shift()
    }

    console.log("all safe creation txs:")
    safeCreationTxs.forEach(tx => {
        console.log(tx)
    })
    
}

work()