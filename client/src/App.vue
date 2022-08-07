<script setup>
	import StakingContract from '@/contracts/Staking.json'
	import ERC20Contract from "@/contracts/ERC20.json";

	import getWeb3 from '@/utils/getWeb3'
	import truncateEthAddress from 'truncate-eth-address'

	import 'bootstrap-icons/font/bootstrap-icons.css'
</script>

<template>
	<header class="navbar navbar-dark mb-5 bg-primary">
		<div class="container">
			<p class="navbar-brand align-middle mb-0">Alyra - Staking Project</p>
			<div class="d-flex text-light align-middle">
				<p class="mb-0">
					<span v-if="connectedWalletTruncate">{{ connectedWalletTruncate }}</span>
					<span v-else>Connect a wallet</span>
					
					<span v-if="currentOwner">(Owner)</span>
				</p>
			</div>
		</div>
	</header>

	<div class="container">
		<div class="mb-3 text-end" v-if="currentOwner">
			<button class="btn btn-success" :class="(!displayAddPoolForm) ? 'btn-success' : 'btn-danger'" @click="displayAddPool()">
				<span v-if="!displayAddPoolForm"><i class="bi bi-plus"></i> Add a new pool</span>
				<span v-else><i class="bi bi-x"></i> Hide add a pool</span>
			</button>
		</div>

		<div id="all-pools" class="mb-5 bg-white p-3 shadow-sm rounded" v-if="currentOwner" v-show="displayAddPoolForm">
			<div class="form-group">
				<div class="form-group mb-3">
					<label for="token" class="form-label fw-bold">Token address:</label>
					<input id="token" type="text" class="form-control" :class="(addPoolFields.token.error) ? 'is-invalid' : ''" autocomplete="off" placeholder="Token address" v-model="addPoolFields.token.value">
					<div class="invalid-feedback">{{ addPoolFields.token.error }}</div>
				</div>
				<div class="form-group mb-3">
					<label for="address-token" class="form-label fw-bold">Pool address Chainlink:</label>
					<input id="address-token" type="text" class="form-control" :class="(addPoolFields.addressPrice.error) ? 'is-invalid' : ''" autocomplete="off" placeholder="Pool address chainlink" v-model="addPoolFields.addressPrice.value">
					<div class="invalid-feedback">{{ addPoolFields.addressPrice.error }}</div>
				</div>
				<div class="form-group mb-3">
					<label for="apr" class="form-label fw-bold">APR:</label>
					<input id="apr" type="text" class="form-control" :class="(addPoolFields.apr.error) ? 'is-invalid' : ''" autocomplete="off" placeholder="APR" v-model="addPoolFields.apr.value">
					<div class="invalid-feedback">{{ addPoolFields.apr.error }}</div>
				</div>
				<div class="text-center">
					<button class="btn-success btn" @click="addPool()">
						Add a pool
						<span v-show="loaderAddPool" class="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>
					</button>
				</div>

				<div class="alert mb-0 mt-3 text-center" :class="'alert-' + notifAddPool.type" role="alert" v-show="notifAddPool.message">
					{{ notifAddPool.message }}
				</div>
			</div>
		</div>

		<div id="pools" class="mt-5" v-if="Object.keys(pools).length">
			<h2 class="text-white">Pools availables</h2>
			<div class="row mt-4">
				<div class="col-4 d-flex mb-4 align-items-stretch" v-for="(pool, key) in pools">
					<div class="card w-100 shadow-sm border-0">
						<div class="card-header bg-white p-3">
							<h2 class="fs-5 mb-2">{{ pool.symbol }}</h2>
							<p class="mb-0">Total staking: <span class="badge bg-secondary">{{ pool.totalStakes }}</span></p>
						</div>
						<div class="card-body">
							<div class="row">
								<p class="card-subtitle mb-2 text-muted mb-2 col-6">Reward APR : {{ pool.apr }}</p>
								<p class="card-subtitle mb-2 text-muted mb-4 col-6 text-end">Earn : CRDV</p>
							</div>
							<button class="btn-primary btn" @click="approveStakingContract(pool.token, key)" v-if="!pools[key].approve && pools[key].totalAccountStake == 0">
								Approve the contract
								<span v-show="loaderApproval[key]" class="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>
							</button>

							<div class="form-group mb-3 row" v-if="pools[key].approve">
								<div class="col-7">
									<input type="text" class="form-control" :class="(pools[key].amountStakeError) ? 'is-invalid' : ''" placeholder="Amount" autocomplete="off" v-model="pools[key].amountStake">
									<div class="invalid-feedback">{{ pools[key].amountStakeError }}</div>
								</div>
								<div class="col-5 text-end">
									<button class="btn-success btn w-100" @click="stake(pools[key].token, key)">
										Stake
										<span v-show="loaderStake[key]" class="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>	
									</button>
								</div>
							</div>

							<div class="row form-group" v-if="pools[key].approve && pools[key].totalAccountStake > 0">
								<div class="col-7">
									<input type="text" class="form-control" :class="(pools[key].amountUnstakeError) ? 'is-invalid' : ''" autocomplete="off" placeholder="Amount" v-model="pools[key].amountUnstake">
									<div class="invalid-feedback">{{ pools[key].amountUnstakeError }}</div>
								</div>
								<div class="text-end col-5">
									<button class="btn btn-warning" @click="unstake(pools[key].token, key)">
										Unstake
										<span v-show="loaderUnstake[key]" class="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>
									</button>
								</div>
							</div>

							<div class="mt-3 text-center" v-if="pools[key].totalAccountStake > 0">
								<button class="btn btn-primary" @click="claimRewards(pools[key].token, key)">
									Claim rewards
									<span v-show="loaderClaim[key]" class="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>
								</button>
								<p v-if="pools[key].rewards" class="mt-2">Your rewards : {{ pools[key].rewards }}</p>
							</div>

							<div class="alert alert-success p-2 mt-4" v-if="pools[key].success" role="alert">{{ pools[key].success }}</div>

							<p class="mt-3">Total stake by you in this pool : <strong>{{ pools[key].totalAccountStake }}</strong></p>
						</div>
					</div>
				</div>
			</div>
		</div>
		
	</div>
</template>

<script>
	export default {
		data() {
			return {
				web3: false,
				accounts: false,
				instance: false,
				connectedWallet: false,
				connectedWalletTruncate: false,
				loaderStake: [],
				loaderClaim: [],
				addressContract: false,
				owner: false,
				currentOwner: false,
				loaderUnstake: [],
				pools: [],
				displayAddPoolForm: false,
				loaderAddPool: false,
				loaderApproval: [], 
				notifAddPool: {type: false, message: false },
				addPoolFields: {
					token: { value: null, error : false },
					apr: { value: null, error: false },
					addressPrice: { value: null, error: false }
				}
			}
		},
		methods: {
			async checkConnectedWallet () {
				this.web3 = await getWeb3()
				this.accounts = await this.web3.eth.getAccounts()
				this.connectedWallet = this.accounts[0]

				this.connectedWalletTruncate = truncateEthAddress(this.accounts[0])
				
				const networkId = await this.web3.eth.net.getId()
				const deployedNetwork = StakingContract.networks[networkId]
				this.instance = await new this.web3.eth.Contract(StakingContract.abi, deployedNetwork && deployedNetwork.address)
				this.addressContract = deployedNetwork.address
				this.owner = await this.instance.methods.owner().call()				

				this.checkCurrentIsOwner()
			},

			/**
			 * Check if the current connected wallet is the owner
			 */
			checkCurrentIsOwner () {
				this.currentOwner = false
				if (this.owner == this.connectedWallet) {
					this.currentOwner = true
				}
			},

			/**
			 * Add a new pool available
			 */
			async addPool () {
				this.validateAddPoolFields()
				
				if (!this.addPoolFields.token.error && !this.addPoolFields.addressPrice.error && !this.addPoolFields.apr.error) {
					this.loaderAddPool = true

					try {
						await this.instance.methods.addPool(this.addPoolFields.token.value, this.addPoolFields.apr.value, this.addPoolFields.addressPrice.value).send({ from: this.accounts[0] })
						await this.getPools()
						this.notifAddPool = { type: 'success', message: 'The new pool has been added.' }
						this.addPoolFields.token.value = null
						this.addPoolFields.apr.value = null
						this.addPoolFields.addressPrice.value = null
						this.loaderAddPool = false
					} catch (error) {
						await this.instance.methods.addPool(this.addPoolFields.token.value, this.addPoolFields.apr.value, this.addPoolFields.addressPrice.value).call({ from: this.accounts[0] })
						.then(result => {}).catch(revert => {
							this.notifAddPool = { type: 'danger', message: this.parseRevertMsg(revert) }
							this.loaderAddPool = false						
						})
					}
				}
			},

			/**	
			 * Validate fields in form add pool before continue
			 */
			 validateAddPoolFields () {
				this.addPoolFields.token.error = false
				this.addPoolFields.addressPrice.error = false
				this.addPoolFields.apr.error = false

				if (!this.addPoolFields.token.value) {
					this.addPoolFields.token.error = 'Please enter a token.'
				} else if (!this.web3.utils.isAddress(this.addPoolFields.token.value)) {
					this.addPoolFields.token.error = 'Please enter a valid address.'
				}

				if (!this.addPoolFields.addressPrice.value) {
					this.addPoolFields.addressPrice.error = 'Please enter an address Chainlink.'
				} else if (!this.web3.utils.isAddress(this.addPoolFields.addressPrice.value)) {
					this.addPoolFields.addressPrice.error = 'Please enter a valid address.'
				}

				if (!this.addPoolFields.apr.value) {
					this.addPoolFields.apr.error = 'Please enter an APR.'
				} else if (!Number.isInteger(this.addPoolFields.apr.value * 1)) {
					this.addPoolFields.apr.error = 'Please enter a number.'
				}
			},

			/**
			 * Prepare revert message
			 */
			parseRevertMsg (revert) {
				revert = revert.message.split('Internal JSON-RPC error.')[1].trim()
				revert = JSON.parse(revert)
				return revert.message.split('revert ')[1]
			},

			/**
			 * Display add pool form
			 */
			displayAddPool () {
				this.displayAddPoolForm = !this.displayAddPoolForm
				this.notifAddPool.message = false
			},

			/**
			 * Get all pool by event
			 */
			async getPools () {
				const pools = await this.instance.getPastEvents('NewPool', { fromBlock: 0 })
				for (let i = 0; i < pools.length; i++) {
					this.pools[i] = {
						token: pools[i].returnValues.tokenAddress,
						apr: pools[i].returnValues.APR,
						totalStakes: await this.getStakingTotal(pools[i].returnValues.tokenAddress),
						symbol: await this.getSymbol(pools[i].returnValues.tokenAddress),
						totalAccountStake: await this.getStakingByPoolByAccount(pools[i].returnValues.tokenAddress),
						amountStake: null,
						amountUnstake: null,
						approve: false,
						amountStakeError: false,
						amountUnstakeError: false,
						success: false,
						rewards: 0
					}

					if (this.pools[i].totalAccountStake > 0) {
						this.rewards(i)
					}
					this.getApproveEvent(pools[i].returnValues.tokenAddress, i)
				}
			},

			/**
			 * Get Symbol at token address
			 */
			async getSymbol (addressToken) {
				const token = await new this.web3.eth.Contract(ERC20Contract.abi, addressToken)
				return await token.methods.symbol().call()
			},

			/**
			 * Get Staking total  by pool
			 */
			async getStakingTotal (addressToken) {
				return await this.instance.methods.getTotalStaking(addressToken).call({ from: this.accounts[0] })
			},

			/**
			 * Get staking amount by pool 
			 */
			async getStakingByPoolByAccount (addressToken) {
				return await this.instance.methods.getStaking(addressToken).call({ from: this.accounts[0] })
			},

			/**
			 * Get appove staking
			 */
			async approveStakingContract (addressToken, key) {
				this.loaderApproval[key] = true
				const token = await new this.web3.eth.Contract(ERC20Contract.abi, addressToken)
				await token.methods.approve(this.addressContract, 10000000000000).send({ from: this.accounts[0] })
				this.pools[key].approve = true
				this.loaderApproval[key] = false
				localStorage.setItem('approval' + key + this.accounts[0], true)
			},

			/**
			 * Get event approve
			 */
			async getApproveEvent (addressToken, key) {
				// const token = await new this.web3.eth.Contract(ERC20Contract.abi, addressToken)
				// const approval = await token.getPastEvents('Approval', { fromBlock: 0 })
// 
				// for (let i = 0; i < approval.length; i++) {
				// 	if (approval[i].returnValues.owner == this.accounts[0]) {
				// 		this.pools[key].approve = true
				// 	}
				// }

				if (localStorage.getItem('approval'+ key + this.accounts[0]) != undefined) {
					this.pools[key].approve = true
				}

			},

			/**
			 * Event stake
			 */
			async eventStake () {
				const approval = await token.getPastEvents('Approval', { fromBlock: 0 })
			},

			/**
			 * Stake
			 */
			async stake (addressToken, key) {
				if (!this.pools[key].amountStake) {
					this.pools[key].amountStakeError = 'Please enter an amount';
				} else if (!Number.isInteger(this.pools[key].amountStake * 1)) {
					this.pools[key].amountStakeError = 'Please enter a number.';
				} else {
					this.pools[key].amountStakeError = false
					this.pools[key].success = false

					let fnName = 'stake'
					/*if (this.pools[key].totalAccountStake > 0) {
						fnName = 'addStake'
					}*/
					this.loaderStake[key] = true
					try {
						await this.instance.methods[fnName](this.pools[key].amountStake, addressToken).send({ from: this.accounts[0] })
						this.pools[key].amountStake = null
						this.pools[key].success = 'Stake has been created.'
					} catch (error) {
						await this.instance.methods[fnName](this.pools[key].amountStake, addressToken).call({ from: this.accounts[0] })
						.then(result => {}).catch(revert => {
							console.log(this.parseRevertMsg(revert))				
						})
					}
					this.loaderStake[key] = false
	
					this.pools[key].totalStakes = await this.getStakingTotal(this.pools[key].token)
					this.pools[key].totalAccountStake = await this.getStakingByPoolByAccount(this.pools[key].token)
				}

			},
			
			/**
			 * Unstake
			 */
			async unstake (addressToken, key) {
				if (!this.pools[key].amountUnstake) {
					this.pools[key].amountUnstakeError = 'Please enter an amount';
				} else if (!Number.isInteger(this.pools[key].amountUnstake * 1)) {
					this.pools[key].amountUnstakeError = 'Please enter a number.';
				} else {
					this.pools[key].amountUnstakeError = false
					this.loaderUnstake[key] = true
					try {
						await this.instance.methods.withdraw(this.pools[key].amountUnstake, addressToken).send({ from: this.accounts[0] })
						this.pools[key].amountUnstake = null
						this.pools[key].success = 'Unstake has been successed.'
					} catch (error) {
						await this.instance.methods.withdraw(this.pools[key].amountUnstake, addressToken).call({ from: this.accounts[0] })
						.then(result => {}).catch(revert => {
							console.log(revert)
							console.log(this.parseRevertMsg(revert))				
						})
					}
					this.loaderUnstake[key] = false
				}

				this.pools[key].totalStakes = await this.getStakingTotal(this.pools[key].token)
				this.pools[key].totalAccountStake = await this.getStakingByPoolByAccount(this.pools[key].token)
			},

			rewards (key) {
				let self = this
				setInterval(async () => {
					let rewards = await this.instance.methods.calculateReward(self.pools[key].token).call({ from: this.accounts[0] })
					console.log(rewards)
					self.pools[key].rewards = rewards / 10**8
 
				}, 8000);
			},

			/**
			 * Claim
			 */
			async claimRewards (addressToken, key) {
				this.loaderClaim[key] = true
				try {
					await this.instance.methods.claimRewards(addressToken,).send({ from: this.accounts[0] })
				} catch (error) {
					await this.instance.methods.claimRewards(addressToken).call({ from: this.accounts[0] })
					.then(result => {}).catch(revert => {
						console.log(revert)
						console.log(this.parseRevertMsg(revert))				
					})
				}
				this.loaderClaim[key] = false
			}
		},
		async mounted () {
			await this.checkConnectedWallet()
			await this.getPools()
		}
	}
</script>
