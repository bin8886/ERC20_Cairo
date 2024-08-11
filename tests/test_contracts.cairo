use core::starknet::ContractAddress;

use snforge_std::{
    declare, ContractClassTrait, start_cheat_caller_address_global, stop_cheat_caller_address_global
};

use erc20_cairo::contracts::ZxbToken::{IZxbTokenDispatcher, IZxbTokenDispatcherTrait};
use openzeppelin::token::erc20::interface::{ERC20ABIDispatcher, ERC20ABIDispatcherTrait};

fn deploy_contract() -> ContractAddress {
    let name = "ZxbToken";
    let contract = declare(name).unwrap();
    let miner: felt252 = 0x04338A1a9AcbF17103d1804e4DAAA97C1CE676C1917E4875A180BA2a6750e9EE;
    let owner: felt252 = 0x04338A1a9AcbF17103d1804e4DAAA97C1CE676C1917E4875A180BA2a6750e9EE;
    let (contract_address, _) = contract.deploy(@array![miner, owner]).unwrap();
    contract_address
}

#[test]
fn token_test() {
    let contract_address = deploy_contract();
    println!("contract_address={:?}", contract_address);
    let dispatcher = IZxbTokenDispatcher{contract_address};
    let owner: ContractAddress = 0x04338A1a9AcbF17103d1804e4DAAA97C1CE676C1917E4875A180BA2a6750e9EE.try_into().unwrap();
    let miner = dispatcher.minter();
    println!("miner={:?} owner = {:?}", miner, owner);
    assert(miner == owner, 'ErrorMiner');

    let tokenDispatcher = ERC20ABIDispatcher{contract_address};
    let balance = tokenDispatcher.balanceOf(owner);
    println!("balance1 = {:?}", balance);
    assert(balance == 0, 'errorBalance1');

    let decimals = tokenDispatcher.decimals();
    println!("decimals = {:?}", decimals);
    start_cheat_caller_address_global(miner);
    let amount = 10000000000 * decimals.into();
    dispatcher.mint_to(owner, amount);
    stop_cheat_caller_address_global();

    let balance = tokenDispatcher.balanceOf(owner);
    println!("balance2 = {:?}", balance);
    assert(balance == amount, 'ErrorBalance2');
    
}