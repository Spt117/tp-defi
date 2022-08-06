
# TP n°4 - DeFi Staking Alyra - Tests unitaires

## Authors
* Jean Baptiste F.
* Etienne H.
* Anthony D. G.


## Introduction

Les tests unitaires portent sur les fichiers CrowdV.sol, StackingPool.sol, Staking.sol et TokenTest.sol.

Les tests ont été effectués avec eth-gas-reporter et coverage préalablement installés et paramétrés dans truffle-config.js.
```
$ truffle test
```
```
$ truffle run coverage
```

Plusieurs tests ont été effectués en faisant varier les valeurs des paramètres de l'optimizer dans truffle-config.js.

L'objectif est de montrer que plus le nombre de cycles d'exécution de l'optimizer est faible, plus le contrat est léger et les fonctions plus coûteuses à appeler. Et inversement, plus le nombre de cycles de l'optimizer est important, plus le contrat est lourd et les fonctions moins coûteuses à appeler.

Voici un tableau résumant les résultats de la taille des fichiers en bytes et des coûts en gas en fonction du nombre d'exécution de l'optimizer :

| Optimizer | File Size (1) | Eth-Gas (2) |
|:---|:---:|---:|
| false | 26005 | 3358284 |
| 1 | 26005 | 1816700 |
| 10 | 26005 | 1816700 |
| 50 | 26021 | 1815620 |
| 100 | 26053 | 1822503 |
| 200 | 26053 | 1837985 |
| 500 | 26117 | 1894549 |

(1) in bytes. During Coverage tests.

(2) in gas. Deployments > Staking.


Vous trouverez ci-dessous les copies d'écran des différents tests exécutés.

## Files

coverage.zip avec optimizer: { enabled: true, runs: 1 }.

## Demo video Dapp

https://www.youtube.com/watch?v=UcAmdV8eeKo

## Images

### Coverage :

Coverage, __sans__ optimizer: {enabled: false}
![](img/coverage_0_false.png)

Coverage, optimizer: {enabled:true, runs:1}
![](img/coverage_1.png)

Coverage, optimizer: {enabled:true, runs:10}
![](img/coverage_10.png)

Coverage, optimizer: {enabled:true, runs:50}
![](img/coverage_50.png)

Coverage, optimizer: {enabled:true, runs:100}
![](img/coverage_100.png)

Coverage, optimizer: {enabled:true, runs:200}
![](img/coverage_200.png)

Coverage, optimizer: {enabled:true, runs:500}
![](img/coverage_500.png)

### eth-gas-reporter :

eth-gas, __sans__ optimizer: {enabled:false}
![](img/eth-gas_0_false.png)

eth-gas, optimizer: {enabled:true, runs:1}
![](img/eth-gas_1.png)

eth-gas, optimizer: {enabled:true, runs:10}
![](img/eth-gas_10.png)

eth-gas, optimizer: {enabled:true, runs:50}
![](img/eth-gas_50.png)

eth-gas, optimizer: {enabled:true, runs:100}
![](img/eth-gas_100.png)

eth-gas, optimizer: {enabled:true, runs:200}
![](img/eth-gas_200.png)

eth-gas, optimizer: {enabled:true, runs:500}
![](img/eth-gas_500.png)