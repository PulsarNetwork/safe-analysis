const { ethers } = require("ethers")
const fs = require("fs")

// use your own
const provider = new ethers.providers.JsonRpcProvider("")

async function work() {
    // first, read from tx results of findowner.js
    const txs = []
    const content = fs.readFileSync("./result1.txt", { encoding: 'utf-8'})
    content.split(/\r?\n/).forEach(line =>  {
        if (line.startsWith("0x")) {
            txs.push(line)
        }
    }) 

    // next, get the safes
    for (const tx of txs) {
        let receipt = await provider.getTransactionReceipt(tx)
        console.log("0x" + receipt.logs[1].data.slice(26, 66))
    }
    
}

work()