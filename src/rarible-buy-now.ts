import { RaribleApi } from './rarible-api'
import { roundPrice } from './utils'
import { RaribleConstant } from './constants'
import Web3 from 'web3'

export class RaribleBuyNow extends HTMLElement {
    private rendered = false
    private web3: Web3
    private buyerAddress: string

    constructor() {
        super()
    }

    connectedCallback() {
        if (!this.rendered) {
            this.render()
            this.rendered = true
        }
    }

    public render() {
        const ownershipId = this.getAttribute('ownershipId')
        const protocolApiUrl = this.getAttribute('protocolApiUrl')
        const marketplaceApiUrl = this.getAttribute('marketplaceApiUrl')

        const itemId = `${ownershipId.split(':')[0]}:${ownershipId.split(':')[1]}`

        const api: RaribleApi = new RaribleApi(protocolApiUrl, marketplaceApiUrl)
        const getMappingItem = api.getMarketMappingItems([itemId])
        const getOrder = api.getOrderByOwnership(ownershipId)
        api.getAll([getMappingItem, getOrder]).then((resData) => {
            const itemInfo = resData[0][0]
            const orderInfo = resData[1]
            console.log('itemInfo', itemInfo)
            console.log('orderInfo', orderInfo)

            const shadow = this.attachShadow({ mode: 'open' })

            const style = document.createElement('style')
            style.textContent = this.renderStyle()
            shadow.appendChild(style)

            const template = document.createElement('template')
            template.innerHTML = this.renderHtml(orderInfo, itemInfo)
            shadow.appendChild(template.content.cloneNode(true))

            // owner info
            const ownerSpan = shadow.querySelector(`#modal-${orderInfo.id}-owner`)
            ownerSpan.innerHTML = `<a href="" target="_blank"><strong>${itemInfo.item.ownership.owner}</strong></a>`
            api.getProfiles([itemInfo.item.ownership.owner]).then((resProfile) => {
                const ownerProfile = resProfile.data[0]
                ownerSpan.innerHTML = `<a href="${RaribleConstant.URL_BASE}/${ownerProfile.shortUrl}?tab=onsale" target="_blank"><strong>${ownerProfile.name}</strong></a>`
            })

            // ADD EVENTS
            const processBtn = shadow.querySelector(`#btn-process-${orderInfo.id}`)
            const modal = shadow.querySelector(`#modal-${orderInfo.id}`)
            const buyNowBtn = shadow.querySelector(`#rarible-btn-buy-${orderInfo.id}`)
            const closeBtn = shadow.querySelector('.rarible-modal-close')
            const cancelBtn = shadow.querySelector('.rarible-btn-cancel')

            closeBtn.addEventListener('click', function () {
                modal.setAttribute('style', `display: none;`)
            })
            cancelBtn.addEventListener('click', function () {
                modal.setAttribute('style', `display: none;`)
            })

            const _this = this
            buyNowBtn.addEventListener('click', async function () {
                modal.setAttribute('style', `display: block;`)

                // init web3 for connecting to meta mask
                const provider = (window as any).ethereum
                await provider.enable()
                _this.web3 = new Web3(provider)
                console.log('provider', provider)

                _this.web3.eth.getAccounts((error, result) => {
                    _this.buyerAddress = result[0]
                    _this.web3.eth.getBalance(_this.buyerAddress, function (error, rsBalance) {
                        if (!error) {
                            console.log('rsBalance', _this.buyerAddress + ': ' + rsBalance)
                            const balanceSpan = shadow.querySelector(`#modal-${orderInfo.id}-balance`)
                            balanceSpan.textContent = rsBalance
                        }
                    })
                })
            })
            window.addEventListener('click', function (event) {
                if (event.target == modal) {
                    //modal.style.display = "none";
                    modal.setAttribute('style', `display: none;`)
                }
            })

            processBtn.addEventListener('click', async function () {
                if (_this.buyerAddress) {
                    // prepare transaction
                    api.prepareTransaction(orderInfo.id, _this.buyerAddress, 1).then((resPreparedTx: any) => {
                        const preparedTx = resPreparedTx.data
                        const tx = {
                            from: _this.buyerAddress,
                            data: preparedTx.transaction.data,
                            to: preparedTx.transaction.to,
                            value: preparedTx.asset.value
                        }

                        console.log('sending tx', tx)
                        // web3.eth.sendTransaction(tx)
                    })
                }
            })
        })
    }

    private renderHtml(orderInfo: any, itemInfo: any) {
        // prettier-ignore
        // const buyNowText = `Buy for ${orderInfo.sellPriceEth} ${orderInfo.takeCurrency.symbol}`
        const buyNowText = `Buy Now`
        return `<button class="rarible-btn-buy" id="rarible-btn-buy-${orderInfo.id}">${buyNowText}</button>
        <div id="modal-${orderInfo.id}" class="rarible-modal">
            <div class="rarible-modal-content">
                <span class="rarible-modal-close">&times;</span>

                <div style="padding: 15px 0px;font-size: 28px;"><strong>Checkout</strong></div>
                
                <div style="margin-top: 10px;">
                    You are about to purchase <span><strong>${itemInfo.properties.name}</strong></span>
                    from <span id="modal-${orderInfo.id}-owner"></span>
                </div>

                <div style="margin-top: 15px">
                    <div style="display: ${itemInfo.item.totalStock == 1 ? 'none' : 'unset'}">
                        <input type="text" placeholder="qty" value="1" />
                        <div class="input-hint">Enter quantity. ${itemInfo.item.totalStock - 1} available</div>
                    </div>
                    <div>
                        <input type="text" placeholder="price" value="${orderInfo.sellPriceEth}" />
                        <div class="input-hint">Price per edition</span>
                    </div>
                </div>
                
                <div style="margin-top: 15px">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Your balance</span>
                        <span><strong><span id="modal-${orderInfo.id}-balance">0</span> ETH</strong></span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Service fee</span>
                        <span><strong>${roundPrice(orderInfo.sellPriceEth * 0.025, 6)} ETH</strong></span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Total price</span> 
                        <span><strong>${orderInfo.sellPriceEth} ETH</strong></span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>You will pay</span>
                        <span><strong>${roundPrice(orderInfo.sellPriceEth * 1.025, 6)} ETH</strong></span>
                    </div>
                </div>

                <div>
                    <button class="rarible-btn-process" id="btn-process-${orderInfo.id}">Process to payment</button>
                    <button class="rarible-btn-cancel" >Cancel</button>
                </div>
            </div>
        </div>`
    }

    private renderStyle() {
        return `
        .rarible-btn-buy {
            border: none;
            border-color: rgb(0, 102, 255);
            border-radius: 48px;
            color: rgb(255, 255, 255);
            background: rgba(0, 102, 255, 0.9);
            min-width: 100px;
            min-height: 32px;
            font-weight: 600;
            cursor: pointer;
            padding: 0px 15px 0px 15px;
        }

        /* The Modal (background) */
        .rarible-modal {
            display: none; /* Hidden by default */
            position: fixed; /* Stay in place */
            z-index: 1; /* Sit on top */
            padding-top: 100px; /* Location of the box */
            left: 0;
            top: 0;
            width: 100%; /* Full width */
            height: 100%; /* Full height */
            overflow: auto; /* Enable scroll if needed */
            background-color: rgb(0,0,0); /* Fallback color */
            background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
        }
        
        /* Modal Content */
        .rarible-modal-content {
            background-color: #fefefe;
            margin: auto;
            padding: 20px;
            border: 1px solid #888;
            //width: 80%;
            width: 350px;
            border-radius: 16px;
            color: rgb(128, 128, 128);
            line-height: 22px;
            font-weight: 600;
            font-size: 14px;
        }

        /* The Close Button */
        .rarible-modal-close {
            color: #aaaaaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
        }

        .rarible-modal-close:hover, .rarible-modal-close:focus {
            color: #000;
            text-decoration: none;
            cursor: pointer;
        }

        .rarible-modal-content  a {
            text-decoration: none;
        }

        .rarible-modal-content  div {
            margin-top: 3px;
        }

        .rarible-modal-content strong {
            color: rgb(4, 4, 5);
            font-weight: 900;
        }

        .rarible-modal-content .input-hint {
            font-size: 13px;
        }

        .rarible-modal-content input[type="text"] {
            border-width: 0px 0px 2px;
            min-height: 36px;
            border-bottom-color: rgba(4, 4, 5, 0.07);
            border-style: solid;
            width: 100%;
            font-size: 16px;
            font-weight: 600;
            color: rgba(4, 4, 5, 0.5);
        }

        .rarible-modal-content button {
            border: none;
            // border-color: rgb(0, 102, 255);
            color: rgb(255, 255, 255);
            background: rgba(0, 102, 255, 0.9);
            height: 48px;
            width: 100%;
            padding-left: 26.4px;
            padding-right: 26.4px;
            min-width: 192px;
            border-radius: 48px;
            font-size: 15px;
            font-weight: 900;
            cursor: pointer;
            margin: 16px 0px 0px
        }

        .rarible-btn-process:hover {
            background: rgba(0, 102, 255, 1) !important;;
        }

        .rarible-btn-cancel:hover {
            background: rgba(0, 102, 255, 0.2) !important;;
        }

        .rarible-btn-cancel {
            background: rgba(0, 102, 255, 0.15) !important;
            color: rgba(0, 102, 255, 0.9) !important;;
        }
        
        `
    }
}
