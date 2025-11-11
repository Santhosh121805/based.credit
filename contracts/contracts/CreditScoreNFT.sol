// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CreditScoreNFT
 * @dev NFT contract representing credit scores on the blockchain
 * @notice Each NFT represents a verified credit score with metadata
 */
contract CreditScoreNFT is ERC721, ERC721Enumerable, ERC721Pausable, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    uint256 private _tokenIdCounter;

    // Credit Score Data Structure
    struct CreditScore {
        uint256 score; // Credit score (300-850)
        uint256 timestamp; // When score was generated
        uint256 validUntil; // Expiration timestamp
        string reportHash; // IPFS hash of detailed credit report
        address oracle; // Oracle that provided the score
        bool isActive; // Whether the score is still valid
    }

    // Mapping from token ID to credit score data
    mapping(uint256 => CreditScore) public creditScores;
    
    // Mapping from user address to their latest token ID
    mapping(address => uint256) public userLatestToken;
    
    // Mapping from user to all their token IDs
    mapping(address => uint256[]) public userTokens;

    // Events
    event CreditScoreMinted(
        address indexed user,
        uint256 indexed tokenId,
        uint256 score,
        uint256 validUntil,
        string reportHash
    );
    
    event CreditScoreUpdated(
        uint256 indexed tokenId,
        uint256 newScore,
        uint256 newValidUntil,
        string newReportHash
    );
    
    event CreditScoreRevoked(uint256 indexed tokenId, string reason);

    // Custom errors
    error InvalidScore(uint256 score);
    error ScoreExpired(uint256 tokenId);
    error UnauthorizedOracle(address oracle);
    error TokenNotExists(uint256 tokenId);

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }

    /**
     * @dev Mint a new credit score NFT
     * @param to The address to mint the NFT to
     * @param score The credit score (300-850)
     * @param validityPeriod How long the score is valid (in seconds)
     * @param reportHash IPFS hash of the detailed credit report
     */
    function mintCreditScore(
        address to,
        uint256 score,
        uint256 validityPeriod,
        string memory reportHash
    ) public onlyRole(MINTER_ROLE) nonReentrant {
        if (score < 300 || score > 850) {
            revert InvalidScore(score);
        }

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        uint256 validUntil = block.timestamp + validityPeriod;

        // Store credit score data
        creditScores[tokenId] = CreditScore({
            score: score,
            timestamp: block.timestamp,
            validUntil: validUntil,
            reportHash: reportHash,
            oracle: msg.sender,
            isActive: true
        });

        // Update user mappings
        userLatestToken[to] = tokenId;
        userTokens[to].push(tokenId);

        _safeMint(to, tokenId);

        emit CreditScoreMinted(to, tokenId, score, validUntil, reportHash);
    }

    /**
     * @dev Update an existing credit score
     * @param tokenId The token ID to update
     * @param newScore The new credit score
     * @param newValidityPeriod New validity period
     * @param newReportHash New IPFS hash
     */
    function updateCreditScore(
        uint256 tokenId,
        uint256 newScore,
        uint256 newValidityPeriod,
        string memory newReportHash
    ) public onlyRole(ORACLE_ROLE) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenNotExists(tokenId);
        }
        
        if (newScore < 300 || newScore > 850) {
            revert InvalidScore(newScore);
        }

        CreditScore storage credit = creditScores[tokenId];
        
        credit.score = newScore;
        credit.timestamp = block.timestamp;
        credit.validUntil = block.timestamp + newValidityPeriod;
        credit.reportHash = newReportHash;
        credit.oracle = msg.sender;

        emit CreditScoreUpdated(tokenId, newScore, credit.validUntil, newReportHash);
    }

    /**
     * @dev Revoke a credit score (mark as inactive)
     * @param tokenId The token ID to revoke
     * @param reason Reason for revocation
     */
    function revokeCreditScore(
        uint256 tokenId,
        string memory reason
    ) public onlyRole(ORACLE_ROLE) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenNotExists(tokenId);
        }

        creditScores[tokenId].isActive = false;
        emit CreditScoreRevoked(tokenId, reason);
    }

    /**
     * @dev Get credit score data for a token
     * @param tokenId The token ID to query
     * @return The credit score data
     */
    function getCreditScore(uint256 tokenId) public view returns (CreditScore memory) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenNotExists(tokenId);
        }
        return creditScores[tokenId];
    }

    /**
     * @dev Check if a credit score is valid (active and not expired)
     * @param tokenId The token ID to check
     * @return Whether the score is valid
     */
    function isValidScore(uint256 tokenId) public view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) {
            return false;
        }
        
        CreditScore memory credit = creditScores[tokenId];
        return credit.isActive && block.timestamp <= credit.validUntil;
    }

    /**
     * @dev Get user's latest valid credit score
     * @param user The user address
     * @return tokenId The latest token ID (0 if none)
     * @return score The credit score (0 if none/invalid)
     */
    function getUserLatestScore(address user) public view returns (uint256 tokenId, uint256 score) {
        tokenId = userLatestToken[user];
        
        if (tokenId == 0 || !isValidScore(tokenId)) {
            return (0, 0);
        }
        
        score = creditScores[tokenId].score;
    }

    /**
     * @dev Get all token IDs owned by a user
     * @param user The user address
     * @return Array of token IDs
     */
    function getUserTokens(address user) public view returns (uint256[] memory) {
        return userTokens[user];
    }

    /**
     * @dev Pause the contract
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Get the token URI (metadata)
     * @param tokenId The token ID
     * @return The token URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenNotExists(tokenId);
        }

        // In a real implementation, you would construct a proper metadata URI
        // For now, return the IPFS hash of the credit report
        return string(abi.encodePacked("ipfs://", creditScores[tokenId].reportHash));
    }

    // Required overrides for OpenZeppelin v5
    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function _update(address to, uint256 tokenId, address auth) 
        internal 
        override(ERC721, ERC721Enumerable, ERC721Pausable) 
        returns (address) 
    {
        address from = _ownerOf(tokenId);
        
        // Update user mappings when transferring
        if (from != address(0) && to != address(0) && from != to) {
            // Remove from old owner's tokens
            uint256[] storage fromTokens = userTokens[from];
            for (uint256 i = 0; i < fromTokens.length; i++) {
                if (fromTokens[i] == tokenId) {
                    fromTokens[i] = fromTokens[fromTokens.length - 1];
                    fromTokens.pop();
                    break;
                }
            }
            
            // Add to new owner's tokens
            userTokens[to].push(tokenId);
            
            // Update latest token if this was the latest for the sender
            if (userLatestToken[from] == tokenId) {
                userLatestToken[from] = fromTokens.length > 0 ? fromTokens[fromTokens.length - 1] : 0;
            }
        }
        
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}