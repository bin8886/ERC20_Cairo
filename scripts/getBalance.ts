import {
    Contract,  
    CallData,
    Calldata,
   } from "starknet";
  import {
    connectToStarknet,
    getDeployerWallet,
    getCompiledCode,
    getKeyPair,
  } from "./utils";

  
  import "dotenv/config";
  import {readConfig} from "./helper";
  async function main() {
    const provider = connectToStarknet();
    const chainid = await provider.getChainId();
    
    console.log("provider chainid ", chainid);
    const deployer = getDeployerWallet(provider);
    console.log("deployer.address ", deployer.address);
    const compiledCode = await getCompiledCode("erc20_cairo_ZxbToken"); 
    const abi = compiledCode.sierraCode.abi;
    let NETWORK = process.env.NETWORK as string;
    let contractAddress: string = await readConfig(NETWORK, "CONTRACT_ADDRESS");
    const contract = new Contract(abi, contractAddress, deployer);
    let owner = await contract.owner();
    console.log("owner=", owner);

    let decimals = await contract.decimals();
    console.log("decimals =", decimals);
    let ownerBalance = await contract.balanceOf(owner);
    let unit =  Math.pow(10, parseInt(decimals.toString()));
    console.log("ownerBalance =", ownerBalance / BigInt(unit));
  }

  function hexStringToByteArray(hexString: string) {
    if (hexString.startsWith('0x')) {
        hexString = hexString.slice(2);
    }

    if (hexString.length % 2 !== 0) {
        throw new Error('Invalid hex string');
    }

    const byteArray = [];
    for (let i = 0; i < hexString.length; i += 2) {
        byteArray.push(parseInt(hexString.substr(i, 2), 16));
    }

    return byteArray;
}

  
  main();