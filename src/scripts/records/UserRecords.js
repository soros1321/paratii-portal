/* @flow */

import Immutable from 'immutable'
import { REQUEST_STATUS } from 'constants/ApplicationConstants'
import type { RequestStatus } from 'types/ApplicationTypes'

export class Balances extends Immutable.Record({
  ETH: '0',
  PTI: '0'
}) {
  ETH: string
  PTI: string
}

class User extends Immutable.Record({
  address: '',
  name: '',
  email: '',
  keepUrl: true,
  walletKey: 'keystore-anon',
  mnemonicKey: 'mnemonic-anon',
  loginRequestStatus: REQUEST_STATUS.NOT_STARTED,
  balances: new Balances()
}) {
  address: string
  name: string
  email: string
  keepUrl: boolean
  walletKey: string
  mnemonicKey: string
  loginRequestStatus: RequestStatus
  balances: Balances
}

export const _getWalletKey = (state: User): string => state.get('walletKey')
export const _getMnemonicKey = (state: User): string => state.get('mnemonicKey')
export const _getLoginRequestStatus = (state: User): RequestStatus =>
  state.get('loginRequestStatus')
export const _getBalances = (state: User): Balances => state.get('balances')

export default User
