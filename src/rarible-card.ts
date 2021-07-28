import { RaribleApi } from './rarible-api'
import { CountdownClock } from './countdown-clock'
import { roundPrice, decorateCurrency } from './utils'
import { Config } from './config'
import { RaribleConstant } from './constants'

export class RaribleCard extends HTMLElement {
    private rendered = false
    private config: Config
    private api: RaribleApi

    constructor() {
        super()
    }

    public render() {
        const itemId = this.getAttribute('itemId')
        const showBuyNow = this.getAttribute('showBuyNow') === 'true'
        this.config = new Config(this.getAttribute('env'))
        this.api = new RaribleApi(this.config.ProtocolApiUrl, this.config.MarketplaceApiUrl)
        this.api.getMarketMappingItems([itemId]).then((res) => {
            const itemInfo = res.data[0]
            console.log('itemInfo', itemInfo)
            const isAuction = itemInfo.item.ownership && itemInfo.item.ownership.status == 'AUCTION'

            const shadow = this.attachShadow({ mode: 'open' })

            const style = document.createElement('style')
            style.textContent = this.renderStyle()
            shadow.appendChild(style)

            const template = document.createElement('template')
            template.innerHTML = this.renderHtml(itemInfo)

            shadow.appendChild(template.content.cloneNode(true))

            // get profiles
            let collections = [itemInfo.item.token]
            let owners = itemInfo.item.owners
            let creators = [itemInfo.item.creator]
            this.api.getAll([this.api.getProfiles(collections), this.api.getProfiles(creators), this.api.getProfiles(owners)]).then((resProfileData) => {
                const collectionProfiles = resProfileData[0].map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    image: this.config.getAvatarUrl(c.image),
                    shortUrl: c.shortUrl,
                    verified: c.badges.indexOf('VERIFIED') > -1
                }))
                const creatorProfiles = resProfileData[1].map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    image: this.config.getAvatarUrl(c.image),
                    shortUrl: c.shortUrl,
                    verified: c.badges.indexOf('VERIFIED') > -1
                }))
                const ownerProfiles = resProfileData[2].map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    image: this.config.getAvatarUrl(c.image),
                    shortUrl: c.shortUrl,
                    verified: c.badges.indexOf('VERIFIED') > -1
                }))

                console.log('avatars', collectionProfiles, creatorProfiles, ownerProfiles)
                const avatarDiv = shadow.querySelector(`#card-${itemInfo.id.replace(':', '-')}-avatar`)
                avatarDiv.innerHTML = this.renderAvatarHtml(collectionProfiles[0], creatorProfiles[0], ownerProfiles.length > 1 ? null : ownerProfiles[0])
            })

            // in case of auction
            if (isAuction) {
                const auctionIds = [`${itemInfo.item.ownership.id}`]
                this.api.getAuctionsByIds(auctionIds).then((res: any) => {
                    if (res.data.length > 0) {
                        const auctionInfo = res.data[0].auction
                        console.log('auctionInfo', auctionInfo)
                        const deadline = new Date(auctionInfo.endDate)
                        if (deadline > new Date()) {
                            const countdownClockDiv = shadow.querySelector(`#card-${itemInfo.id.replace(':', '-')}-countdown`)
                            new CountdownClock().initializeClock(countdownClockDiv, deadline)
                        }

                        const bidDiv = shadow.querySelector(`#card-${itemInfo.id.replace(':', '-')}-bid a`)
                        bidDiv.innerHTML = `${auctionInfo.minPrice} ${decorateCurrency(RaribleConstant.CURRENCY[auctionInfo.currency])}`
                    }
                })
            } else {
                // buy now button
                if (showBuyNow && itemInfo.item.ownership && itemInfo.item.ownership.status == 'FIXED_PRICE') {
                    const bidDiv = shadow.querySelector(`#card-${itemInfo.id.replace(':', '-')}-bid`)
                    bidDiv.innerHTML = `<rarible-buy-now ownershipId="${itemInfo.item.ownership.id}" env="${this.config.Environment}" } />`
                }
            }
        })
    }

    public connectedCallback() {
        if (!this.rendered) {
            this.render()
            this.rendered = true
        }
    }

    private renderHtml(itemInfo: any) {
        //// price html
        const ownership = itemInfo.item.ownership
        const offer = itemInfo.item.offerV2

        let priceHtml = ''
        let bidHtml = 'Place a bid'

        // in case of Not For Sale
        if (!ownership) {
            priceHtml = `<span>Not for sale ${itemInfo.item.supply}/${itemInfo.item.supply}</span>`
            bidHtml = `No bids yet`
        } else {
            const availableTotalText = `${itemInfo.item.totalStock}/${itemInfo.item.supply}`
            let price = ownership.priceEth
            let currency = RaribleConstant.DEFAULT_CURRENCY

            // in case of open for offers
            if (ownership.status == 'OPEN_FOR_OFFERS') {
                priceHtml = `Open for bids ${availableTotalText}`
                bidHtml = 'Place a bid'
            }
            // in case of buy now
            else if (ownership.status == 'FIXED_PRICE') {
                priceHtml = `
                <span>${ownership.stock > 1 ? `<span style="margin-right: 4px">From</span>` : ``}
                    <span style="color: rgb(4, 4, 5); margin-right: 4px;">
                        ${price >= RaribleConstant.MIN_BID_AMOUNT ? roundPrice(price) : `~${roundPrice(price)}`} ${currency} 
                    </span>
                    ${availableTotalText}
                </span>`
                bidHtml = 'Place a bid'

                // if (offer) {
                //     bidHtml = `Bid ${price >= RaribleConstant.MIN_BID_AMOUNT ? price : `~${RaribleConstant.MIN_BID_AMOUNT}`} ${currency}`
                // }
            }
            // in case of Auction
            else if (ownership.status == 'AUCTION') {
                priceHtml = `<span>${price > 0 ? 'Highest bid' : 'Minimum bid'} ${availableTotalText}</span>`
                if (offer) {
                    price = offer.buyPriceEth
                    currency = decorateCurrency(offer.makeCurrency.symbol)
                    bidHtml = `${price >= RaribleConstant.MIN_BID_AMOUNT ? roundPrice(price) : `~${roundPrice(price)}`} ${currency}`
                }
            }
        }

        const cardId = `card-${itemInfo.id.replace(':', '-')}`

        // prettier-ignore
        const html = `
        <div class="rarible-card" id="${cardId}">
            <div class="rarible-card-border">
                
                <div>
                    <div>
                        <div class="avatar-row" id="${cardId}-avatar">
                        </div>
                    </div>
                    <div class="rarible-card-image">
                        <div>
                            <a href="${this.config.getItemUrl(itemInfo.id)}" target="_blank">
                                <image src="${this.config.getImageUrl(itemInfo.properties.imagePreview ?? itemInfo.properties.image)}" title="${itemInfo.properties.name}"></image>
                            </a>
                            <div id="${cardId}-countdown"></div>
                        </div>
                    </div>
                    <div class="rarible-card-name">
                        <a href="${this.config.getItemUrl(itemInfo.id)}" target="_blank" title="${itemInfo.properties.name}">
                            <span style="color: rgba(4, 4, 5, 0.9)">${itemInfo.properties.name}</span>
                        </a>
                    </div>
                    <div style="margin-top: 10px; font-size: 13px; color: rgb(128, 128, 128);">${priceHtml}</div>
                    <div style="margin-top: 7px; ; font-size: 13px; display: flex; align-items: center;">
                        <div class="rarible-card-bid" id="${cardId}-bid">
                            <a href="${this.config.getItemUrl(itemInfo.id)}" target="_blank">
                                ${bidHtml}
                            </a>
                        </div>
                        <div class="rarible-card-likes">
                            <span><svg viewBox="0 0 17 16" fill="none" width="16" height="16" xlmns="http://www.w3.org/2000/svg"><path d="M8.2112 14L12.1056 9.69231L14.1853 7.39185C15.2497 6.21455 15.3683 4.46116 14.4723 3.15121V3.15121C13.3207 1.46757 10.9637 1.15351 9.41139 2.47685L8.2112 3.5L6.95566 2.42966C5.40738 1.10976 3.06841 1.3603 1.83482 2.97819V2.97819C0.777858 4.36443 0.885104 6.31329 2.08779 7.57518L8.2112 14Z" stroke="rgba(4, 4, 5, 1)" stroke-width="2"></path></svg></span>
                            <span style="margin-left: 4px;">${itemInfo.item.likes > 0 ? itemInfo.item.likes : ''}</span>
                        </div>
                    </div>
                </div>
                ${itemInfo.item.supply > 1 ? `<div class="rarible-card-border-bottom"></div>` : ``}
            </div>
        </div>
        `

        return html
    }

    private renderAvatarHtml(collectionProfile: any, creatorProfile: any, ownerProfile: any) {
        // avatar html
        let avatarHtml = ''

        let verifiedBadgeHtml = `<div class="verified-badge"><svg width="16" height="16" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.78117 0.743103C5.29164 -0.247701 6.70826 -0.247701 7.21872 0.743103C7.52545 1.33846 8.21742 1.62509 8.8553 1.42099C9.91685 1.08134 10.9186 2.08304 10.5789 3.1446C10.3748 3.78247 10.6614 4.47445 11.2568 4.78117C12.2476 5.29164 12.2476 6.70826 11.2568 7.21872C10.6614 7.52545 10.3748 8.21742 10.5789 8.8553C10.9186 9.91685 9.91685 10.9186 8.8553 10.5789C8.21742 10.3748 7.52545 10.6614 7.21872 11.2568C6.70826 12.2476 5.29164 12.2476 4.78117 11.2568C4.47445 10.6614 3.78247 10.3748 3.1446 10.5789C2.08304 10.9186 1.08134 9.91685 1.42099 8.8553C1.62509 8.21742 1.33846 7.52545 0.743103 7.21872C-0.247701 6.70826 -0.247701 5.29164 0.743103 4.78117C1.33846 4.47445 1.62509 3.78247 1.42099 3.1446C1.08134 2.08304 2.08304 1.08134 3.1446 1.42099C3.78247 1.62509 4.47445 1.33846 4.78117 0.743103Z" fill="#feda03"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M8.43961 4.23998C8.64623 4.43922 8.65221 4.76823 8.45297 4.97484L5.40604 8.13462L3.54703 6.20676C3.34779 6.00014 3.35377 5.67113 3.56039 5.47189C3.76701 5.27266 4.09602 5.27864 4.29526 5.48525L5.40604 6.63718L7.70475 4.25334C7.90398 4.04672 8.23299 4.04074 8.43961 4.23998Z" fill="#000000"></path></svg></div>`

        if (collectionProfile) {
            // prettier-ignore
            avatarHtml += `
                <a href="${this.config.getCollectionUrl(collectionProfile.shortUrl, collectionProfile.id)}" target="_blank">
                    <div class="avatar"><img title="Collection: ${collectionProfile.name}" src="${this.config.getAvatarUrl(collectionProfile.image)}"></img></div>
                </a>
            `
        }

        if (ownerProfile) {
            // prettier-ignore
            avatarHtml += `
                <a href="${this.config.getUserUrl(ownerProfile.shortUrl, ownerProfile.id)}" target="_blank">
                    <div class="avatar">
                        ${ownerProfile.verified ? verifiedBadgeHtml : ''}
                        <img title="Owner: ${ownerProfile.name ?? ownerProfile.id}" src="${this.config.getAvatarUrl(ownerProfile.image)}"></img>
                    </div>
                </a>
            `
        }

        if (creatorProfile) {
            avatarHtml += `
            <a href="${this.config.getUserUrl(creatorProfile.shortUrl, creatorProfile.id)}" target="_blank">
                <div class="avatar">
                    ${creatorProfile.verified ? verifiedBadgeHtml : ''}
                    <img title="Creator: ${creatorProfile.name ?? creatorProfile.id}" src="${this.config.getAvatarUrl(creatorProfile.image)}"></img>
                </div>
            </a>`
        }

        return avatarHtml
    }

    private renderStyle() {
        let style = `
        .rarible-card {
            display: inline-block;
            padding: 10px;
            text-align: left;
        }
        .rarible-card a {
            text-decoration: none;
        }
        .rarible-card-border {
            display: inline-block;
            position: relative;
            padding: 20px;
            border-radius: 16px; 
            border: 1px solid rgb(230, 230, 230); 
            width: 230px;
            height: 360px;
            background-color: white;
            color: rgb(4, 4, 5);
            font-family: "Circular Std", Helvetica, Arial, sans-serif;
            font-weight: 600;
            font-size: 14px;
            margin-top: 20px;
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
        }
        .rarible-card-name {
            margin-top: 20px;
            width: 220px;
            overflow: hidden;
            display: inline-block;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .rarible-card-likes {
            display: flex;
            align-items: center; 
            opacity: 0.5;
        }
        .rarible-card-bid {
            flex: 1;
        }
        .rarible-card-bid a {
            color: rgb(0, 135, 255);
        }
        .avatar-row {
            display: flex;
            flex-direction: row;
            margin: 0px 15px 0px 15px;
        }
        .avatar-row a {
            margin-left: -10px;
            text-decoration: none;
        }
        .avatar {
            position: relative;
            z-index: 1;
        }
        .avatar img {
            border-radius: 100%;
            width: 30px;
            height: 30px;
        }
        .verified-badge {
            position: absolute;
            right: -5px;
            bottom: 2px;
            z-index: 10;
        }
        .rarible-card-border-bottom::before {
            left: 3px;
            right: 3px;
            bottom: -3px;
            z-index: -1;
        }
        .rarible-card-border-bottom::before, .rarible-card-border-bottom::after {
            position: absolute;
            content: "";
            height: 40px;
            display: block;
            background: rgb(255, 255, 255);
            border-radius: 16px;
            border: 1px solid rgb(230, 230, 230);
        }        
        .rarible-card-border-bottom::after {
            left: 6px;
            right: 6px;
            bottom: -6px;
            z-index: -2;
        }
        `

        return style
    }
}
