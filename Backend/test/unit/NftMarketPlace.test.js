const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Nft Market Place", function () {
          let nftMarketPlace, nftMarketPlaceContract, basicNft, deployer, player

          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0

          beforeEach(async function () {
              // player = await getNamedAccounts().player
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              player = accounts[1]
              await deployments.fixture(["all"])

              nftMarketPlaceContract = await ethers.getContract("NftMarketPlace")
              nftMarketPlace = await nftMarketPlaceContract.connect(deployer)
              basicNft = await ethers.getContract("BasicNft")
              await basicNft.mintNft()
              await basicNft.approve(nftMarketPlace.address, TOKEN_ID)
          })

          describe("list Items", () => {
              it("emits an event after listing an Item", async () => {
                  expect(await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit("ItemListed")
              })

              it("excludes items that have already been listed", async () => {
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const error = `NftMarketPlace__AlreadyListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.be.revertedWith(error)
              })

              it("exclusively allows owners to list", async () => {
                  nftMarketPlace = nftMarketPlaceContract.connect(player)
                  await basicNft.approve(player.address, TOKEN_ID)
                  await expect(nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.be.revertedWith(
                      "NotOwner"
                  )
              })

              it("needs approve for listing Item", async () => {
                  await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID)
                  await expect(nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.be.revertedWith(
                      "NftMarketPlace__NotApprovedForMarketPlace"
                  )
              })

              it("Updates listing with seller and price", async () => {
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const listing = await nftMarketPlace.getListing(basicNft.address, TOKEN_ID)

                  assert(listing.price.toString() == PRICE)
                  assert(listing.seller.toString() == deployer.address)
              })
          })

          describe("Cancling Listing", () => {
              it("reverts if there is not Listing", async () => {
                  const error = `NftMarketPlace__NotListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(nftMarketPlace.cancelListing(basicNft.address, TOKEN_ID)).to.be.revertedWith(error)
              })

              it("reverts if anyone but the owner tries to call", async () => {
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketPlace = await nftMarketPlaceContract.connect(player)
                  await basicNft.approve(player.address, TOKEN_ID)

                  await expect(nftMarketPlace.cancelListing(basicNft.address, TOKEN_ID)).to.be.revertedWith("NotOwner")
              })

              it("emits event and remove the listing", async () => {
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  expect(await nftMarketPlace.cancelListing(basicNft.address, TOKEN_ID)).to.emit("ItemCanceled")
                  const listing = await nftMarketPlace.getListing(basicNft.address, TOKEN_ID)
                  assert(listing.price.toString() == "0")
              })
          })

          describe("buyItem", function () {
              it("reverts if the item isnt listed", async function () {
                  await expect(nftMarketPlace.buyItem(basicNft.address, TOKEN_ID)).to.be.revertedWith("NotListed")
              })
              it("reverts if the price isnt met", async function () {
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(nftMarketPlace.buyItem(basicNft.address, TOKEN_ID)).to.be.revertedWith("PriceNotMet")
              })
              it("transfers the nft to the buyer and updates internal proceeds record", async function () {
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketPlace = nftMarketPlaceContract.connect(player)
                  expect(await nftMarketPlace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })).to.emit(
                      "ItemBought"
                  )
                  const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  const deployerProceeds = await nftMarketPlace.getProceeds(deployer.address)
                  assert(newOwner.toString() == player.address)
                  assert(deployerProceeds.toString() == PRICE.toString())
              })
          })

          describe("updateListing", function () {
              it("must be owner and listed", async function () {
                  await expect(nftMarketPlace.updateListing(basicNft.address, TOKEN_ID, PRICE)).to.be.revertedWith(
                      "NotListed"
                  )
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketPlace = nftMarketPlaceContract.connect(player)
                  await expect(nftMarketPlace.updateListing(basicNft.address, TOKEN_ID, PRICE)).to.be.revertedWith(
                      "NotOwner"
                  )
              })
              it("updates the price of the item", async function () {
                  const updatedPrice = ethers.utils.parseEther("0.2")
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  expect(await nftMarketPlace.updateListing(basicNft.address, TOKEN_ID, updatedPrice)).to.emit(
                      "ItemListed"
                  )
                  const listing = await nftMarketPlace.getListing(basicNft.address, TOKEN_ID)
                  assert(listing.price.toString() == updatedPrice.toString())
              })
          })

          describe("withdrawProceeds", function () {
              it("doesn't allow 0 proceed withdrawls", async function () {
                  await expect(nftMarketPlace.withdrawProceeds()).to.be.revertedWith("NoProceeds")
              })
              it("withdraws proceeds", async function () {
                  await nftMarketPlace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketPlace = nftMarketPlaceContract.connect(player)
                  await nftMarketPlace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  nftMarketPlace = nftMarketPlaceContract.connect(deployer)

                  const deployerProceedsBefore = await nftMarketPlace.getProceeds(deployer.address)
                  const deployerBalanceBefore = await deployer.getBalance()
                  const txResponse = await nftMarketPlace.withdrawProceeds()
                  const transactionReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const deployerBalanceAfter = await deployer.getBalance()

                  assert(
                      deployerBalanceAfter.add(gasCost).toString() ==
                          deployerProceedsBefore.add(deployerBalanceBefore).toString()
                  )
              })
          })
      })
