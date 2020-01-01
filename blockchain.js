const fs = require('fs');
const path = require('path');
const Web3 = require('web3');
const TruffleContract = require('@truffle/contract');

const web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(web3Provider);

const createContractInstance = async artifactName => {
 const artifact = JSON.parse(fs.readFileSync(path.join(__dirname, 'build/contracts', `${artifactName}.json`)));
  const contract = TruffleContract(artifact);
  contract.setProvider(web3Provider);
  return contract.deployed();
};

let shop;
createContractInstance('Shop').then(instance => {
  shop = instance;
});

const addProduct = async (name, price, quantity, imgPath, seller) => {
  const timestamp = Date.now();
  const pid = timestamp;
  const receipt = await shop.addProduct(pid, name, price, quantity, imgPath, timestamp, { from: seller, gas: 1000000 });
  return { receipt: receipt, pid: pid };
};

const buyProduct = async (pid, buyer) => {
  try {
    const receipt = await shop.buyProduct(pid, Date.now(), { from: buyer, gas: 1000000 });
    return receipt;
  } catch (error) {
    if (error.reason) throw new Error(error.reason);
    throw error;
  }
};

const getProduct = async pid => {
  const product = await shop.getProduct.call(pid);
  product.id = pid;
  return product;
};

const getAllProducts = async () => {
  const events = await shop.getPastEvents('AddedProduct', { fromBlock: 0 });
  const allPids = events.map(item => item.returnValues.pid);
  return allPids;
};

const getAccounts = () => web3.eth.getAccounts();

const unlockAccount = (address, password) => web3.eth.personal.unlockAccount(address, password);

module.exports = {
 addProduct,
 buyProduct,
 getProduct,
 getAccounts,
 unlockAccount,
 getAllProducts,
}
