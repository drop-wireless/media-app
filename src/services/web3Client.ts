import Web3 from 'web3';
import EncryptedStorage from 'react-native-encrypted-storage';
import {contractABI, contractAddress} from '../constants/contract';
import { advertisementAPI } from './advertisementAPI';

const web3Iotex = new Web3('https://babel-api.mainnet.iotex.io/');
const web3NIT = new Web3('https://node01.nitwallet.io/');

const contract = new web3Iotex.eth.Contract(contractABI, contractAddress);

export const web3Client = {
  async getWalletAddress(privateKey: string) {
    return web3Iotex.eth.accounts.privateKeyToAccount('0x' + privateKey);
  },

  async getBalance(tokenName: string, walletAddress: string) {
    switch (tokenName) {
      case 'NIT':
        return web3NIT.utils
          .fromWei(await web3NIT.eth.getBalance(walletAddress), 'ether')
          .toString();
      case 'IOTX':
        return web3NIT.utils
          .fromWei(await web3Iotex.eth.getBalance(walletAddress), 'ether')
          .toString();
      case 'DWIN':
        return web3NIT.utils
          .fromWei(
            await contract.methods.balanceOf(walletAddress).call(),
            'ether',
          )
          .toString();
      default:
        console.log('getBalance invalid tokenName');
    }
  },

  async estimateGas(tokenName: string, from: string, amount: number) {
    if (tokenName === 'DWIN') {
      // Prepare the transfer transaction
      const transferTransaction = contract.methods.transfer(
        from,
        web3Iotex.utils.toWei(amount.toString()),
      );

      // Get the gas price
      const gasPrice = Number(await web3Iotex.eth.getGasPrice());

      // Estimate the gas required for the transfer transaction
      const estimatedGas = await transferTransaction.estimateGas({
        from: from,
      });

      const gasFee = web3Iotex.utils.fromWei(
        (gasPrice * estimatedGas).toString(),
      );

      console.log('gasFee:', gasFee);
      return gasFee;
    }
  },

  async transferToken(
    tokenName: string,
    from: string,
    to: string,
    amount: number,
    username: string,
  ) {
    return new Promise((resolve, reject) => {
      // TODO: check balance of from
      // EncryptedStorage.getItem('privateKey')
      EncryptedStorage.getItem('pk_' + username)
        .then(async privateKey => {
          if (privateKey) {
            let signedTransaction: any;
            if (tokenName === 'DWIN') {
              // Prepare the transfer transaction
              const transferTransaction = contract.methods.transfer(
                to,
                web3Iotex.utils.toWei(amount.toString()),
              );

              // Get the gas price
              const gasPrice = await web3Iotex.eth.getGasPrice();

              // Estimate the gas required for the transfer transaction
              const estimatedGas = await transferTransaction.estimateGas({
                from: from,
              });

              // Build the transfer transaction
              const rawTransaction = {
                from: from,
                to: contractAddress,
                gas: estimatedGas,
                gasPrice: gasPrice,
                data: transferTransaction.encodeABI(),
              };

              // Sign the transaction
              signedTransaction = await web3Iotex.eth.accounts.signTransaction(
                rawTransaction,
                privateKey,
              );

              // Send the transaction
              if (signedTransaction.rawTransaction) {
                await web3Iotex.eth
                  .sendSignedTransaction(signedTransaction.rawTransaction)
                  .on('transactionHash', hash => {
                    resolve(hash);
                  })
                  .catch(err => {
                    // console.log('sendSignedTransaction err:', err);
                    reject(err);
                  });
              } else {
                reject('rawTransaction undefined');
              }
            } else if (tokenName === 'NIT') {
              signedTransaction = await web3NIT.eth.accounts.signTransaction(
                {
                  to: to,
                  value: web3NIT.utils.toWei(amount.toString()),
                  gas: 2000000,
                },
                '0x' + privateKey,
              );

              // Send the transaction
              if (signedTransaction.rawTransaction) {
                await web3NIT.eth
                  .sendSignedTransaction(signedTransaction.rawTransaction)
                  .on('transactionHash', hash => {
                    resolve(hash);
                  })
                  .catch(err => {
                    // console.log('sendSignedTransaction err:', err);
                    reject(err);
                  });
              } else {
                reject('rawTransaction undefined');
              }
            } else {
              reject('Invalid token name');
            }
          } else {
            reject('privateKey undefined');
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  },
};
