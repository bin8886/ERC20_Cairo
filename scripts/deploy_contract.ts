import {
    CallData,
    Calldata,
    CairoAssembly
   } from "starknet";
  import {
    connectToStarknet,
    getDeployerWallet,
    getCompiledCode,
  } from "./utils";
  
  import "dotenv/config";
  import {readConfig, writeConfig} from "./helper";
  
  import * as fs from "fs";
  
  async function main() {
    const provider = connectToStarknet();
    const chainid = await provider.getChainId();
    
    console.log("provider chainid ", chainid);
    const deployer = getDeployerWallet(provider);
    let nonce = await provider.getNonceForAddress(deployer.address);

    const compiledCode = await getCompiledCode("erc20_cairo_ZxbToken"); 
    const abi = compiledCode.sierraCode.abi;
    const contractCallData: CallData = new CallData(abi);

    let minter= deployer.address;
    let owner = deployer.address;
    const contractConstructor: Calldata = contractCallData.compile('constructor', {
        minter,
        owner
    });
    console.log("contractConstructor = ", contractConstructor);

    let NETWORK = process.env.NETWORK as string;
    let class_hash: string = await readConfig(NETWORK, "CLASS_HASH");

     const deployERC20Response = await deployer.deploy({
        classHash: class_hash,
        salt: "0x0",
        unique: false,
        constructorCalldata: contractConstructor,
      }
     );
     console.log("deployERC20Response = ", deployERC20Response);
     await writeConfig(NETWORK, NETWORK, "CONTRACT_ADDRESS", deployERC20Response.contract_address[0]);
  }
  
  main();
  