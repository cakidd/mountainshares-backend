// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MountainSharesComplianceFramework is ERC20, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256("COMPLIANCE_OFFICER_ROLE");
    bytes32 public constant EMERGENCY_RESPONDER_ROLE = keccak256("EMERGENCY_RESPONDER_ROLE");
    
    // Phase System (from MountainShares5.pdf)
    enum SystemPhase { PHASE1, PHASE2, PHASE3, EMERGENCY }
    SystemPhase public currentPhase;
    
    // Dual-Balance System (from MountainShares5.pdf)
    struct Balance {
        uint256 purchased; // USD-backed, always redeemable
        uint256 earned;    // Volunteer hour-backed, federal rate
    }
    
    struct KYCProfile {
        bool isVerified;
        bool isEmergencyResponder;
        string jurisdiction;
        uint256 verificationTimestamp;
        uint256 verificationExpiry;
        address verifiedBy;
        string kycLevel;
    }
    
    mapping(address => KYCProfile) public kycProfiles;
    mapping(string => bool) public approvedJurisdictions;
    mapping(address => uint256) public lockedBalances;
    mapping(string => bool) public statePaused;
    mapping(address => Balance) private _balances;
    
    uint256 private _totalPurchased;
    uint256 private _totalEarned;
    uint256 public usdcReserve;
    uint256 public constant PHASE2_THRESHOLD = 100_000 * 1e6; // $100k
    
    bool public foundationPhaseUnlocked = false;
    uint256 public totalLockedTokens;
    
    event KYCStatusUpdated(address indexed user, bool verified, string jurisdiction);
    event LockedTokensIssued(address indexed user, uint256 amount, string reason);
    event FoundationPhaseUnlocked(uint256 totalUnlocked, uint256 affectedUsers);
    event PhaseTransition(SystemPhase oldPhase, SystemPhase newPhase);
    
    constructor() ERC20("MountainShares", "MS") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COMPLIANCE_OFFICER_ROLE, msg.sender);
        currentPhase = SystemPhase.PHASE1;
        
        approvedJurisdictions["US-WV"] = true;
        approvedJurisdictions["US-PA"] = true;
        approvedJurisdictions["US-VA"] = true;
        approvedJurisdictions["US-KY"] = true;
        approvedJurisdictions["US-TN"] = true;
        approvedJurisdictions["US-NC"] = true;
    }
    
    function setKYCStatus(address user, bool verified, string memory jurisdiction, string memory kycLevel, uint256 expiryDays) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        kycProfiles[user] = KYCProfile({
            isVerified: verified,
            isEmergencyResponder: false,
            jurisdiction: jurisdiction,
            verificationTimestamp: block.timestamp,
            verificationExpiry: block.timestamp + (expiryDays * 1 days),
            verifiedBy: msg.sender,
            kycLevel: kycLevel
        });
        emit KYCStatusUpdated(user, verified, jurisdiction);
    }
    
    // DEFINE THIS FUNCTION BEFORE mintBatch CALLS IT
    function mintCulturalContribution(address contributor, uint256 amount, string memory culturalAssetId, bool isLocked) external onlyRole(COMPLIANCE_OFFICER_ROLE) whenNotPaused() nonReentrant() {
        require(kycProfiles[contributor].isVerified, "Contributor must be KYC verified");
        
        if (isLocked && !foundationPhaseUnlocked) {
            lockedBalances[contributor] += amount;
            totalLockedTokens += amount;
            _balances[contributor].earned += amount;
            _totalEarned += amount;
            emit LockedTokensIssued(contributor, amount, culturalAssetId);
        } else {
            _balances[contributor].earned += amount;
            _totalEarned += amount;
            _mint(contributor, amount);
        }
    }
    
    // NOW mintBatch CAN CALL mintCulturalContribution
    function mintBatch(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string[] calldata reasons
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        require(recipients.length == amounts.length, "Array length mismatch");
        require(amounts.length == reasons.length, "Array length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(kycProfiles[recipients[i]].isVerified, "Recipient not KYC verified");
            // This internal call should work now
            this.mintCulturalContribution(recipients[i], amounts[i], reasons[i], true);
        }
    }
    
    function purchaseMS(uint256 usdcAmount) external {
        require(currentPhase != SystemPhase.EMERGENCY, "Emergency mode active");
        _balances[msg.sender].purchased += usdcAmount;
        _totalPurchased += usdcAmount;
        usdcReserve += usdcAmount;
        _mint(msg.sender, usdcAmount);
        _checkPhaseTransition();
    }
    
    function _checkPhaseTransition() internal {
        SystemPhase oldPhase = currentPhase;
        uint256 requiredReserve = _calculateRequiredReserve();
        
        if (usdcReserve < PHASE2_THRESHOLD) {
            currentPhase = SystemPhase.EMERGENCY;
        } else if (usdcReserve >= requiredReserve) {
            currentPhase = SystemPhase.PHASE3;
        } else if (usdcReserve >= PHASE2_THRESHOLD) {
            currentPhase = SystemPhase.PHASE2;
        }
        
        if (oldPhase != currentPhase) {
            emit PhaseTransition(oldPhase, currentPhase);
        }
    }
    
    function _calculateRequiredReserve() internal view returns (uint256) {
        return _totalPurchased + (_totalEarned * 34700000); // $34.70 federal rate
    }
    
    function unlockFoundationPhase() external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        require(!foundationPhaseUnlocked, "Foundation phase already unlocked");
        foundationPhaseUnlocked = true;
        emit FoundationPhaseUnlocked(totalLockedTokens, 0);
    }
    
    function claimUnlockedTokens() external {
        require(foundationPhaseUnlocked, "Foundation phase not yet unlocked");
        require(lockedBalances[msg.sender] > 0, "No locked tokens to claim");
        
        uint256 amount = lockedBalances[msg.sender];
        lockedBalances[msg.sender] = 0;
        totalLockedTokens -= amount;
        _mint(msg.sender, amount);
    }
    
    function getUserBalance(address user) external view returns (uint256 purchased, uint256 earned) {
        return (_balances[user].purchased, _balances[user].earned);
    }
    
    function isJurisdictionApproved(string memory jurisdiction) external view returns (bool) {
        return approvedJurisdictions[jurisdiction];
    }
    
    function getUserKYCStatus(address user) external view returns (KYCProfile memory) {
        return kycProfiles[user];
    }
}
