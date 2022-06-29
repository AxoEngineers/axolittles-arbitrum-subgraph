import { BigInt } from "@graphprotocol/graph-ts"
import {
  Axolittles,
  Approval,
  ApprovalForAll,
  MessageFailed,
  OwnershipTransferred,
  ReceiveFromChain,
  SendToChain,
  SetTrustedRemote,
  Transfer
} from "../generated/Axolittles/Axolittles"
import { Axolittle, Tran, TransferTransaction, AxoHolder } from "../generated/schema"

export function handleApproval(event: Approval): void {}

export function handleApprovalForAll(event: ApprovalForAll): void {}

export function handleMessageFailed(event: MessageFailed): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleReceiveFromChain(event: ReceiveFromChain): void {}

export function handleSendToChain(event: SendToChain): void {}

export function handleSetTrustedRemote(event: SetTrustedRemote): void {}

export function handleTransfer(event: Transfer): void {
  let fromAccount = AxoHolder.load(event.params.from.toHex())
  if (fromAccount == null) {
    fromAccount = new AxoHolder(event.params.from.toHex())
    fromAccount.firstActiveBlock = event.block.number
  }

  let toAccount = AxoHolder.load(event.params.to.toHex())
  if (toAccount == null) {
    toAccount = new AxoHolder(event.params.to.toHex())
    toAccount.firstActiveBlock = event.block.number
  }

  let axo = Axolittle.load(event.params.tokenId.toString())
  if (axo == null) {
    axo = new Axolittle(event.params.tokenId.toString())
    axo.bridgeBlock = event.block.number
  }
  axo.owner = event.params.to.toHex()

  fromAccount.lastActiveBlock = event.block.number
  toAccount.lastActiveBlock = event.block.number
  
  let txnString = event.transaction.hash.toHexString()
  let tokenString = event.params.tokenId.toString()
  let fromString = event.params.from.toHexString()
  let toString = event.params.to.toHexString()
  //this complex id is needed because
  //some transactions include multiple transfers of the same
  //token, for example nftx.io staking
  let transfer_id = txnString + tokenString + fromString + toString
  let transfer = new Tran(transfer_id)
  transfer.from = event.params.from.toHex()
  transfer.to = event.params.to.toHex()
  transfer.token_id = event.params.tokenId
  transfer.blockHeight = event.block.number
  transfer.timestamp = event.block.timestamp

  let transaction = TransferTransaction.load(event.transaction.hash.toHex())
  if (transaction == null) {
    // need to create instance
    transaction = new TransferTransaction(event.transaction.hash.toHex())
    transaction.nTransfers = 0
  }
  transaction.valueWei = event.transaction.value
  // incriment for each axo transfered.
  transaction.nTransfers += 1
  
  transfer.transaction = event.transaction.hash.toHex()
  transfer.value = event.transaction.value
  fromAccount.save()
  toAccount.save()
  transfer.save()
  axo.save()
  transaction.save()

}
