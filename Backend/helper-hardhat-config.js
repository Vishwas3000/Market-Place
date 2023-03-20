const { ethers, network } = require("hardhat")

const networkConfig = {
    default: {
        name: "hardhat",
    },
    31337: {
        name: "localhost",
    },
    5: {
        name: "goerli",
    },
    1: {
        name: "mainnet",
    },
    11155111: {
        name: "sepolia",
    },
}
const developmentChains = ["hardhat", "localhost"]

const frontEndContractsFile = "../Frontend/nextjs-nft-marketplace-graph-fcc/constants/networkMapping.json"
const frontEndContractsFile2 = "../Frontend/nextjs-nft-marketplace-moralis-fcc/constants/networkMapping.json"
const frontEndAbiLocation = "../Frontend/nextjs-nft-marketplace-graph-fcc/constants/"
const frontEndAbiLocation2 = "../Frontend/nextjs-nft-marketplace-moralis-fcc/constants/"

module.exports = {
    networkConfig,
    developmentChains,
    frontEndContractsFile,
    frontEndContractsFile2,
    frontEndAbiLocation,
    frontEndAbiLocation2,
}
