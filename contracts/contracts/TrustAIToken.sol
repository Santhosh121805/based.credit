// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TrustAIToken
 * @dev Governance and utility token for Trust AI Weave platform
 * @notice Used for governance voting, fee payments, and staking rewards
 */
contract TrustAIToken is ERC20, ERC20Pausable, AccessControl, ERC20Permit, ReentrancyGuard {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    // Token distribution allocations
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant TEAM_ALLOCATION = 150_000_000 * 10**18; // 15%
    uint256 public constant ECOSYSTEM_ALLOCATION = 300_000_000 * 10**18; // 30%
    uint256 public constant PUBLIC_SALE_ALLOCATION = 200_000_000 * 10**18; // 20%
    uint256 public constant LIQUIDITY_ALLOCATION = 150_000_000 * 10**18; // 15%
    uint256 public constant TREASURY_ALLOCATION = 200_000_000 * 10**18; // 20%

    // Vesting schedules
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 duration;
        uint256 cliff;
        bool revocable;
        bool revoked;
    }

    mapping(address => VestingSchedule) public vestingSchedules;
    
    // Staking mechanism
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 rewardDebt;
        uint256 lockPeriod;
    }

    mapping(address => StakeInfo) public stakes;
    
    uint256 public totalStaked;
    uint256 public rewardRate = 100; // 1% per year (100 basis points)
    uint256 public constant REWARD_PRECISION = 10000;
    
    // Fee structure for platform services
    uint256 public creditScoreFee = 10 * 10**18; // 10 tokens for credit score generation
    uint256 public loanApplicationFee = 50 * 10**18; // 50 tokens for loan applications
    
    // Treasury and fee collection
    address public treasury;
    uint256 public totalFeesCollected;

    // Events
    event TokensVested(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary);
    event TokensStaked(address indexed staker, uint256 amount, uint256 lockPeriod);
    event TokensUnstaked(address indexed staker, uint256 amount, uint256 reward);
    event RewardsHarvested(address indexed staker, uint256 reward);
    event FeeCollected(address indexed payer, uint256 amount, string serviceType);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event FeeUpdated(string serviceType, uint256 oldFee, uint256 newFee);

    constructor(
        address _treasury
    ) ERC20("Trust AI Token", "TRUST") ERC20Permit("Trust AI Token") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        
        treasury = _treasury;
        
        // Initial token distribution
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    /**
     * @dev Create a vesting schedule for a beneficiary
     * @param beneficiary The address that will receive tokens
     * @param amount Total amount to be vested
     * @param startTime When vesting starts
     * @param duration Total vesting duration in seconds
     * @param cliff Cliff period in seconds
     * @param revocable Whether the vesting can be revoked
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 startTime,
        uint256 duration,
        uint256 cliff,
        bool revocable
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(amount > 0, "Amount must be positive");
        require(duration > 0, "Duration must be positive");
        require(cliff <= duration, "Cliff longer than duration");
        require(vestingSchedules[beneficiary].totalAmount == 0, "Vesting already exists");

        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            releasedAmount: 0,
            startTime: startTime,
            duration: duration,
            cliff: cliff,
            revocable: revocable,
            revoked: false
        });

        // Transfer tokens to contract for vesting
        _transfer(msg.sender, address(this), amount);
    }

    /**
     * @dev Release vested tokens to beneficiary
     * @param beneficiary The address to release tokens to
     */
    function releaseVestedTokens(address beneficiary) public nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        require(schedule.totalAmount > 0, "No vesting schedule");
        require(!schedule.revoked, "Vesting revoked");
        require(block.timestamp >= schedule.startTime + schedule.cliff, "Cliff period not met");

        uint256 vestedAmount = calculateVestedAmount(beneficiary);
        uint256 releasableAmount = vestedAmount - schedule.releasedAmount;
        
        require(releasableAmount > 0, "No tokens to release");

        schedule.releasedAmount += releasableAmount;
        _transfer(address(this), beneficiary, releasableAmount);

        emit TokensVested(beneficiary, releasableAmount);
    }

    /**
     * @dev Calculate the amount of tokens vested for a beneficiary
     * @param beneficiary The address to calculate for
     * @return The amount of vested tokens
     */
    function calculateVestedAmount(address beneficiary) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        
        if (schedule.totalAmount == 0 || schedule.revoked) {
            return 0;
        }

        if (block.timestamp < schedule.startTime + schedule.cliff) {
            return 0;
        }

        if (block.timestamp >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount;
        }

        uint256 timeElapsed = block.timestamp - schedule.startTime;
        return (schedule.totalAmount * timeElapsed) / schedule.duration;
    }

    /**
     * @dev Stake tokens for rewards
     * @param amount Amount to stake
     * @param lockPeriod Lock period in seconds
     */
    function stake(uint256 amount, uint256 lockPeriod) public nonReentrant {
        require(amount > 0, "Amount must be positive");
        require(lockPeriod >= 30 days, "Minimum lock period is 30 days");
        require(lockPeriod <= 365 days, "Maximum lock period is 365 days");

        // Harvest existing rewards first
        if (stakes[msg.sender].amount > 0) {
            _harvestRewards(msg.sender);
        }

        _transfer(msg.sender, address(this), amount);
        
        stakes[msg.sender] = StakeInfo({
            amount: stakes[msg.sender].amount + amount,
            startTime: block.timestamp,
            rewardDebt: 0,
            lockPeriod: lockPeriod
        });

        totalStaked += amount;

        emit TokensStaked(msg.sender, amount, lockPeriod);
    }

    /**
     * @dev Unstake tokens and claim rewards
     */
    function unstake() public nonReentrant {
        StakeInfo storage stakeInfo = stakes[msg.sender];
        require(stakeInfo.amount > 0, "No tokens staked");
        require(block.timestamp >= stakeInfo.startTime + stakeInfo.lockPeriod, "Tokens still locked");

        uint256 amount = stakeInfo.amount;
        uint256 rewards = calculateRewards(msg.sender);

        // Reset stake
        totalStaked -= amount;
        delete stakes[msg.sender];

        // Transfer staked tokens and rewards
        _transfer(address(this), msg.sender, amount + rewards);

        emit TokensUnstaked(msg.sender, amount, rewards);
    }

    /**
     * @dev Calculate pending rewards for a staker
     * @param staker The staker address
     * @return The pending rewards
     */
    function calculateRewards(address staker) public view returns (uint256) {
        StakeInfo memory stakeInfo = stakes[staker];
        if (stakeInfo.amount == 0) {
            return 0;
        }

        uint256 stakingDuration = block.timestamp - stakeInfo.startTime;
        uint256 maxDuration = stakeInfo.lockPeriod;
        
        // Calculate pro-rated rewards based on lock period multiplier
        uint256 lockMultiplier = (stakeInfo.lockPeriod * 100) / (365 days); // 100% bonus for 1 year lock
        uint256 effectiveRate = rewardRate + (rewardRate * lockMultiplier) / 100;
        
        return (stakeInfo.amount * effectiveRate * stakingDuration) / (365 days * REWARD_PRECISION);
    }

    /**
     * @dev Harvest rewards without unstaking
     */
    function harvestRewards() public nonReentrant {
        _harvestRewards(msg.sender);
    }

    /**
     * @dev Internal function to harvest rewards
     * @param staker The staker address
     */
    function _harvestRewards(address staker) internal {
        uint256 rewards = calculateRewards(staker);
        if (rewards > 0) {
            stakes[staker].rewardDebt += rewards;
            stakes[staker].startTime = block.timestamp; // Reset start time for reward calculation
            
            _mint(address(this), rewards); // Mint new tokens as rewards
            _transfer(address(this), staker, rewards);
            
            emit RewardsHarvested(staker, rewards);
        }
    }

    /**
     * @dev Pay service fee with tokens
     * @param serviceType Type of service ("credit_score", "loan_application")
     * @param amount Fee amount
     */
    function payServiceFee(string memory serviceType, uint256 amount) public nonReentrant {
        require(amount > 0, "Amount must be positive");
        
        // Verify fee amount is correct
        if (keccak256(bytes(serviceType)) == keccak256(bytes("credit_score"))) {
            require(amount == creditScoreFee, "Invalid credit score fee");
        } else if (keccak256(bytes(serviceType)) == keccak256(bytes("loan_application"))) {
            require(amount == loanApplicationFee, "Invalid loan application fee");
        } else {
            revert("Invalid service type");
        }

        _transfer(msg.sender, treasury, amount);
        totalFeesCollected += amount;

        emit FeeCollected(msg.sender, amount, serviceType);
    }

    /**
     * @dev Update reward rate (admin only)
     * @param newRate New reward rate in basis points
     */
    function updateRewardRate(uint256 newRate) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRate <= 1000, "Reward rate too high"); // Max 10%
        
        uint256 oldRate = rewardRate;
        rewardRate = newRate;
        
        emit RewardRateUpdated(oldRate, newRate);
    }

    /**
     * @dev Update service fees (admin only)
     * @param serviceType Service type to update
     * @param newFee New fee amount
     */
    function updateServiceFee(string memory serviceType, uint256 newFee) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFee > 0, "Fee must be positive");
        
        if (keccak256(bytes(serviceType)) == keccak256(bytes("credit_score"))) {
            uint256 oldFee = creditScoreFee;
            creditScoreFee = newFee;
            emit FeeUpdated(serviceType, oldFee, newFee);
        } else if (keccak256(bytes(serviceType)) == keccak256(bytes("loan_application"))) {
            uint256 oldFee = loanApplicationFee;
            loanApplicationFee = newFee;
            emit FeeUpdated(serviceType, oldFee, newFee);
        } else {
            revert("Invalid service type");
        }
    }

    /**
     * @dev Mint tokens (admin only)
     * @param to Address to mint to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from sender
     * @param amount Amount to burn
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    /**
     * @dev Burn tokens from account (requires approval)
     * @param from Account to burn from
     * @param amount Amount to burn
     */
    function burnFrom(address from, uint256 amount) public onlyRole(BURNER_ROLE) {
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Required override for OpenZeppelin v5
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
}