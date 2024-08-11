import {
    Account,
    stark,
    ec,
    hash,
    CallData,
    RpcProvider,
    Contract,
    cairo,
  } from "starknet";
  import { promises as fs } from "fs";
  import * as path from "path";
  import * as readline from "readline";
  import "dotenv/config";

    
  export async function waitForEnter(message: string): Promise<void> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
  
      rl.question(message, (_) => {
        rl.close();
        resolve();
      });
    });
  }
  
  export async function importChalk() {
    return import("chalk").then((m) => m.default);
  }

  export function connectToStarknet() {
    return new RpcProvider({
      nodeUrl: process.env.RPC_ENDPOINT as string,
    });
  }
  
  export function getDeployerWallet(provider: RpcProvider) {
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY as string;
    let address = process.env.DEPLOYER_ADDRESS as string;
    return new Account(provider, address, privateKey);
  }
  
  export function createKeyPair() {
    const privateKey = stark.randomAddress();
    const publicKey = ec.starkCurve.getStarkKey(privateKey);
    return {
      privateKey,
      publicKey,
    };
  }

  export function getKeyPair(privateKey: string) {
    const publicKey = ec.starkCurve.getStarkKey(privateKey);
    return {
      privateKey,
      publicKey,
    };
  }

  export async function getSerraFilePath(fileName: string) {
    const sierraFilePath = path.join(
      __dirname,
      `../target/dev/${fileName}.contract_class.json`,
    );
    return sierraFilePath;
  }

  export async function getCompiledCode(filename: string) {
    try {
      const sierraFilePath = path.join(
        __dirname,
        `../target/dev/${filename}.contract_class.json`,
      );
      const casmFilePath = path.join(
        __dirname,
        `../target/dev/${filename}.compiled_contract_class.json`,
      );
  
      // 使用Promise.all并行读取文件
      const [sierraFile, casmFile] = await Promise.all([
        fs.readFile(sierraFilePath, 'utf-8'),
        fs.readFile(casmFilePath, 'utf-8')
      ]);
      // 解析文件内容
      const sierraCode = JSON.parse(sierraFile);
      const casmCode =  JSON.parse(casmFile); ;
  
      return {
        sierraCode,
        casmCode,
      };
    } catch (error) {
      console.error('Error reading or parsing files:', error);
      throw error;
    }
  }

  export async function getClassCode(filename: string) {
    const sierraFilePath = path.join(
      __dirname,
      `../target/dev/${filename}.contract_class.json`,
    );
    const file = await fs.readFile(sierraFilePath);
    let code = JSON.parse(file.toString("ascii"));
    return code;
  }

  interface DeclareAccountConfig {
    provider: RpcProvider;
    deployer: Account;
    sierraCode: any;
    casmCode: any;
  }
  
  export async function declareContract({
    provider,
    deployer,
    sierraCode,
    casmCode,
  }: DeclareAccountConfig) {
    const declare = await deployer.declare({
      contract: sierraCode,
      casm: casmCode,
    });
    await provider.waitForTransaction(declare.transaction_hash);
  }

  interface DeployAccountConfig {
    privateKey: string;
    publicKey: string;
    classHash: string;
    provider: RpcProvider;
  }
  
  export async function deployAccount({
    privateKey,
    publicKey,
    classHash,
    provider,
  }: DeployAccountConfig) {
    const chalk = await importChalk();
  
    const constructorArgs = CallData.compile({
      public_key: publicKey,
    });
  
    const myAccountAddress = hash.calculateContractAddressFromHash(
      publicKey,
      classHash,
      constructorArgs,
      0,
    );
  
    console.log(`Send ETH to contract address ${chalk.bold(myAccountAddress)}`);
    const message = "Press [Enter] when ready...";
    await waitForEnter(message);
  
    const account = new Account(provider, myAccountAddress, privateKey, "1");
  
    const deploy = await account.deployAccount({
      classHash: classHash,
      constructorCalldata: constructorArgs,
      addressSalt: publicKey,
    });
  
    await provider.waitForTransaction(deploy.transaction_hash);
    return deploy.contract_address;
  }

  interface TransferEthConfig {
    provider: RpcProvider;
    account: Account;
  }
  
  export async function transferEth({ provider, account }: TransferEthConfig) {
    const L2EthAddress =
      "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
  
    const L2EthAbiPath = path.join(__dirname, "./l2-eth-abi.json");
    const L2EthAbiFile = await fs.readFile(L2EthAbiPath);
    const L2ETHAbi = JSON.parse(L2EthAbiFile.toString("ascii"));
  
    const contract = new Contract(L2ETHAbi, L2EthAddress, provider);
  
    contract.connect(account);
  
    const recipient =
      "0x05feeb3a0611b8f1f602db065d36c0f70bb01032fc1f218bf9614f96c8f546a9";
    const amountInGwei = cairo.uint256(100);
  
    await contract.transfer(recipient, amountInGwei);
  }
  
  export async function isContractAlreadyDeclared(
    classHash: string,
    provider: RpcProvider,
  ) {
    try {
      await provider.getClassByHash(classHash);
      return true;
    } catch (error) {
      return false;
    }
  }
  

//   async function connectWallet() {
//     const starknet = await connect();
//     console.log(starknet.account);

//     const nonce = await starknet.account.getNonce();
//     const message = await starknet.account.signMessage(...)
// }
