// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HumanLevelNFT
 * @notice Human user level NFT contract for coidea.ai
 * @notice 人类用户等级 NFT 合约
 *
 * Humans progress through 5 levels (L1-L5) based on contribution points
 * 人类通过贡献值升级，共 5 个等级 (L1-L5)
 *
 * Level Benefits:
 * - L1: Basic task publishing
 * - L2: Higher task rewards
 * - L3: Advanced task types
 * - L4: Arbitration rights
 * - L5: DAO governance
 */
contract HumanLevelNFT is ERC721, ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;

    // Level definitions / 等级定义
    enum Level {
        L1, // Novice / 新手
        L2, // Apprentice / 学徒
        L3, // Expert / 专家
        L4, // Master / 大师
        L5  // Legend / 传奇
    }

    // Human user data structure / 人类用户数据结构
    struct Human {
        string username;                    // Username / 用户名
        Level level;                        // Current level / 当前等级
        uint256 contributionPoints;         // Contribution score / 贡献值
        uint256 tasksPublished;             // Tasks created / 发布任务数
        uint256 tasksCompleted;             // Tasks finished / 完成任务数
        uint256 reputationScore;            // Reputation (0-100) / 声誉分
        address wallet;                     // Wallet address / 钱包地址
        uint256 joinedAt;                   // Join timestamp / 加入时间
        string metadataURI;                 // Metadata URI / 元数据 URI
    }

    // Token ID => Human data / Token ID => 人类数据
    mapping(uint256 => Human) public humans;

    // Wallet address => Token ID / 钱包地址 => Token ID
    mapping(address => uint256) public walletToTokenId;

    // Level thresholds (contribution points) / 等级阈值（贡献值）
    mapping(Level => uint256) public levelThresholds;

    // Level names for metadata (constant) / 等级名称（常量）
    function getLevelName(Level _level) public pure returns (string memory) {
        if (_level == Level.L1) return "Novice";
        if (_level == Level.L2) return "Apprentice";
        if (_level == Level.L3) return "Expert";
        if (_level == Level.L4) return "Master";
        if (_level == Level.L5) return "Legend";
        return "";
    }

    // Events / 事件
    event HumanRegistered(uint256 indexed tokenId, address indexed wallet, string username);
    event LevelUp(uint256 indexed tokenId, Level oldLevel, Level newLevel);
    event ContributionAdded(uint256 indexed tokenId, uint256 points, uint256 total);
    event ReputationUpdated(uint256 indexed tokenId, uint256 oldScore, uint256 newScore);

    constructor() ERC721("Coidea Human", "COHM") Ownable() {
        // Initialize level thresholds / 初始化等级阈值
        levelThresholds[Level.L1] = 0;       // Starting level / 起始等级
        levelThresholds[Level.L2] = 100;     // 100 points / 100 贡献值
        levelThresholds[Level.L3] = 500;     // 500 points / 500 贡献值
        levelThresholds[Level.L4] = 2000;    // 2000 points / 2000 贡献值
        levelThresholds[Level.L5] = 10000;   // 10000 points / 10000 贡献值
    }

    /**
     * @notice Register a new human user
     * @notice 注册新的人类用户
     * @param _username User's display name / 用户显示名称
     * @param _metadataURI Metadata URI / 元数据 URI
     */
    function registerHuman(
        string memory _username,
        string memory _metadataURI
    ) public returns (uint256) {
        require(bytes(_username).length > 0, "Username cannot be empty");
        require(bytes(_username).length <= 32, "Username too long");
        require(!isRegistered(msg.sender), "Wallet already registered");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(msg.sender, tokenId);

        humans[tokenId] = Human({
            username: _username,
            level: Level.L1,
            contributionPoints: 0,
            tasksPublished: 0,
            tasksCompleted: 0,
            reputationScore: 50, // Initial reputation / 初始声誉分
            wallet: msg.sender,
            joinedAt: block.timestamp,
            metadataURI: _metadataURI
        });

        walletToTokenId[msg.sender] = tokenId;

        emit HumanRegistered(tokenId, msg.sender, _username);

        return tokenId;
    }

    /**
     * @notice Add contribution points to a human
     * @notice 为人类用户添加贡献值
     * @param _tokenId Human's token ID / 人类 Token ID
     * @param _points Points to add / 要添加的分数
     */
    function addContribution(uint256 _tokenId, uint256 _points) public onlyOwner {
        require(_exists(_tokenId), "Human does not exist");
        require(_points > 0, "Points must be positive");

        Human storage human = humans[_tokenId];
        human.contributionPoints += _points;

        // Check for level up / 检查是否升级
        _checkLevelUp(_tokenId);

        emit ContributionAdded(_tokenId, _points, human.contributionPoints);
    }

    /**
     * @notice Batch add contribution points
     * @notice 批量添加贡献值
     */
    function batchAddContribution(
        uint256[] memory _tokenIds,
        uint256[] memory _points
    ) public onlyOwner {
        require(_tokenIds.length == _points.length, "Length mismatch");

        for (uint256 i = 0; i < _tokenIds.length; i++) {
            addContribution(_tokenIds[i], _points[i]);
        }
    }

    /**
     * @notice Update reputation score
     * @notice 更新声誉分
     * @param _tokenId Human's token ID / 人类 Token ID
     * @param _newScore New reputation score (0-100) / 新声誉分
     */
    function updateReputation(uint256 _tokenId, uint256 _newScore) public onlyOwner {
        require(_exists(_tokenId), "Human does not exist");
        require(_newScore <= 100, "Score must be 0-100");

        Human storage human = humans[_tokenId];
        uint256 oldScore = human.reputationScore;
        human.reputationScore = _newScore;

        emit ReputationUpdated(_tokenId, oldScore, _newScore);
    }

    /**
     * @notice Record task published
     * @notice 记录任务发布
     */
    function recordTaskPublished(uint256 _tokenId) public onlyOwner {
        require(_exists(_tokenId), "Human does not exist");
        humans[_tokenId].tasksPublished++;
    }

    /**
     * @notice Record task completed
     * @notice 记录任务完成
     */
    function recordTaskCompleted(uint256 _tokenId) public onlyOwner {
        require(_exists(_tokenId), "Human does not exist");
        humans[_tokenId].tasksCompleted++;
    }

    /**
     * @notice Check and perform level up if eligible
     * @notice 检查并执行升级
     */
    function _checkLevelUp(uint256 _tokenId) internal {
        Human storage human = humans[_tokenId];
        Level currentLevel = human.level;
        uint256 points = human.contributionPoints;

        // Check each level from high to low / 从高到低检查每个等级
        for (uint256 i = uint256(Level.L5); i > uint256(currentLevel); i--) {
            Level checkLevel = Level(i);
            if (points >= levelThresholds[checkLevel]) {
                human.level = checkLevel;
                emit LevelUp(_tokenId, currentLevel, checkLevel);
                break;
            }
        }
    }

    /**
     * @notice Force level up (for special cases)
     * @notice 强制升级（特殊情况）
     */
    function forceLevelUp(uint256 _tokenId, Level _newLevel) public onlyOwner {
        require(_exists(_tokenId), "Human does not exist");
        require(_newLevel <= Level.L5, "Invalid level");

        Human storage human = humans[_tokenId];
        Level oldLevel = human.level;
        require(_newLevel > oldLevel, "Can only level up");

        human.level = _newLevel;
        emit LevelUp(_tokenId, oldLevel, _newLevel);
    }

    /**
     * @notice Get human's current level
     * @notice 获取当前等级
     */
    function getLevel(uint256 _tokenId) public view returns (Level) {
        require(_exists(_tokenId), "Human does not exist");
        return humans[_tokenId].level;
    }

    /**
     * @notice Get human's level name
     * @notice 获取等级名称
     */
    function getHumanLevelName(uint256 _tokenId) public view returns (string memory) {
        require(_exists(_tokenId), "Human does not exist");
        return getLevelName(humans[_tokenId].level);
    }

    /**
     * @notice Get human info by wallet
     * @notice 通过钱包地址获取信息
     */
    function getHumanByWallet(address _wallet) public view returns (Human memory) {
        uint256 tokenId = walletToTokenId[_wallet];
        require(tokenId != 0 || _wallet == humans[0].wallet, "Wallet not registered");
        return humans[tokenId];
    }

    /**
     * @notice Check if wallet is registered
     * @notice 检查钱包是否已注册
     */
    function isRegistered(address _wallet) public view returns (bool) {
        uint256 tokenId = walletToTokenId[_wallet];
        // Check if token exists and belongs to this wallet
        if (tokenId >= _tokenIdCounter) return false;
        return humans[tokenId].wallet == _wallet;
    }

    /**
     * @notice Check if human can perform action
     * @notice 检查权限
     */
    function canPublishTask(uint256 _tokenId) public view returns (bool) {
        return _exists(_tokenId);
    }

    function canArbitrate(uint256 _tokenId) public view returns (bool) {
        require(_exists(_tokenId), "Human does not exist");
        return humans[_tokenId].level >= Level.L4;
    }

    function canGovern(uint256 _tokenId) public view returns (bool) {
        require(_exists(_tokenId), "Human does not exist");
        return humans[_tokenId].level >= Level.L5;
    }

    /**
     * @notice Get humans by level
     * @notice 按等级获取人类列表
     */
    function getHumansByLevel(Level _level) public view returns (uint256[] memory) {
        uint256 totalSupply = totalSupply();
        uint256 count = 0;

        // First pass: count / 第一遍：计数
        for (uint256 i = 0; i < totalSupply; i++) {
            if (humans[i].level == _level) {
                count++;
            }
        }

        // Second pass: collect / 第二遍：收集
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < totalSupply; i++) {
            if (humans[i].level == _level) {
                result[index] = i;
                index++;
            }
        }

        return result;
    }

    /**
     * @notice Update level threshold
     * @notice 更新等级阈值
     */
    function setLevelThreshold(Level _level, uint256 _threshold) public onlyOwner {
        require(_level != Level.L1, "Cannot change L1 threshold");
        levelThresholds[_level] = _threshold;
    }

    /**
     * @notice Update metadata URI
     * @notice 更新元数据 URI
     */
    function setTokenURI(uint256 _tokenId, string memory _uri) public {
        require(_isAuthorized(msg.sender, _tokenId), "Not authorized");
        humans[_tokenId].metadataURI = _uri;
    }

    /**
     * @notice Override tokenURI
     * @notice 重写 tokenURI
     */
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "Token does not exist");
        return humans[_tokenId].metadataURI;
    }

    /**
     * @notice Check if token exists
     * @notice 检查 Token 是否存在
     */
    function _exists(uint256 tokenId) internal view override returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @notice Check if authorized
     * @notice 检查是否授权
     */
    function _isAuthorized(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }

    // Override required functions / 重写必要函数
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
