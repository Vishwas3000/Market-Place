const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config.js")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts()
    const { log, deploy } = deployments
    const chainId = network.config.chainId

    const args = []
    log("----------------------------")
    const nftMarketPlace = await deploy("NftMarketPlace", {
        from: deployer,
        args: args,
        log: true,
        waitConformations: network.config.blockConformations || 1,
    })
    log("----------------------------")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifing...")
        await verify(nftMarketPlace.address, args)
    }
}

module.exports.tags = ["all", "nftMarktePlace"]
