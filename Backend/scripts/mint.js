const { ethers, network } = require("hardhat")

async function mintAndList() {
    const basicNft = await ethers.getContract("BasicNft")
    console.log("Minting...")
    const mintTx = await basicNft.mintNft()
    const mintReciept = await mintTx.wait(1)

    console.log(`Minted tokenId ${mintTxReceipt.events[0].args.tokenId.toString()} from contract: ${basicNft.address}`)
    if (network.config.chainId == 31337) {
        await moveBlocks(2, (sleepAmount = 1000))
    }
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
