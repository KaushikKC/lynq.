// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title VerificationSBT
 * @notice Soulbound token (non-transferable) for verified users
 * @dev Implements ERC721 with transfer restrictions to create soulbound tokens
 */
contract VerificationSBT is ERC721, AccessControl {
    using Strings for uint256;
    
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    uint256 private _tokenIdCounter;
    
    // Mapping from address to token ID (each address can only have one SBT)
    mapping(address => uint256) public userToTokenId;
    
    // Mapping from token ID to metadata URI
    mapping(uint256 => string) private _tokenURIs;
    
    // Mapping to track if an address has ever been verified
    mapping(address => bool) public hasBeenVerified;
    
    event VerificationMinted(address indexed user, uint256 indexed tokenId, string metadataURI);
    event VerificationRevoked(address indexed user, uint256 indexed tokenId);
    
    constructor() ERC721("Lynq Verification SBT", "LYNQ-SBT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }
    
    /**
     * @notice Mint a soulbound token to a verified user
     * @param to Address to mint the SBT to
     * @param metadataURI IPFS or HTTP URI containing verification metadata
     */
    function mintSBT(address to, string calldata metadataURI) external onlyRole(VERIFIER_ROLE) {
        require(to != address(0), "VerificationSBT: Cannot mint to zero address");
        require(userToTokenId[to] == 0 && !hasBeenVerified[to], "VerificationSBT: User already verified");
        
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;
        
        _safeMint(to, newTokenId);
        _tokenURIs[newTokenId] = metadataURI;
        userToTokenId[to] = newTokenId;
        hasBeenVerified[to] = true;
        
        emit VerificationMinted(to, newTokenId, metadataURI);
    }
    
    /**
     * @notice Revoke a user's verification SBT
     * @param user Address to revoke verification from
     */
    function revokeSBT(address user) external onlyRole(VERIFIER_ROLE) {
        uint256 tokenId = userToTokenId[user];
        require(tokenId != 0, "VerificationSBT: User not verified");
        
        _burn(tokenId);
        delete userToTokenId[user];
        delete _tokenURIs[tokenId];
        
        emit VerificationRevoked(user, tokenId);
    }
    
    /**
     * @notice Check if a user is currently verified
     * @param user Address to check
     * @return bool True if user has an active SBT
     */
    function isVerified(address user) public view returns (bool) {
        uint256 tokenId = userToTokenId[user];
        return tokenId != 0 && _ownerOf(tokenId) == user;
    }
    
    /**
     * @notice Get token URI for a token ID
     * @param tokenId Token ID to query
     * @return string Metadata URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }
    
    /**
     * @notice Override transfer functions to make tokens soulbound (non-transferable)
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        // Disallow transfers between addresses
        require(
            from == address(0) || to == address(0),
            "VerificationSBT: Soulbound token cannot be transferred"
        );
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @notice Override approve to prevent approvals (soulbound)
     */
    function approve(address /* to */, uint256 /* tokenId */) public pure override {
        revert("VerificationSBT: Soulbound token cannot be approved");
    }
    
    /**
     * @notice Override setApprovalForAll to prevent approvals (soulbound)
     */
    function setApprovalForAll(address /* operator */, bool /* approved */) public pure override {
        revert("VerificationSBT: Soulbound token cannot be approved");
    }
    
    /**
     * @notice Required override for AccessControl
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

