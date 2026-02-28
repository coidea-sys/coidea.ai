// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title X402Payment
 * @notice Micropayment contract implementing the x402 payment protocol
 * @notice 实现 x402 微支付协议的合约
 * 
 * The x402 protocol enables:
 * - Pre-authorized payments with settlement
 * - Low-cost micropayments (near-zero fees on L2)
 * - Instant settlement
 * - Payment streaming
 * 
 * x402 协议支持：
 * - 预授权支付与结算
 * - 低成本微支付（L2 上接近零手续费）
 * - 即时结算
 * - 支付流
 */
contract X402Payment is Ownable, ReentrancyGuard {
    
    // Payment state / 支付状态
    enum PaymentState {
        Pending,      // 0 - Authorized but not settled / 已授权未结算
        Settled,      // 1 - Successfully settled / 已成功结算
        Cancelled,    // 2 - Cancelled or expired / 已取消或过期
        Refunded      // 3 - Refunded to payer / 已退款
    }
    
    // Authorization structure / 授权结构
    struct Authorization {
        address payer;           // Payer address / 付款方地址
        address payee;           // Payee address / 收款方地址
        uint256 amount;          // Authorized amount / 授权金额
        uint256 settledAmount;   // Actually settled amount / 实际结算金额
        address token;           // Token address (address(0) for ETH) / 代币地址
        uint256 createdAt;       // Creation timestamp / 创建时间
        uint256 expiresAt;       // Expiration timestamp / 过期时间
        bytes32 payloadHash;     // Hash of payment payload / 支付负载哈希
        PaymentState state;      // Current state / 当前状态
    }
    
    // Authorization ID => Authorization / 授权 ID => 授权
    mapping(bytes32 => Authorization) public authorizations;
    
    // Payer => authorization IDs / 付款方 => 授权 ID 列表
    mapping(address => bytes32[]) public payerAuthorizations;
    
    // Payee => authorization IDs / 收款方 => 授权 ID 列表
    mapping(address => bytes32[]) public payeeAuthorizations;
    
    // Nonce tracking for replay protection / 防重放攻击的 nonce 追踪
    mapping(address => uint256) public nonces;
    
    // Platform fee (in basis points, 100 = 1%) / 平台手续费（基点，100=1%）
    uint256 public platformFee = 100; // 1% default / 默认 1%
    
    // Fee recipient / 手续费接收地址
    address public feeRecipient;
    
    // Minimum authorization amount / 最小授权金额
    uint256 public minAuthorizationAmount = 0.001 ether;
    
    // Maximum authorization duration / 最大授权时长
    uint256 public maxAuthorizationDuration = 30 days;
    
    // Supported tokens / 支持的代币
    mapping(address => bool) public supportedTokens;
    
    // Events / 事件
    event Authorized(
        bytes32 indexed authorizationId,
        address indexed payer,
        address indexed payee,
        uint256 amount,
        address token
    );
    event Settled(
        bytes32 indexed authorizationId,
        uint256 amount,
        uint256 fee
    );
    event Cancelled(bytes32 indexed authorizationId);
    event Refunded(bytes32 indexed authorizationId, uint256 amount);
    event TokenSupportUpdated(address indexed token, bool supported);
    event PlatformFeeUpdated(uint256 newFee);
    
    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
        
        // ETH is always supported / ETH 始终支持
        supportedTokens[address(0)] = true;
    }
    
    /**
     * @notice Create a payment authorization with ETH
     * @notice 使用 ETH 创建支付授权
     */
    function authorizeETH(
        address _payee,
        uint256 _amount,
        uint256 _duration,
        bytes32 _payloadHash
    ) public payable returns (bytes32) {
        require(msg.value >= _amount, "Insufficient ETH sent");
        require(_amount >= minAuthorizationAmount, "Amount below minimum");
        require(_duration <= maxAuthorizationDuration, "Duration too long");
        require(_payee != address(0), "Invalid payee");
        require(_payee != msg.sender, "Cannot pay yourself");
        
        bytes32 authorizationId = keccak256(
            abi.encodePacked(
                msg.sender,
                _payee,
                _amount,
                address(0),
                block.timestamp,
                nonces[msg.sender]++
            )
        );
        
        authorizations[authorizationId] = Authorization({
            payer: msg.sender,
            payee: _payee,
            amount: _amount,
            settledAmount: 0,
            token: address(0),
            createdAt: block.timestamp,
            expiresAt: block.timestamp + _duration,
            payloadHash: _payloadHash,
            state: PaymentState.Pending
        });
        
        payerAuthorizations[msg.sender].push(authorizationId);
        payeeAuthorizations[_payee].push(authorizationId);
        
        // Refund excess / 退还多余金额
        if (msg.value > _amount) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - _amount}("");
            require(success, "Refund failed");
        }
        
        emit Authorized(authorizationId, msg.sender, _payee, _amount, address(0));
        
        return authorizationId;
    }
    
    /**
     * @notice Create a payment authorization with ERC20 token
     * @notice 使用 ERC20 代币创建支付授权
     */
    function authorizeToken(
        address _token,
        address _payee,
        uint256 _amount,
        uint256 _duration,
        bytes32 _payloadHash
    ) public returns (bytes32) {
        require(supportedTokens[_token], "Token not supported");
        require(_amount >= minAuthorizationAmount, "Amount below minimum");
        require(_duration <= maxAuthorizationDuration, "Duration too long");
        require(_payee != address(0), "Invalid payee");
        require(_payee != msg.sender, "Cannot pay yourself");
        
        // Transfer tokens to contract / 将代币转移到合约
        IERC20 token = IERC20(_token);
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "Token transfer failed"
        );
        
        bytes32 authorizationId = keccak256(
            abi.encodePacked(
                msg.sender,
                _payee,
                _amount,
                _token,
                block.timestamp,
                nonces[msg.sender]++
            )
        );
        
        authorizations[authorizationId] = Authorization({
            payer: msg.sender,
            payee: _payee,
            amount: _amount,
            settledAmount: 0,
            token: _token,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + _duration,
            payloadHash: _payloadHash,
            state: PaymentState.Pending
        });
        
        payerAuthorizations[msg.sender].push(authorizationId);
        payeeAuthorizations[_payee].push(authorizationId);
        
        emit Authorized(authorizationId, msg.sender, _payee, _amount, _token);
        
        return authorizationId;
    }
    
    /**
     * @notice Settle a payment authorization (called by payee)
     * @notice 结算支付授权（由收款方调用）
     * @param _authorizationId Authorization ID / 授权 ID
     * @param _amount Amount to settle / 结算金额
     * @param _payload Payment payload (must match hash) / 支付负载（必须匹配哈希）
     */
    function settle(
        bytes32 _authorizationId,
        uint256 _amount,
        bytes memory _payload
    ) public nonReentrant {
        Authorization storage auth = authorizations[_authorizationId];
        
        require(auth.state == PaymentState.Pending, "Authorization not pending");
        require(auth.payee == msg.sender, "Not authorized payee");
        require(block.timestamp <= auth.expiresAt, "Authorization expired");
        require(_amount <= auth.amount - auth.settledAmount, "Amount exceeds remaining");
        require(keccak256(_payload) == auth.payloadHash, "Invalid payload");
        
        auth.settledAmount += _amount;
        
        // Check if fully settled / 检查是否完全结算
        if (auth.settledAmount >= auth.amount) {
            auth.state = PaymentState.Settled;
        }
        
        // Calculate fee / 计算手续费
        uint256 fee = (_amount * platformFee) / 10000;
        uint256 payeeAmount = _amount - fee;
        
        if (auth.token == address(0)) {
            // ETH settlement / ETH 结算
            (bool payeeSuccess, ) = payable(auth.payee).call{value: payeeAmount}("");
            require(payeeSuccess, "Payee transfer failed");
            
            if (fee > 0) {
                (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
                require(feeSuccess, "Fee transfer failed");
            }
        } else {
            // Token settlement / 代币结算
            IERC20 token = IERC20(auth.token);
            require(token.transfer(auth.payee, payeeAmount), "Payee transfer failed");
            
            if (fee > 0) {
                require(token.transfer(feeRecipient, fee), "Fee transfer failed");
            }
        }
        
        emit Settled(_authorizationId, _amount, fee);
    }
    
    /**
     * @notice Cancel an authorization (by payer)
     * @notice 取消授权（由付款方发起）
     */
    function cancel(bytes32 _authorizationId) public nonReentrant {
        Authorization storage auth = authorizations[_authorizationId];
        
        require(auth.payer == msg.sender, "Not authorized payer");
        require(auth.state == PaymentState.Pending, "Authorization not pending");
        
        auth.state = PaymentState.Cancelled;
        
        // Refund remaining amount / 退还剩余金额
        uint256 remaining = auth.amount - auth.settledAmount;
        
        if (remaining > 0) {
            if (auth.token == address(0)) {
                (bool success, ) = payable(auth.payer).call{value: remaining}("");
                require(success, "Refund failed");
            } else {
                IERC20 token = IERC20(auth.token);
                require(token.transfer(auth.payer, remaining), "Refund failed");
            }
        }
        
        emit Cancelled(_authorizationId);
    }
    
    /**
     * @notice Refund expired authorization (anyone can call)
     * @notice 退还过期授权（任何人可调用）
     */
    function refundExpired(bytes32 _authorizationId) public nonReentrant {
        Authorization storage auth = authorizations[_authorizationId];
        
        require(auth.state == PaymentState.Pending, "Authorization not pending");
        require(block.timestamp > auth.expiresAt, "Authorization not expired");
        
        auth.state = PaymentState.Refunded;
        
        uint256 remaining = auth.amount - auth.settledAmount;
        
        if (remaining > 0) {
            if (auth.token == address(0)) {
                (bool success, ) = payable(auth.payer).call{value: remaining}("");
                require(success, "Refund failed");
            } else {
                IERC20 token = IERC20(auth.token);
                require(token.transfer(auth.payer, remaining), "Refund failed");
            }
        }
        
        emit Refunded(_authorizationId, remaining);
    }
    
    /**
     * @notice Batch settle multiple authorizations
     * @notice 批量结算多个授权
     */
    function batchSettle(
        bytes32[] memory _authorizationIds,
        uint256[] memory _amounts,
        bytes[] memory _payloads
    ) public nonReentrant {
        require(
            _authorizationIds.length == _amounts.length &&
            _amounts.length == _payloads.length,
            "Length mismatch"
        );
        
        for (uint256 i = 0; i < _authorizationIds.length; i++) {
            settle(_authorizationIds[i], _amounts[i], _payloads[i]);
        }
    }
    
    /**
     * @notice Add or remove supported token
     * @notice 添加或移除支持的代币
     */
    function setTokenSupport(address _token, bool _supported) public onlyOwner {
        require(_token != address(0), "Cannot change ETH support");
        supportedTokens[_token] = _supported;
        emit TokenSupportUpdated(_token, _supported);
    }
    
    /**
     * @notice Update platform fee
     * @notice 更新平台手续费
     */
    function setPlatformFee(uint256 _newFee) public onlyOwner {
        require(_newFee <= 500, "Fee cannot exceed 5%");
        platformFee = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }
    
    /**
     * @notice Update fee recipient
     * @notice 更新手续费接收地址
     */
    function setFeeRecipient(address _newRecipient) public onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient");
        feeRecipient = _newRecipient;
    }
    
    /**
     * @notice Get authorization details
     * @notice 获取授权详情
     */
    function getAuthorization(bytes32 _authorizationId) public view returns (Authorization memory) {
        return authorizations[_authorizationId];
    }
    
    /**
     * @notice Get payer's authorizations
     * @notice 获取付款方的授权列表
     */
    function getPayerAuthorizations(address _payer) public view returns (bytes32[] memory) {
        return payerAuthorizations[_payer];
    }
    
    /**
     * @notice Get payee's authorizations
     * @notice 获取收款方的授权列表
     */
    function getPayeeAuthorizations(address _payee) public view returns (bytes32[] memory) {
        return payeeAuthorizations[_payee];
    }
    
    /**
     * @notice Get remaining amount for authorization
     * @notice 获取授权的剩余金额
     */
    function getRemainingAmount(bytes32 _authorizationId) public view returns (uint256) {
        Authorization storage auth = authorizations[_authorizationId];
        return auth.amount - auth.settledAmount;
    }
    
    /**
     * @notice Check if authorization is valid and can be settled
     * @notice 检查授权是否有效且可以结算
     */
    function isSettleable(bytes32 _authorizationId) public view returns (bool) {
        Authorization storage auth = authorizations[_authorizationId];
        return (
            auth.state == PaymentState.Pending &&
            block.timestamp <= auth.expiresAt &&
            auth.amount > auth.settledAmount
        );
    }
    
    /**
     * @notice Emergency withdraw (only owner)
     * @notice 紧急提款（仅所有者）
     */
    function emergencyWithdraw(address _token) public onlyOwner {
        if (_token == address(0)) {
            (bool success, ) = payable(owner()).call{value: address(this).balance}("");
            require(success, "Withdraw failed");
        } else {
            IERC20 token = IERC20(_token);
            uint256 balance = token.balanceOf(address(this));
            require(token.transfer(owner(), balance), "Withdraw failed");
        }
    }
    
    receive() external payable {}
    fallback() external payable {}
}
