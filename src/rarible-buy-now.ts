import { RaribleApi } from './rarible-api'
import { roundPrice, shortAddress, ShareLinkBuilder } from './utils'
import { Config } from './config'
import Web3 from 'web3'
import { RaribleConstant } from './constants'
const ConfettiGenerator = require('confetti-js').default

export class RaribleBuyNow extends HTMLElement {
    private rendered = false
    private config: Config
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
        const itemId = `${ownershipId.split(':')[0]}:${ownershipId.split(':')[1]}`
        this.config = new Config(this.getAttribute('env'))

        const api: RaribleApi = new RaribleApi(this.config.ProtocolApiUrl, this.config.MarketplaceApiUrl)
        const getMappingItem = api.getMarketMappingItems([itemId])
        const getOrder = api.getOrderByOwnership(ownershipId)
        api.getAll([getMappingItem, getOrder]).then((resData) => {
            console.log('resData', resData)
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

            const ownerSpans = shadow.querySelectorAll(`.modal-${orderInfo.id}-owner`)
            ownerSpans.forEach((ownerSpan) => {
                ownerSpan.innerHTML = `<a href="" target="_blank"><strong>${itemInfo.item.ownership.owner}</strong></a>`
            })
            api.getProfiles([itemInfo.item.ownership.owner]).then((resProfile) => {
                const ownerProfile = resProfile.data[0]
                ownerSpans.forEach((ownerSpan) => {
                    ownerSpan.innerHTML = `<a href="${this.config.getUserUrl(ownerProfile.shortUrl, ownerProfile.id)}" target="_blank">
                    <strong>${ownerProfile.name ?? ownerProfile.id}</strong>
                    </a>`
                })
            })

            // ADD EVENTS
            const processBtn = shadow.querySelector(`#btn-process-${orderInfo.id}`)
            const modal = shadow.querySelector(`#modal-${orderInfo.id}`)
            const buyNowBtn = shadow.querySelector(`#rarible-btn-buy-${orderInfo.id}`)
            const closeBtn = shadow.querySelector('.rarible-modal-close')
            const cancelBtn = shadow.querySelector('.rarible-btn-cancel')
            const continueBtn = shadow.querySelector('.rarible-btn-continue')

            const resultModal = shadow.querySelector(`#modal-result-${orderInfo.id}`)
            const confettiElement = shadow.querySelector(`#confetti`)
            const statusSpan = shadow.querySelector(`#modal-result-${orderInfo.id}-status`)
            const transactionSpan = shadow.querySelector(`#modal-result-${orderInfo.id}-transaction`)
            const progressSpan = shadow.querySelector(`#modal-result-${orderInfo.id}-progress`)

            closeBtn.addEventListener('click', function () {
                modal.setAttribute('style', `display: none;`)
            })

            cancelBtn.addEventListener('click', function () {
                modal.setAttribute('style', `display: none;`)
            })
            continueBtn.addEventListener('click', function () {
                resultModal.setAttribute('style', `display: none;`)
            })
            window.addEventListener('click', function (event) {
                if (event.target == modal) {
                    modal.setAttribute('style', `display: none;`)
                }
            })

            const _this = this
            buyNowBtn.addEventListener('click', async function () {
                modal.setAttribute('style', `display: block;`)

                // init web3 for connecting to meta mask
                const provider = (window as any).ethereum
                await provider.enable()
                _this.web3 = new Web3(provider)

                _this.web3.eth.getAccounts((error, result) => {
                    _this.buyerAddress = result[0]
                    _this.web3.eth.getBalance(_this.buyerAddress, function (error, rsBalance) {
                        if (!error) {
                            console.log('rsBalance', _this.buyerAddress + ': ' + _this.web3.utils.fromWei(rsBalance, 'ether'))

                            const balanceSpan = shadow.querySelector(`#modal-${orderInfo.id}-balance`)
                            balanceSpan.textContent = roundPrice(parseFloat(_this.web3.utils.fromWei(rsBalance, 'ether')), 6).toString()
                        }
                    })
                })
            })

            processBtn.addEventListener('click', function () {
                if (_this.buyerAddress) {
                    // close process purchase modal
                    modal.setAttribute('style', `display: none;`)
                    // show result modal
                    resultModal.setAttribute('style', `display: block;`)
                    statusSpan.innerHTML = 'Waiting'

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
                        _this.web3.eth
                            .sendTransaction(tx)
                            .on('transactionHash', function (hash: string) {
                                statusSpan.innerHTML = 'Processing'
                                statusSpan.setAttribute('style', `color: rgb(175, 162, 63);`)

                                console.log('shoraddres', shortAddress(hash))
                                transactionSpan.innerHTML = shortAddress(hash)
                                transactionSpan.setAttribute('href', _this.config.getEtherscanUrl(hash))

                                // confetti effect
                                ConfettiGenerator({ target: confettiElement, width: 380, height: 325 }).render()
                            })
                            .on('error', function (err) {
                                console.log('sendTransaction error', err)

                                // render result
                                statusSpan.innerHTML = 'Fail'
                            })
                            .then(function (receipt) {
                                // will be fired once the receipt is mined
                                console.log('receipt', receipt)

                                // render result
                                statusSpan.innerHTML = 'Success'
                                statusSpan.setAttribute('style', `color: rgb(0, 102, 255);`)

                                // You successfully purchased ${itemInfo.properties.name} from <span class="modal-${orderInfo.id}-owner"></span>
                                progressSpan.innerHTML = `You successfully purchased`
                            })
                    })
                }
            })
        })
    }

    private renderHtml(orderInfo: any, itemInfo: any) {
        // prettier-ignore
        // const buyNowText = `Buy for ${orderInfo.sellPriceEth} ${orderInfo.takeCurrency.symbol}`
        const buyNowText = `Buy Now`
        const buyNowButton = `<button class="rarible-btn-buy" id="rarible-btn-buy-${orderInfo.id}">${buyNowText}</button>`
        const processModal = `
            <div id="modal-${orderInfo.id}" class="rarible-modal">
                <div class="rarible-modal-content" style="width: 380px;">
                    <div style="padding: 20px">
                        <span class="rarible-modal-close">&times;</span>
                        
                        <div style="padding: 15px 0px;font-size: 28px;"><strong>Checkout</strong></div>
                        
                        <div style="margin-top: 10px;">
                            You are about to purchase <span><strong>${itemInfo.properties.name}</strong></span>
                            from <span class="modal-${orderInfo.id}-owner"></span>
                        </div>

                        <div style="margin-top: 15px">
                            <div>
                                <div class="rarible-input-wrap">
                                    <input type="text" placeholder="qty" value="1" readonly disabled />
                                </div>
                                <div class="rarible-input-hint">Enter quantity. ${itemInfo.item.totalStock} available</div>
                            </div>
                            <div>
                                <div class="rarible-input-wrap">
                                    <input type="text" placeholder="price" value="${orderInfo.sellPrice}" readonly disabled />
                                    <label>${RaribleConstant.DEFAULT_CURRENCY}</label>
                                </div>
                                <div class="rarible-input-hint">Price per edition</span></div>
                            </div>
                        </div>
                        
                        <div style="margin-top: 15px">
                            <div style="display: flex; justify-content: space-between;">
                                <span>Your balance</span>
                                <span><strong><span id="modal-${orderInfo.id}-balance">0</span> ${RaribleConstant.DEFAULT_CURRENCY}</strong></span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Service fee</span>
                                <span><strong>${roundPrice(orderInfo.sellPrice * RaribleConstant.SERVICE_FEE, 6)} ${RaribleConstant.DEFAULT_CURRENCY}</strong></span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Total price</span> 
                                <span><strong>${orderInfo.sellPrice} ${RaribleConstant.DEFAULT_CURRENCY}</strong></span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>You will pay</span>
                                <span><strong>${roundPrice(orderInfo.sellPrice * (1 + RaribleConstant.SERVICE_FEE), 6)} ${RaribleConstant.DEFAULT_CURRENCY}</strong></span>
                            </div>
                        </div>

                        <div>
                            <button class="rarible-btn rarible-btn-process" id="btn-process-${orderInfo.id}">Process to payment</button>
                            <button class="rarible-btn rarible-btn-cancel" >Cancel</button>
                        </div>
                    </div>
                </div>
            </div>`

        // prettier-ignore
        const resultModal = `
            <div id="modal-result-${orderInfo.id}" class="rarible-modal" >
                <div class="rarible-modal-content" style="width: 380px;">
                    <canvas id="confetti" style="position: absolute"></canvas>
                    <div style="padding: 30px">
                        <div class="rarible-card-image">
                            <image src="${this.config.getImageUrl(itemInfo.properties.imagePreview ?? itemInfo.properties.image)}" 
                                title="${itemInfo.properties.name}"></image>
                        </div>

                        <div style="margin-top: 15px; text-align: center; font-weight: 600; font-size: 16px" >
                            <span id="modal-result-${orderInfo.id}-progress">You are about to purchase</span> ${itemInfo.properties.name} from <span class="modal-${orderInfo.id}-owner"></span>
                        </div>

                        <div style="margin-top: 15px; text-align: left; display: flex; justify-content: space-between; 
                                border-radius: 16px; border: 1px solid rgb(230, 230, 230); padding: 15px 20px 15px 20px;">
                            <div style="display: flex; flex-direction: column; width: 100px;">
                                <span style="font-size: 12px">Status</span>
                                <span id="modal-result-${orderInfo.id}-status">Unknown</span>
                            </div>
                            <div style="display: flex; flex-direction: column; width: 170px;">
                                <span style="font-size: 12px">Transaction hash</span>
                                <span ><strong><a id="modal-result-${orderInfo.id}-transaction" href="rarible.com" style="color: rgb(0, 102, 255);">Unknown</a></strong></span>
                            </div>
                            
                        </div>

                        <div style="margin-top: 20px; text-align: center; font-size: 18px;">Let's show-off a little</div>

                        <div style="margin-top: 15px; padding: 0 35px 0 35px; display: flex; justify-content: space-between; ">
                            <div class="rarible-share-button-wrap">
                                <button class="rarible-share-button" onClick="window.open('${ShareLinkBuilder.buildTwitterShareLink(this.config.getItemUrl(itemInfo.id), itemInfo.properties.name)}')">
                                    <svg viewBox="0 0 18 16" fill="none" width="13" height="13" xlmns="http://www.w3.org/2000/svg"><path d="M17.9655 2.42676C17.3018 2.71851 16.593 2.91726 15.8468 3.00801C16.6073 2.54976 17.1922 1.82751 17.469 0.965759C16.7558 1.38201 15.9653 1.68501 15.1238 1.85376C14.4518 1.13451 13.494 0.684509 12.4305 0.684509C10.3927 0.684509 8.7405 2.33676 8.7405 4.37226C8.7405 4.66476 8.77425 4.94601 8.83575 5.21526C5.76825 5.07051 3.0495 3.59751 1.23 1.37076C0.90975 1.91226 0.7305 2.54151 0.7305 3.22701C0.7305 4.50951 1.383 5.63676 2.3715 6.29901C1.76625 6.27951 1.197 6.11301 0.7005 5.83701V5.88276C0.7005 7.67151 1.97025 9.16326 3.66 9.50301C3.35025 9.58626 3.02325 9.63126 2.688 9.63126C2.4525 9.63126 2.22675 9.60876 2.001 9.56676C2.47425 11.0315 3.83475 12.0995 5.454 12.1295C4.194 13.1188 2.59725 13.7083 0.8775 13.7083C0.585 13.7083 0.29325 13.691 0 13.658C1.64175 14.7035 3.576 15.3148 5.66775 15.3148C12.4583 15.3148 16.167 9.69276 16.167 4.82526C16.167 4.66851 16.167 4.51026 16.1558 4.35276C16.8765 3.83601 17.5057 3.18276 18.0007 2.44176L17.9655 2.42676Z" fill="currentColor"></path></svg>
                                </button>
                                <div style="font-size: 11px">Twitter</div>
                            </div>
                            <div class="rarible-share-button-wrap">
                                <button class="rarible-share-button" onClick="window.open('${ShareLinkBuilder.buildFacebookShareLink(this.config.getItemUrl(itemInfo.id), itemInfo.properties.name)}')">
                                    <svg viewBox="0 0 24 24" width="13" height="13" xlmns="http://www.w3.org/2000/svg"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.222h2l-.209 2h-1.791v7h-3v-7h-2v-2h2v-2.308c0-1.769.931-2.692 3.029-2.692h1.971v3z" fill="currentColor"></path></svg>
                                </button>
                                <div style="font-size: 11px">Facebook</div>
                            </div>
                            <div class="rarible-share-button-wrap">
                                <button class="rarible-share-button" onClick="window.open('${ShareLinkBuilder.buildTelegramShareLink(this.config.getItemUrl(itemInfo.id), itemInfo.properties.name)}')">
                                    <svg viewBox="0 0 16 14" fill="none" width="13" height="13" xlmns="http://www.w3.org/2000/svg"><path d="M15.9513 1.29916L13.5438 13.1556C13.377 13.997 12.8902 14.1987 12.21 13.8093L8.542 10.979L6.76804 12.7662C6.56797 12.9748 6.40125 13.1556 6.03445 13.1556C5.55428 13.1556 5.63431 12.9679 5.47425 12.495L4.20714 8.19051L0.572523 7.00834C-0.214421 6.76495 -0.22109 6.20168 0.745918 5.7914L14.9243 0.0891779C15.5711 -0.209841 16.1914 0.256072 15.9446 1.29221L15.9513 1.29916Z" fill="currentColor"></path></svg>
                                </button>
                                <div style="font-size: 11px">Telegram</div>
                            </div>
                            <div class="rarible-share-button-wrap">
                                <button class="rarible-share-button" onClick="window.open('${ShareLinkBuilder.buildEmailShareLink(this.config.getItemUrl(itemInfo.id), itemInfo.properties.name)}')">
                                    <svg viewBox="0 0 24 24" width="13" height="13" xlmns="http://www.w3.org/2000/svg"><path d="M12 12.713l-11.985-9.713h23.971l-11.986 9.713zm-5.425-1.822l-6.575-5.329v12.501l6.575-7.172zm10.85 0l6.575 7.172v-12.501l-6.575 5.329zm-1.557 1.261l-3.868 3.135-3.868-3.135-8.11 8.848h23.956l-8.11-8.848z" fill="currentColor"></path></svg>
                                </button>
                                <div style="font-size: 11px">Email</div>
                            </div>
                        </div>
                        <div>
                            <button class="rarible-btn rarible-btn-continue" >Continue</button>
                        </div>
                    </div>
                    
                </div>
            </div>
            
            `

        return `${buyNowButton} ${processModal} ${resultModal}`
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
            min-height: 28px;
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
            background-color: rgba(0,0,0,0.8); /* Black w/ opacity */
        }

        /* Modal Content */
        .rarible-modal-content {
            background-color: #fefefe;
            margin: auto;
            // padding: 20px;
            border: 1px solid #888;
            //width: 80%;
            border-radius: 16px;
            color: rgb(128, 128, 128);
            line-height: 22px;
            font-weight: 600;
            font-size: 14px;
            position: relative;
            box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);
            -webkit-animation-name: animatebottom;
            -webkit-animation-duration: 0.5s;
            animation-name: animatebottom;
            animation-duration: 0.5s
        }

        /* Add Animation */
        @-webkit-keyframes animatetop {
            from {top:-300px; opacity:0} 
            to {top:0; opacity:1}
        }

        @keyframes animatetop {
            from {top:-300px; opacity:0}
            to {top:0; opacity:1}
        }

        @-webkit-keyframes animatebottom {
            from {bottom:-300px; opacity:0} 
            to {bottom:0; opacity:1}
        }

        @keyframes animatebottom {
            from {bottom:-300px; opacity:0}
            to {bottom:0; opacity:1}
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

        .rarible-input-hint {
            font-size: 13px;
        }

        .rarible-modal-content input[type="text"] {
            border: none;
            min-height: 36px;
            width: 100%;
            font-size: 16px;
            font-weight: 600;
            color: rgba(4, 4, 5, 0.5);
            background-color: white;
        }

        .rarible-input-wrap {
            display: flex;flex-direction: row;
            align-items: center;
            border-bottom-color: rgba(4, 4, 5, 0.07);
            border-style: solid;
            border-width: 0px 0px 2px;
        }

        .rarible-btn {
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

        .rarible-btn-process {
            border: none;
            // border-color: rgb(0, 102, 255);
            color: rgb(255, 255, 255);
            background: rgba(0, 102, 255, 0.9);
            
        }

        .rarible-btn-process:hover {
            background: rgba(0, 102, 255, 1) !important;
        }

        .rarible-btn-cancel:hover {
            background: rgba(0, 102, 255, 0.2) !important;
        }

        .rarible-btn-cancel {
            background: rgba(0, 102, 255, 0.15) !important;
            color: rgba(0, 102, 255, 0.9) !important;
            border: none;
        }

        .rarible-btn-continue {
            background: rgb(255, 255, 255) !important;
            color: rgb(4, 4, 5) !important;
            border: solid 1px rgba(4, 4, 5, 0.07) !important;
        }

        .rarible-btn-continue:hover  {
            background: rgba(4, 4, 5, 0.04) !important;
        }

        .rarible-share-button {
            height: 40px;width: 40px;
            border-radius: 40px; 
            border: solid 1px rgb(230, 230, 230);
            cursor: pointer;
            color: rgba(4, 4, 5, 0.8);
            background-color: rgba(0, 0, 0, 0);
        }

        .rarible-share-button-wrap {
            display: block; 
            flex-direction: column; 
            text-align: center;
        }

        .rarible-card-image {
            margin-top: 15px;
            min-width: 182px;
            min-height: 220px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .rarible-card-image img {
            max-width: 220px;
            max-height: 220px;
            border-radius: 6px;
            z-index: 1000;
        }
        
        `
    }
}
