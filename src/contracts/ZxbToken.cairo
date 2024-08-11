use starknet::{ContractAddress, ClassHash};

#[starknet::interface]
pub trait IZxbToken <TContractState> {
    fn mint_to(ref self: TContractState, account: ContractAddress, amount: u256);
    fn burn_to(ref self: TContractState, account: ContractAddress, amount: u256);
    fn upgrade(ref self: TContractState, new_class_hash: ClassHash);

    fn minter(self: @TContractState) -> ContractAddress;
}

#[starknet::contract]
mod ZxbToken {
    use core::num::traits::zero::Zero;
    use openzeppelin::access::ownable::ownable::OwnableComponent::InternalTrait;
    use starknet::{ContractAddress, ClassHash, contract_address_const};
    use openzeppelin::token::erc20::ERC20Component;
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::upgrades::UpgradeableComponent;
    use openzeppelin::upgrades::interface::IUpgradeable;
    use openzeppelin::token::erc20::interface::{IERC20};
    use openzeppelin::token::erc20::erc20::ERC20Component::InternalTrait as ERC20InternalTrait;
    use openzeppelin::token::erc20::erc20::ERC20Component::ERC20HooksTrait;
    use openzeppelin::token::erc20::erc20::ERC20Component::ComponentState;
    use openzeppelin::token::erc20::erc20::ERC20HooksEmptyImpl;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableTwoStepImpl<ContractState>;
    impl InternalImpl = OwnableComponent::InternalImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;
    
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
    }

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        _minter: ContractAddress,
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
    }

    #[constructor]
    fn constructor(ref self: ContractState, minter: ContractAddress, owner: ContractAddress) {
        let name = "USDZ";
        let symbol = "ZXB";
        self.erc20.initializer(name, symbol);
        assert(!self.is_zero(minter), 'minter is 0');
        self._minter.write(minter);
        self.ownable.initializer(owner);
    }

    #[abi(embed_v0)]
    impl ZxbToken of super::IZxbToken<ContractState> {
        fn mint_to(ref self: ContractState, account: ContractAddress, amount: u256) {
            self.only_minter();
            self.erc20.mint(account, amount);
        }

        fn burn_to(ref self: ContractState, account: ContractAddress, amount: u256) {
            self.only_minter();
            self.erc20.burn(account, amount);
        }

        fn minter(self: @ContractState) -> ContractAddress {
            self._minter.read()
        }

        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            self.ownable.assert_only_owner();
            self.upgradeable.upgrade(new_class_hash);
        }
    }

    #[generate_trait]
    impl TokenInternal of TokenInternalTrait {
        fn only_minter(ref self: ContractState) {
            let caller = starknet::get_caller_address();
            let minter = self._minter.read();
            assert(caller == minter, 'only minter');
        }
        fn is_zero(self: @ContractState, account: ContractAddress) -> bool {
            let zero: ContractAddress = contract_address_const::<0>();
            account == zero
        }
    }

    // /// An empty implementation of the ERC20 hooks to be used in basic ERC20 preset contracts.
    // pub impl ERC20HooksEmptyImpl<TContractState> of ERC20Component::ERC20HooksTrait<TContractState> {
    //     fn before_update(
    //         ref self: ERC20Component::ComponentState<TContractState>,
    //         from: ContractAddress,
    //         recipient: ContractAddress,
    //         amount: u256
    //     ) {}
    
    //     fn after_update(
    //         ref self: ERC20Component::ComponentState<TContractState>,
    //         from: ContractAddress,
    //         recipient: ContractAddress,
    //         amount: u256
    //     ) {}
    // }

    
}