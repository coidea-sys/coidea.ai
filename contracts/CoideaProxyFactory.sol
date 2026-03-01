// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

/**
 * @title CoideaProxyFactory
 * @notice 代理合约工厂，管理所有可升级合约
 */
contract CoideaProxyFactory {
    
    ProxyAdmin public proxyAdmin;
    
    // 合约名称 => 代理地址
    mapping(string => address) public proxies;
    
    // 合约名称 => 实现地址
    mapping(string => address) public implementations;
    
    event ProxyDeployed(string name, address proxy, address implementation);
    event ImplementationUpgraded(string name, address newImplementation);
    
    constructor() {
        proxyAdmin = new ProxyAdmin(msg.sender);
    }
    
    /**
     * @notice 部署代理合约
     */
    function deployProxy(
        string memory _name,
        address _implementation,
        bytes memory _data
    ) external returns (address) {
        require(proxies[_name] == address(0), "Proxy already exists");
        
        TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(
            _implementation,
            address(proxyAdmin),
            _data
        );
        
        proxies[_name] = address(proxy);
        implementations[_name] = _implementation;
        
        emit ProxyDeployed(_name, address(proxy), _implementation);
        
        return address(proxy);
    }
    
    /**
     * @notice 升级实现合约
     */
    function upgradeImplementation(
        string memory _name,
        address _newImplementation
    ) external {
        require(proxies[_name] != address(0), "Proxy not found");
        
        address proxy = proxies[_name];
        proxyAdmin.upgrade(ITransparentUpgradeableProxy(proxy), _newImplementation);
        
        implementations[_name] = _newImplementation;
        
        emit ImplementationUpgraded(_name, _newImplementation);
    }
    
    /**
     * @notice 获取代理地址
     */
    function getProxy(string memory _name) external view returns (address) {
        return proxies[_name];
    }
    
    /**
     * @notice 获取实现地址
     */
    function getImplementation(string memory _name) external view returns (address) {
        return implementations[_name];
    }
}
