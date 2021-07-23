import { RaribleApi } from "./rarible-api";
import { roundPrice } from "./utils";
import Web3 from "web3"

export class RaribleBuyNow extends HTMLElement {
    private rendered = false;
    private url = "https://rarible.com";

    constructor() {
        super();
    }

    connectedCallback() {
        if (!this.rendered) {
            this.render();
            this.rendered = true;
        }
    }

    public render() {
        let ownershipId = this.getAttribute("ownershipId");
        let api: RaribleApi = new RaribleApi();

        const itemId = `${ownershipId.split(':')[0]}:${ownershipId.split(':')[1]}`
        const getMappingItem = api.getMarketMappingItems([itemId])
        const getOrder = api.getOrderByOwnership(ownershipId)
        api.getAll([getMappingItem, getOrder]).then(resData => {
            const itemInfo = resData[0][0]
            const orderInfo = resData[1]
            console.log('itemInfo', itemInfo)
            console.log('orderInfo', orderInfo)

            const shadow = this.attachShadow({ mode: 'open' })

            const style = document.createElement('style')
            style.textContent = this.renderStyle()
            shadow.appendChild(style);

            const template = document.createElement('template')
            template.innerHTML = this.renderHtml(orderInfo, itemInfo)
            shadow.appendChild(template.content.cloneNode(true))


            // ADD EVENTS
            const processBtn = shadow.querySelector(`#btn-process-${orderInfo.id}`);
            const modal = shadow.querySelector(`#modal-${orderInfo.id}`);
            const buyNowBtn = shadow.querySelector(`#rarible-btn-buy-${orderInfo.id}`);
            const closeBtn = shadow.querySelector(".rarible-modal-close");
            const cancelBtn = shadow.querySelector('.rarible-btn-cancel')

            closeBtn.addEventListener("click", function () {
                modal.setAttribute('style', `display: none;`)
            })
            cancelBtn.addEventListener("click", function () {
                modal.setAttribute('style', `display: none;`)
            })
            buyNowBtn.addEventListener('click', function () {
                modal.setAttribute('style', `display: block;`)
            })
            window.addEventListener("click", function (event) {
                if (event.target == modal) {
                    //modal.style.display = "none";
                    modal.setAttribute('style', `display: none;`)
                }
            })

            processBtn.addEventListener('click', async function () {
                // init web3 for connecting to meta mask
                const provider = (window as any).ethereum
                await provider.enable()
                const web3 = new Web3(provider)
                console.log('provider', provider)

                web3.eth.getAccounts((error, result) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log(result);
                        const buyerAddr = result[0]

                        // prepare transaction
                        api.prepareTransaction(orderInfo.id, buyerAddr, 1).then((resPreparedTx: any) => {
                            const preparedTx = resPreparedTx.data
                            const tx = {
                                from: buyerAddr,
                                data: preparedTx.transaction.data,
                                to: preparedTx.transaction.to,
                                value: preparedTx.asset.value
                            }

                            console.log("sending tx", tx);
                            // web3.eth.sendTransaction(tx)
                        })
                    }
                });
            })
        });
    }

    private renderHtml(orderInfo: any, itemInfo: any) {
        return `<button id="rarible-btn-buy-${orderInfo.id}">Buy Now</button>
        <div id="modal-${orderInfo.id}" class="rarible-modal">
            <div class="rarible-modal-content">
                <span class="rarible-modal-close">&times;</span>

                <div style="padding: 15px 0px;font-size: 28px;"><strong>Checkout</strong></div>
                
                <div style="margin-top: 10px">
                    You are about to purchase <span><strong>${itemInfo.properties.name}</strong></span>
                    from <span><a href="${this.url}/${itemInfo.item.ownership.owner}?tab=onsale" target="_blank"><strong>${itemInfo.item.ownership.owner}</strong></a></span>
                </div>

                <div style="margin-top: 15px">
                    <div>
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
                        <span><strong>0 ETH</strong></span>
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
            width: 380px;
            border-radius: 16px;
            color: rgb(128, 128, 128);
            line-height: 22px;
            font-weight: 600;
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