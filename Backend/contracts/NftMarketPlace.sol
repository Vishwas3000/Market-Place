// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error NotOwner();

error NftMarketPlace__PriceMustBeAboveZero();
error NftMarketPlace__NotApprovedForMarketPlace();
error NftMarketPlace__NotListed(address nftAddress, uint256 tokenId);
error NftMarketPlace__AlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketPlace__PriceNotMet(address nftAddress, uint256 tokenId, uint256 nftPrice);
error NftMarketPlace__NoProceeds();

contract NftMarketPlace is ReentrancyGuard {
    struct Listing {
        address seller;
        uint256 price;
    }

    // Events //
    event ItemListed(address indexed seller, address indexed nftAddress, uint256 indexed tokenId, uint256 price);
    event ItemBought(address indexed buyer, address indexed nftAddress, uint256 indexed tokenId, uint256 price);
    event ItemCancled(address indexed seller, address indexed nftAddress, uint256 tokenId);

    // State Variables //
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    mapping(address => uint256) private s_proceeds;

    // Modifiers //

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        if (nft.ownerOf(tokenId) != spender) {
            revert NotOwner();
        }
        _;
    }

    modifier listedRequired(
        bool required,
        address nftAddress,
        uint256 tokenId
    ) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (required) {
            if (listing.price <= 0) {
                revert NftMarketPlace__NotListed(nftAddress, tokenId);
            }
        } else {
            if (listing.price > 0) {
                revert NftMarketPlace__AlreadyListed(nftAddress, tokenId);
            }
        }
        _;
    }

    // Main Function//

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external isOwner(nftAddress, tokenId, msg.sender) listedRequired(false, nftAddress, tokenId) {
        if (price <= 0) {
            revert NftMarketPlace__PriceMustBeAboveZero();
        }
        IERC721 nft = IERC721(nftAddress);

        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketPlace__NotApprovedForMarketPlace();
        }

        s_listings[nftAddress][tokenId] = Listing(msg.sender, price);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(
        address nftAddress,
        uint256 tokenId
    ) external payable nonReentrant listedRequired(true, nftAddress, tokenId) {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        if (msg.value < listedItem.price) {
            revert NftMarketPlace__PriceNotMet(nftAddress, tokenId, listedItem.price);
        }
        s_proceeds[listedItem.seller] += msg.value;

        delete (s_listings[nftAddress][tokenId]);
        IERC721(nftAddress).safeTransferFrom(listedItem.seller, msg.sender, tokenId);
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    function cancelListing(
        address nftAddress,
        uint256 tokenId
    ) external isOwner(nftAddress, tokenId, msg.sender) listedRequired(true, nftAddress, tokenId) {
        delete (s_listings[nftAddress][tokenId]);
        emit ItemCancled(msg.sender, nftAddress, tokenId);
    }

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    ) external isOwner(nftAddress, tokenId, msg.sender) listedRequired(true, nftAddress, tokenId) {
        if (newPrice <= 0) {
            revert NftMarketPlace__PriceMustBeAboveZero();
        }
        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0) {
            revert NftMarketPlace__NoProceeds();
        }
        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        require(success, "Transfer failed");
    }

    function getListing(address nftAddress, uint256 tokenId) external view returns (Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }
}

// 1. `ListItem`: List NFTs on the marketplace
// 2. `BuyItem`: Buy NFTs
// 3. `CancleItem`: Cancle Listing
// 4. `UpdatingListing`: Update pricing
// 5. `withdrawProceeds`: Withdraw payment for my bought NFT
