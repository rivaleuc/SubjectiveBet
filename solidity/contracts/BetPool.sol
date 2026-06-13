// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BetPool {
    struct Market {
        uint256 totalPool;
        uint256 winningOption;
        bool resolved;
        mapping(uint256 => uint256) optionTotals;
        mapping(address => uint256) betOption;
        mapping(address => uint256) betAmount;
        address[] bettors;
    }

    mapping(bytes32 => Market) private markets;
    address public resolver;

    modifier onlyResolver() {
        require(msg.sender == resolver, "Not resolver");
        _;
    }

    constructor(address _resolver) {
        resolver = _resolver;
    }

    function bet(bytes32 marketId, uint256 optionIndex) external payable {
        require(msg.value > 0, "No ETH sent");
        Market storage m = markets[marketId];
        require(!m.resolved, "Already resolved");
        require(m.betAmount[msg.sender] == 0, "Already bet");

        m.bettors.push(msg.sender);
        m.betOption[msg.sender] = optionIndex;
        m.betAmount[msg.sender] = msg.value;
        m.optionTotals[optionIndex] += msg.value;
        m.totalPool += msg.value;
    }

    function resolve(bytes32 marketId, uint256 _winningOption) external onlyResolver {
        Market storage m = markets[marketId];
        require(!m.resolved, "Already resolved");
        m.resolved = true;
        m.winningOption = _winningOption;
    }

    function claim(bytes32 marketId) external {
        Market storage m = markets[marketId];
        require(m.resolved, "Not resolved");
        uint256 amount = m.betAmount[msg.sender];
        require(amount > 0, "No bet");
        require(m.betOption[msg.sender] == m.winningOption, "Did not win");

        m.betAmount[msg.sender] = 0;
        uint256 winPool = m.optionTotals[m.winningOption];
        uint256 payout = (amount * m.totalPool) / winPool;
        payable(msg.sender).transfer(payout);
    }

    function getMarketInfo(bytes32 marketId) external view returns (uint256 totalPool, bool resolved, uint256 winningOption) {
        Market storage m = markets[marketId];
        return (m.totalPool, m.resolved, m.winningOption);
    }
}
