import styles from "../styles/Home.module.css"
import { useMoralis } from "react-moralis"
import GET_ACTIVE_ITEMS from "../constants/subGraphQueries"
import NFTBox from "../components/NFTBox"
import networkMapping from "../constants/networkMapping.json"
import { useQuery } from "@apollo/client"

export default function Home() {
    const { isWeb3Enabled, chainId } = useMoralis()

    const chainIdString = chainId ? parseInt(chainId).toString() : "31337"
    const marketPlaceAddress = networkMapping[chainIdString].NftMarketPlace[0]

    const { loading, error, data: listedNfts } = useQuery(GET_ACTIVE_ITEMS)
    console.log("Listed Nfts: ", listedNfts)

    return (
        <div className="container mx-auto">
            <h1 className="py-4 px-4 font-bold text-2xl">Recently Listed</h1>
            <div className="flex flex-wrap">
                {isWeb3Enabled ? (
                    loading || !listedNfts ? (
                        <div>Loading...</div>
                    ) : (
                        listedNfts.activeItems.map((nft) => {
                            console.log(nft)
                            const { price, nftAddress, tokenId, seller } = nft
                            return (
                                <NFTBox
                                    price={price}
                                    nftAddress={nftAddress}
                                    tokenId={tokenId}
                                    marketplaceAddress={marketPlaceAddress}
                                    seller={seller}
                                    key={`${nftAddress}${tokenId}`}
                                />
                            )
                        })
                    )
                ) : (
                    <div>Web3 Currently Not Enabled</div>
                )}
            </div>
        </div>
    )
}
