// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title X402Payment
 * @notice x402 Protocol Implementation - Gasless Micropayments for AI Agents
 * @notice x402 协议实现 - AI Agent 无 Gas 微支付
 * 
 * @dev Core features:
 * @dev - EIP-712 signature authorization (gasless for payer)
 * @dev - Facilitator pays gas on behalf of payer
 * @dev - HTTP 402 Payment Required semantic
 * @dev - M2M (Machine-to-Machine) payment ready
 * 
 * @dev 核心特性：
 * @dev - EIP-712 签名授权（付款方无 Gas）
 * @dev - Facilitator 代付 Gas
 * @dev - HTTP 402 Payment Required 语义
 * @dev - M2M（机器对机器）支付就绪
 */
contract X402Payment is Ownable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // ============ EIP-712 TypeHashes ============
    bytes32 public constant AUTHORIZATION_TYPEHASH = keccak256(
        "Authorization(address payer,address payee,uint256 amount,address token,uint256 nonce,uint256 expiresAt,bytes32 payloadHash)"
    );

    // ============ Enums ============
    enum PaymentState {
        Pending,      // 0 - Authorized, awaiting settlement / 已授权，等待结算
        Settled,      // 1 - Fully settled / 已完全结算
        Cancelled,    // 2 - Cancelled by payer / 由付款方取消
        Refunded      // 3 - Refunded (expired or disputed) / 已退款（过期或争议）
    }

    // ============ Structs ============
    struct Authorization {
        address payer;           // Payer address (signer) / 付款方地址（签名者）
        address payee;           // Payee address / 收款方地址
        uint256 amount;          // Authorized amount / 授权金额
        uint256 settledAmount;   // Already settled amount / 已结算金额
        address token;           // Token address (address(0) for ETH) / 代币地址
        uint256 createdAt;       // Creation timestamp / 创建时间戳
        uint256 expiresAt;       // Expiration timestamp / 过期时间戳
        bytes32 payloadHash;     // Hash of payment payload / 支付负载哈希
        PaymentState state;      // Current state / 当前状态
        address facilitator;     // Gas sponsor address / Gas 代付地址
        uint256 gasFee;          // Gas fee compensation / Gas 费补偿
    }

    // ============ State Variables ============
    mapping(bytes32 => Authorization) public authorizations;
    mapping(address => bytes32[]) public payerAuthorizations;
    mapping(address => bytes32[]) public payeeAuthorizations;
    mapping(address => uint256) public nonces;
    mapping(address => bool) public supportedTokens;
    mapping(address => bool) public facilitators;

    uint256 public platformFee = 100; // 1% in basis points / 1% 基点
    address public feeRecipient;
    uint256 public minAuthorizationAmount = 1e15; // 0.001 ETH in wei / 0.001 ETH
    uint256 public maxAuthorizationDuration = 30 days;

    // ============ Events ============
    event Authorized(
        bytes32 indexed authorizationId,
        address indexed payer,
        address indexed payee,
        uint256 amount,
        address token,
        address facilitator
    );
    event Settled(
        bytes32 indexed authorizationId,
        uint256 amount,
        uint256 platformFee,
        uint256 gasFee,
        address facilitator
    );
    event Cancelled(bytes32 indexed authorizationId, string reason);
    event Refunded(bytes32 indexed authorizationId, uint256 amount, address indexed payer);
    event FacilitatorUpdated(address indexed facilitator, bool approved);
    event TokenSupportUpdated(address indexed token, bool supported);

    // ============ Constructor ============
    constructor(address _feeRecipient) 
        Ownable() 
        EIP712("X402 Payment Protocol", "1") 
    {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
        supportedTokens[address(0)] = true;
    }

    // ============ Core Functions ============

    /**
     * @notice Create authorization via EIP-712 signature (gasless for payer)
     * @notice 通过 EIP-712 签名创建授权（付款方无 Gas）
     * @param _payer Payer address / 付款方地址
     * @param _payee Payee address / 收款方地址
     * @param _amount Authorized amount / 授权金额
     * @param _token Token address / 代币地址
     * @param _expiresAt Expiration timestamp / 过期时间戳
     * @param _payloadHash Hash of payment payload / 支付负载哈希
     * @param _facilitator Gas sponsor / Gas 代付方
     * @param _gasFee Gas fee compensation / Gas 费补偿
     * @param _signature EIP-712 signature / EIP-712 签名
     * @return authorizationId Unique authorization ID / 唯一授权 ID
     */
    function authorize(
        address _payer,
        address _payee,
        uint256 _amount,
        address _token,
        uint256 _expiresAt,
        bytes32 _payloadHash,
        address _facilitator,
        uint256 _gasFee,
        bytes memory _signature
    ) public nonReentrant returns (bytes32) {
        require(supportedTokens[_token], "Token not supported");
        require(_amount >= minAuthorizationAmount, "Amount below minimum");
        require(_expiresAt <= block.timestamp + maxAuthorizationDuration, "Duration too long");
        require(_expiresAt > block.timestamp, "Must expire in future");
        require(_payee != address(0) && _payee != _payer, "Invalid payee");
        require(facilitators[_facilitator] || _facilitator == address(0), "Invalid facilitator");

        // EIP-712 signature verification
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            AUTHORIZATION_TYPEHASH,
            _payer,
            _payee,
            _amount,
            _token,
            nonces[_payer]++,
            _expiresAt,
            _payloadHash
        )));
        require(digest.recover(_signature) == _payer, "Invalid signature");

        bytes32 authorizationId = keccak256(abi.encodePacked(
            _payer, _payee, _amount, _token, nonces[_payer], block.timestamp
        ));
        require(authorizations[authorizationId].payer == address(0), "Authorization exists");

        authorizations[authorizationId] = Authorization({
            payer: _payer,
            payee: _payee,
            amount: _amount,
            settledAmount: 0,
            token: _token,
            createdAt: block.timestamp,
            expiresAt: _expiresAt,
            payloadHash: _payloadHash,
            state: PaymentState.Pending,
            facilitator: _facilitator,
            gasFee: _gasFee
        });

        payerAuthorizations[_payer].push(authorizationId);
        payeeAuthorizations[_payee].push(authorizationId);

        emit Authorized(authorizationId, _payer, _payee, _amount, _token, _facilitator);
        return authorizationId;
    }

    /**
     * @notice Settle payment (called by payee or facilitator)
     * @notice 结算支付（由收款方或 Facilitator 调用）
     */
    function settle(
        bytes32 _authorizationId,
        uint256 _amount,
        bytes memory _payload
    ) public nonReentrant {
        Authorization storage auth = authorizations[_authorizationId];
        
        require(auth.state == PaymentState.Pending, "Not pending");
        require(
            auth.payee == msg.sender || auth.facilitator == msg.sender,
            "Not authorized"
        );
        require(block.timestamp <= auth.expiresAt, "Expired");
        require(_amount <= auth.amount - auth.settledAmount, "Exceeds remaining");
        require(keccak256(_payload) == auth.payloadHash, "Invalid payload");

        auth.settledAmount += _amount;
        if (auth.settledAmount >= auth.amount) {
            auth.state = PaymentState.Settled;
        }

        uint256 platformFeeAmount = (_amount * platformFee) / 10000;
        uint256 payeeAmount = _amount - platformFeeAmount - auth.gasFee;

        if (auth.token == address(0)) {
            (bool payeeSuccess, ) = payable(auth.payee).call{value: payeeAmount}("");
            require(payeeSuccess, "Payee transfer failed");

            if (platformFeeAmount > 0) {
                (bool feeSuccess, ) = payable(feeRecipient).call{value: platformFeeAmount}("");
                require(feeSuccess, "Fee transfer failed");
            }

            if (auth.gasFee > 0 && auth.facilitator != address(0)) {
                (bool gasSuccess, ) = payable(auth.facilitator).call{value: auth.gasFee}("");
                require(gasSuccess, "Gas fee failed");
            }
        } else {
            IERC20 token = IERC20(auth.token);
            token.safeTransferFrom(auth.payer, auth.payee, payeeAmount);
            if (platformFeeAmount > 0) {
                token.safeTransferFrom(auth.payer, feeRecipient, platformFeeAmount);
            }
            if (auth.gasFee > 0 && auth.facilitator != address(0)) {
                token.safeTransferFrom(auth.payer, auth.facilitator, auth.gasFee);
            }
        }

        emit Settled(_authorizationId, _amount, platformFeeAmount, auth.gasFee, auth.facilitator);
    }

    /**
     * @notice Cancel authorization by payer
     * @notice 付款方取消授权
     */
    function cancel(bytes32 _authorizationId, string calldata _reason) public nonReentrant {
        Authorization storage auth = authorizations[_authorizationId];
        require(auth.payer == msg.sender, "Not payer");
        require(auth.state == PaymentState.Pending, "Not pending");

        auth.state = PaymentState.Cancelled;
        _removeFromArray(payerAuthorizations[auth.payer], _authorizationId);
        _removeFromArray(payeeAuthorizations[auth.payee], _authorizationId);

        emit Cancelled(_authorizationId, _reason);
    }

    /**
     * @notice Refund expired authorization
     * @notice 退还过期授权
     */
    function refundExpired(bytes32 _authorizationId) public nonReentrant {
        Authorization storage auth = authorizations[_authorizationId];
        require(auth.state == PaymentState.Pending, "Not pending");
        require(block.timestamp > auth.expiresAt, "Not expired");

        auth.state = PaymentState.Refunded;
        uint256 remaining = auth.amount - auth.settledAmount;

        _removeFromArray(payerAuthorizations[auth.payer], _authorizationId);
        _removeFromArray(payeeAuthorizations[auth.payee], _authorizationId);

        emit Refunded(_authorizationId, remaining, auth.payer);
    }

    // ============ Admin Functions ============
    function setFacilitator(address _facilitator, bool _approved) public onlyOwner {
        facilitators[_facilitator] = _approved;
        emit FacilitatorUpdated(_facilitator, _approved);
    }

    function setTokenSupport(address _token, bool _supported) public onlyOwner {
        require(_token != address(0), "Cannot change ETH");
        supportedTokens[_token] = _supported;
        emit TokenSupportUpdated(_token, _supported);
    }

    function setPlatformFee(uint256 _fee) public onlyOwner {
        require(_fee <= 500, "Max 5%");
        platformFee = _fee;
    }

    // ============ Internal Functions ============
    function _removeFromArray(bytes32[] storage _array, bytes32 _value) internal {
        for (uint256 i = 0; i < _array.length; i++) {
            if (_array[i] == _value) {
                _array[i] = _array[_array.length - 1];
                _array.pop();
                break;
            }
        }
    }

    // ============ View Functions ============
    function getRemainingAmount(bytes32 _authorizationId) public view returns (uint256) {
        Authorization storage auth = authorizations[_authorizationId];
        return auth.amount - auth.settledAmount;
    }

    function isSettleable(bytes32 _authorizationId) public view returns (bool) {
        Authorization storage auth = authorizations[_authorizationId];
        return auth.state == PaymentState.Pending && block.timestamp <= auth.expiresAt;
    }

    receive() external payable {}
}
