import {
    connectToStarknet,
    getDeployerWallet,
    getCompiledCode,
  } from "./utils";
  
  import "dotenv/config";
  import {writeConfig} from "./helper";
  async function main() {
    const provider = connectToStarknet();
    const chainid = await provider.getChainId();
    console.log("provider chainid ", chainid);
    const deployer = getDeployerWallet(provider);
    let nonce = await provider.getNonceForAddress(deployer.address);

    const compiledCode = await getCompiledCode("erc20_cairo_ZxbToken"); 

    const declareResponse = await deployer.declareIfNot({
        contract: compiledCode.sierraCode,
        casm: compiledCode.casmCode,
    } , {nonce: nonce});
    console.log("declareResponse ", declareResponse)

    const network = process.env.NETWORK as string;
    await writeConfig(network, network, "CLASS_HASH", declareResponse.class_hash);
  }
  
  main();
  