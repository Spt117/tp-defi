<script setup>
	import StakingContract from '@/contracts/StakingJB.json'
	import getWeb3 from '@/utils/getWeb3'

	import 'bootstrap-icons/font/bootstrap-icons.css'
</script>

<template>
	<header class="navbar navbar-dark mb-5 bg-primary">
		<div class="container">
			<p class="navbar-brand align-middle mb-0">Alyra - Staking Project</p>
			<div class="d-flex">
				<p>
					{{ connectedWallet }}
					<span v-if="currentOwner">(Owner)</span>
				</p>
			</div>
		</div>
	</header>

	<div class="container">
		<div class="mb-3 text-end" v-if="owner">
			<button class="btn btn-success" :class="(!displayAddPoolForm) ? 'btn-success' : 'btn-danger'" @click="displayAddPool()">
				<span v-if="!displayAddPoolForm"><i class="bi bi-plus"></i> Add a new pool</span>
				<span v-else><i class="bi bi-x"></i> Hide add a pool</span>
			</button>
		</div>

		<div id="all-pools" class="mb-5 bg-white p-3 shadow-sm" v-if="owner" v-show="displayAddPoolForm">
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

		<div id="pools" class="mt-5">
			<h2>Pools availables</h2>
			<div class="row mt-4">
				<div class="col-4 d-flex align-items-stretch">
					<div class="card w-100 shadow-sm border-0">
						<div class="card-header bg-white p-3">
							<h2 class="fs-5 mb-2">Staking DAI</h2>
							<p class="mb-0">Total staking: <span class="badge bg-secondary">0 $</span></p>
						</div>
						<div class="card-body">
							<div class="row">
								<p class="card-subtitle mb-2 text-muted mb-2 col-6">Reward APR : 8%</p>
								<p class="card-subtitle mb-2 text-muted mb-4 col-6 text-end">Earn : MY</p>
							</div>
							<button class="btn-primary btn">Approve</button>
							<p class="mt-3">Total stake by you in this pool : <strong>0</strong></p>
						</div>
					</div>
				</div>
				<div class="col-4 d-flex align-items-stretch">
					<div class="card w-100 shadow-sm border-0">
						<div class="card-header bg-white p-3">
							<h2 class="fs-5 mb-2">Staking ETH</h2>
							<p class="mb-0">Total staking: <span class="badge bg-secondary">1000 $</span></p>
						</div>
						<div class="card-body">
							<div class="row">
								<p class="card-subtitle mb-2 text-muted mb-2 col-6">Reward APR : 2%</p>
								<p class="card-subtitle mb-2 text-muted mb-4 col-6 text-end">Earn : MY</p>
							</div>
							<div class="form-group mb-3 row">
								<div class="col-9">
									<input type="text" class="form-control" placeholder="Amount">
								</div>
								<div class="col-3">
									<button class="btn-success btn w-100">Stake</button>
								</div>
							</div>
							<p class="mt-3">Total stake by you in this pool : <strong>0</strong></p>
						</div>
					</div>
				</div>
				<div class="col-4 d-flex align-items-stretch">
					<div class="card w-100 shadow-sm border-0">
						<div class="card-header bg-white p-3">
							<h2 class="fs-5 mb-2">Staking ETH</h2>
							<p class="mb-0">Total staking: <span class="badge bg-secondary">1000 $</span></p>
						</div>
						<div class="card-body">
							<div class="row">
								<p class="card-subtitle mb-2 text-muted mb-2 col-6">Reward APR : 2%</p>
								<p class="card-subtitle mb-2 text-muted mb-4 col-6 text-end">Earn : MY</p>
							</div>
							<div class="form-group mb-3 row">
								<div class="col-9">
									<input type="text" class="form-control" placeholder="Amount">
								</div>
								<div class="col-3">
									<button class="btn-success btn w-100">Stake</button>
								</div>
							</div>

							<p class="fw-bold mt-5">Your stakes</p>
							<ul class="list-group">
								<li class="list-group-item d-flex justify-content-between align-items-center">
									Staked 1000 ETH<button class="btn btn-warning">Unstake</button>
								</li>
							</ul>
							<p class="mt-3">Total stake by you in this pool : <strong>1000</strong></p>
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
				owner: false,
				currentOwner: false,
				pools: [],
				displayAddPoolForm: false,
				loaderAddPool: false,
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
				
				const networkId = await this.web3.eth.net.getId()
				const deployedNetwork = StakingContract.networks[networkId]
				this.instance = await new this.web3.eth.Contract(StakingContract.abi, deployedNetwork && deployedNetwork.address)
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
						this.notifAddPool = { type: 'success', message: 'The new pool has been added.' }
						this.addPoolFields.token.value = null
						this.addPoolFields.token.value = null
						this.addPoolFields.token.value = null
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
			}
		},
		async mounted () {
			await this.checkConnectedWallet()
		}
	}
</script>
